import { describe, expect, it } from "vitest";
import {
  calculateCraneBeam,
  defaultCraneBeamInput,
  runCraneBeamCalculationWithDebug,
} from "./index";

describe("crane-beam oracle wrapper", () => {
  it("calculates default crane beam input", () => {
    const result = calculateCraneBeam(defaultCraneBeamInput);

    expect(result.source).toBe("velican-oracle");
    expect(result.selectedProfile || result.warnings.length > 0).toBeTruthy();
    expect(result.checks.strength).toBeInstanceOf(Array);
    expect(result.warnings).toBeInstanceOf(Array);
  }, 20_000);

  it("returns normalized dimensions and checks arrays", () => {
    const result = calculateCraneBeam(defaultCraneBeamInput);

    expect(result.dimensions.raw).toBeInstanceOf(Array);
    expect(result.checks.crane78).toBeInstanceOf(Array);
    expect(result.checks.globalStability).toBeInstanceOf(Array);
    expect(result.checks.localStability).toBeInstanceOf(Array);
    expect(result.checks.deflections).toBeInstanceOf(Array);
  }, 20_000);

  it("builds debug trace for default crane beam input", () => {
    const debug = runCraneBeamCalculationWithDebug(defaultCraneBeamInput);

    expect(debug.source).toBe("velican-oracle");
    expect(debug.inputSnapshot).toEqual(defaultCraneBeamInput);
    expect(debug.oracleInputSnapshot).toBeTruthy();
    expect(debug.strengthChecks).toBeInstanceOf(Array);
    expect(debug.fatigueChecks).toBeInstanceOf(Array);
    expect(debug.stabilityChecks).toBeInstanceOf(Array);
    expect(debug.localStabilityChecks).toBeInstanceOf(Array);
    expect(debug.deflectionChecks).toBeInstanceOf(Array);
    expect(debug.missingDebugFields).toBeInstanceOf(Array);
  }, 20_000);
});
