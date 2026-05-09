import { describe, expect, it } from "vitest";
import { defaultWindowRiegelInput } from "../calculate-window-riegel";
import {
  calculateWindowRiegelNative,
  runWindowRiegelNativeCalculationWithDebug,
} from "./index";

describe("window-riegel native skeleton", () => {
  it("returns source native-skeleton", () => {
    const result = calculateWindowRiegelNative(defaultWindowRiegelInput);

    expect(result.source).toBe("native-skeleton");
  });

  it("returns preliminary selected profiles", () => {
    const result = calculateWindowRiegelNative(defaultWindowRiegelInput);

    expect(result.lowerProfile?.profile || result.upperProfile?.profile || result.sideProfile?.profile).toBeTruthy();
  });

  it("returns candidate profiles in debug trace", () => {
    const debug = runWindowRiegelNativeCalculationWithDebug(defaultWindowRiegelInput);

    expect(debug.candidateProfiles.length).toBeGreaterThan(0);
    expect(debug.candidateProfiles[0]?.reason).toBeTruthy();
  });

  it("warns that the skeleton is preliminary", () => {
    const debug = runWindowRiegelNativeCalculationWithDebug(defaultWindowRiegelInput);

    expect(debug.warnings.join(" ")).toContain("preliminary skeleton");
    expect(debug.warnings.join(" ")).toContain("VELICAN oracle");
  });

  it("returns positive mass for default input", () => {
    const result = calculateWindowRiegelNative(defaultWindowRiegelInput);

    expect(result.massKg).toBeGreaterThan(0);
  });

  it("calculates cost when pricePerTonRub is present", () => {
    const result = calculateWindowRiegelNative({
      ...defaultWindowRiegelInput,
      pricePerTonRub: 180000,
    });

    expect(result.costRub).toBeGreaterThan(0);
  });
});
