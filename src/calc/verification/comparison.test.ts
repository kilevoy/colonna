import { describe, expect, it } from "vitest";
import {
  buildAllDefaultComparisons,
  buildAllNormalizedComparisons,
  compareNumberField,
  formatAllComparisonsMarkdown,
} from "./comparison-report";
import { compareDefaultColumnNativeToVelican } from "./column-comparison";
import { compareDefaultPurlinNativeToVelican } from "./purlin-comparison";
import { compareDefaultTrussNativeToVelican } from "./truss-comparison";

describe("native vs VELICAN comparisons", () => {
  it("column comparison returns field results", () => {
    const result = compareDefaultColumnNativeToVelican();

    expect(result.block).toBe("column");
    expect(result.comparisons.length).toBeGreaterThan(0);
  }, 60_000);

  it("truss comparison returns field results", () => {
    const result = compareDefaultTrussNativeToVelican();

    expect(result.block).toBe("truss");
    expect(result.comparisons.length).toBeGreaterThan(0);
  }, 60_000);

  it("purlin comparison returns field results", async () => {
    const result = await compareDefaultPurlinNativeToVelican();

    expect(result.block).toBe("purlin");
    expect(result.comparisons.length).toBeGreaterThan(0);
  }, 60_000);

  it("buildAllDefaultComparisons returns all three blocks", async () => {
    const results = await buildAllDefaultComparisons();

    expect(results.map((result) => result.block)).toEqual(["column", "truss", "purlin"]);
  }, 90_000);

  it("buildAllNormalizedComparisons returns all three blocks", async () => {
    const results = await buildAllNormalizedComparisons();

    expect(results.map((result) => result.block)).toEqual(["column", "truss", "purlin"]);
  }, 90_000);

  it("normalized comparison markdown can be formatted", async () => {
    const markdown = formatAllComparisonsMarkdown(await buildAllNormalizedComparisons());

    expect(markdown).toContain("Column");
    expect(markdown).toContain("Truss");
    expect(markdown).toContain("Purlin");
  }, 90_000);

  it("formatAllComparisonsMarkdown includes block sections", async () => {
    const markdown = formatAllComparisonsMarkdown(await buildAllDefaultComparisons());

    expect(markdown).toContain("Column");
    expect(markdown).toContain("Truss");
    expect(markdown).toContain("Purlin");
  }, 90_000);

  it("missing fields are reported without throwing", () => {
    const result = compareNumberField("missing", undefined, 1, 0.01);

    expect(result.status).toBe("missing-native-field");
  });
});
