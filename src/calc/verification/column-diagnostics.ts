import type { ColumnCalculationWithDebug } from "../debug/column-debug";
import { runColumnCalculationWithDebug } from "../debug/column-debug";
import {
  calculateVelicanColumn,
  type ColumnOption,
  type ColumnResult,
} from "../velican/column-oracle";
import {
  compareNumberField,
  compareTextField,
  notComparableField,
} from "./comparison-report";
import type { ComparisonFieldResult } from "./comparison-types";
import { normalizeCheckName } from "./normalize-check-name";
import { columnNormalizedScenario } from "./scenarios";

const LOAD_TOLERANCE = 0.001;
const FORCE_TOLERANCE = 0.01;
const MASS_TOLERANCE = 0.1;
const COST_TOLERANCE = 2;
const UTILIZATION_TOLERANCE = 0.001;

export interface ColumnOracleDiagnosticAdapter {
  snowDesignKpa: number | null;
  windDesignKpa: number | null;
  windInternalKpa: number | null;
  roofDesignKpa: number | null;
  wallDesignKpa: number | null;
  supportCraneGKn: number | null;
  supportCraneTKn: number | null;
  supportCraneMomentKnM: number | null;
  normalForceKn: number | null;
  baseMomentKnM: number | null;
  momentFactor: number | null;
  momentKnM: number | null;
  firstOption: ColumnOption | null;
}

export interface ColumnDiagnosticReport {
  scenarioId: string;
  inputSnapshot: unknown;
  loadDiagnostics: ComparisonFieldResult[];
  craneDiagnostics: ComparisonFieldResult[];
  forceDiagnostics: ComparisonFieldResult[];
  profileDiagnostics: ComparisonFieldResult[];
  massCostDiagnostics: ComparisonFieldResult[];
  columnMassTrace: unknown;
  missingFields: {
    native: string[];
    oracle: string[];
  };
  suspectedCauses: string[];
}

function adaptOracle(result: ColumnResult): ColumnOracleDiagnosticAdapter {
  return {
    snowDesignKpa: result.snowDesignKpa,
    windDesignKpa: result.windDesignKpa,
    windInternalKpa: result.windInternalKpa,
    roofDesignKpa: result.roofDesignKpa,
    wallDesignKpa: result.wallDesignKpa,
    supportCraneGKn: result.supportCraneGKn,
    supportCraneTKn: result.supportCraneTKn,
    supportCraneMomentKnM: result.supportCraneMomentKnM,
    normalForceKn: result.normalForceKn,
    baseMomentKnM: result.baseMomentKnM,
    momentFactor: result.momentFactor,
    momentKnM: result.momentKnM,
    firstOption: result.options[0] ?? null,
  };
}

function hasFail(items: ComparisonFieldResult[], field: string): boolean {
  return items.some((item) => item.field === field && item.status === "fail");
}

function anyFail(items: ComparisonFieldResult[], fieldIncludes: string): boolean {
  return items.some((item) => item.field.includes(fieldIncludes) && item.status === "fail");
}

function buildSuspectedCauses(report: Omit<ColumnDiagnosticReport, "suspectedCauses">): string[] {
  const causes: string[] = [];
  const windFail = hasFail(report.loadDiagnostics, "windDesign");
  const nFail = hasFail(report.forceDiagnostics, "final_N_kN");
  const mFail = hasFail(report.forceDiagnostics, "final_M_kNm");
  const profileFail = anyFail(report.profileDiagnostics, "profile");
  const profileOk = report.profileDiagnostics.some((item) => item.field === "topCandidateProfile" && item.status === "ok");
  const massCostFail = report.massCostDiagnostics.some((item) => item.status === "fail");

  if (windFail) {
    causes.push("Сначала проверить расчет ветра/коэффициенты/terrain/height.");
  }
  if (windFail && mFail) {
    causes.push("M может отличаться из-за ветра.");
  }
  if (nFail) {
    causes.push("Проверить снег, roof/wall load, tributary area, crane vertical.");
  }
  if ((nFail || mFail) && profileFail) {
    causes.push("Профиль может отличаться из-за усилий.");
  }
  if (profileOk && massCostFail) {
    causes.push("Проверить массу, длину, распорки, цены.");
  }
  if (!nFail && !mFail && profileFail) {
    causes.push("Проверить сортамент, steel grades, utilization, ranking.");
  }

  return Array.from(new Set(causes));
}

