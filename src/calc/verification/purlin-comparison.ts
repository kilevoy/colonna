import { runPurlinCalculationWithDebug } from "../debug/purlin-debug";
import { getCassetteHeightFilter } from "../purlin";
import type { PurlinInput } from "../purlin/types";
import {
  calculateVelicanPurlin,
  defaultVelicanPurlinInputs,
} from "../velican/purlin-oracle";
import type { PurlinInputs } from "../velican/purlin-oracle";
import {
  buildComparisonSummary,
  compareNumberField,
  compareTextField,
  getOverallStatus,
} from "./comparison-report";
import type { BlockComparisonResult, ComparisonFieldResult } from "./comparison-types";
import { purlinNormalizedScenario } from "./scenarios";

const LOAD_TOLERANCE = 0.001;
const STEP_TOLERANCE = 1;
const MASS_TOLERANCE = 0.1;
const COST_TOLERANCE = 1;

const prices = {
  "С255Б": 148.8,
  "С355Б": 155.88,
  "С245": 130.2,
  "С345": 141,
};

export const defaultNativePurlinLstkComparisonInput: PurlinInput = {
  materialType: "lstk",
  gamma_n: 1,
  roofShape: "gable",
  span_m: 24,
  length_m: 60,
  height_m: 12,
  roofSlope_deg: 6,
  framePitch_m: 6,
  terrainType: "B",
  w0_kPa: 0.6,
  Sg_kPa: 2.45,
  roofStructure: "РЎ-Рџ 150 РјРј",
  roofLoad_kPa: 0.32028,
  snowDrift: "none",
  drift_dropHeight_m: 4.5,
  drift_existingSize_m: 9.5,
  maxStep_mm: 1500,
  minStep_mm: 500,
  snowGuardPurlin: false,
  fencePurlin: false,
  maxUtilization: "default",
  cassetteHeightFilter_mm: getCassetteHeightFilter("РЎ-Рџ 150 РјРј"),
  prices,
};

export const defaultNativePurlinRolledComparisonInput: PurlinInput = {
  ...defaultNativePurlinLstkComparisonInput,
  materialType: "rolled",
  cassetteHeightFilter_mm: 0,
};

export async function comparePurlinNativeToVelican(
  nativeLstkInput: PurlinInput = defaultNativePurlinLstkComparisonInput,
  nativeRolledInput: PurlinInput = defaultNativePurlinRolledComparisonInput,
  oracleInput: PurlinInputs = defaultVelicanPurlinInputs,
): Promise<BlockComparisonResult> {
  const nativeLstk = runPurlinCalculationWithDebug(nativeLstkInput);
  const nativeRolled = runPurlinCalculationWithDebug(nativeRolledInput);
  const oracleResult = await calculateVelicanPurlin(oracleInput);
  const nativeHotRolled = nativeRolled.hotRolledCandidates[0] ?? null;
  const nativeMp350 = nativeLstk.lstkMp350Candidates[0] ?? null;
  const nativeMp390 = nativeLstk.lstkMp390Candidates[0] ?? null;
  const oracleHotRolled = oracleResult.hotRolled[0] ?? null;
  const oracleMp350 = oracleResult.mp350[0] ?? null;
  const oracleMp390 = oracleResult.mp390[0] ?? null;

  const comparisons: ComparisonFieldResult[] = [
    compareNumberField("roofLoadKpa", nativeLstk.roofLoadKpa, oracleResult.roofLoadKpa, LOAD_TOLERANCE),
    compareNumberField("snowLoadKpa", nativeLstk.snowLoadKpa, null, LOAD_TOLERANCE, "VELICAN purlin facade exposes loadAtMaxStepKpa, but not a standalone snow load."),
    compareNumberField("windLoadKpa", nativeLstk.windLoadKpa, null, LOAD_TOLERANCE, "VELICAN purlin facade exposes loadAtMaxStepKpa, but not a standalone wind load."),
    compareNumberField("autoMaxStepMm", nativeLstk.autoMaxStepMm, oracleResult.autoMaxStepMm, STEP_TOLERANCE, "Native colonna uses explicit min/max step and does not expose auto max step."),
    compareNumberField("loadAtMaxStepKpa", nativeLstk.loadAtMaxStepKpa, oracleResult.loadAtMaxStepKpa, LOAD_TOLERANCE),
    compareTextField("hotRolled.profile", nativeHotRolled?.profile, oracleHotRolled?.profile),
    compareNumberField("hotRolled.stepMm", nativeHotRolled?.stepMm, oracleHotRolled?.stepMm, STEP_TOLERANCE),
    compareNumberField("hotRolled.weightKg", nativeHotRolled?.weightKg, oracleHotRolled?.weightKg, MASS_TOLERANCE),
    compareNumberField("hotRolled.costRub", nativeHotRolled?.costRub, oracleHotRolled?.costThousandRub === null || oracleHotRolled?.costThousandRub === undefined ? oracleHotRolled?.costThousandRub : oracleHotRolled.costThousandRub * 1000, COST_TOLERANCE, "Native purlin rolled output does not expose estimated cost."),
    compareTextField("mp350.profile", nativeMp350?.profile, oracleMp350?.profile),
    compareNumberField("mp350.stepMm", nativeMp350?.stepMm, oracleMp350?.stepMm, STEP_TOLERANCE),
    compareNumberField("mp350.buildingWeightKg", nativeMp350?.buildingWeightKg, oracleMp350?.buildingWeightKg, MASS_TOLERANCE),
    compareTextField("mp390.profile", nativeMp390?.profile, oracleMp390?.profile),
    compareNumberField("mp390.stepMm", nativeMp390?.stepMm, oracleMp390?.stepMm, STEP_TOLERANCE),
    compareNumberField("mp390.buildingWeightKg", nativeMp390?.buildingWeightKg, oracleMp390?.buildingWeightKg, MASS_TOLERANCE),
  ];
  const summary = buildComparisonSummary(comparisons);

  return {
    block: "purlin",
    inputSnapshot: { nativeLstkInput, nativeRolledInput, oracleInput },
    nativeResult: { lstk: nativeLstk, rolled: nativeRolled },
    oracleResult,
    comparisons,
    summary,
    overallStatus: getOverallStatus(summary),
  };
}

export async function compareDefaultPurlinNativeToVelican(): Promise<BlockComparisonResult> {
  return comparePurlinNativeToVelican();
}

export async function compareNormalizedPurlinNativeToVelican(): Promise<BlockComparisonResult> {
  return comparePurlinNativeToVelican(
    purlinNormalizedScenario.nativeInput,
    purlinNormalizedScenario.nativeRolledInput,
    purlinNormalizedScenario.oracleInput,
  );
}
