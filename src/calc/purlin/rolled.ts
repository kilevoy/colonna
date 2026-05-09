import type {
  PurlinInput,
  RolledProfile,
  RolledCandidate,
  RolledSectionResult,
  RolledSteelGrade,
} from "./types";

import profilesJson from "../../data/profiles/profiles.json";
import { getKze, getNu, getZeta } from "../wind";

const PROFILES = profilesJson as RolledProfile[];
const E_MPA = 206000;
const GAMMA_C = 0.95;
const PURLIN_ROLLED_EXCLUDED_PROFILE_NAMES = new Set([
  // Workbook sort-steel reference marks this profile as excluded.
  "пр.200х120х4",
]);

/* ─── Local Ry lookup (matches column engine/steel.ts) ─── */

function maxThick(p: RolledProfile): number {
  return Math.max(p.s_mm ?? 0, p.t_mm ?? 0);
}

function getRyRolled(steel: RolledSteelGrade, profile: RolledProfile): number {
  const t = maxThick(profile);
  if (steel === "С245") return 240;
  if (steel === "С345") return 340;
  if (steel === "С255Б") {
    let base: number;
    if (t <= 10) base = 255;
    else if (t <= 20) base = 245;
    else if (t <= 40) base = 235;
    else if (t <= 60) base = 235;
    else if (t <= 80) base = 225;
    else base = 215;
    return base / 1.025;
  }
  if (steel === "С355Б") {
    let base: number;
    if (t <= 20) base = 355;
    else if (t <= 40) base = 345;
    else if (t <= 60) base = 340;
    else if (t <= 80) base = 325;
    else if (t <= 100) base = 315;
    else base = 295;
    return base / 1.025;
  }
  throw new Error(`Unknown steel: ${steel}`);
}

function steelsForCategoryRolled(
  cat: RolledProfile["category"],
): RolledSteelGrade[] {
  if (cat === "square_tube" || cat === "rect_tube")
    return ["С245", "С345"];
  return ["С255Б", "С355Б"];
}

/** Shape factor for torsion constant J approximations */
function approxJ(profile: RolledProfile): number {
  const cat = profile.category;
  const h = profile.h_mm ?? 0;
  const b = profile.b_mm ?? 0;
  const t = profile.t_mm ?? 0;
  const s = profile.s_mm ?? t;

  if (cat === "beam_normal" || cat === "beam_wide" || cat === "beam_column") {
    // J ≈ (1/3)(2bt³ + (h-2t)s³) for I-beam
    return (
      (1 / 3) * (2 * b * t * t * t + Math.max(0, h - 2 * t) * s * s * s)
    );
  }
  if (cat === "square_tube") {
    // Closed thin-walled approx: J ≈ 4A₀² / Σ(t/l) ≈ 2t(b-t)(h-t) for square
    const a = h - t;
    return 2 * t * a * a; // rough
  }
  if (cat === "rect_tube") {
    const a0 = (h - t) * (b - t);
    const perim = 2 * (h + b - 2 * t);
    return (4 * a0 * a0 * t) / perim; // Bredt
  }
  return 0;
}

/** Max thickness for Ry lookup */
function maxThickness(profile: RolledProfile): number {
  return Math.max(profile.s_mm ?? 0, profile.t_mm ?? 0);
}

/**
 * Evaluate a single hot-rolled profile+steel+spacing for purlin use.
 * Returns null if fails any check.
 */
