import { runPurlinCalculationWithDebug } from "../debug/purlin-debug";
import type {
  PurlinHotRolledDebugCandidate,
  PurlinHotRolledMassTrace,
  PurlinLstkDebugCandidate,
  PurlinLstkSelectionTrace,
} from "../debug/purlin-debug";
import {
  calculateVelicanPurlin,
  type PurlinHotRolledOption,
  type PurlinInputs,
  type PurlinLstkOption,
  type PurlinResult,
} from "../velican/purlin-oracle";
import {
  compareNumberField,
  compareTextField,
} from "./comparison-report";
import type { ComparisonFieldResult } from "./comparison-types";
import { purlinNormalizedScenario } from "./scenarios";

const LOAD_TOLERANCE = 0.001;
const STEP_TOLERANCE = 1;
const MASS_TOLERANCE = 0.1;
const COST_TOLERANCE = 1;
const UTILIZATION_TOLERANCE = 0.001;

export interface VelicanPurlinDiagnosticAdapter {
  roofLoadKpa: number | null;
  autoMaxStepMm: number | null;
  loadAtMaxStepKpa: number | null;
  hotRolledCandidates: PurlinHotRolledOption[];
  mp350Candidates: PurlinLstkOption[];
  mp390Candidates: PurlinLstkOption[];
  oracleOnlyFields: {
    deckProfileSheet: string;
    tieInstallation: string;
    braceStep: number;
    lstkMp350PriceRubPerKg: number | null;
    lstkMp390PriceRubPerKg: number | null;
  };
}

export interface PurlinDiagnosticReport {
  scenarioId: string;
  inputSnapshot: unknown;
  loadDiagnostics: ComparisonFieldResult[];
  stepDiagnostics: ComparisonFieldResult[];
  hotRolledDiagnostics: ComparisonFieldResult[];
  hotRolledCandidateDiagnostics: HotRolledCandidateDiagnostics;
  hotRolledMassDiagnostics: HotRolledMassDiagnostics;
  lstkCandidateDiagnostics: LstkCandidateDiagnostics;
  mp350Diagnostics: ComparisonFieldResult[];
  mp390Diagnostics: ComparisonFieldResult[];
  missingFields: {
    native: string[];
    oracle: string[];
  };
  suspectedCauses: string[];
}

export interface HotRolledMassDiagnostics {
  nativeMassTrace: PurlinHotRolledMassTrace | null;
  oracleFirstCandidate: PurlinHotRolledOption | null;
  impliedOracleTotalLengthM: number | null;
  nativeTotalLinearLengthM: number | null;
  lengthRatio: number | null;
  massRatio: number | null;
  suspectedCauses: string[];
}

export interface HotRolledProfileOrderComparison {
  profile: string;
  nativeIndex: number | null;
  oracleIndex: number | null;
  status: "same-order" | "different-order" | "missing-native" | "missing-oracle";
}

export interface HotRolledCandidateDiagnostics {
  nativeTop10: PurlinHotRolledDebugCandidate[];
  oracleTop10: PurlinHotRolledOption[];
  firstNative: PurlinHotRolledDebugCandidate | null;
  firstOracle: PurlinHotRolledOption | null;
  commonProfiles: string[];
  nativeOnlyProfiles: string[];
  oracleOnlyProfiles: string[];
  profileOrderComparison: HotRolledProfileOrderComparison[];
  suspectedCauses: string[];
}

export interface LstkSystemCandidateDiagnostics {
  nativeSelectionTrace: PurlinLstkSelectionTrace | null;
  nativeTopCandidates: PurlinLstkDebugCandidate[];
  oracleTopCandidates: PurlinLstkOption[];
  firstNative: PurlinLstkDebugCandidate | null;
  firstOracle: PurlinLstkOption | null;
  commonProfiles: string[];
  nativeOnlyProfiles: string[];
  oracleOnlyProfiles: string[];
  suspectedCauses: string[];
}

