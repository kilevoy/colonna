import { describe, expect, it } from "vitest";
import {
  calculateWindowRiegel,
  defaultWindowRiegelInput,
  runWindowRiegelCalculationWithDebug,
} from "./index";

describe("window-riegel oracle wrapper", () => {
  it("calculates default window-riegel input", () => {
    const result = calculateWindowRiegel(defaultWindowRiegelInput);

    expect(result.source).toBe("velican-oracle");
    expect(
      result.lowerProfile ||
        result.upperProfile ||
        result.warnings.length > 0,
    ).toBeTruthy();
    expect(result.checks).toBeInstanceOf(Array);
    expect(result.warnings).toBeInstanceOf(Array);
  }, 20_000);

  it("returns normalized profiles or warnings", () => {
    const result = calculateWindowRiegel(defaultWindowRiegelInput);

    if (result.lowerProfile) {
      expect(result.lowerProfile.profile?.trim().length).toBeGreaterThan(0);
    }
    if (result.upperProfile) {
      expect(result.upperProfile.profile?.trim().length).toBeGreaterThan(0);
    }
    expect(result.notes.join(" ")).toContain("VELICAN");
  }, 20_000);

  it("builds debug trace for default window-riegel input", () => {
    const debug = runWindowRiegelCalculationWithDebug(defaultWindowRiegelInput);

    expect(debug.source).toBe("velican-oracle");
    expect(debug.inputSnapshot).toEqual(defaultWindowRiegelInput);
    expect(debug.oracleInputSnapshot).toBeTruthy();
    expect(debug.oracleResultSnapshot).toBeTruthy();
    expect(debug.checks).toBeInstanceOf(Array);
    expect(debug.warnings).toBeInstanceOf(Array);
    expect(debug.missingDebugFields).toBeInstanceOf(Array);
  }, 20_000);
});