function buildMissingFields(native: ColumnCalculationWithDebug, oracle: ColumnOracleDiagnosticAdapter): ColumnDiagnosticReport["missingFields"] {
  const nativeMissing = new Set<string>(native.columnLoadTrace.missingDebugFields);
  const oracleMissing = new Set<string>();

  if (oracle.windInternalKpa === null) oracleMissing.add("windInternalKpa");
  if (oracle.firstOption?.governingCheck === null || oracle.firstOption?.governingCheck === undefined) {
    oracleMissing.add("firstOption.governingCheck");
  }

  return {
    native: Array.from(nativeMissing),
    oracle: Array.from(oracleMissing),
  };
}

export function buildColumnDiagnosticReport(): ColumnDiagnosticReport {
  const scenario = columnNormalizedScenario;
  const native = runColumnCalculationWithDebug(scenario.nativeInput);
  const oracleRaw = calculateVelicanColumn(scenario.oracleInput);
  const oracle = adaptOracle(oracleRaw);
  const trace = native.columnLoadTrace;
  const firstOption = oracle.firstOption;

  const loadDiagnostics: ComparisonFieldResult[] = [
    compareNumberField("snowDesign", trace.snowDesignKpa, oracle.snowDesignKpa, LOAD_TOLERANCE),
    compareNumberField("windDesign", trace.windDesignKpa, oracle.windDesignKpa, LOAD_TOLERANCE),
    compareNumberField("windInternal", trace.windInternalKpa, oracle.windInternalKpa, LOAD_TOLERANCE),
    compareNumberField("roofDesign", trace.roofDesignKpa, oracle.roofDesignKpa, LOAD_TOLERANCE),
    compareNumberField("wallDesign", trace.wallDesignKpa, oracle.wallDesignKpa, LOAD_TOLERANCE),
  ];
  const craneDiagnostics: ComparisonFieldResult[] = [
    compareNumberField("supportCraneVerticalLoad", trace.supportCraneGKn, oracle.supportCraneGKn, FORCE_TOLERANCE),
    compareNumberField("supportCraneHorizontalLoad", trace.supportCraneTKn, oracle.supportCraneTKn, FORCE_TOLERANCE),
    compareNumberField("supportCraneMoment", trace.supportCraneMomentKnM, oracle.supportCraneMomentKnM, FORCE_TOLERANCE),
  ];
  const forceDiagnostics: ComparisonFieldResult[] = [
    compareNumberField("final_N_kN", trace.finalNKn, oracle.normalForceKn, FORCE_TOLERANCE),
    compareNumberField("baseMomentKnM", trace.baseMomentKnM, oracle.baseMomentKnM, FORCE_TOLERANCE),
    compareNumberField("momentFactor", trace.momentFactor, oracle.momentFactor, UTILIZATION_TOLERANCE),
    notComparableField("mu", trace.mu, oracle.momentFactor, "VELICAN exposes momentFactor; native mu is effective length coefficient."),
    compareNumberField("final_M_kNm", trace.finalMKnM, oracle.momentKnM, FORCE_TOLERANCE),
  ];
  const profileDiagnostics: ComparisonFieldResult[] = [
    compareTextField("topCandidateProfile", native.topCandidateProfile, firstOption?.profile),
    compareTextField("topCandidateSteel", native.topCandidateSteel, firstOption?.steel),
    compareNumberField("topCandidateUtilization", native.topCandidateUtilization, firstOption?.utilization, UTILIZATION_TOLERANCE),
    compareTextField(
      "limitingCheck",
      normalizeCheckName(native.limitingCheck),
      normalizeCheckName(firstOption?.governingCheck),
      "Compared after check-name normalization.",
    ),
  ];
  const massCostDiagnostics: ComparisonFieldResult[] = [
    compareNumberField("massKg", native.massKg, firstOption?.totalWeightKg, MASS_TOLERANCE),
    compareNumberField(
      "costRubNormalized",
      native.costRubNormalized,
      firstOption?.costThousandRub === null || firstOption?.costThousandRub === undefined
        ? firstOption?.costThousandRub
        : firstOption.costThousandRub * 1000,
      COST_TOLERANCE,
      "Legacy native field costRub stores thousand rubles; comparison uses normalized rubles.",
    ),
    compareNumberField(
      "costThousandRub",
      native.costThousandRub,
      firstOption?.costThousandRub,
      COST_TOLERANCE / 1000,
    ),
  ];

  const base = {
    scenarioId: scenario.scenarioId,
    inputSnapshot: {
      nativeInput: scenario.nativeInput,
      oracleInput: scenario.oracleInput,
      nativeColumnLoadTrace: trace,
      oracleEffectiveWindLoadKpa: oracleRaw.effectiveWindLoadKpa,
      oracleEffectiveSnowLoadKpa: oracleRaw.effectiveSnowLoadKpa,
      oracleClimateSettlement: oracleRaw.climateSettlement,
      oracleWarnings: oracleRaw.warnings,
    },
    loadDiagnostics,
    craneDiagnostics,
    forceDiagnostics,
    profileDiagnostics,
    massCostDiagnostics,
    columnMassTrace: {
      native: native.columnLoadTrace.columnMassTrace,
      oracle: firstOption
        ? {
            profile: firstOption.profile,
            steel: firstOption.steel,
            unitMassKgPerM: firstOption.meterWeightKg,
            columnWeightKg: firstOption.columnWeightKg,
            braceCount: firstOption.braceCount,
            totalMassKg: firstOption.totalWeightKg,
            costThousandRub: firstOption.costThousandRub,
          }
        : null,
    },
    missingFields: buildMissingFields(native, oracle),
  };

  return {
    ...base,
    suspectedCauses: buildSuspectedCauses(base),
  };
}

