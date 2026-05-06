import { describe, expect, it } from "vitest";
import {
  calculateCraneBeam,
  defaultCraneBeamInput,
} from "../crane-beam";

describe("crane-beam oracle wrapper acceptance", () => {
  it("runs stable default crane-beam wrapper calculation", () => {
    const result = calculateCraneBeam(defaultCraneBeamInput);

    expect(result.source).toBe("velican-oracle");
    expect(result.selectedProfile || result.warnings.length > 0).toBeTruthy();
    expect(result.warnings).toBeInstanceOf(Array);

    if (result.selectedProfile) {
      expect(result.selectedProfile.trim().length).toBeGreaterThan(0);
    }
    if (result.utilization !== null) {
      expect(Number.isFinite(result.utilization)).toBe(true);
    } else {
      expect(result.warnings.length).toBeGreaterThan(0);
    }
  }, 20_000);
});
