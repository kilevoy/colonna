import {
  calculateVelicanBeamCell,
  defaultVelicanBeamCellInputs,
} from "../velican/beam-cell";
import type {
  BeamCellCheck,
  BeamCellInput,
  BeamCellResult,
  VelicanBeamCellInputs,
  VelicanBeamCellMemberSolution,
  VelicanBeamCellResult,
} from "./types";

export const defaultBeamCellInput: BeamCellInput = {
  spanM: defaultVelicanBeamCellInputs.mainBeamSpan,
  stepM: defaultVelicanBeamCellInputs.mainBeamStep,
  roofLoadKpa: defaultVelicanBeamCellInputs.floorLoadKgM2 / 100,
  steel: defaultVelicanBeamCellInputs.acceptedMainSteel,
  rawOracleInput: {},
};

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function solutionStatus(solution: VelicanBeamCellMemberSolution): BeamCellCheck["status"] {
  if (solution.status === "OK") return "ok";
  if (solution.status === "NO_SOLUTION") return "missing";
  return "not-comparable";
}

function solutionChecks(prefix: string, solution: VelicanBeamCellMemberSolution): BeamCellCheck[] {
  return [
    {
      name: `${prefix}.status`,
      value: solution.status,
      status: solutionStatus(solution),
      note: solution.message,
    },
    {
      name: `${prefix}.profile`,
      value: solution.profile ?? null,
      status: solution.profile ? "not-comparable" : "missing",
      note: "Workbook selected profile from VELICAN oracle.",
    },
    {
      name: `${prefix}.weightKg`,
      value: solution.weightKg ?? null,
      status: solution.weightKg === undefined ? "missing" : "not-comparable",
      note: "Workbook diagnostic value from VELICAN oracle.",
    },
    {
      name: `${prefix}.costRub`,
      value: solution.costRub ?? null,
      status: solution.costRub === undefined ? "missing" : "not-comparable",
      note: "Workbook diagnostic value from VELICAN oracle.",
    },
    {
      name: `${prefix}.utilization`,
      value: solution.utilization ?? null,
      utilization: solution.utilization ?? null,
      status: solution.utilization === undefined ? "missing" : solution.utilization <= 1 ? "ok" : "fail",
      note: "Workbook utilization from VELICAN oracle.",
    },
  ];
}

function buildChecks(result: VelicanBeamCellResult): BeamCellCheck[] {
  return [
    {
      name: "qMain",
      value: result.qMain,
      status: "not-comparable",
      note: "Main beam load from VELICAN oracle.",
    },
    {
      name: "qSecondary",
      value: result.qSecondary ?? null,
      status: result.qSecondary === undefined ? "missing" : "not-comparable",
      note: "Secondary beam load from VELICAN oracle.",
    },
    {
      name: "columnLoadKn",
      value: result.columnLoadKn ?? null,
      status: result.columnLoadKn === undefined ? "missing" : "not-comparable",
      note: "Column load from VELICAN oracle.",
    },
    ...solutionChecks("accepted.secondary", result.accepted.secondary),
    ...solutionChecks("accepted.main", result.accepted.main),
    ...solutionChecks("accepted.columns", result.accepted.columns),
  ];
}

export function buildVelicanBeamCellInput(input: BeamCellInput): VelicanBeamCellInputs {
  return {
    ...defaultVelicanBeamCellInputs,
    mainBeamSpan: input.spanM,
    mainBeamStep: input.stepM,
    floorLoadKgM2: input.roofLoadKpa * 100,
    acceptedMainSteel:
      input.steel === "C245" || input.steel === "C345"
        ? input.steel
        : defaultVelicanBeamCellInputs.acceptedMainSteel,
    prices:
      typeof input.pricePerTonRub === "number"
        ? {
            ...defaultVelicanBeamCellInputs.prices,
            ibeamC245: input.pricePerTonRub / 1000,
            ibeamC345: input.pricePerTonRub / 1000,
          }
        : defaultVelicanBeamCellInputs.prices,
    ...input.rawOracleInput,
  };
}

function normalizeResult(result: VelicanBeamCellResult): BeamCellResult {
  const main = result.accepted.main;

  return {
    selectedProfile: main.profile ?? null,
    utilization: numberOrNull(main.utilization),
    massKg: numberOrNull(main.weightKg),
    costRub: numberOrNull(main.costRub),
    checks: buildChecks(result),
    warnings: [...result.warnings],
    notes: [
      "Calculation is currently backed by VELICAN Excel/workbook oracle.",
      "Native beam-cell formulas are not implemented in colonna yet.",
    ],
    source: "velican-oracle",
  };
}

export function calculateBeamCell(input: BeamCellInput = defaultBeamCellInput): BeamCellResult {
  const oracleInput = buildVelicanBeamCellInput(input);
  const oracleResult = calculateVelicanBeamCell(oracleInput);

  return normalizeResult(oracleResult);
}
