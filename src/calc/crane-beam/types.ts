import type {
  CraneCalculatorInputs as VelicanCraneCalculatorInputs,
  CraneCalculationResult as VelicanCraneCalculationResult,
} from "../velican/crane-beam";

export type CraneBeamSource = "velican-oracle";

export type CraneBeamCheckStatus = "ok" | "fail" | "not-comparable" | "missing";

export interface CraneBeamInput {
  capacityT: number | string;
  craneSpanM: number;
  beamSpanM: number;
  wheelCount: number;
  wheelBaseM?: number | null;
  maxWheelLoadKn?: number | null;
  trolleyWeightT?: number | null;
  craneWeightT?: number | null;
  railType: string;
  dutyGroup?: string;
  regimeGroup?: string;
  steel?: string | null;
  pricePerTonRub?: number | null;
  deflectionLimit?: number | null;
  extraOptions?: Record<string, unknown>;
  rawOracleInput?: Partial<VelicanCraneCalculatorInputs>;
}

export interface CraneBeamCheck {
  name: string;
  value: number | string | null;
  limit?: number | string | null;
  status: CraneBeamCheckStatus;
  utilization?: number | null;
  note?: string;
}

export interface CraneBeamDimensions {
  heightMm?: number | null;
  flangeWidthMm?: number | null;
  webThicknessMm?: number | null;
  flangeThicknessMm?: number | null;
  webHeightMm?: number | null;
  flangeOverhangMm?: number | null;
  radiusMm?: number | null;
  raw: CraneBeamCheck[];
}

export interface CraneBeamChecks {
  strength: CraneBeamCheck[];
  crane78: CraneBeamCheck[];
  globalStability: CraneBeamCheck[];
  localStability: CraneBeamCheck[];
  deflections: CraneBeamCheck[];
  geometry: CraneBeamCheck[];
}

export interface CraneBeamResult {
  selectedProfile: string | null;
  utilization: number | null;
  massKg: number | null;
  costRub: number | null;
  dimensions: CraneBeamDimensions;
  checks: CraneBeamChecks;
  warnings: string[];
  notes: string[];
  source: CraneBeamSource;
}

export interface CraneBeamDebugResult extends CraneBeamResult {
  inputSnapshot: CraneBeamInput;
  oracleInputSnapshot: VelicanCraneCalculatorInputs;
  oracleResultSnapshot: VelicanCraneCalculationResult;
  strengthChecks: CraneBeamCheck[];
  fatigueChecks: CraneBeamCheck[];
  stabilityChecks: CraneBeamCheck[];
  localStabilityChecks: CraneBeamCheck[];
  deflectionChecks: CraneBeamCheck[];
  missingDebugFields: string[];
}

export type { VelicanCraneCalculatorInputs, VelicanCraneCalculationResult };