export interface LstkCandidateDiagnostics {
  mp350: LstkSystemCandidateDiagnostics;
  mp390: LstkSystemCandidateDiagnostics;
}

function adaptOracle(
  input: PurlinInputs,
  result: PurlinResult,
): VelicanPurlinDiagnosticAdapter {
  return {
    roofLoadKpa: result.roofLoadKpa,
    autoMaxStepMm: result.autoMaxStepMm,
    loadAtMaxStepKpa: result.loadAtMaxStepKpa,
    hotRolledCandidates: result.hotRolled,
    mp350Candidates: result.mp350,
    mp390Candidates: result.mp390,
    oracleOnlyFields: {
      deckProfileSheet: input.deckProfile,
      tieInstallation: input.tieInstallation,
      braceStep: input.braceStepM,
      lstkMp350PriceRubPerKg: null,
      lstkMp390PriceRubPerKg: null,
    },
  };
}

function first<T>(items: T[]): T | null {
  return items[0] ?? null;
}

function hotRolledDiagnostics(
  native: PurlinHotRolledDebugCandidate | null,
  oracle: PurlinHotRolledOption | null,
): ComparisonFieldResult[] {
  return [
    compareTextField("hotRolled.profile", native?.profile, oracle?.profile),
    compareTextField("hotRolled.steel", native?.steel, oracle?.steel),
    compareNumberField("hotRolled.stepMm", native?.stepMm, oracle?.stepMm, STEP_TOLERANCE),
    compareNumberField("hotRolled.utilization", native?.utilization, undefined, UTILIZATION_TOLERANCE, "VELICAN facade does not expose hot-rolled utilization."),
    compareNumberField("hotRolled.weightKg", native?.weightKg, oracle?.weightKg, MASS_TOLERANCE),
    compareNumberField("hotRolled.costRub", native?.costRub, oracle?.costThousandRub == null ? oracle?.costThousandRub : oracle.costThousandRub * 1000, COST_TOLERANCE),
    compareTextField("hotRolled.limitingCheck", native?.limitingCheck, undefined, "VELICAN facade does not expose hot-rolled limiting check."),
  ];
}

function profileName(value: { profile?: string | null }): string | null {
  return value.profile ?? null;
}

function uniqueProfiles(items: Array<{ profile?: string | null }>): string[] {
  return Array.from(new Set(items.map(profileName).filter((item): item is string => Boolean(item))));
}

function firstIndex(items: Array<{ profile?: string | null }>, profile: string): number | null {
  const index = items.findIndex((item) => item.profile === profile);
  return index === -1 ? null : index;
}

function buildProfileOrderComparison(
  nativeTop10: PurlinHotRolledDebugCandidate[],
  oracleTop10: PurlinHotRolledOption[],
): HotRolledProfileOrderComparison[] {
  const profiles = Array.from(new Set([...uniqueProfiles(nativeTop10), ...uniqueProfiles(oracleTop10)]));
  return profiles.map((profile) => {
    const nativeIndex = firstIndex(nativeTop10, profile);
    const oracleIndex = firstIndex(oracleTop10, profile);
    if (nativeIndex === null) return { profile, nativeIndex, oracleIndex, status: "missing-native" };
    if (oracleIndex === null) return { profile, nativeIndex, oracleIndex, status: "missing-oracle" };
    return {
      profile,
      nativeIndex,
      oracleIndex,
      status: nativeIndex === oracleIndex ? "same-order" : "different-order",
    };
  });
}

