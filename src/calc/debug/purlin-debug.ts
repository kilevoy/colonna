import { runPurlinCalculation } from "../purlin";
import { enumerateRolledCandidates } from "../purlin/rolled";
import { isLstkOutput } from "../purlin/types";
import type {
  LstkCandidate,
  LstkOutput,
  PurlinInput,
  PurlinOutput,
  RolledCandidate,
} from "../purlin/types";

export interface PurlinHotRolledDebugCandidate {
  profile: string;
  steel: string;
  stepMm: number;
  utilization: number;
  strengthUtilization: number | null;
  deflectionUtilization: number | null;
  weightKg: number;
  costRub: number | null;
  governingCheck: string;
  limitingCheck: string;
  status: "accepted";
  checks: Record<string, number>;
}

export interface PurlinLstkDebugCandidate {
  system?: "MP350" | "MP390";
  family?: string;
  profile: string;
  stepMm: number;
  meterWeightKg: number;
  buildingWeightKg: number;
  utilization?: number;
  limitingCheck?: string | null;
  status?: "accepted";
  blackWeightKg: number | null;
  galvanizedWeightKg: number | null;
  bracedWeightKg: number | null;
}

export interface PurlinLoadTrace {
  roofLoadKpa: number;
  snowLoadKpa: number;
  windLoadKpa: number;
  snowBagFactor: number;
  responsibilityCoeff: number;
  loadBeforeFactorsKpa: number;
  loadAfterFactorsKpa: number;
  totalDesignLoadKpa: number;
  loadAtMaxStepKpa: number;
  appliedCoefficients: {
    snowGammaF: number;
    snowCombinationCoeff: number;
    snowThermalCoeff: number;
    roofResponsibilityCoeff: number;
    snowResponsibilityCoeff: number;
    windResponsibilityCoeff: number;
  };
  notes: string[];
}

export interface PurlinHotRolledSelectionTrace {
  inputLoadKpa: number;
  minStepMm: number;
  maxStepMm: number;
  maxUtilization: "default" | number;
  selectedProfile: string | null;
  selectedSteel: string | null;
  selectedStepMm: number | null;
  selectedUtilization: number | null;
  selectedWeightKg: number | null;
  selectedCostRub: number | null;
  sortingRule: string;
  totalCandidatesCount: number | null;
  rejectedCandidatesCount: number | null;
  topCandidates: PurlinHotRolledDebugCandidate[];
  rejectedSamples: unknown[];
  missingDebugFields: string[];
}

export interface PurlinHotRolledMassTrace {
  selectedProfile: string | null;
  selectedSteel: string | null;
  selectedStepMm: number | null;
  unitMassKgPerM: number | null;
  buildingLengthM: number;
  buildingSpanM: number;
  roofSlopeDeg: number;
  frameStepM: number;
  purlinStepM: number | null;
  roofSlopeLengthM: number | null;
  numberOfPurlinLines: number | null;
  numberOfSpansAlongLength: number;
  lengthPerLineM: number;
  totalLinearLengthM: number | null;
  basePurlinMassKg: number | null;
  braceMassKg: number | null;
  snowRetentionExtraMassKg: number | null;
  barrierExtraMassKg: number | null;
  overlapOrWasteFactor: number | null;
  totalMassKg: number | null;
  formulaNotes: string[];
  missingDebugFields: string[];
}

export interface PurlinLstkSelectionTrace {
  system: "MP350" | "MP390";
  inputLoadKpa: number;
  minStepMm: number;
  maxStepMm: number;
  maxUtilization: "default" | number;
  selectedProfile: string | null;
  selectedStepMm: number | null;
  selectedMeterWeightKg: number | null;
  selectedBuildingWeightKg: number | null;
  selectedBlackWeightKg: number | null;
  selectedGalvanizedWeightKg: number | null;
  selectedBracedWeightKg: number | null;
  roofSlopeLengthM: number;
  numberOfPurlinLines: number | null;
  buildingLengthM: number;
  totalLinearLengthM: number | null;
  overlapOrWasteFactor: number | null;
  sortingRule: string;
  totalCandidatesCount: number;
  topCandidates: PurlinLstkDebugCandidate[];
  rejectedSamples: unknown[];
  missingDebugFields: string[];
}

