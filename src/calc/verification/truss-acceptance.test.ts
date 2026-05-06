import { beforeAll, describe, expect, it } from "vitest";
import {
  expectComparisonOk,
  expectDiagnosticSectionNoFail,
  findComparisonField,
} from "./assert-comparison";
import {
  compareNormalizedTrussNativeToVelican,
} from "./truss-comparison";
import type { BlockComparisonResult } from "./comparison-types";

describe("truss normalized acceptance parity", () => {
  let result: BlockComparisonResult;

  beforeAll(() => {
    result = compareNormalizedTrussNativeToVelican();
  }, 60_000);

  it("keeps normalized truss comparison free of calculation failures", () => {
    expect(result.block).toBe("truss");
    expect(result.summary.fail).toBe(0);
    expect(result.summary.ok).toBeGreaterThanOrEqual(12);
    expect(result.summary.notComparable).toBe(2);
    expectDiagnosticSectionNoFail(result.comparisons);
  });

  it("keeps main truss member profiles and weights aligned with Molodechno oracle", () => {
    for (const field of [
      "topChord.profile",
      "topChord.weightKg",
      "bottomChord.profile",
      "bottomChord.weightKg",
      "supportBrace.profile",
      "supportBrace.weightKg",
      "web.profile",
      "web.weightKg",
      "totalWeightKg",
      "specificWeightKgM2",
    ]) {
      expectComparisonOk(result.comparisons, field);
    }
  });

  it("keeps directly comparable utilization fields aligned", () => {
    for (const field of [
      "topChord.utilization",
      "bottomChord.utilization",
    ]) {
      expectComparisonOk(result.comparisons, field);
    }
  });

  it("documents utilization fields that are not directly comparable", () => {
    for (const field of ["supportBrace.utilization", "web.utilization"]) {
      const comparison = findComparisonField(result.comparisons, field);

      expect(comparison, `Missing comparison field: ${field}`).toBeDefined();
      expect(comparison?.status, `Expected ${field} to stay not-comparable`).toBe("not-comparable");
      expect(comparison?.note).toBeTruthy();
    }
  });
});