function buildHotRolledCandidateSuspectedCauses(
  nativeTop10: PurlinHotRolledDebugCandidate[],
  oracleTop10: PurlinHotRolledOption[],
  firstNative: PurlinHotRolledDebugCandidate | null,
  firstOracle: PurlinHotRolledOption | null,
  profileOrderComparison: HotRolledProfileOrderComparison[],
): string[] {
  const causes: string[] = [];
  const nativeProfiles = uniqueProfiles(nativeTop10);
  const oracleProfiles = uniqueProfiles(oracleTop10);

  if (firstOracle?.profile && !nativeProfiles.includes(firstOracle.profile)) {
    causes.push("Проверить сортамент или фильтры: oracle profile не найден в native candidates.");
  }
  if (firstNative?.profile && !oracleProfiles.includes(firstNative.profile)) {
    causes.push("Проверить сортамент или фильтры: native profile не найден в oracle candidates.");
  }
  if (profileOrderComparison.some((item) => item.status === "different-order")) {
    causes.push("Проверить правило сортировки: масса/стоимость/utilization/шаг.");
  }
  if (
    firstNative?.stepMm !== undefined &&
    firstOracle?.stepMm !== undefined &&
    firstNative.stepMm !== firstOracle.stepMm
  ) {
    causes.push("Проверить min/max step и расчет допустимого шага.");
  }
  if (firstNative?.limitingCheck?.includes("прочность")) {
    causes.push("Проверить проверки прочности/прогиба.");
  }
  if (
    firstNative?.profile &&
    firstOracle?.profile &&
    firstNative.profile === firstOracle.profile &&
    firstNative.weightKg !== firstOracle.weightKg
  ) {
    causes.push("Профиль совпал, следующий этап — масса/количество/длина.");
  }

  return Array.from(new Set(causes));
}

function buildHotRolledCandidateDiagnostics(
  nativeTop10: PurlinHotRolledDebugCandidate[],
  oracleTop10: PurlinHotRolledOption[],
): HotRolledCandidateDiagnostics {
  const nativeProfiles = uniqueProfiles(nativeTop10);
  const oracleProfiles = uniqueProfiles(oracleTop10);
  const commonProfiles = nativeProfiles.filter((profile) => oracleProfiles.includes(profile));
  const nativeOnlyProfiles = nativeProfiles.filter((profile) => !oracleProfiles.includes(profile));
  const oracleOnlyProfiles = oracleProfiles.filter((profile) => !nativeProfiles.includes(profile));
  const firstNative = first(nativeTop10);
  const firstOracle = first(oracleTop10);
  const profileOrderComparison = buildProfileOrderComparison(nativeTop10, oracleTop10);

  return {
    nativeTop10,
    oracleTop10,
    firstNative,
    firstOracle,
    commonProfiles,
    nativeOnlyProfiles,
    oracleOnlyProfiles,
    profileOrderComparison,
    suspectedCauses: buildHotRolledCandidateSuspectedCauses(
      nativeTop10,
      oracleTop10,
      firstNative,
      firstOracle,
      profileOrderComparison,
    ),
  };
}

function buildHotRolledMassSuspectedCauses(
  nativeMassTrace: PurlinHotRolledMassTrace | null,
  oracleFirstCandidate: PurlinHotRolledOption | null,
  impliedOracleTotalLengthM: number | null,
  lengthRatio: number | null,
  massRatio: number | null,
): string[] {
  const causes: string[] = [];
  const sameProfileAndStep =
    nativeMassTrace?.selectedProfile === oracleFirstCandidate?.profile &&
    nativeMassTrace?.selectedStepMm === oracleFirstCandidate?.stepMm;

  if (sameProfileAndStep && impliedOracleTotalLengthM !== null && lengthRatio !== null && Math.abs(lengthRatio - 1) > 0.001) {
    causes.push("Проверить количество линий прогонов, длину ската, число скатов, длину здания, нахлесты/запас.");
  }
  if (massRatio !== null && massRatio >= 1.15 && massRatio <= 1.2) {
    causes.push("Похоже на коэффициент запаса/нахлеста/дополнительных прогонов/распорок.");
  }
  if (nativeMassTrace?.roofSlopeLengthM === null) {
    causes.push("Проверить расчет длины ската вместо горизонтальной проекции.");
  }
  if (nativeMassTrace?.braceMassKg === null || nativeMassTrace?.snowRetentionExtraMassKg === null || nativeMassTrace?.barrierExtraMassKg === null) {
    causes.push("Проверить дополнительные элементы в массе.");
  }
  if (nativeMassTrace?.unitMassKgPerM === null && oracleFirstCandidate?.weightKg !== null) {
    causes.push("Проверить сортамент и погонную массу профиля.");
  }

  return Array.from(new Set(causes));
}

