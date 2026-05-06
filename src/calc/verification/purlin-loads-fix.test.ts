import { describe, expect, it } from "vitest";
import type { ComparisonFieldResult } from "./comparison-types";
import { buildPurlinDiagnosticReport } from "./purlin-diagnostics";

const PREVIOUS_LOAD_FAIL_COUNT = 2;

function byField(items: ComparisonFieldResult[], field: string) {
  return items.find((item) => item.field === field);
}

describe("purlin load diagnostics after normalized climate fix", () => {
  it("keeps load diagnostics focused on totalDesignLoadKpa and loadAtMaxStepKpa", async () => {
    const report = await buildPurlinDiagnosticReport();
    const total = byField(report.loadDiagnostics, "totalDesignLoadKpa");
    const atMaxStep = byField(report.loadDiagnostics, "loadAtMaxStepKpa");

    expect(total).toBeDefined();
    expect(atMaxStep).toBeDefined();
  });

  it("does not regress the load fail count", async () => {
    const report = await buildPurlinDiagnosticReport();
    const failCount = report.loadDiagnostics.filter((item) => item.status === "fail").length;

    expect(failCount).toBeLessThanOrEqual(PREVIOUS_LOAD_FAIL_COUNT);
  });

  it("matches normalized total load fields or explains remaining mismatch", async () => {
    const report = await buildPurlinDiagnosticReport();
    const total = byField(report.loadDiagnostics, "totalDesignLoadKpa");
    const atMaxStep = byField(report.loadDiagnostics, "loadAtMaxStepKpa");

    for (const item of [total, atMaxStep]) {
      expect(item).toBeDefined();
      if (item?.status !== "ok") {
        expect(item?.note).toBeTruthy();
      }
    }
  });
});
