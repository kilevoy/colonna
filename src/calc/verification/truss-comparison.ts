import { runTrussCalculationWithDebug } from "../debug/truss-debug";
import { getDefaultMinThickness } from "../truss/engine";
import type { TrussInput, TrussSection } from "../truss/types";
import {
  calculateVelicanMolodechno,
  defaultVelicanMolodechnoInputs,
} from "../velican/molodechno-oracle";
import type { MolodechnoInputs, MolodechnoMemberResult } from "../velican/molodechno-oracle";
import {
  buildComparisonSummary,
  compareNumberField,
  compareTextField,
  getOverallStatus,
  notComparableField,
} from "./comparison-report";
import type { BlockComparisonResult, ComparisonFieldResult } from "./comparison-types";
import { trussNormalizedScenario } from "./scenarios";

const MASS_TOLERANCE = 0.1;
const UTILIZATION_TOLERANCE = 0.001;

export const defaultNativeTrussComparisonInput: TrussInput = {
  height_m: 12,
  span_m: 24,
  length_m: 30,
  framePitch_m: 6,
  purlinPitch_mm: 0,
  roofSlope_deg: 6,
  responsibilityCoeff: 1,
  terrainType: "B",
  w0_kPa: 0.3,
  Sg_kPa: 1.2,
  roofStructure: "temporary-comparison",
  roofLoad_kPa: 0.24,
  loadAddition_pct: 15,
  maxUtilization: 0.85,
  minThickness_mm: getDefaultMinThickness(),
  maxWidth_mm: { VP: 500, NP: 500 },
  minWidth_mm: { ORb: 80, OR: 80, RR: 60 },
};

function nativeSection(
  nativeResult: ReturnType<typeof runTrussCalculationWithDebug>,
  section: TrussSection,
) {
  return nativeResult.output.sections[section].selected;
}

function oracleMember(
  oracleResult: ReturnType<typeof calculateVelicanMolodechno>,
  key: MolodechnoMemberResult["key"],
) {
  return oracleResult.members.find((member) => member.key === key) ?? null;
}

export function compareTrussNativeToVelican(
  nativeInput: TrussInput = defaultNativeTrussComparisonInput,
  oracleInput: MolodechnoInputs = defaultVelicanMolodechnoInputs,
): BlockComparisonResult {
  const nativeResult = runTrussCalculationWithDebug(nativeInput);
  const oracleResult = calculateVelicanMolodechno(oracleInput);
  const topChord = oracleMember(oracleResult, "topChord");
  const bottomChord = oracleMember(oracleResult, "bottomChord");
  const supportBrace = oracleMember(oracleResult, "braceNoRidge");
  const web = oracleMember(oracleResult, "web");
  const nativeTop = nativeSection(nativeResult, "VP");
  const nativeBottom = nativeSection(nativeResult, "NP");
  const nativeSupportBrace = nativeSection(nativeResult, "ORb");
  const nativeWeb = nativeSection(nativeResult, "RR");

  const comparisons: ComparisonFieldResult[] = [
    compareTextField("topChord.profile", nativeTop?.profile.name, topChord?.profile),
    compareNumberField("topChord.weightKg", nativeTop?.totalMass_kg, topChord?.weightKg, MASS_TOLERANCE),
    compareNumberField("topChord.utilization", nativeTop?.maxUtilization, topChord?.utilization, UTILIZATION_TOLERANCE),
    compareTextField("bottomChord.profile", nativeBottom?.profile.name, bottomChord?.profile),
    compareNumberField("bottomChord.weightKg", nativeBottom?.totalMass_kg, bottomChord?.weightKg, MASS_TOLERANCE),
    compareNumberField("bottomChord.utilization", nativeBottom?.maxUtilization, bottomChord?.utilization, UTILIZATION_TOLERANCE),
    compareTextField("supportBrace.profile", nativeSupportBrace?.profile.name, supportBrace?.profile),
    compareNumberField("supportBrace.weightKg", nativeSupportBrace?.totalMass_kg, supportBrace?.weightKg, MASS_TOLERANCE),
    notComparableField(
      "supportBrace.utilization",
      nativeSupportBrace?.maxUtilization,
      supportBrace?.utilization,
      "Native ORb and VELICAN braceNoRidge may represent different support-brace scheme assumptions.",
    ),
    compareTextField("web.profile", nativeWeb?.profile.name, web?.profile),
    compareNumberField("web.weightKg", nativeWeb?.totalMass_kg, web?.weightKg, MASS_TOLERANCE),
    notComparableField(
      "web.utilization",
      nativeWeb?.maxUtilization,
      web?.utilization,
      "Native RR section is mapped to VELICAN web only for diagnostics; element schemes are not identical.",
    ),
    compareNumberField("totalWeightKg", nativeResult.totalMassKg, oracleResult.totalWeightKg, MASS_TOLERANCE),
    compareNumberField("specificWeightKgM2", nativeResult.unitMassKgPerM2, oracleResult.specificWeightKgM2, MASS_TOLERANCE),
  ];
  const summary = buildComparisonSummary(comparisons);

  return {
    block: "truss",
    inputSnapshot: { nativeInput, oracleInput },
    nativeResult,
    oracleResult,
    comparisons,
    summary,
    overallStatus: getOverallStatus(summary),
  };
}

export function compareDefaultTrussNativeToVelican(): BlockComparisonResult {
  return compareTrussNativeToVelican();
}

export function compareNormalizedTrussNativeToVelican(): BlockComparisonResult {
  return compareTrussNativeToVelican(
    trussNormalizedScenario.nativeInput,
    trussNormalizedScenario.oracleInput,
  );
}