function buildHotRolledMassDiagnostics(
  nativeMassTrace: PurlinHotRolledMassTrace | null,
  oracleFirstCandidate: PurlinHotRolledOption | null,
): HotRolledMassDiagnostics {
  const unitMass = nativeMassTrace?.unitMassKgPerM ?? null;
  const impliedOracleTotalLengthM =
    unitMass !== null && oracleFirstCandidate?.weightKg !== null && oracleFirstCandidate?.weightKg !== undefined
      ? oracleFirstCandidate.weightKg / unitMass
      : null;
  const nativeTotalLinearLengthM = nativeMassTrace?.totalLinearLengthM ?? null;
  const lengthRatio =
    impliedOracleTotalLengthM !== null && nativeTotalLinearLengthM !== null && nativeTotalLinearLengthM !== 0
      ? impliedOracleTotalLengthM / nativeTotalLinearLengthM
      : null;
  const massRatio =
    nativeMassTrace?.totalMassKg !== null &&
    nativeMassTrace?.totalMassKg !== undefined &&
    nativeMassTrace.totalMassKg !== 0 &&
    oracleFirstCandidate?.weightKg !== null &&
    oracleFirstCandidate?.weightKg !== undefined
      ? oracleFirstCandidate.weightKg / nativeMassTrace.totalMassKg
      : null;

  return {
    nativeMassTrace,
    oracleFirstCandidate,
    impliedOracleTotalLengthM,
    nativeTotalLinearLengthM,
    lengthRatio,
    massRatio,
    suspectedCauses: buildHotRolledMassSuspectedCauses(
      nativeMassTrace,
      oracleFirstCandidate,
      impliedOracleTotalLengthM,
      lengthRatio,
      massRatio,
    ),
  };
}

function buildLstkCandidateSuspectedCauses(
  nativeTopCandidates: PurlinLstkDebugCandidate[],
  oracleTopCandidates: PurlinLstkOption[],
  firstNative: PurlinLstkDebugCandidate | null,
  firstOracle: PurlinLstkOption | null,
): string[] {
  const causes: string[] = [];
  const nativeProfiles = uniqueProfiles(nativeTopCandidates);
  const oracleProfiles = uniqueProfiles(oracleTopCandidates);

  if (firstOracle?.profile && !nativeProfiles.includes(firstOracle.profile)) {
    causes.push("Проверить справочник профилей/наименования/фильтры.");
  }
  if (
    firstNative?.profile &&
    firstOracle?.profile &&
    firstNative.profile === firstOracle.profile &&
    firstNative.meterWeightKg !== firstOracle.meterWeightKg
  ) {
    causes.push("Проверить массу погонного метра в справочнике.");
  }
  if (
    firstNative?.profile &&
    firstOracle?.profile &&
    firstNative.profile === firstOracle.profile &&
    firstNative.meterWeightKg === firstOracle.meterWeightKg &&
    firstNative.buildingWeightKg !== firstOracle.buildingWeightKg
  ) {
    causes.push("Проверить расчет общей длины, numberOfPurlinLines, 1.03 factor, распорки.");
  }
  if (firstNative?.bracedWeightKg === null || firstNative?.blackWeightKg === null || firstNative?.galvanizedWeightKg === null) {
    causes.push("Проверить влияние oracle-only параметров на LSTK.");
  }
  if (nativeProfiles.length > 0 && oracleProfiles.length > 0 && nativeProfiles[0] !== oracleProfiles[0]) {
    causes.push("Проверить порядок workbook-семейств MP: 2TPS/2PS/Z и фильтры принятых профилей.");
  }

  return Array.from(new Set(causes));
}

