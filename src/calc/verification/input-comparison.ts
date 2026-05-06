import {
  defaultNativeColumnComparisonInput,
  compareColumnInputs,
} from "./column-input-mapping";
import {
  defaultNativePurlinLstkComparisonInput,
  comparePurlinInputs,
} from "./purlin-input-mapping";
import {
  defaultNativeTrussComparisonInput,
  compareTrussInputs,
} from "./truss-input-mapping";
import { defaultVelicanColumnInputs } from "../velican/column-oracle";
import { defaultVelicanMolodechnoInputs } from "../velican/molodechno-oracle";
import { defaultVelicanPurlinInputs } from "../velican/purlin-oracle";
import {
  columnNormalizedScenario,
  purlinNormalizedScenario,
  trussNormalizedScenario,
} from "./scenarios";

export type InputComparisonStatus =
  | "ok"
  | "different"
  | "missing-native-input"
  | "missing-oracle-input"
  | "not-comparable";

export interface InputComparisonRow {
  field: string;
  nativeInput: unknown;
  oracleInput: unknown;
  status: InputComparisonStatus;
  note?: string;
}

export interface InputComparisonSummary {
  total: number;
  ok: number;
  different: number;
  missingNative: number;
  missingOracle: number;
  notComparable: number;
}

export interface InputComparisonResult {
  block: "column" | "truss" | "purlin";
  rows: InputComparisonRow[];
  summary: InputComparisonSummary;
}

export interface InputComparisonReport {
  column: InputComparisonResult;
  truss: InputComparisonResult;
  purlin: InputComparisonResult;
}

function missing(value: unknown): boolean {
  return value === undefined || value === null;
}

export function compareInputField(
  field: string,
  nativeInput: unknown,
  oracleInput: unknown,
  note?: string,
): InputComparisonRow {
  if (missing(nativeInput)) {
    return { field, nativeInput, oracleInput, status: "missing-native-input", note };
  }
  if (missing(oracleInput)) {
    return { field, nativeInput, oracleInput, status: "missing-oracle-input", note };
  }
  return {
    field,
    nativeInput,
    oracleInput,
    status: Object.is(nativeInput, oracleInput) ? "ok" : "different",
    note,
  };
}

export function notComparableInputField(
  field: string,
  nativeInput: unknown,
  oracleInput: unknown,
  note: string,
): InputComparisonRow {
  return { field, nativeInput, oracleInput, status: "not-comparable", note };
}

export function buildInputComparisonSummary(rows: InputComparisonRow[]): InputComparisonSummary {
  return {
    total: rows.length,
    ok: rows.filter((row) => row.status === "ok").length,
    different: rows.filter((row) => row.status === "different").length,
    missingNative: rows.filter((row) => row.status === "missing-native-input").length,
    missingOracle: rows.filter((row) => row.status === "missing-oracle-input").length,
    notComparable: rows.filter((row) => row.status === "not-comparable").length,
  };
}

export function createInputComparisonResult(
  block: InputComparisonResult["block"],
  rows: InputComparisonRow[],
): InputComparisonResult {
  return { block, rows, summary: buildInputComparisonSummary(rows) };
}

export function buildInputComparisonReport(): InputComparisonReport {
  return {
    column: compareColumnInputs(defaultNativeColumnComparisonInput, defaultVelicanColumnInputs),
    truss: compareTrussInputs(defaultNativeTrussComparisonInput, defaultVelicanMolodechnoInputs),
    purlin: comparePurlinInputs(defaultNativePurlinLstkComparisonInput, defaultVelicanPurlinInputs),
  };
}

export function compareNormalizedColumnInputs(): InputComparisonResult {
  return compareColumnInputs(
    columnNormalizedScenario.nativeInput,
    columnNormalizedScenario.oracleInput,
  );
}

export function compareNormalizedTrussInputs(): InputComparisonResult {
  return compareTrussInputs(
    trussNormalizedScenario.nativeInput,
    trussNormalizedScenario.oracleInput,
  );
}

export function compareNormalizedPurlinInputs(): InputComparisonResult {
  return comparePurlinInputs(
    purlinNormalizedScenario.nativeInput,
    purlinNormalizedScenario.oracleInput,
  );
}

export function buildNormalizedInputComparisonReport(): InputComparisonReport {
  return {
    column: compareNormalizedColumnInputs(),
    truss: compareNormalizedTrussInputs(),
    purlin: compareNormalizedPurlinInputs(),
  };
}

function formatValue(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "number") return Number.isFinite(value) ? String(Number(value.toFixed(6))) : String(value);
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function title(block: InputComparisonResult["block"]): string {
  if (block === "column") return "Column";
  if (block === "truss") return "Truss";
  return "Purlin";
}

function formatBlock(result: InputComparisonResult): string {
  const s = result.summary;
  return [
    `## ${title(result.block)}`,
    `Summary: total ${s.total} / ok ${s.ok} / different ${s.different} / missing ${s.missingNative + s.missingOracle} / not-comparable ${s.notComparable}`,
    "",
    "| Field | Native input | Oracle input | Status | Note |",
    "|---|---:|---:|---|---|",
    ...result.rows.map((row) => (
      `| ${row.field} | ${formatValue(row.nativeInput)} | ${formatValue(row.oracleInput)} | ${row.status} | ${row.note ?? ""} |`
    )),
  ].join("\n");
}

export function formatInputComparisonMarkdown(report: InputComparisonReport): string {
  return [
    "# Native vs VELICAN Input Comparison",
    "",
    formatBlock(report.column),
    "",
    formatBlock(report.truss),
    "",
    formatBlock(report.purlin),
  ].join("\n");
}
