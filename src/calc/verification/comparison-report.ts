import type {
  BlockComparisonResult,
  BlockComparisonSummary,
  ComparisonFieldResult,
} from "./comparison-types";
import {
  compareDefaultColumnNativeToVelican,
  compareNormalizedColumnNativeToVelican,
} from "./column-comparison";
import {
  compareDefaultPurlinNativeToVelican,
  compareNormalizedPurlinNativeToVelican,
} from "./purlin-comparison";
import {
  compareDefaultTrussNativeToVelican,
  compareNormalizedTrussNativeToVelican,
} from "./truss-comparison";

function isMissing(value: unknown): boolean {
  return value === undefined || value === null;
}

export function compareNumberField(
  field: string,
  nativeValue: unknown,
  oracleValue: unknown,
  tolerance: number,
  note?: string,
): ComparisonFieldResult {
  if (isMissing(nativeValue)) {
    return { field, nativeValue, oracleValue, delta: null, tolerance, status: "missing-native-field", note };
  }
  if (isMissing(oracleValue)) {
    return { field, nativeValue, oracleValue, delta: null, tolerance, status: "missing-oracle-field", note };
  }
  if (typeof nativeValue !== "number" || typeof oracleValue !== "number") {
    return {
      field,
      nativeValue,
      oracleValue,
      delta: null,
      tolerance,
      status: "not-comparable",
      note: note ?? "Both values must be finite numbers.",
    };
  }

  const delta = nativeValue - oracleValue;
  return {
    field,
    nativeValue,
    oracleValue,
    delta,
    tolerance,
    status: Math.abs(delta) <= tolerance ? "ok" : "fail",
    note,
  };
}

export function compareTextField(
  field: string,
  nativeValue: unknown,
  oracleValue: unknown,
  note?: string,
): ComparisonFieldResult {
  if (isMissing(nativeValue)) {
    return { field, nativeValue, oracleValue, delta: null, tolerance: null, status: "missing-native-field", note };
  }
  if (isMissing(oracleValue)) {
    return { field, nativeValue, oracleValue, delta: null, tolerance: null, status: "missing-oracle-field", note };
  }
  if (typeof nativeValue !== "string" || typeof oracleValue !== "string") {
    return {
      field,
      nativeValue,
      oracleValue,
      delta: null,
      tolerance: null,
      status: "not-comparable",
      note: note ?? "Both values must be text.",
    };
  }

  return {
    field,
    nativeValue,
    oracleValue,
    delta: null,
    tolerance: null,
    status: nativeValue === oracleValue ? "ok" : "fail",
    note,
  };
}

export function notComparableField(
  field: string,
  nativeValue: unknown,
  oracleValue: unknown,
  note: string,
): ComparisonFieldResult {
  return {
    field,
    nativeValue,
    oracleValue,
    delta: null,
    tolerance: null,
    status: "not-comparable",
    note,
  };
}

export function buildComparisonSummary(
  comparisons: ComparisonFieldResult[],
): BlockComparisonSummary {
  return {
    total: comparisons.length,
    ok: comparisons.filter((item) => item.status === "ok").length,
    fail: comparisons.filter((item) => item.status === "fail").length,
    missingNative: comparisons.filter((item) => item.status === "missing-native-field").length,
    missingOracle: comparisons.filter((item) => item.status === "missing-oracle-field").length,
    notComparable: comparisons.filter((item) => item.status === "not-comparable").length,
  };
}

export function getOverallStatus(summary: BlockComparisonSummary): "ok" | "fail" | "incomplete" {
  if (summary.fail > 0) return "fail";
  if (summary.missingNative > 0 || summary.missingOracle > 0 || summary.notComparable > 0) {
    return "incomplete";
  }
  return "ok";
}

function formatValue(value: unknown): string {
  if (value === undefined) return "";
  if (value === null) return "";
  if (typeof value === "number") return Number.isFinite(value) ? String(Number(value.toFixed(6))) : String(value);
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function blockTitle(block: BlockComparisonResult["block"]): string {
  if (block === "column") return "Column";
  if (block === "truss") return "Truss";
  if (block === "purlin") return "Purlin";
  return "Window Riegel";
}

export function formatComparisonMarkdown(result: BlockComparisonResult): string {
  const summary = result.summary;
  const lines = [
    `## ${blockTitle(result.block)}`,
    `Summary: total ${summary.total} / ok ${summary.ok} / fail ${summary.fail} / missing ${summary.missingNative + summary.missingOracle} / not-comparable ${summary.notComparable}`,
    "",
    "| Field | Native | Oracle | Delta | Tolerance | Status | Note |",
    "|---|---:|---:|---:|---:|---|---|",
    ...result.comparisons.map((item) => (
      `| ${item.field} | ${formatValue(item.nativeValue)} | ${formatValue(item.oracleValue)} | ${formatValue(item.delta)} | ${formatValue(item.tolerance)} | ${item.status} | ${item.note ?? ""} |`
    )),
  ];

  return lines.join("\n");
}

export async function buildAllDefaultComparisons(): Promise<BlockComparisonResult[]> {
  const column = compareDefaultColumnNativeToVelican();
  const truss = compareDefaultTrussNativeToVelican();
  const purlin = await compareDefaultPurlinNativeToVelican();
  return [column, truss, purlin];
}

export async function buildAllNormalizedComparisons(): Promise<BlockComparisonResult[]> {
  const column = compareNormalizedColumnNativeToVelican();
  const truss = compareNormalizedTrussNativeToVelican();
  const purlin = await compareNormalizedPurlinNativeToVelican();
  return [column, truss, purlin];
}

export function formatAllComparisonsMarkdown(results: BlockComparisonResult[]): string {
  return [
    "# Native vs VELICAN Oracle Comparison",
    "",
    ...results.map(formatComparisonMarkdown),
  ].join("\n\n");
}