function buildLstkSystemCandidateDiagnostics(
  nativeSelectionTrace: PurlinLstkSelectionTrace | null,
  oracleTopCandidates: PurlinLstkOption[],
): LstkSystemCandidateDiagnostics {
  const nativeTopCandidates = nativeSelectionTrace?.topCandidates ?? [];
  const nativeProfiles = uniqueProfiles(nativeTopCandidates);
  const oracleProfiles = uniqueProfiles(oracleTopCandidates);
  const firstNative = first(nativeTopCandidates);
  const firstOracle = first(oracleTopCandidates);

  return {
    nativeSelectionTrace,
    nativeTopCandidates,
    oracleTopCandidates,
    firstNative,
    firstOracle,
    commonProfiles: nativeProfiles.filter((profile) => oracleProfiles.includes(profile)),
    nativeOnlyProfiles: nativeProfiles.filter((profile) => !oracleProfiles.includes(profile)),
    oracleOnlyProfiles: oracleProfiles.filter((profile) => !nativeProfiles.includes(profile)),
    suspectedCauses: buildLstkCandidateSuspectedCauses(
      nativeTopCandidates,
      oracleTopCandidates,
      firstNative,
      firstOracle,
    ),
  };
}

function buildLstkCandidateDiagnostics(
  nativeLstk: ReturnType<typeof runPurlinCalculationWithDebug>,
  oracle: VelicanPurlinDiagnosticAdapter,
): LstkCandidateDiagnostics {
  return {
    mp350: buildLstkSystemCandidateDiagnostics(
      nativeLstk.lstkSelectionTrace.mp350,
      oracle.mp350Candidates.slice(0, 10),
    ),
    mp390: buildLstkSystemCandidateDiagnostics(
      nativeLstk.lstkSelectionTrace.mp390,
      oracle.mp390Candidates.slice(0, 10),
    ),
  };
}

function lstkDiagnostics(
  prefix: "mp350" | "mp390",
  native: PurlinLstkDebugCandidate | null,
  oracle: PurlinLstkOption | null,
): ComparisonFieldResult[] {
  return [
    compareTextField(`${prefix}.profile`, native?.profile, oracle?.profile),
    compareNumberField(`${prefix}.stepMm`, native?.stepMm, oracle?.stepMm, STEP_TOLERANCE),
    compareNumberField(`${prefix}.meterWeightKg`, native?.meterWeightKg, oracle?.meterWeightKg, MASS_TOLERANCE),
    compareNumberField(`${prefix}.buildingWeightKg`, native?.buildingWeightKg, oracle?.buildingWeightKg, MASS_TOLERANCE),
    compareNumberField(`${prefix}.blackWeightKg`, native?.blackWeightKg, oracle?.blackWeightKg, MASS_TOLERANCE),
    compareNumberField(`${prefix}.galvanizedWeightKg`, native?.galvanizedWeightKg, oracle?.galvanizedWeightKg, MASS_TOLERANCE),
    compareNumberField(`${prefix}.bracedWeightKg`, native?.bracedWeightKg, oracle?.bracedWeightKg, MASS_TOLERANCE),
  ];
}

function hasFail(items: ComparisonFieldResult[], field: string): boolean {
  return items.some((item) => item.field === field && item.status === "fail");
}

function anyFail(items: ComparisonFieldResult[], fieldIncludes: string): boolean {
  return items.some((item) => item.field.includes(fieldIncludes) && item.status === "fail");
}

