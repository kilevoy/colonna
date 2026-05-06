import {
  calculateVelicanBeamCell,
} from "../velican/beam-cell";
import {
  buildVelicanBeamCellInput,
  calculateBeamCell,
  defaultBeamCellInput,
} from "./calculate-beam-cell";
import type { BeamCellDebugResult, BeamCellInput } from "./types";

function buildMissingDebugFields(input: BeamCellInput): string[] {
  const missing: string[] = [];

  if (input.snowLoadKpa !== undefined && input.snowLoadKpa !== null) {
    missing.push("snowLoadKpa.oracleInputMapping");
  }
  if (input.windLoadKpa !== undefined && input.windLoadKpa !== null) {
    missing.push("windLoadKpa.oracleInputMapping");
  }
  if (input.roofSlopeDeg !== undefined && input.roofSlopeDeg !== null) {
    missing.push("roofSlopeDeg.oracleInputMapping");
  }
  if (input.deflectionLimit !== undefined && input.deflectionLimit !== null) {
    missing.push("deflectionLimit.oracleInputMapping");
  }

  return missing;
}

export function runBeamCellCalculationWithDebug(
  input: BeamCellInput = defaultBeamCellInput,
): BeamCellDebugResult {
  const oracleInput = buildVelicanBeamCellInput(input);
  const oracleResult = calculateVelicanBeamCell(oracleInput);
  const result = calculateBeamCell(input);

  return {
    ...result,
    inputSnapshot: input,
    oracleInputSnapshot: oracleInput,
    oracleResultSnapshot: oracleResult,
    selectedProfile: result.selectedProfile,
    utilization: result.utilization,
    massKg: result.massKg,
    costRub: result.costRub,
    checks: result.checks,
    warnings: result.warnings,
    missingDebugFields: buildMissingDebugFields(input),
    source: "velican-oracle",
  };
}
