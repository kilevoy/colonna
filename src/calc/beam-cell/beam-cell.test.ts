import { describe, expect, it } from "vitest";
import {
  calculateBeamCell,
  defaultBeamCellInput,
  runBeamCellCalculationWithDebug,
} from "./index";

describe("beam-cell oracle wrapper", () => {
  it("calculates default beam-cell input", () => {
    const result = calculateBeamCell(defaultBeamCellInput);

    expect(result.source).toBe("velican-oracle");
    expect(result.selectedProfile || result.warnings.length > 0).toBeTruthy();
    expect(result.checks).toBeInstanceOf(Array);
    expect(result.warnings).toBeInstanceOf(Array);
  });

  it("returns selected profile data or warnings", () => {
    const result = calculateBeamCell(defaultBeamCellInput);

    if (result.selectedProfile) {
      expect(result.selectedProfile.trim().length).toBeGreaterThan(0);
    }
    if (result.utilization !== null) {
      expect(Number.isFinite(result.utilization)).toBe(true);
    }
    expect(result.notes.join(" ")).toContain("VELICAN");
  });

  it("builds debug trace for default beam-cell input", () => {
    const debug = runBeamCellCalculationWithDebug(defaultBeamCellInput);

    expect(debug.source).toBe("velican-oracle");
    expect(debug.inputSnapshot).toEqual(defaultBeamCellInput);
    expect(debug.oracleInputSnapshot).toBeTruthy();
    expect(debug.oracleResultSnapshot).toBeTruthy();
    expect(debug.checks).toBeInstanceOf(Array);
    expect(debug.warnings).toBeInstanceOf(Array);
    expect(debug.missingDebugFields).toBeInstanceOf(Array);
  });
});