function buildSuspectedCauses(report: Omit<PurlinDiagnosticReport, "suspectedCauses">): string[] {
  const allProfileDiagnostics = [
    ...report.hotRolledDiagnostics,
    ...report.mp350Diagnostics,
    ...report.mp390Diagnostics,
  ];
  const loadFail = hasFail(report.loadDiagnostics, "loadAtMaxStepKpa");
  const profileFail = anyFail(allProfileDiagnostics, "profile");
  const weightFail = anyFail(allProfileDiagnostics, "weight") || anyFail(allProfileDiagnostics, "Weight");
  const mpFail = [...report.mp350Diagnostics, ...report.mp390Diagnostics].some((item) => item.status === "fail");
  const hasOracleOnlyNativeMissing = report.missingFields.native.some((field) => field.startsWith("oracleOnly."));
  const causes: string[] = [];

  if (loadFail) causes.push("Сначала проверить расчет итоговой нагрузки/коэффициентов.");
  if (loadFail && profileFail) causes.push("Отличие профиля может быть следствием отличия нагрузки.");
  if (!loadFail && profileFail) causes.push("Проверить сортамент, фильтры профилей, max utilization, min/max step.");
  if (!profileFail && weightFail) causes.push("Проверить расчет массы/количества/длины/коэффициентов распорок.");
  if (mpFail && hasOracleOnlyNativeMissing) {
    causes.push("Проверить влияние deck/profile sheet, tie installation, brace step, LSTK prices.");
  }

  return causes;
}

