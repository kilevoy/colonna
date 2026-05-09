import {
  calculateVelicanWindowRiegel,
} from "../velican/window-riegel";
import {
  buildVelicanWindowRiegelInput,
  calculateWindowRiegel,
  defaultWindowRiegelInput,
} from "./calculate-window-riegel";
import type { WindowRiegelDebugResult, WindowRiegelInput } from "./types";

function buildMissingDebugFields(input: WindowRiegelInput): string[] {
  const missing: string[] = [
    "utilization",
    "checks.limits",
  ];

  if (input.openingWidthM !== undefined && input.openingWidthM !== null) {
    missing.push("openingWidthM.oracleInputMapping");
  }
  if (input.wallHeightM !== undefined && input.wallHeightM !== null) {
    missing.push("wallHeightM.oracleInputMapping");
  }
  if (input.wallLoadKpa !== undefined && input.wallLoadKpa !== null) {
    missing.push("wallLoadKpa.oracleInputMapping");
  }
  if (input.steel) {
    missing.push("steel.oracleInputMapping");
  }
  if (input.pricePerTonRub === undefined || input.pricePerTonRub === null) {
    missing.push("costRub.pricePerTonRub");
  }

  return missing;
}

export function runWindowRiegelCalculationWithDebug(
  input: WindowRiegelInput = defaultWindowRiegelInput,
): WindowRiegelDebugResult {
  const oracleInput = buildVelicanWindowRiegelInput(input);
  const oracleResult = calculateVelicanWindowRiegel(oracleInput);
  const result = calculateWindowRiegel(input);

  return {
    ...result,
    inputSnapshot: input,
    oracleInputSnapshot: oracleInput,
    oracleResultSnapshot: oracleResult,
    lowerProfile: result.lowerProfile,
    upperProfile: result.upperProfile,
    utilization: result.utilization,
    massKg: result.massKg,
    costRub: result.costRub,
    checks: result.checks,
    warnings: result.warnings,
    missingDebugFields: buildMissingDebugFields(input),
    source: "velican-oracle",
  };
}
