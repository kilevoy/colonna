import profilesData from "../../data/lstk/profiles.json";
import {
  computeLoads,
  computeSnowDrift,
  getCassetteHeightFilter,
} from "./loads";
import type {
  LstkProfile,
  LstkProfileType,
  LstkCandidate,
  PurlinInput,
  LstkOutput,
  LstkSectionResult,
  LstkSteelGrade,
} from "./types";

const ALL_PROFILES: Record<LstkSteelGrade, LstkProfile[]> = {
  MP350: profilesData.MP350 as LstkProfile[],
  MP390: profilesData.MP390 as LstkProfile[],
};

function evaluateLstkProfile(
  profile: LstkProfile,
  spacing_mm: number,
  q_total_kPa: number,
  input: PurlinInput,
): LstkCandidate | null {
  if (
    input.cassetteHeightFilter_mm > 0 &&
    profile.h_mm !== input.cassetteHeightFilter_mm
  ) {
    return null;
  }

  // The workbook-backed LSTK branch uses profile-specific coefficients here.
  // input.maxUtilization is a hot-rolled selection cap, not an LSTK capacity factor.
  const appliedCoef = profile.default_coef;
  const M_pred_eff = (profile.M_pred_baseline_kNm / 0.85) * appliedCoef;

  const s_m = spacing_mm / 1000;
  const L = input.framePitch_m;
  const w_purlin_kN_per_m =
    q_total_kPa * s_m + (profile.mass_kg_per_m / 100) * input.gamma_n;

  const M_design = (w_purlin_kN_per_m * L * L) / 8;
  const K = M_design / M_pred_eff;
  if (K > 1) return null;

  const slopeFactor = input.roofShape === "gable" ? 2 : 1;
  const halfSlope_m = (input.span_m - 0.3) / slopeFactor;
  const baseCount = Math.max(1, Math.ceil(halfSlope_m / s_m));
  const isZ = profile.type === "Z";
  const sgExtra = isZ
    ? input.snowGuardPurlin
      ? 2
      : 1
    : input.snowGuardPurlin
      ? 1.5
      : 1;
  const fenceExtra = isZ
    ? input.fencePurlin
      ? 1
      : 0
    : input.fencePurlin
      ? 0.5
      : 0;
  const countPerHalf = baseCount + sgExtra + fenceExtra;
  const nPurlins = countPerHalf * slopeFactor;

  const perPurlinUnit_kg = isZ
    ? profile.mass_kg_per_m * input.framePitch_m + 1.72
    : profile.mass_kg_per_m * input.framePitch_m;
  const massPerFrameStep_kg = countPerHalf * perPurlinUnit_kg * slopeFactor;
  const massPerBuilding_kg =
    (massPerFrameStep_kg * input.length_m) / input.framePitch_m;

  return {
    profile,
    spacing_mm,
    M_pred_eff_kNm: M_pred_eff,
    M_design_kNm: M_design,
    K,
    nPurlins,
    massPerFrameStep_kg,
    massPerBuilding_kg,
  };
}

function enumerateLstkCandidates(
  input: PurlinInput,
  q_total_kPa: number,
): LstkCandidate[] {
  const out: LstkCandidate[] = [];
  const minS = Math.min(input.minStep_mm, input.maxStep_mm);
  const maxS = Math.max(input.minStep_mm, input.maxStep_mm);
  for (let s = minS; s <= maxS; s += 5) {
    for (const grade of ["MP350", "MP390"] as LstkSteelGrade[]) {
      for (const profile of ALL_PROFILES[grade]) {
        const cand = evaluateLstkProfile(profile, s, q_total_kPa, input);
        if (cand) out.push(cand);
      }
    }
  }
  return out;
}

function lstkBestPerGroup(candidates: LstkCandidate[]): LstkSectionResult[] {
  const grades: LstkSteelGrade[] = ["MP350", "MP390"];
  const types: LstkProfileType[] = ["2TPS", "2PS", "Z"];
  const out: LstkSectionResult[] = [];
  for (const grade of grades) {
    for (const type of types) {
      const filtered = candidates.filter(
        (c) =>
          c.profile.Ry_MPa === (grade === "MP350" ? 350 : 390) &&
          c.profile.type === type,
      );
      filtered.sort((a, b) => a.massPerBuilding_kg - b.massPerBuilding_kg);
      out.push({ grade, type, best: filtered[0] ?? null });
    }
  }
  return out;
}

/** Run LSTK purlin calculation. */
export function runLstkPurlinCalculation(input: PurlinInput): LstkOutput {
  const loads = computeLoads(input);
  const { mu2, designSpan_m } = computeSnowDrift(input);
  const slopeFactor = input.roofShape === "gable" ? 2 : 1;
  const L_slope_m = (input.span_m - 0.3) / slopeFactor;

  const allCandidates = enumerateLstkCandidates(input, loads.q_total_kPa);
  const sections = lstkBestPerGroup(allCandidates);

  allCandidates.sort((a, b) => a.massPerBuilding_kg - b.massPerBuilding_kg);
  const top10 = allCandidates.slice(0, 10);

  return {
    ...loads,
    mu2,
    designSpan_m,
    L_slope_m,
    sections,
    top10,
  };
}

/** Re-export helpers */
export { computeLoads, getCassetteHeightFilter, computeSnowDrift };