export async function buildPurlinDiagnosticReport(): Promise<PurlinDiagnosticReport> {
  const scenario = purlinNormalizedScenario;
  const nativeLstk = runPurlinCalculationWithDebug(scenario.nativeInput);
  const nativeRolled = runPurlinCalculationWithDebug(scenario.nativeRolledInput);
  const oracleRaw = await calculateVelicanPurlin(scenario.oracleInput);
  const oracle = adaptOracle(scenario.oracleInput, oracleRaw);

  const loadDiagnostics: ComparisonFieldResult[] = [
    compareNumberField("roofLoadKpa", nativeLstk.purlinLoadTrace.roofLoadKpa, oracle.roofLoadKpa, LOAD_TOLERANCE),
    compareNumberField("snowLoadKpa", nativeLstk.purlinLoadTrace.snowLoadKpa, undefined, LOAD_TOLERANCE, "VELICAN facade does not expose standalone snow load."),
    compareNumberField("windLoadKpa", nativeLstk.purlinLoadTrace.windLoadKpa, undefined, LOAD_TOLERANCE, "VELICAN facade does not expose standalone wind load."),
    compareNumberField("totalDesignLoadKpa", nativeLstk.purlinLoadTrace.totalDesignLoadKpa, oracle.loadAtMaxStepKpa, LOAD_TOLERANCE),
    compareNumberField("loadAtMaxStepKpa", nativeLstk.purlinLoadTrace.loadAtMaxStepKpa, oracle.loadAtMaxStepKpa, LOAD_TOLERANCE),
  ];
  const stepDiagnostics: ComparisonFieldResult[] = [
    compareNumberField("autoMaxStepMm", nativeLstk.autoMaxStepMm, oracle.autoMaxStepMm, STEP_TOLERANCE),
    compareNumberField("manualMinStepMm", nativeLstk.manualMinStepMm, scenario.oracleInput.minStepMm, STEP_TOLERANCE),
    compareNumberField("manualMaxStepMm", nativeLstk.manualMaxStepMm, scenario.oracleInput.maxStepMm, STEP_TOLERANCE),
    compareNumberField("selectedStepMm.lstk", nativeLstk.selectedStepMm, first(oracle.mp350Candidates)?.stepMm, STEP_TOLERANCE),
    compareNumberField("selectedStepMm.hotRolled", nativeRolled.selectedStepMm, first(oracle.hotRolledCandidates)?.stepMm, STEP_TOLERANCE),
  ];
  const hotRolled = hotRolledDiagnostics(
    first(nativeRolled.hotRolledCandidates),
    first(oracle.hotRolledCandidates),
  );
  const hotRolledCandidateDiagnostics = buildHotRolledCandidateDiagnostics(
    nativeRolled.hotRolledSelectionTrace?.topCandidates ?? nativeRolled.hotRolledCandidates,
    oracle.hotRolledCandidates.slice(0, 10),
  );
  const hotRolledMassDiagnostics = buildHotRolledMassDiagnostics(
    nativeRolled.hotRolledMassTrace,
    first(oracle.hotRolledCandidates),
  );
  const lstkCandidateDiagnostics = buildLstkCandidateDiagnostics(nativeLstk, oracle);
  const mp350 = lstkDiagnostics("mp350", first(nativeLstk.lstkMp350Candidates), first(oracle.mp350Candidates));
  const mp390 = lstkDiagnostics("mp390", first(nativeLstk.lstkMp390Candidates), first(oracle.mp390Candidates));
  const missingNative = Array.from(new Set([
    ...nativeLstk.missingDebugFields,
    ...nativeRolled.missingDebugFields,
    "oracleOnly.deckProfileSheet",
    "oracleOnly.tieInstallation",
    "oracleOnly.braceStep",
    "oracleOnly.lstkMp350PriceRubPerKg",
    "oracleOnly.lstkMp390PriceRubPerKg",
  ]));
  const missingOracle = [
    "snowLoadKpa",
    "windLoadKpa",
    "hotRolled.utilization",
    "hotRolled.limitingCheck",
  ];

  const base = {
    scenarioId: scenario.scenarioId,
    inputSnapshot: {
      nativeLstkInput: scenario.nativeInput,
      nativeRolledInput: scenario.nativeRolledInput,
      oracleInput: scenario.oracleInput,
      nativeLstkLoadTrace: nativeLstk.purlinLoadTrace,
      nativeRolledLoadTrace: nativeRolled.purlinLoadTrace,
      oracleOnlyFields: oracle.oracleOnlyFields,
    },
    loadDiagnostics,
    stepDiagnostics,
    hotRolledDiagnostics: hotRolled,
    hotRolledCandidateDiagnostics,
    hotRolledMassDiagnostics,
    lstkCandidateDiagnostics,
    mp350Diagnostics: mp350,
    mp390Diagnostics: mp390,
    missingFields: {
      native: missingNative,
      oracle: missingOracle,
    },
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

function formatHotRolledCandidateDiagnostics(items: HotRolledCandidateDiagnostics): string {
  return [
    "## Hot Rolled Candidate Diagnostics",
    `First native: ${items.firstNative?.profile ?? "-"} / ${items.firstNative?.steel ?? "-"} / step ${items.firstNative?.stepMm ?? "-"}`,
    `First oracle: ${items.firstOracle?.profile ?? "-"} / ${items.firstOracle?.steel ?? "-"} / step ${items.firstOracle?.stepMm ?? "-"}`,
    `Common profiles: ${items.commonProfiles.join(", ") || "-"}`,
    `Native-only profiles: ${items.nativeOnlyProfiles.join(", ") || "-"}`,
    `Oracle-only profiles: ${items.oracleOnlyProfiles.join(", ") || "-"}`,
    "",
    "| Profile | Native index | Oracle index | Status |",
    "|---|---:|---:|---|",
    ...items.profileOrderComparison.map((item) => (
      `| ${item.profile} | ${item.nativeIndex ?? ""} | ${item.oracleIndex ?? ""} | ${item.status} |`
    )),
    "",
    "Suspected causes:",
    ...(items.suspectedCauses.length > 0 ? items.suspectedCauses.map((cause) => `- ${cause}`) : ["- -"]),
  ].join("\n");
}

function formatHotRolledMassDiagnostics(items: HotRolledMassDiagnostics): string {
  return [
    "## Hot Rolled Mass Diagnostics",
    `Native profile: ${items.nativeMassTrace?.selectedProfile ?? "-"}`,
    `Oracle profile: ${items.oracleFirstCandidate?.profile ?? "-"}`,
    `Native total linear length: ${formatValue(items.nativeTotalLinearLengthM)}`,
    `Oracle implied total length: ${formatValue(items.impliedOracleTotalLengthM)}`,
    `Length ratio: ${formatValue(items.lengthRatio)}`,
    `Mass ratio: ${formatValue(items.massRatio)}`,
    "",
    "Suspected causes:",
    ...(items.suspectedCauses.length > 0 ? items.suspectedCauses.map((cause) => `- ${cause}`) : ["- -"]),
  ].join("\n");
}

function formatLstkSystemCandidateDiagnostics(
  title: string,
  items: LstkSystemCandidateDiagnostics,
): string {
  return [
    `## ${title} Candidate Diagnostics`,
    `First native: ${items.firstNative?.profile ?? "-"} / step ${items.firstNative?.stepMm ?? "-"} / meter ${items.firstNative?.meterWeightKg ?? "-"}`,
    `First oracle: ${items.firstOracle?.profile ?? "-"} / step ${items.firstOracle?.stepMm ?? "-"} / meter ${items.firstOracle?.meterWeightKg ?? "-"}`,
    `Common profiles: ${items.commonProfiles.join(", ") || "-"}`,
    `Native-only profiles: ${items.nativeOnlyProfiles.join(", ") || "-"}`,
    `Oracle-only profiles: ${items.oracleOnlyProfiles.join(", ") || "-"}`,
    "",
    "| Source | System | Family | Profile | Step | Meter weight | Building weight |",
    "|---|---|---|---|---:|---:|---:|",
    ...items.nativeTopCandidates.map((item) => (
      `| native | ${item.system ?? ""} | ${item.family ?? ""} | ${item.profile} | ${item.stepMm} | ${formatValue(item.meterWeightKg)} | ${formatValue(item.buildingWeightKg)} |`
    )),
    ...items.oracleTopCandidates.map((item) => (
      `| oracle | ${item.system ?? ""} |  | ${item.profile ?? ""} | ${formatValue(item.stepMm)} | ${formatValue(item.meterWeightKg)} | ${formatValue(item.buildingWeightKg)} |`
    )),
    "",
    "Suspected causes:",
    ...(items.suspectedCauses.length > 0 ? items.suspectedCauses.map((cause) => `- ${cause}`) : ["- -"]),
  ].join("\n");
}

export function formatPurlinDiagnosticMarkdown(report: PurlinDiagnosticReport): string {
  return [
    "# Purlin Native vs VELICAN Diagnostic",
    "",
    `Scenario: ${report.scenarioId}`,
    "",
    formatSection("Loads", report.loadDiagnostics),
    "",
    formatSection("Steps", report.stepDiagnostics),
    "",
    formatSection("Hot Rolled", report.hotRolledDiagnostics),
    "",
    formatHotRolledCandidateDiagnostics(report.hotRolledCandidateDiagnostics),
    "",
    formatHotRolledMassDiagnostics(report.hotRolledMassDiagnostics),
    "",
    formatLstkSystemCandidateDiagnostics("MP350", report.lstkCandidateDiagnostics.mp350),
    "",
    formatLstkSystemCandidateDiagnostics("MP390", report.lstkCandidateDiagnostics.mp390),
    "",
    formatSection("MP350", report.mp350Diagnostics),
    "",
    formatSection("MP390", report.mp390Diagnostics),
    "",
    "## Missing Fields",
    `Native: ${report.missingFields.native.join(", ") || "-"}`,
    `Oracle: ${report.missingFields.oracle.join(", ") || "-"}`,
    "",
    "## Suspected Causes",
    ...report.suspectedCauses.map((cause) => `- ${cause}`),
  ].join("\n");
}
