import type {
  WindowRiegelInputs as VelicanWindowRiegelInputs,
  WindowRiegelOption as VelicanWindowRiegelOption,
  WindowRiegelResult as VelicanWindowRiegelResult,
} from "../velican/window-riegel";

export type WindowRiegelSource = "velican-oracle";

export type WindowRiegelCheckStatus = "ok" | "fail" | "not-comparable" | "missing";

export interface WindowRiegelInput {
  openingWidthM?: number | null;
  openingHeightM: number;
  wallHeightM?: number | null;
  facadePostStepM: number;
  windLoadKpa: number;
  terrainType: string;
  buildingHeightM: number;
  wallLoadKpa?: number | null;
  steel?: string | null;
  pricePerTonRub?: number | null;
  extraOptions?: Record<string, unknown>;
  rawOracleInput?: Partial<VelicanWindowRiegelInputs>;
}

export interface WindowRiegelCheck {
  name: string;
  value: number | string | null;
  limit?: number | string | null;
  utilization?: number | null;
  status: WindowRiegelCheckStatus;
  note?: string;
}

export interface WindowRiegelProfile {
  profile: string | null;
  steel: string | null;
  weightKg: number | null;
  sourceOption?: VelicanWindowRiegelOption;
}

export interface WindowRiegelResult {
  lowerProfile: WindowRiegelProfile | null;
  upperProfile: WindowRiegelProfile | null;
  sideProfile?: WindowRiegelProfile | null;
  utilization: number | null;
  massKg: number | null;
  costRub: number | null;
  checks: WindowRiegelCheck[];
  warnings: string[];
  notes: string[];
  source: WindowRiegelSource;
}

export interface WindowRiegelDebugResult extends WindowRiegelResult {
  inputSnapshot: WindowRiegelInput;
  oracleInputSnapshot: VelicanWindowRiegelInputs;
  oracleResultSnapshot: VelicanWindowRiegelResult;
  lowerProfile: WindowRiegelProfile | null;
  upperProfile: WindowRiegelProfile | null;
  utilization: number | null;
  massKg: number | null;
  costRub: number | null;
  checks: WindowRiegelCheck[];
  warnings: string[];
  missingDebugFields: string[];
  source: WindowRiegelSource;
}

export type {
  VelicanWindowRiegelInputs,
  VelicanWindowRiegelOption,
  VelicanWindowRiegelResult,
};