function evaluateRolledProfile(
  profile: RolledProfile,
  steel: RolledSteelGrade,
  spacing_mm: number,
  q_total_kPa: number,
  input: PurlinInput,
  L_slope_m: number,
): RolledCandidate | null {
  if (PURLIN_ROLLED_EXCLUDED_PROFILE_NAMES.has(profile.name)) {
    return null;
  }

  const L = input.framePitch_m; // purlin span = frame pitch
  const s_m = spacing_mm / 1000;
  const gamma_n = input.gamma_n;

  // Line load on purlin (kN/m): q*spacing + self-weight*γn
  const q_line =
    q_total_kPa * s_m + (profile.mass_kg_per_m / 100) * gamma_n;

  // Moment and shear for simply supported beam under uniform load
  const M_design = (q_line * L * L) / 8; // kN·m
  const Q_design = (q_line * L) / 2; // kN

  const Ry = getRyRolled(steel, profile);
  const Wx_m3 = profile.Wx_cm3 / 1e6;
  const Ix_m4 = profile.Ix_cm4 / 1e-8;
  const Sx_m3 = profile.Sx_cm3 ? profile.Sx_cm3 / 1e6 : null;
  const s_mm = profile.s_mm ?? profile.t_mm ?? 1;
  const h_web_mm = (profile.h_mm ?? 0) - 2 * (profile.t_mm ?? 0);

  // --- Checks ---
  const checks: Record<string, number> = {};

  // 1. Strength (bending)
  const sigma = M_design / (Wx_m3 * 1000); // MPa (MN·m / m³)
  checks["прочность"] = sigma / (Ry * GAMMA_C);
  const windFacade_kPa = calcFacadeWindPressure(
    input.w0_kPa,
    input.terrainType,
    input.height_m,
    input.length_m,
  ) * gamma_n;
  const windForce_kN = (windFacade_kPa * input.height_m * input.framePitch_m) / 2;
  const roofSlopeRad = (input.roofSlope_deg * Math.PI) / 180;
  const Wy_m3 = profile.Wy_cm3 / 1e6;
  const biaxialSigma =
    windForce_kN / (profile.A_cm2 / 1e4) +
    M_design / Wx_m3 +
    ((q_total_kPa * s_m * L * L) / 8) * Math.tan(roofSlopeRad) / Wy_m3;
  checks["прочность с ветром/уклоном"] = biaxialSigma / 1e3 / (Ry * GAMMA_C);

  // 2. Deflection (limit L/200)
  const f = (5 * q_line * Math.pow(L, 4)) / (384 * E_MPA * 1e3 * Ix_m4); // m
  const f_limit = L / 200;
  checks["прогиб"] = f / f_limit;

  // 3. Shear (only for I-beams with known web)
  if ((profile.category === "beam_normal" || profile.category === "beam_wide" || profile.category === "beam_column") && Sx_m3 !== null && h_web_mm > 0) {
    const tau =
      (Q_design * Sx_m3 * 1e3) /
      (Ix_m4 * (s_mm / 1000) * 1e6); // MPa
    checks["срез"] = tau / (0.58 * Ry * GAMMA_C);
  } else {
    // For tubes: simplified shear check (rough)
    const A_cm2 = profile.A_cm2;
    const tau_approx = (Q_design * 1e3) / (A_cm2 * 100); // MPa (N/mm²)
    checks["срез"] = tau_approx / (0.58 * Ry * GAMMA_C);
  }

  // 4. Local stability of web (simplified: hw/tw ≤ 3.2*sqrt(E/Ry))
  if (profile.category === "beam_normal" || profile.category === "beam_wide" || profile.category === "beam_column") {
    const hw = h_web_mm;
    const tw = s_mm;
    const limit = 3.2 * Math.sqrt(E_MPA / Ry);
    checks["устойч.стенки"] = hw / tw / limit;
  } else {
    checks["устойч.стенки"] = 0;
  }

  // 5. Lateral-torsional buckling (very rough: if no top flange restraint)
  // For purlins with roofing attached → generally restrained
  // Conservatively check if iy is very small compared to ix
  if (profile.iy_cm > 0) {
    const lambda_y = (L * 100) / profile.iy_cm;
    const lambda_lim = 180; // common limit for secondary members
    checks["гибкость"] = lambda_y / lambda_lim;
  } else {
    checks["гибкость"] = 0;
  }

  // Utilization = max of all checks
  const entries = Object.entries(checks);
  const maxEntry = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
  const K_max = maxEntry[1];
  const limitingCheck = maxEntry[0];

  // Apply user's maxUtilization cap (default 0.85)
  const utilCap =
    input.maxUtilization === "default" ? 0.85 : input.maxUtilization;
  if (K_max > utilCap) return null;

  // --- Mass calculation ---
  const slopeFactor = input.roofShape === "gable" ? 2 : 1;
  const halfSlope_m =
    (input.span_m - 0.3) /
    slopeFactor /
    Math.cos((input.roofSlope_deg * Math.PI) / 180);
  const baseCount = Math.max(1, Math.ceil(halfSlope_m / s_m) + 1);
  const sgExtra = input.snowGuardPurlin ? 1 : 0;
  const fenceExtra = input.fencePurlin ? 0.5 : 0;
  const countPerHalf = baseCount + sgExtra + fenceExtra;
  const nPurlins = countPerHalf * slopeFactor;
  const overlapOrWasteFactor = 1.03;

  const massPerFrameStep_kg =
    countPerHalf * profile.mass_kg_per_m * slopeFactor * input.framePitch_m;
  const massPerBuilding_kg =
    (massPerFrameStep_kg * input.length_m * overlapOrWasteFactor) / input.framePitch_m;

  return {
    profile,
    steel,
    spacing_mm,
    Ry_MPa: Ry,
    M_design_kNm: M_design,
    K_max,
    limitingCheck,
    checks,
    nPurlins,
    massPerFrameStep_kg,
    massPerBuilding_kg,
  };
}

