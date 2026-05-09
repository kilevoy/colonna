import { runCalculation } from "../engine";
import { calcWindDetailed } from "../wind";
import type { CalculationInput, CalculationOutput } from "../types";

export interface ColumnCalculationDebug {
  inputSnapshot: CalculationInput;
  columnType: CalculationInput["columnType"];
  height_m: number;
  span_m: number;
  framePitch_m: number;
  fachverkPitch_m: number;
  w0_kPa: number;
  Sg_kPa: number;
  terrainType: CalculationInput["terrainType"];
  responsibilityCoeff: number;
  roofLoad_kPa: number;
  wallLoad_kPa: number;
  roofTributaryArea: number;
  wallTributaryArea: number;
  snowDesign: number;
  windDesign: {
    horizontalPressure_kPa: number;
    verticalRoof_kPa: number;
    horizontalDesign_kPa: number;
    verticalDesign_kPa: number;
  };
  supportCraneVerticalLoad: number;
  supportCraneMoment: number;
  suspendedCraneLoad: number;
  final_N_kN: number;
  final_M_kNm: number;
  mu: number;
  topCandidateProfile: string | null;
  topCandidateSteel: string | null;
  topCandidateUtilization: number | null;
  limitingCheck: string | null;
  massKg: number | null;
  costRub: number | null;
  costThousandRub: number | null;
  costRubNormalized: number | null;
}

export interface ColumnLoadTrace {
  inputSnapshot: CalculationInput;
  windLoadKpa: number;
  snowLoadKpa: number;
  terrainType: CalculationInput["terrainType"];
  heightM: number;
  spanM: number;
  frameStepM: number;
  facadeStepM: number;
  roofLoadKpa: number;
  wallLoadKpa: number;
  roofTributaryArea: number;
  wallTributaryArea: number;
  snowDesignKpa: number;
  windDesignKpa: number;
  windInternalKpa: number | null;
  roofDesignKpa: number;
  wallDesignKpa: number;
  supportCraneGKn: number;
  supportCraneTKn: number | null;
  supportCraneMomentKnM: number;
  suspendedCraneLoadKn: number;
  finalNKn: number;
  baseMomentKnM: number;
  finalMKnM: number;
  momentFactor: number;
  mu: number;
  appliedCoefficients: {
    snowGammaF: number;
    responsibilityCoeff: number;
    loadAdditionFactor: number;
  };
  notes: string[];
  missingDebugFields: string[];
  windTrace: ColumnWindTrace;
  columnMassTrace: ColumnMassTrace | null;
}

export interface ColumnMassTrace {
  nativeMassRaw: number | null;
  nativeMassUnit: "kg";
  oracleMassRaw: null;
  oracleMassUnit: "kg";
  profile: string | null;
  steel: string | null;
  lengthM: number;
  unitMassKgPerM: number | null;
  quantity: number;
  columnMassKg: number | null;
  braceMassKg: number | null;
  totalMassKg: number | null;
  costThousandRub: number | null;
  costRubNormalized: number | null;
  notes: string[];
  missingDebugFields: string[];
}

export interface ColumnWindTrace {
  w0Kpa: number;
  terrainType: CalculationInput["terrainType"];
  heightM: number;
  kZe: number;
  zeta: number;
  nu: {
    longB: number;
    shortB: number;
    fghPlus: number;
  };
  dynamicCoeff: number | null;
  pulsationCoeff: number | null;
  externalPressureCoeff: {
    zoneB: number;
    fghPlus: number;
  };
  internalPressureCoeff: number | null;
  windBeforeSideFactor: number;
  sideFactor: number;
  doubleSideFactor: number | null;
  windDesignKpa: number;
  windInternalKpa: number | null;
  windForMomentKpa: number;
  tributaryHeightM: number;
  tributaryWidthM: number;
  frameStepM: number;
  momentArmM: number;
  baseMomentKnM: number;
  notes: string[];
  missingDebugFields: string[];
}

export interface ColumnCalculationWithDebug extends ColumnCalculationDebug {
  output: CalculationOutput;
  columnLoadTrace: ColumnLoadTrace;
}

function roofTributaryArea(input: CalculationInput): number {
  if (input.columnType === "edge") return input.span_m / 2 * input.framePitch_m;
  if (input.columnType === "middle") return input.span_m * input.framePitch_m;
  return input.fachverkPitch_m * input.framePitch_m / 2;
}

function wallArea(input: CalculationInput): number {
  if (input.columnType === "fachwerk") return input.height_m * input.fachverkPitch_m;
  return input.height_m * input.framePitch_m;
}

