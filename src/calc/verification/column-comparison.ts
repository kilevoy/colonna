import { runColumnCalculationWithDebug } from "../debug/column-debug";
import type { CalculationInput } from "../types";
import {
  calculateVelicanColumn,
  defaultVelicanColumnInputs,
} from "../velican/column-oracle";
import type { ColumnInputs } from "../velican/column-oracle";
import {
  buildComparisonSummary,
  compareNumberField,
  compareTextField,
  getOverallStatus,
  notComparableField,
} from "./comparison-report";
import type { BlockComparisonResult, ComparisonFieldResult } from "./comparison-types";
import { normalizeCheckName } from "./normalize-check-name";
import { columnNormalizedScenario } from "./scenarios";

const LOAD_TOLERANCE = 0.001;
const FORCE_TOLERANCE = 0.01;
const MASS_TOLERANCE = 0.1;
const COST_TOLERANCE = 2;
const UTILIZATION_TOLERANCE = 0.001;

export const defaultNativeColumnComparisonInput: CalculationInput = {
  height_m: 11.5,
  span_m: 40,
  length_m: 80,
  framePitch_m: 6,
  fachverkPitch_m: 6,
  roofSlope_deg: 6,
  roofType: "gable",
  spanCount: "single",
  perimeterTies: false,
  columnType: "fachwerk",
  responsibilityCoeff: 1,
  terrainType: "B",
  w0_kPa: 0.6,
  Sg_kPa: 1.7,
  roofStructure: "temporary-comparison",
  roofLoad_kPa: 0.105,
  wallStructure: "temporary-comparison",
  wallLoad_kPa: 0.105,
  loadAddition_pct: 15,
  overheadCrane: {
    enabled: false,
    capacity: "5",
    span_m: 12,
    count: "one",
    singleSpan: true,
    railLevel_m: 6,
    wheelLoad_kN: 0,
    base_m: 0,
    gauge_m: 0,
  },
  suspendedCrane: {
    enabled: false,
    capacity_t: 0,
    singleSpan: true,
  },
  prices: {
    "С255Б": 148.8,
    "С355Б": 155.88,
    "С245": 130.2,
    "С345": 141,
  },
};

export function compareColumnNativeToVelican(
  nativeInput: CalculationInput = defaultNativeColumnComparisonInput,
  oracleInput: ColumnInputs = defaultVelicanColumnInputs,
): BlockComparisonResult {
  const nativeResult = runColumnCalculationWithDebug(nativeInput);
  const oracleResult = calculateVelicanColumn(oracleInput);
  const firstOption = oracleResult.options[0] ?? null;
  const comparisons: ComparisonFieldResult[] = [
    compareNumberField("snowDesign", nativeResult.snowDesign, oracleResult.snowDesignKpa, LOAD_TOLERANCE),
    compareNumberField("windDesign", nativeResult.windDesign.horizontalDesign_kPa, oracleResult.windDesignKpa, LOAD_TOLERANCE),
    compareNumberField("roofLoad", nativeResult.roofLoad_kPa, oracleResult.roofDesignKpa, LOAD_TOLERANCE),
    compareNumberField("wallLoad", nativeResult.wallLoad_kPa, oracleResult.wallDesignKpa, LOAD_TOLERANCE),
    compareNumberField("supportCraneVerticalLoad", nativeResult.supportCraneVerticalLoad, oracleResult.supportCraneGKn, FORCE_TOLERANCE),
    compareNumberField("supportCraneMoment", nativeResult.supportCraneMoment, oracleResult.supportCraneMomentKnM, FORCE_TOLERANCE),
    compareNumberField("final_N_kN", nativeResult.final_N_kN, oracleResult.normalForceKn, FORCE_TOLERANCE),
    compareNumberField("final_M_kNm", nativeResult.final_M_kNm, oracleResult.momentKnM, FORCE_TOLERANCE),
    compareTextField("topCandidateProfile", nativeResult.topCandidateProfile, firstOption?.profile),
    compareTextField("topCandidateSteel", nativeResult.topCandidateSteel, firstOption?.steel),
    compareNumberField("topCandidateUtilization", nativeResult.topCandidateUtilization, firstOption?.utilization, UTILIZATION_TOLERANCE),
    compareTextField(
      "limitingCheck",
      normalizeCheckName(nativeResult.limitingCheck),
      normalizeCheckName(firstOption?.governingCheck),
      "Compared after check-name normalization.",
    ),
    compareNumberField("massKg", nativeResult.massKg, firstOption?.totalWeightKg, MASS_TOLERANCE),
    compareNumberField(
      "costRubNormalized",
      nativeResult.costRubNormalized,
      firstOption?.costThousandRub === null || firstOption?.costThousandRub === undefined
        ? firstOption?.costThousandRub
        : firstOption.costThousandRub * 1000,
      COST_TOLERANCE,
      "Legacy native field costRub stores thousand rubles; comparison uses normalized rubles.",
    ),
    notComparableField(
      "baseMomentKnM",
      nativeResult.final_M_kNm,
      oracleResult.baseMomentKnM,
      "Native debug exposes final moment after coefficient, not the separate Excel base moment.",
    ),
  ];
  const summary = buildComparisonSummary(comparisons);

  return {
    block: "column",
    inputSnapshot: { nativeInput, oracleInput },
    nativeResult,
    oracleResult,
    comparisons,
    summary,
    overallStatus: getOverallStatus(summary),
  };
}

export function compareDefaultColumnNativeToVelican(): BlockComparisonResult {
  return compareColumnNativeToVelican();
}

export function compareNormalizedColumnNativeToVelican(): BlockComparisonResult {
  return compareColumnNativeToVelican(
    columnNormalizedScenario.nativeInput,
    columnNormalizedScenario.oracleInput,
  );
}