/**
 * Enumerate all rolled profiles × steels × spacings.
 */
export function enumerateRolledCandidates(
  input: PurlinInput,
  q_total_kPa: number,
  L_slope_m: number,
): RolledCandidate[] {
  const out: RolledCandidate[] = [];
  const minS = Math.min(input.minStep_mm, input.maxStep_mm);
  const maxS = Math.max(input.minStep_mm, input.maxStep_mm);

  for (let s = minS; s <= maxS; s += 5) {
    for (const profile of PROFILES) {
      const steels = steelsForCategoryRolled(profile.category);
      for (const steel of steels) {
        const cand = evaluateRolledProfile(
          profile,
          steel,
          s,
          q_total_kPa,
          input,
          L_slope_m,
        );
        if (cand) out.push(cand);
      }
    }
  }
  return out;
}

function calcFacadeWindPressure(
  w0: number,
  terrain: PurlinInput["terrainType"],
  height_m: number,
  length_m: number,
): number {
  const h = Math.max(height_m, 5);
  const kze = getKze(terrain, h);
  const zeta = getZeta(terrain, h);
  const nu = getNu(0.4 * length_m, h);
  const mean = Math.abs(w0 * kze * -0.8 * 1.4);
  return mean + mean * zeta * nu;
}

/** Group rolled candidates by (steel, category) and pick lightest in each group. */
function rolledBestPerGroup(
  candidates: RolledCandidate[],
): RolledSectionResult[] {
  const steels: RolledSteelGrade[] = ["С255Б", "С355Б", "С245", "С345"];
  const cats: RolledProfile["category"][] = [
    "beam_normal",
    "beam_wide",
    "beam_column",
    "square_tube",
    "rect_tube",
  ];
  const out: RolledSectionResult[] = [];
  for (const steel of steels) {
    for (const category of cats) {
      const filtered = candidates.filter(
        (c) => c.steel === steel && c.profile.category === category,
      );
      filtered.sort((a, b) => a.massPerBuilding_kg - b.massPerBuilding_kg);
      out.push({ steel, category, best: filtered[0] ?? null });
    }
  }
  return out;
}

/** Run hot-rolled purlin calculation. Returns loads + candidates. */
export function runRolledPurlinCalculation(
  input: PurlinInput,
  loads: {
    q_total_kPa: number;
    q_snow_kPa: number;
    q_windRoof_kPa: number;
    q_roof_kPa: number;
    mu2: number;
    designSpan_m: number;
  },
  L_slope_m: number,
): {
  q_total_kPa: number;
  q_snow_kPa: number;
  q_windRoof_kPa: number;
  q_roof_kPa: number;
  mu2: number;
  designSpan_m: number;
  L_slope_m: number;
  sections: RolledSectionResult[];
  top10: RolledCandidate[];
} {
  const all = enumerateRolledCandidates(input, loads.q_total_kPa, L_slope_m);
  all.sort((a, b) => a.massPerBuilding_kg - b.massPerBuilding_kg);

  const sections = rolledBestPerGroup(all);
  const top10 = all.slice(0, 10);

  return {
    q_total_kPa: loads.q_total_kPa,
    q_snow_kPa: loads.q_snow_kPa,
    q_windRoof_kPa: loads.q_windRoof_kPa,
    q_roof_kPa: loads.q_roof_kPa,
    mu2: loads.mu2,
    designSpan_m: loads.designSpan_m,
    L_slope_m,
    sections,
    top10,
  };
}