function multiSpanFactor(input: CalculationInput, singleSpan: boolean): number {
  if (input.spanCount === "multi" && input.columnType === "middle" && !singleSpan) {
    return 2;
  }
  return 1;
}

function calcOverheadCraneDebug(input: CalculationInput): {
  supportCraneVerticalLoad: number;
  supportCraneMoment: number;
} {
  const c = input.overheadCrane;
  if (!c.enabled) {
    return { supportCraneVerticalLoad: 0, supportCraneMoment: 0 };
  }

  const step = input.framePitch_m;
  const y1 = 1;
  const y2 = y1 * (step - c.base_m) / step;
  const y3 = c.count === "two" ? y1 * (step - (c.gauge_m - c.base_m)) / step : 0;
  const y4 = c.count === "two" ? y1 * (step - c.gauge_m) / step : 0;
  const sumY = y1 + y2 + y3 + y4;
  const factor = multiSpanFactor(input, c.singleSpan);

  const vertical = c.wheelLoad_kN * sumY * 1.3 * 1.06 * factor;
  const horizontal = 0.05 * vertical;
  const moment = input.columnType === "middle"
    ? vertical * 0.75 / factor + horizontal * c.railLevel_m
    : vertical * 0.75 + horizontal * c.railLevel_m;

  return { supportCraneVerticalLoad: vertical, supportCraneMoment: moment };
}

function calcSuspendedCraneLoad(input: CalculationInput): number {
  const c = input.suspendedCrane;
  if (!c.enabled) return 0;
  return (c.capacity_t * 10 + 0.5 * 10) * 1.2 * 1.1 * multiSpanFactor(input, c.singleSpan);
}

function momentReductionCoeff(input: CalculationInput): number {
  const { columnType, perimeterTies, spanCount } = input;
  if (columnType === "fachwerk") return 0.35;

  const multi = spanCount === "multi";
  if (columnType === "edge") {
    if (perimeterTies) return multi ? 0.3 : 0.55;
    return multi ? 0.9 : 1;
  }
  if (columnType === "middle") {
    if (perimeterTies) return multi ? 0.1 : 0.55;
    return multi ? 0.6 : 1;
  }
  return 0.35;
}

