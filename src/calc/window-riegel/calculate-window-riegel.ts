import {
  calculateVelicanWindowRiegel,
  defaultVelicanWindowRiegelInputs,
} from "../velican/window-riegel";
import type {
  VelicanWindowRiegelInputs,
  VelicanWindowRiegelOption,
  VelicanWindowRiegelResult,
  WindowRiegelCheck,
  WindowRiegelInput,
  WindowRiegelProfile,
  WindowRiegelResult,
} from "./types";

export const defaultWindowRiegelInput: WindowRiegelInput = {
  openingHeightM: defaultVelicanWindowRiegelInputs.windowHeightM,
  facadePostStepM: defaultVelicanWindowRiegelInputs.frameStepM,
  windLoadKpa: defaultVelicanWindowRiegelInputs.windLoadKpa,
  terrainType: defaultVelicanWindowRiegelInputs.terrainType,
  buildingHeightM: defaultVelicanWindowRiegelInputs.buildingHeightM,
  rawOracleInput: {},
};

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeProfile(option: VelicanWindowRiegelOption | undefined): WindowRiegelProfile | null {
  if (!option || !option.profile) return null;

  return {
    profile: option.profile,
    steel: option.steel,
    weightKg: option.weightKg,
    sourceOption: option,
  };
}

export function buildVelicanWindowRiegelInput(
  input: WindowRiegelInput,
): VelicanWindowRiegelInputs {
  return {
    ...defaultVelicanWindowRiegelInputs,
    windowHeightM: input.openingHeightM,
    frameStepM: input.facadePostStepM,
    buildingHeightM: input.buildingHeightM,
    terrainType: input.terrainType,
    windLoadKpa: input.windLoadKpa,
    ...input.rawOracleInput,
  };
}

function buildChecks(result: VelicanWindowRiegelResult): WindowRiegelCheck[] {
  return [
    {
      name: "verticalLoadKpa",
      value: result.verticalLoadKpa,
      status: result.verticalLoadKpa === null ? "missing" : "not-comparable",
      note: "Workbook diagnostic value from VELICAN oracle.",
    },
    {
      name: "horizontalLoadKpa",
      value: result.horizontalLoadKpa,
      status: result.horizontalLoadKpa === null ? "missing" : "not-comparable",
      note: "Workbook diagnostic value from VELICAN oracle.",
    },
    {
      name: "outOfPlaneLengthM",
      value: result.outOfPlaneLengthM,
      status: result.outOfPlaneLengthM === null ? "missing" : "not-comparable",
      note: "Workbook diagnostic value from VELICAN oracle.",
    },
    {
      name: "inPlaneLengthM",
      value: result.inPlaneLengthM,
      status: result.inPlaneLengthM === null ? "missing" : "not-comparable",
      note: "Workbook diagnostic value from VELICAN oracle.",
    },
    {
      name: "effectiveWindLoadKpa",
      value: result.effectiveWindLoadKpa,
      status: "not-comparable",
      note: "Effective wind load after climate settlement lookup.",
    },
  ];
}

function normalizeResult(
  input: WindowRiegelInput,
  oracleResult: VelicanWindowRiegelResult,
): WindowRiegelResult {
  const lowerAndUpper = normalizeProfile(oracleResult.lowerAndUpperProfiles[0]);
  const sideProfile = normalizeProfile(oracleResult.upperType1Profiles[0]);
  const massKg = numberOrNull(lowerAndUpper?.weightKg);
  const costRub =
    massKg !== null && typeof input.pricePerTonRub === "number"
      ? (massKg / 1000) * input.pricePerTonRub
      : null;

  return {
    lowerProfile: lowerAndUpper,
    upperProfile: lowerAndUpper,
    sideProfile,
    utilization: null,
    massKg,
    costRub,
    checks: buildChecks(oracleResult),
    warnings: [...oracleResult.warnings],
    notes: [
      "Calculation is currently backed by VELICAN Excel/workbook oracle.",
      "Native window-riegel formulas are not implemented in colonna yet.",
    ],
    source: "velican-oracle",
  };
}

export function calculateWindowRiegel(
  input: WindowRiegelInput = defaultWindowRiegelInput,
): WindowRiegelResult {
  const oracleInput = buildVelicanWindowRiegelInput(input);
  const oracleResult = calculateVelicanWindowRiegel(oracleInput);

  return normalizeResult(input, oracleResult);
}
