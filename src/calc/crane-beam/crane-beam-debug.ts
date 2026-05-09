import {
  calculateVelicanCraneBeam,
} from "../velican/crane-beam";
import {
  buildVelicanCraneBeamInput,
  calculateCraneBeam,
  defaultCraneBeamInput,
} from "./calculate-crane-beam";
import type { CraneBeamDebugResult, CraneBeamInput } from "./types";

function buildMissingDebugFields(input: CraneBeamInput): string[] {
  const missing: string[] = [];

  if (input.maxWheelLoadKn !== undefined && input.maxWheelLoadKn !== null) {
    missing.push("maxWheelLoadKn.oracleInputMapping");
  }
  if (input.trolleyWeightT !== undefined && input.trolleyWeightT !== null) {
    missing.push("trolleyWeightT.oracleInputMapping");
  }
  if (input.craneWeightT !== undefined && input.craneWeightT !== null) {
    missing.push("craneWeightT.oracleInputMapping");
  }
  if (input.wheelBaseM !== undefined && input.wheelBaseM !== null) {
    missing.push("wheelBaseM.oracleInputMapping");
  }
  if (input.steel) {
    missing.push("steel.oracleInputMapping");
  }
  if (input.deflectionLimit !== undefined && input.deflectionLimit !== null) {
    missing.push("deflectionLimit.oracleInputMapping");
  }
  if (input.pricePerTonRub === undefined || input.pricePerTonRub === null) {
    missing.push("costRub.pricePerTonRub");
  }

  return missing;
}

export function runCraneBeamCalculationWithDebug(
  input: CraneBeamInput = defaultCraneBeamInput,
): CraneBeamDebugResult {
  const oracleInput = buildVelicanCraneBeamInput(input);
  const oracleResult = calculateVelicanCraneBeam(oracleInput);
  const result = calculateCraneBeam(input);

  return {
    ...result,
    inputSnapshot: input,
    oracleInputSnapshot: oracleInput,
    oracleResultSnapshot: oracleResult,
    selectedProfile: result.selectedProfile,
    utilization: result.utilization,
    massKg: result.massKg,
    costRub: result.costRub,
    dimensions: result.dimensions,
    strengthChecks: result.checks.strength,
    fatigueChecks: result.checks.crane78,
    stabilityChecks: result.checks.globalStability,
    localStabilityChecks: result.checks.localStability,
    deflectionChecks: result.checks.deflections,
    warnings: result.warnings,
    missingDebugFields: buildMissingDebugFields(input),
    source: "velican-oracle",
  };
}