export function runColumnCalculationWithDebug(
  input: CalculationInput,
): ColumnCalculationWithDebug {
  const output = runCalculation(input);
  const wind = calcWindDetailed(
    input.w0_kPa,
    input.terrainType,
    input.height_m,
    input.span_m,
    input.length_m,
  );
  const crane = calcOverheadCraneDebug(input);
  const suspendedCraneLoad = calcSuspendedCraneLoad(input);
  const pitch = input.columnType === "fachwerk" ? input.fachverkPitch_m : input.framePitch_m;
  const baseMomentKnM = output.windPressure_kPa * pitch * input.height_m * input.height_m / 2;
  const momentFactor = momentReductionCoeff(input);
  const top = output.results[0] ?? null;
  const strutStep = input.columnType === "fachwerk" ? input.fachverkPitch_m : input.framePitch_m;
  const columnMassTrace: ColumnMassTrace | null = top
    ? {
        nativeMassRaw: top.totalMass_kg,
        nativeMassUnit: "kg",
        oracleMassRaw: null,
        oracleMassUnit: "kg",
        profile: top.profileName,
        steel: top.steel,
        lengthM: input.height_m,
        unitMassKgPerM: top.mass_per_m,
        quantity: 1,
        columnMassKg: top.columnMass_kg,
        braceMassKg: top.strutCount * 9.6 * strutStep * 1.15,
        totalMassKg: top.totalMass_kg,
        costThousandRub: top.cost_rub,
        costRubNormalized: top.cost_rub * 1000,
        notes: [
          "Native legacy field costRub stores thousand rubles.",
          "Column mass follows workbook summary: unit mass * height * 1.15.",
          "Brace mass follows workbook summary: 9.6 kg/m * spacing * 1.15 * brace count.",
        ],
        missingDebugFields: ["columnMassTrace.oracleMassRaw"],
      }
    : null;
  const windTrace: ColumnWindTrace = {
    w0Kpa: input.w0_kPa,
    terrainType: input.terrainType,
    heightM: input.height_m,
    kZe: wind.kZe,
    zeta: wind.zeta,
    nu: {
      longB: wind.nuLongB,
      shortB: wind.nuShortB,
      fghPlus: wind.nuFghPlus,
    },
    dynamicCoeff: null,
    pulsationCoeff: null,
    externalPressureCoeff: {
      zoneB: wind.externalPressureCoeffB,
      fghPlus: wind.externalPressureCoeffFghPlus,
    },
    internalPressureCoeff: null,
    windBeforeSideFactor: wind.windBeforeSideFactor_kPa,
    sideFactor: wind.sideFactor,
    doubleSideFactor: null,
    windDesignKpa: output.windPressure_kPa,
    windInternalKpa: null,
    windForMomentKpa: output.windPressure_kPa,
    tributaryHeightM: input.height_m,
    tributaryWidthM: pitch,
    frameStepM: input.framePitch_m,
    momentArmM: input.height_m / 2,
    baseMomentKnM,
    notes: [
      "Native column wind uses max(B-zone long/short side) + FGH+ from calcWindDetailed().",
      "No double-side factor is applied in native after normalized wind input is aligned to oracle effective climate wind.",
    ],
    missingDebugFields: [
      "windTrace.dynamicCoeff",
      "windTrace.pulsationCoeff",
      "windTrace.internalPressureCoeff",
      "windTrace.doubleSideFactor",
    ],
  };
  const columnLoadTrace: ColumnLoadTrace = {
    inputSnapshot: structuredClone(input),
    windLoadKpa: input.w0_kPa,
    snowLoadKpa: input.Sg_kPa,
    terrainType: input.terrainType,
    heightM: input.height_m,
    spanM: input.span_m,
    frameStepM: input.framePitch_m,
    facadeStepM: input.fachverkPitch_m,
    roofLoadKpa: input.roofLoad_kPa,
    wallLoadKpa: input.wallLoad_kPa,
    roofTributaryArea: roofTributaryArea(input),
    wallTributaryArea: wallArea(input),
    snowDesignKpa: output.snowLoad_kPa,
    windDesignKpa: output.windPressure_kPa,
    windInternalKpa: null,
    roofDesignKpa: input.roofLoad_kPa * input.responsibilityCoeff,
    wallDesignKpa: input.wallLoad_kPa * input.responsibilityCoeff,
    supportCraneGKn: crane.supportCraneVerticalLoad,
    supportCraneTKn: input.overheadCrane.enabled ? crane.supportCraneVerticalLoad * 0.05 : 0,
    supportCraneMomentKnM: crane.supportCraneMoment,
    suspendedCraneLoadKn: suspendedCraneLoad,
    finalNKn: output.N_kN,
    baseMomentKnM,
    finalMKnM: output.M_kNm,
    momentFactor,
    mu: output.mu,
    appliedCoefficients: {
      snowGammaF: 1.4,
      responsibilityCoeff: input.responsibilityCoeff,
      loadAdditionFactor: 1 + input.loadAddition_pct / 100,
    },
    notes: [
      "Native column calculation uses explicit w0/Sg values; it does not resolve city climate loads.",
      "baseMomentKnM is reconstructed from native windPressure_kPa, column pitch and height before momentFactor.",
    ],
    missingDebugFields: [
      "columnLoadTrace.windInternalKpa",
      ...windTrace.missingDebugFields,
    ],
    windTrace,
    columnMassTrace,
  };

  return {
    output,
    columnLoadTrace,
    inputSnapshot: structuredClone(input),
    columnType: input.columnType,
    height_m: input.height_m,
    span_m: input.span_m,
    framePitch_m: input.framePitch_m,
    fachverkPitch_m: input.fachverkPitch_m,
    w0_kPa: input.w0_kPa,
    Sg_kPa: input.Sg_kPa,
    terrainType: input.terrainType,
    responsibilityCoeff: input.responsibilityCoeff,
    roofLoad_kPa: input.roofLoad_kPa,
    wallLoad_kPa: input.wallLoad_kPa,
    roofTributaryArea: roofTributaryArea(input),
    wallTributaryArea: wallArea(input),
    snowDesign: output.snowLoad_kPa,
    windDesign: {
      horizontalPressure_kPa: wind.horizontalPressure_kPa,
      verticalRoof_kPa: wind.verticalRoof_kPa,
      horizontalDesign_kPa: output.windPressure_kPa,
      verticalDesign_kPa: output.windSuction_kPa,
    },
    supportCraneVerticalLoad: crane.supportCraneVerticalLoad,
    supportCraneMoment: crane.supportCraneMoment,
    suspendedCraneLoad,
    final_N_kN: output.N_kN,
    final_M_kNm: output.M_kNm,
    mu: output.mu,
    topCandidateProfile: top?.profileName ?? null,
    topCandidateSteel: top?.steel ?? null,
    topCandidateUtilization: top?.maxUtilization ?? null,
    limitingCheck: top?.limitingCheck ?? null,
    massKg: top?.totalMass_kg ?? null,
    costRub: top?.cost_rub ?? null,
    costThousandRub: top?.cost_rub ?? null,
    costRubNormalized: top ? top.cost_rub * 1000 : null,
  };
}
