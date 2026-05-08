export type ComparisonBlock = "column" | "truss" | "purlin" | "window_riegel";

export type ComparisonStatus =
  | "ok"
  | "fail"
  | "missing-native-field"
  | "missing-oracle-field"
  | "not-comparable";

export interface ComparisonFieldResult {
  field: string;
  nativeValue: unknown;
  oracleValue: unknown;
  delta: number | null;
  tolerance: number | null;
  status: ComparisonStatus;
  note?: string;
}

export interface BlockComparisonSummary {
  total: number;
  ok: number;
  fail: number;
  missingNative: number;
  missingOracle: number;
  notComparable: number;
}

export interface BlockComparisonResult {
  block: ComparisonBlock;
  inputSnapshot: unknown;
  nativeResult: unknown;
  oracleResult: unknown;
  comparisons: ComparisonFieldResult[];
  summary: BlockComparisonSummary;
  overallStatus: "ok" | "fail" | "incomplete";
}
