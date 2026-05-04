/** Light-gauge steel framing (ЛСТК) purlin types. */

export type LstkProfileType = "2TPS" | "2PS" | "Z";
export type LstkSteelGrade = "MP350" | "MP390";

/** Hot-rolled steel grades for purlin selection */
export type RolledSteelGrade = "С255Б" | "С355Б" | "С245" | "С345";
export type RolledProfileCategory =
  | "beam_normal"
  | "beam_wide"
  | "beam_column"
  | "square_tube"
  | "rect_tube";

export type MaterialType = "lstk" | "rolled";

/* ─── ЛСТК профили ─── */

export interface LstkProfile {
  name: string;
  type: LstkProfileType;
  h_mm: number;
  b_mm: number | null;
  t_mm: number;
  /** Baseline (working coefficient = 0.85) bending capacity, kN·m */
  M_pred_baseline_kNm: number;
  /** Default working coefficient */
  default_coef: number;
  mass_kg_per_m: number;
  Ry_MPa: number;
}

export interface LstkCandidate {
  profile: LstkProfile;
  spacing_mm: number;
  M_pred_eff_kNm: number;
  M_design_kNm: number;
  K: number;
  nPurlins: number;
  massPerFrameStep_kg: number;
  massPerBuilding_kg: number;
}

export interface LstkSectionResult {
  best: LstkCandidate | null;
  grade: LstkSteelGrade;
  type: LstkProfileType;
}

/* ─── Сортовые профили (shared profiles.json from column engine) ─── */

export interface RolledProfile {
  name: string;
  category: RolledProfileCategory;
  h_mm: number | null;
  b_mm: number | null;
  s_mm: number | null;
  t_mm: number | null;
  R_mm: number | null;
  A_cm2: number;
  mass_kg_per_m: number;
  Ix_cm4: number;
  Wx_cm3: number;
  Sx_cm3: number | null;
  ix_cm: number;
  Iy_cm4: number;
  Wy_cm3: number;
  iy_cm: number;
  /** Allowable steel grades for this profile */
  steels: RolledSteelGrade[];
}

export interface RolledCandidate {
  profile: RolledProfile;
  steel: RolledSteelGrade;
  spacing_mm: number;
  Ry_MPa: number;
  /** Design moment, kN·m */
  M_design_kNm: number;
  /** Max utilization ratio among all checks */
  K_max: number;
  limitingCheck: string;
  /** Per-check utilizations */
  checks: Record<string, number>;
  nPurlins: number;
  massPerFrameStep_kg: number;
  massPerBuilding_kg: number;
}

export interface RolledSectionResult {
  best: RolledCandidate | null;
  steel: RolledSteelGrade;
  category: RolledProfileCategory;
}

/* ─── Общие типы ─── */

export type SnowDriftMode = "none" | "along" | "across";
export type RoofShape = "gable" | "monoslope";

export interface PurlinLoads {
  q_snow_kPa: number;
  q_windRoof_kPa: number;
  q_roof_kPa: number;
  q_total_kPa: number;
}

export interface SnowDriftResult {
  mu2: number;
  designSpan_m: number;
}

export interface PurlinInput {
  materialType: MaterialType;

  /** γn — coefficient of responsibility */
  gamma_n: number;
  /** Roof shape */
  roofShape: RoofShape;

  /** Building geometry */
  span_m: number;
  length_m: number;
  height_m: number;
  roofSlope_deg: number;
  /** Frame pitch (m) — equals purlin span */
  framePitch_m: number;

  /** Wind */
  terrainType: "A" | "B" | "C";
  w0_kPa: number;
  /** Snow ground load, kN/m² */
  Sg_kPa: number;

  /** Roof structure (kPa) */
  roofStructure: string;
  roofLoad_kPa: number;

  /** Snow drift */
  snowDrift: SnowDriftMode;
  drift_dropHeight_m: number;
  drift_existingSize_m: number;

  /** Purlin step constraints (mm) */
  maxStep_mm: number;
  minStep_mm: number;

  /** Optional extra purlins */
  snowGuardPurlin: boolean;
  fencePurlin: boolean;

  /** Maximum utilization for rolled steel (default = 0.85) */
  maxUtilization: "default" | number;

  /** Sandwich panel cassette height filter (mm). Only for ЛСТК; 0 = no filter */
  cassetteHeightFilter_mm: number;

  /** For rolled: steel prices */
  prices?: Record<RolledSteelGrade, number>;
}

/* ─── Выходные данные ─── */

/** ЛСТК output */
export interface LstkOutput {
  q_total_kPa: number;
  q_snow_kPa: number;
  q_windRoof_kPa: number;
  q_roof_kPa: number;
  mu2: number;
  designSpan_m: number;
  L_slope_m: number;
  sections: LstkSectionResult[];
  top10: LstkCandidate[];
}

/** Сортовой output */
export interface RolledOutput {
  q_total_kPa: number;
  q_snow_kPa: number;
  q_windRoof_kPa: number;
  q_roof_kPa: number;
  mu2: number;
  designSpan_m: number;
  L_slope_m: number;
  sections: RolledSectionResult[];
  top10: RolledCandidate[];
}

/** Union output — one of these is populated based on materialType */
export type PurlinOutput = LstkOutput | RolledOutput;

/** Type guard */
export function isLstkOutput(out: PurlinOutput): out is LstkOutput {
  return "sections" in out && out.sections.length > 0 && "type" in (out.sections[0] ?? {});
}
