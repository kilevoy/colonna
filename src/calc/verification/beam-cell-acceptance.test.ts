import { describe, expect, it } from "vitest";
import {
  calculateBeamCell,
  defaultBeamCellInput,
} from "../beam-cell";

describe("beam-cell oracle wrapper acceptance", () => {
  it("runs stable default beam-cell wrapper calculation", () => {
    const result = calculateBeamCell(defaultBeamCellInput);

    expect(result.source).toBe("velican-oracle");
    expect(result.warnings).toBeInstanceOf(Array);
    expect(result.selectedProfile || result.warnings.length > 0).toBeTruthy();

    if (result.selectedProfile) {
      expect(result.selectedProfile.trim().length).toBeGreaterThan(0);
    }
  });
});