function statusCount(items: ComparisonFieldResult[], status: ComparisonFieldResult["status"]): number {
  return items.filter((item) => item.status === status).length;
}

function sectionSummary(items: ComparisonFieldResult[]): string {
  return `total ${items.length} / ok ${statusCount(items, "ok")} / fail ${statusCount(items, "fail")} / missing native ${statusCount(items, "missing-native-field")} / missing oracle ${statusCount(items, "missing-oracle-field")} / not-comparable ${statusCount(items, "not-comparable")}`;
}

function formatValue(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "number") return Number.isFinite(value) ? String(Number(value.toFixed(6))) : String(value);
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function formatSection(title: string, items: ComparisonFieldResult[]): string {
  return [
    `## ${title}`,
    `Summary: ${sectionSummary(items)}`,
    "",
    "| Field | Native | Oracle | Delta | Tolerance | Status | Note |",
    "|---|---:|---:|---:|---:|---|---|",
    ...items.map((item) => (
      `| ${item.field} | ${formatValue(item.nativeValue)} | ${formatValue(item.oracleValue)} | ${formatValue(item.delta)} | ${formatValue(item.tolerance)} | ${item.status} | ${item.note ?? ""} |`
    )),
  ].join("\n");
}

export function formatColumnDiagnosticMarkdown(report: ColumnDiagnosticReport): string {
  return [
    "# Column Native vs VELICAN Diagnostic",
    "",
    `Scenario: ${report.scenarioId}`,
    "",
    formatSection("Loads", report.loadDiagnostics),
    "",
    formatSection("Cranes", report.craneDiagnostics),
    "",
    formatSection("Forces", report.forceDiagnostics),
    "",
    formatSection("Profile", report.profileDiagnostics),
    "",
    formatSection("Mass/Cost", report.massCostDiagnostics),
    "",
    "## Missing Fields",
    `Native: ${report.missingFields.native.join(", ") || "-"}`,
    `Oracle: ${report.missingFields.oracle.join(", ") || "-"}`,
    "",
    "## Suspected Causes",
    ...(report.suspectedCauses.length > 0 ? report.suspectedCauses.map((cause) => `- ${cause}`) : ["- -"]),
  ].join("\n");
}