export interface PurlinCalculationWithDebug {
  inputSnapshot: PurlinInput;
  output: PurlinOutput;
  materialType: PurlinInput["materialType"];
  loads: {
    q_snow_kPa: number;
    q_windRoof_kPa: number;
    q_roof_kPa: number;
    q_total_kPa: number;
  };
  roofLoadKpa: number;
  snowLoadKpa: number;
  windLoadKpa: number;
  totalDesignLoadKpa: number;
  loadAtMaxStepKpa: number;
  autoMaxStepMm: number | null;
  manualMinStepMm: number;
  manualMaxStepMm: number;
  maxUtilization: "default" | number;
  selectedStepMm: number | null;
  hotRolledCandidates: PurlinHotRolledDebugCandidate[];
  lstkMp350Candidates: PurlinLstkDebugCandidate[];
  lstkMp390Candidates: PurlinLstkDebugCandidate[];
  purlinLoadTrace: PurlinLoadTrace;
  hotRolledSelectionTrace: PurlinHotRolledSelectionTrace | null;
  hotRolledMassTrace: PurlinHotRolledMassTrace | null;
  lstkSelectionTrace: {
    mp350: PurlinLstkSelectionTrace | null;
    mp390: PurlinLstkSelectionTrace | null;
  };
  warnings: string[];
  missingDebugFields: string[];
  mu2: number;
  designSpan_m: number;
  topCandidateProfile: string | null;
  topCandidateUtilization: number | null;
}

function mapRolled(candidate: RolledCandidate): PurlinHotRolledDebugCandidate {
  const strengthUtilization =
    candidate.checks["прочность с ветром/уклоном"] ??
    candidate.checks["прочность"] ??
    null;
  const deflectionUtilization = candidate.checks["прогиб"] ?? null;

  return {
    profile: candidate.profile.name,
    steel: candidate.steel,
    stepMm: candidate.spacing_mm,
    utilization: candidate.K_max,
    strengthUtilization,
    deflectionUtilization,
    weightKg: candidate.massPerBuilding_kg,
    costRub: null,
    governingCheck: candidate.limitingCheck,
    limitingCheck: candidate.limitingCheck,
    status: "accepted",
    checks: candidate.checks,
  };
}

function mapLstk(candidate: LstkCandidate): PurlinLstkDebugCandidate {
  return {
    system: candidate.profile.Ry_MPa === 350 ? "MP350" : "MP390",
    family: candidate.profile.type,
    profile: candidate.profile.name,
    stepMm: candidate.spacing_mm,
    meterWeightKg: candidate.profile.mass_kg_per_m,
    buildingWeightKg: candidate.massPerBuilding_kg,
    utilization: candidate.K,
    limitingCheck: "strength",
    status: "accepted",
    blackWeightKg: null,
    galvanizedWeightKg: null,
    bracedWeightKg: null,
  };
}

function sectionWinners(output: LstkOutput, grade: "MP350" | "MP390"): PurlinLstkDebugCandidate[] {
  const ry = grade === "MP350" ? 350 : 390;
  return output.sections
    .filter((section) => section.grade === grade && section.best)
    .map((section) => {
      const mapped = mapLstk(section.best as LstkCandidate);
      return {
        ...mapped,
        system: grade,
        family: section.type,
      };
    })
    .filter((candidate) => candidate.system === grade && (grade === "MP350" ? ry === 350 : ry === 390));
}

function splitLstkCandidates(output: PurlinOutput): {
  lstkMp350Candidates: PurlinLstkDebugCandidate[];
  lstkMp390Candidates: PurlinLstkDebugCandidate[];
} {
  if (!isLstkOutput(output)) {
    return { lstkMp350Candidates: [], lstkMp390Candidates: [] };
  }
  return {
    lstkMp350Candidates: sectionWinners(output, "MP350"),
    lstkMp390Candidates: sectionWinners(output, "MP390"),
  };
}

function hotRolledCandidates(output: PurlinOutput): PurlinHotRolledDebugCandidate[] {
  if (isLstkOutput(output)) return [];
  return output.top10.slice(0, 10).map(mapRolled);
}

