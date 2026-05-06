import type {
  CalculatorInputs as VelicanBeamCellInputs,
  CalculationResult as VelicanBeamCellResult,
  MemberSolution as VelicanBeamCellMemberSolution,
} from "../velican/beam-cell";

export type BeamCellSource = "velican-oracle";

export type BeamCellCheckStatus = "ok" | "fail" | "not-comparable" | "missing";

export interface BeamCellInput {
  spanM: number;
  stepM: number;
  roofLoadKpa: number;
  snowLoadKpa?: number | null;
  windLoadKpa?: number | null;
  roofSlopeDeg?: number | null;
  steel?: string | null;
  pricePerTonRub?: number | null;
  deflectionLimit?: number | null;
  extraOptions?: Record<string, unknown>;
  rawOracleInput?: Partial<VelicanBeamCellInputs>;
}

export interface BeamCellCheck {
  name: string;
  value: number | string | null;
  limit?: number | string | null;
  utilization?: number | null;
  status: BeamCellCheckStatus;
  note?: string;
}

export interface BeamCellResult {
  selectedProfile: string | null;
  utilization: number | null;
  massKg: number | null;
  costRub: number | null;
  checks: BeamCellCheck[];
  warnings: string[];
  notes: string[];
  source: BeamCellSource;
}

export interface BeamCellDebugResult extends BeamCellResult {
  inputSnapshot: BeamCellInput;
  oracleInputSnapshot: VelicanBeamCellInputs;
  oracleResultSnapshot: VelicanBeamCellResult;
  selectedProfile: string | null;
  utilization: number | null;
  massKg: number | null;
  costRub: number | null;
  checks: BeamCellCheck[];
  warnings: string[];
  missingDebugFields: string[];
  source: BeamCellSource;
}

export type {
  VelicanBeamCellInputs,
  VelicanBeamCellMemberSolution,
  VelicanBeamCellResult,
};
