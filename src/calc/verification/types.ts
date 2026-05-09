export type VerificationBlock =
  | "column"
  | "truss"
  | "purlin"
  | "crane_beam"
  | "window_riegel"
  | "beam_cell";

export type VerificationSource =
  | "excel"
  | "temporary-current-engine-baseline"
  | "velican-oracle";

export interface NumericTolerance {
  abs?: number;
  relativePct?: number;
}

export type VerificationTolerance = number | NumericTolerance;

export interface VerificationCase<TInput = unknown, TExpected = unknown> {
  caseId: string;
  title: string;
  block: VerificationBlock;
  source: VerificationSource;
  input: TInput;
  expected: TExpected;
  tolerances: VerificationTolerance | Record<string, VerificationTolerance>;
}

export interface ToleranceComparison {
  actual: number;
  expected: number;
  delta: number;
  absDelta: number;
  tolerance: VerificationTolerance;
  status: "ok" | "fail";
}