function buildHotRolledSelectionTrace(
  input: PurlinInput,
  output: PurlinOutput,
): PurlinHotRolledSelectionTrace | null {
  if (isLstkOutput(output)) return null;
  const allCandidates = enumerateRolledCandidates(input, output.q_total_kPa, output.L_slope_m);
  allCandidates.sort((a, b) => a.massPerBuilding_kg - b.massPerBuilding_kg);
  const topCandidates = allCandidates.slice(0, 10).map(mapRolled);
  const selected = topCandidates[0] ?? null;

  return {
    inputLoadKpa: output.q_total_kPa,
    minStepMm: Math.min(input.minStep_mm, input.maxStep_mm),
    maxStepMm: Math.max(input.minStep_mm, input.maxStep_mm),
    maxUtilization: input.maxUtilization,
    selectedProfile: selected?.profile ?? null,
    selectedSteel: selected?.steel ?? null,
    selectedStepMm: selected?.stepMm ?? null,
    selectedUtilization: selected?.utilization ?? null,
    selectedWeightKg: selected?.weightKg ?? null,
    selectedCostRub: selected?.costRub ?? null,
    sortingRule: "accepted candidates sorted by massPerBuilding_kg ascending",
    totalCandidatesCount: allCandidates.length,
    rejectedCandidatesCount: null,
    topCandidates,
    rejectedSamples: [],
    missingDebugFields: [
      "hotRolledSelectionTrace.rejectedCandidatesCount",
      "hotRolledSelectionTrace.rejectedSamples",
      "hotRolledSelectionTrace.selectedCostRub",
      "hotRolledSelectionTrace.topCandidates.costRub",
    ],
  };
}

function buildHotRolledMassTrace(
  input: PurlinInput,
  output: PurlinOutput,
): PurlinHotRolledMassTrace | null {
  if (isLstkOutput(output)) return null;
  const selected = output.top10[0] ?? null;
  const stepM = selected ? selected.spacing_mm / 1000 : null;
  const slopeFactor = input.roofShape === "gable" ? 2 : 1;
  const roofSlopeLengthM =
    (input.span_m - 0.3) /
    slopeFactor /
    Math.cos((input.roofSlope_deg * Math.PI) / 180);
  const baseLinesPerSlope = stepM ? Math.max(1, Math.ceil(roofSlopeLengthM / stepM) + 1) : null;
  const snowRetentionExtraLinesPerSlope = input.snowGuardPurlin ? 1 : 0;
  const barrierExtraLinesPerSlope = input.fencePurlin ? 0.5 : 0;
  const linesPerSlope = baseLinesPerSlope === null
    ? null
    : baseLinesPerSlope + snowRetentionExtraLinesPerSlope + barrierExtraLinesPerSlope;
  const numberOfPurlinLines = linesPerSlope === null ? null : linesPerSlope * slopeFactor;
  const totalLinearLengthM = numberOfPurlinLines === null
    ? null
    : numberOfPurlinLines * input.length_m;
  const unitMassKgPerM = selected?.profile.mass_kg_per_m ?? null;
  const overlapOrWasteFactor = 1.03;
  const basePurlinMassKg = totalLinearLengthM === null || unitMassKgPerM === null
    ? null
    : totalLinearLengthM * unitMassKgPerM;

  return {
    selectedProfile: selected?.profile.name ?? null,
    selectedSteel: selected?.steel ?? null,
    selectedStepMm: selected?.spacing_mm ?? null,
    unitMassKgPerM,
    buildingLengthM: input.length_m,
    buildingSpanM: input.span_m,
    roofSlopeDeg: input.roofSlope_deg,
    frameStepM: input.framePitch_m,
    purlinStepM: stepM,
    roofSlopeLengthM,
    numberOfPurlinLines,
    numberOfSpansAlongLength: input.length_m / input.framePitch_m,
    lengthPerLineM: input.length_m,
    totalLinearLengthM,
    basePurlinMassKg,
    braceMassKg: null,
    snowRetentionExtraMassKg: input.snowGuardPurlin ? null : 0,
    barrierExtraMassKg: input.fencePurlin ? null : 0,
    overlapOrWasteFactor,
    totalMassKg: selected?.massPerBuilding_kg ?? null,
    formulaNotes: [
      "Hot-rolled mass uses roof slope length instead of horizontal half-span.",
      "Workbook parity adds one purlin line per slope: ceil(roofSlopeLength / step) + 1.",
      "Workbook parity applies a 1.03 overlap/waste factor to hot-rolled building mass.",
    ],
    missingDebugFields: [
      "hotRolledMassTrace.braceMassKg",
      ...(input.snowGuardPurlin ? ["hotRolledMassTrace.snowRetentionExtraMassKg"] : []),
      ...(input.fencePurlin ? ["hotRolledMassTrace.barrierExtraMassKg"] : []),
    ],
  };
}

