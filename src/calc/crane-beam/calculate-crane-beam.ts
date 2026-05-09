import {
  calculateVelicanCraneBeam,
  defaultVelicanCraneInputs,
} from "../velican/crane-beam";
import type {
  CraneBeamCheck,
  CraneBeamDimensions,
  CraneBeamInput,
  CraneBeamResult,
  VelicanCraneCalculatorInputs,
  VelicanCraneCalculationResult,
} from "./types";

export const defaultCraneBeamInput: CraneBeamInput = {
  capacityT: defaultVelicanCraneInputs.capacity,
  craneSpanM: defaultVelicanCraneInputs.craneSpan,
  beamSpanM: defaultVelicanCraneInputs.beamSpan,
  wheelCount: defaultVelicanCraneInputs.wheelCount,
  railType: defaultVelicanCraneInputs.rail,
  dutyGroup: defaultVelicanCraneInputs.workGroup,
  regimeGroup: defaultVelicanCraneInputs.workGroup,
  rawOracleInput: {},
};

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function textOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return String(value);
}

export function buildVelicanCraneBeamInput(input: CraneBeamInput): VelicanCraneCalculatorInputs {
  return {
    ...defaultVelicanCraneInputs,
    capacity: input.capacityT,
    craneSpan: input.craneSpanM,
    wheelCount: input.wheelCount,
    workGroup: input.dutyGroup ?? input.regimeGroup ?? defaultVelicanCraneInputs.workGroup,
    rail: input.railType,
    beamSpan: input.beamSpanM,
    ...input.rawOracleInput,
  };
}

function checkStatus(label: string, value: unknown): CraneBeamCheck["status"] {
  if (value === null || value === undefined || value === "") return "missing";
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    !label.toLocaleLowerCase("ru-RU").includes("проверка")
  ) {
    return "not-comparable";
  }
  return value <= 1 ? "ok" : "fail";
}

function toChecks(items: VelicanCraneCalculationResult["strength"]): CraneBeamCheck[] {
  return items.map((item) => ({
    name: item.label,
    value: item.value,
    status: checkStatus(item.label, item.value),
    utilization:
      typeof item.value === "number" &&
      Number.isFinite(item.value) &&
      item.label.toLocaleLowerCase("ru-RU").includes("проверка")
        ? item.value
        : null,
    note: "Workbook cell value normalized from VELICAN oracle.",
  }));
}

function dimensionByIndex(dimensions: CraneBeamCheck[], index: number): number | null {
  return numberOrNull(dimensions[index]?.value);
}

function normalizeDimensions(result: VelicanCraneCalculationResult): CraneBeamDimensions {
  const raw = toChecks(result.dimensions);

  return {
    heightMm: dimensionByIndex(raw, 0),
    flangeWidthMm: dimensionByIndex(raw, 1),
    webThicknessMm: dimensionByIndex(raw, 2),
    flangeThicknessMm: dimensionByIndex(raw, 3),
    webHeightMm: dimensionByIndex(raw, 4),
    flangeOverhangMm: dimensionByIndex(raw, 5),
    radiusMm: dimensionByIndex(raw, 6),
    raw,
  };
}

function normalizeResult(
  input: CraneBeamInput,
  oracleResult: VelicanCraneCalculationResult,
): CraneBeamResult {
  const massKg = numberOrNull(oracleResult.weightKg);
  const costRub =
    massKg !== null && typeof input.pricePerTonRub === "number"
      ? (massKg / 1000) * input.pricePerTonRub
      : null;

  return {
    selectedProfile: textOrNull(oracleResult.profile),
    utilization: numberOrNull(oracleResult.utilizationPercent),
    massKg,
    costRub,
    dimensions: normalizeDimensions(oracleResult),
    checks: {
      strength: toChecks(oracleResult.strength),
      crane78: toChecks(oracleResult.crane78),
      globalStability: toChecks(oracleResult.globalStability),
      localStability: toChecks(oracleResult.localStability),
      deflections: toChecks(oracleResult.deflections),
      geometry: toChecks(oracleResult.geometry),
    },
    warnings: [...oracleResult.warnings],
    notes: [
      "Calculation is currently backed by VELICAN Excel/workbook oracle.",
      "Native crane-beam formulas are not implemented in colonna yet.",
    ],
    source: "velican-oracle",
  };
}

export function calculateCraneBeam(input: CraneBeamInput = defaultCraneBeamInput): CraneBeamResult {
  const oracleInput = buildVelicanCraneBeamInput(input);
  const oracleResult = calculateVelicanCraneBeam(oracleInput);

  return normalizeResult(input, oracleResult);
}
