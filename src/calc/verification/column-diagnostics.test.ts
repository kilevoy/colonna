import { beforeAll, describe, expect, it } from "vitest";
import {
  buildColumnDiagnosticReport,
  formatColumnDiagnosticMarkdown,
  type ColumnDiagnosticReport,
} from "./column-diagnostics";

describe("column diagnostics", () => {
  let report: ColumnDiagnosticReport;

  beforeAll(() => {
    report = buildColumnDiagnosticReport();
  }, 20000);

  it("builds a diagnostic report for normalized column scenario", () => {
    expect(report.scenarioId).toBeTruthy();
    expect(report.loadDiagnostics.length).toBeGreaterThan(0);
    expect(report.craneDiagnostics.length).toBeGreaterThan(0);
    expect(report.forceDiagnostics.length).toBeGreaterThan(0);
    expect(report.profileDiagnostics.length).toBeGreaterThan(0);
    expect(report.massCostDiagnostics.length).toBeGreaterThan(0);
    expect(Array.isArray(report.suspectedCauses)).toBe(true);
  });

  it("formats column diagnostic report as markdown", () => {
    const markdown = formatColumnDiagnosticMarkdown(report);

    expect(markdown).toContain("Column");
    expect(markdown).toContain("Loads");
    expect(markdown).toContain("Forces");
    expect(markdown).toContain("Profile");
  });

  it("keeps missing fields explicit without throwing", () => {
    expect(report.missingFields.native).toContain("columnLoadTrace.windInternalKpa");
    expect(Array.isArray(report.missingFields.oracle)).toBe(true);
  });
});
