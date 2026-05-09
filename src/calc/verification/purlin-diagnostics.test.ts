import { describe, expect, it } from "vitest";
import {
  buildPurlinDiagnosticReport,
  formatPurlinDiagnosticMarkdown,
} from "./purlin-diagnostics";

describe("purlin diagnostics", () => {
  it("builds a diagnostic report for normalized purlin scenario", async () => {
    const report = await buildPurlinDiagnosticReport();

    expect(report.scenarioId).toBeTruthy();
    expect(report.loadDiagnostics.length).toBeGreaterThan(0);
    expect(report.hotRolledDiagnostics.length).toBeGreaterThan(0);
    expect(Array.isArray(report.suspectedCauses)).toBe(true);
  });

  it("formats diagnostic report as markdown", async () => {
    const report = await buildPurlinDiagnosticReport();
    const markdown = formatPurlinDiagnosticMarkdown(report);

    expect(markdown).toContain("Purlin");
    expect(markdown).toContain("Loads");
    expect(markdown).toContain("Hot Rolled");
  });

  it("keeps missing debug fields inside the report without throwing", async () => {
    const report = await buildPurlinDiagnosticReport();

    expect(report.missingFields.native).toContain("autoMaxStepMm");
    expect(report.missingFields.oracle).toContain("snowLoadKpa");
  });
});