function buildLoadTrace(input: PurlinInput, output: PurlinOutput): PurlinLoadTrace {
  const cosAlpha = Math.cos((input.roofSlope_deg * Math.PI) / 180);
  const loadBeforeFactorsKpa =
    input.roofLoad_kPa +
    input.Sg_kPa * output.mu2 * cosAlpha +
    output.q_windRoof_kPa / input.gamma_n;

  return {
    roofLoadKpa: output.q_roof_kPa,
    snowLoadKpa: output.q_snow_kPa,
    windLoadKpa: output.q_windRoof_kPa,
    snowBagFactor: output.mu2,
    responsibilityCoeff: input.gamma_n,
    loadBeforeFactorsKpa,
    loadAfterFactorsKpa: output.q_total_kPa,
    totalDesignLoadKpa: output.q_total_kPa,
    loadAtMaxStepKpa: output.q_total_kPa,
    appliedCoefficients: {
      snowGammaF: 1.4,
      snowCombinationCoeff: 1.1,
      snowThermalCoeff: 1.13,
      roofResponsibilityCoeff: input.gamma_n,
      snowResponsibilityCoeff: input.gamma_n,
      windResponsibilityCoeff: input.gamma_n,
    },
    notes: [
      "Native purlin uses explicit w0/Sg values; it does not resolve city climate loads.",
      "Native loadAtMaxStepKpa is the same value as totalDesignLoadKpa because current native selection uses explicit min/max step and a uniform area load.",
    ],
  };
}

function buildLstkSelectionTrace(
  input: PurlinInput,
  output: PurlinOutput,
  system: "MP350" | "MP390",
): PurlinLstkSelectionTrace | null {
  if (!isLstkOutput(output)) return null;
  const topCandidates = sectionWinners(output, system);
  const selected = topCandidates[0] ?? null;
  const slopeFactor = input.roofShape === "gable" ? 2 : 1;
  const stepM = selected ? selected.stepMm / 1000 : null;
  const horizontalHalfSpanM = (input.span_m - 0.3) / slopeFactor;
  const baseLinesPerSlope = stepM ? Math.max(1, Math.ceil(horizontalHalfSpanM / stepM)) : null;
  const isZ = selected?.family === "Z";
  const snowRetentionExtraLinesPerSlope = isZ
    ? input.snowGuardPurlin
      ? 2
      : 1
    : input.snowGuardPurlin
      ? 1.5
      : 1;
  const barrierExtraLinesPerSlope = isZ
    ? input.fencePurlin
      ? 1
      : 0
    : input.fencePurlin
      ? 0.5
      : 0;
  const linesPerSlope = baseLinesPerSlope === null
    ? null
    : baseLinesPerSlope + snowRetentionExtraLinesPerSlope + barrierExtraLinesPerSlope;
  const numberOfPurlinLines = linesPerSlope === null ? null : linesPerSlope * slopeFactor;
  const totalLinearLengthM = numberOfPurlinLines === null
    ? null
    : numberOfPurlinLines * input.length_m;

  return {
    system,
    inputLoadKpa: output.q_total_kPa,
    minStepMm: Math.min(input.minStep_mm, input.maxStep_mm),
    maxStepMm: Math.max(input.minStep_mm, input.maxStep_mm),
    maxUtilization: input.maxUtilization,
    selectedProfile: selected?.profile ?? null,
    selectedStepMm: selected?.stepMm ?? null,
    selectedMeterWeightKg: selected?.meterWeightKg ?? null,
    selectedBuildingWeightKg: selected?.buildingWeightKg ?? null,
    selectedBlackWeightKg: selected?.blackWeightKg ?? null,
    selectedGalvanizedWeightKg: selected?.galvanizedWeightKg ?? null,
    selectedBracedWeightKg: selected?.bracedWeightKg ?? null,
    roofSlopeLengthM: horizontalHalfSpanM,
    numberOfPurlinLines,
    buildingLengthM: input.length_m,
    totalLinearLengthM,
    overlapOrWasteFactor: null,
    sortingRule: "accepted family winners in workbook order: 2TPS, 2PS, Z",
    totalCandidatesCount: output.top10.filter((candidate) => candidate.profile.Ry_MPa === (system === "MP350" ? 350 : 390)).length,
    topCandidates,
    rejectedSamples: [],
    missingDebugFields: [
      `${system}.rejectedSamples`,
      `${system}.selectedBlackWeightKg`,
      `${system}.selectedGalvanizedWeightKg`,
      `${system}.selectedBracedWeightKg`,
      `${system}.overlapOrWasteFactor`,
    ],
  };
}

