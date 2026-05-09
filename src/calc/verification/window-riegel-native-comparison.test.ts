import { describe, expect, it } from "vitest";
import { defaultWindowRiegelInput } from "../window-riegel";
import { compareWindowRiegelNativeToVelican } from "./window-riegel-native-comparison";

describe("window-riegel native vs VELICAN diagnostic comparison", () => {
  it("runs without throwing", () => {
    expect(() => compareWindowRiegelNativeToVelican(defaultWindowRiegelInput)).not.toThrow();
  }, 20_000);

  it("returns at least one comparable field", () => {
    const result = compareWindowRiegelNativeToVelican({
      ...defaultWindowRiegelInput,
      pricePerTonRub: 180000,
    });

    expect(result.block).toBe("window_riegel");
    expect(result.comparisons.length).toBeGreaterThan(0);
    expect(result.summary.total).toBeGreaterThan(0);
    expect(result.summary.fail + result.summary.ok + result.summary.missingNative + result.summary.missingOracle).toBeGreaterThan(0);
  }, 20_000);

  it("documents that the skeleton is not parity-approved", async () => {
    const { readFileSync } = await import("node:fs");
    const doc = readFileSync("docs/window-riegel-native-migration.md", "utf8");

    expect(doc).toContain("not parity-approved");
  });
});
