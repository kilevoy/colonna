import { describe, expect, it } from "vitest";
import {
  calculateWindowRiegel,
  defaultWindowRiegelInput,
} from "../window-riegel";

describe("window-riegel oracle wrapper acceptance", () => {
  it("runs stable default window-riegel wrapper calculation", () => {
    const result = calculateWindowRiegel(defaultWindowRiegelInput);

    expect(result.source).toBe("velican-oracle");
    expect(result.warnings).toBeInstanceOf(Array);
    expect(
      result.lowerProfile ||
        result.upperProfile ||
        result.warnings.length > 0,
    ).toBeTruthy();

    if (result.lowerProfile) {
      expect(result.lowerProfile.profile?.trim().length).toBeGreaterThan(0);
    }
    if (result.upperProfile) {
      expect(result.upperProfile.profile?.trim().length).toBeGreaterThan(0);
    }
  }, 20_000);
});