export function runPurlinCalculationWithDebug(
  input: PurlinInput,
): PurlinCalculationWithDebug {
  const output = runPurlinCalculation(input);
  const top = output.top10[0] ?? null;
  const lstk = splitLstkCandidates(output);
  const hotRolled = hotRolledCandidates(output);
  const selectedStepMm = top
    ? "spacing_mm" in top
      ? top.spacing_mm
      : null
    : null;
  const missingDebugFields = [
    "autoMaxStepMm",
    ...(hotRolled.length > 0
      ? [
          "hotRolledCandidates.costRub",
          "hotRolledSelectionTrace.rejectedCandidatesCount",
          "hotRolledSelectionTrace.rejectedSamples",
        ]
      : []),
    ...(lstk.lstkMp350Candidates.length > 0 || lstk.lstkMp390Candidates.length > 0
      ? [
          "lstkMp350Candidates.blackWeightKg",
          "lstkMp350Candidates.galvanizedWeightKg",
          "lstkMp350Candidates.bracedWeightKg",
          "lstkMp390Candidates.blackWeightKg",
          "lstkMp390Candidates.galvanizedWeightKg",
          "lstkMp390Candidates.bracedWeightKg",
        ]
      : []),
  ];
  const purlinLoadTrace = buildLoadTrace(input, output);
  const hotRolledSelectionTrace = buildHotRolledSelectionTrace(input, output);
  const hotRolledMassTrace = buildHotRolledMassTrace(input, output);
  const lstkSelectionTrace = {
    mp350: buildLstkSelectionTrace(input, output, "MP350"),
    mp390: buildLstkSelectionTrace(input, output, "MP390"),
  };

  return {
    inputSnapshot: structuredClone(input),
    output,
    materialType: input.materialType,
    loads: {
      q_snow_kPa: output.q_snow_kPa,
      q_windRoof_kPa: output.q_windRoof_kPa,
      q_roof_kPa: output.q_roof_kPa,
      q_total_kPa: output.q_total_kPa,
    },
    roofLoadKpa: output.q_roof_kPa,
    snowLoadKpa: output.q_snow_kPa,
    windLoadKpa: output.q_windRoof_kPa,
    totalDesignLoadKpa: output.q_total_kPa,
    loadAtMaxStepKpa: output.q_total_kPa,
    autoMaxStepMm: null,
    manualMinStepMm: input.minStep_mm,
    manualMaxStepMm: input.maxStep_mm,
    maxUtilization: input.maxUtilization,
    selectedStepMm,
    hotRolledCandidates: hotRolled,
    lstkMp350Candidates: lstk.lstkMp350Candidates,
    lstkMp390Candidates: lstk.lstkMp390Candidates,
    purlinLoadTrace,
    hotRolledSelectionTrace,
    hotRolledMassTrace,
    lstkSelectionTrace,
    warnings: [],
    missingDebugFields,
    mu2: output.mu2,
    designSpan_m: output.designSpan_m,
    topCandidateProfile: top?.profile.name ?? null,
    topCandidateUtilization: top
      ? "K" in top
        ? top.K
        : top.K_max
      : null,
  };
}
