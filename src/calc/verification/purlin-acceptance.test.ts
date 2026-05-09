import { describe, it } from "vitest";
import {
  expectComparisonOk,
  expectDiagnosticSectionNoFail,
} from "./assert-comparison";
import { buildPurlinDiagnosticReport } from "./purlin-diagnostics";

describe("purlin normalized acceptance parity", () => {
  it("keeps normalized purlin load parity with VELICAN oracle", async () => {
    const report = await buildPurlinDiagnosticReport();

    expectComparisonOk(report.loadDiagnostics, "totalDesignLoadKpa");
    expectComparisonOk(report.loadDiagnostics, "loadAtMaxStepKpa");
    expectDiagnosticSectionNoFail(report.loadDiagnostics);
  });

  it("keeps normalized hot-rolled purlin parity with VELICAN oracle", async () => {
    const report = await buildPurlinDiagnosticReport();

    expectComparisonOk(report.hotRolledDiagnostics, "hotRolled.profile");
    expectComparisonOk(report.hotRolledDiagnostics, "hotRolled.stepMm");
    expectComparisonOk(report.hotRolledDiagnostics, "hotRolled.weightKg");
    expectDiagnosticSectionNoFail(report.hotRolledDiagnostics);
  });

  it("keeps normalized MP350 purlin parity with VELICAN oracle", async () => {
    const report = await buildPurlinDiagnosticReport();

    expectComparisonOk(report.mp350Diagnostics, "mp350.profile");
    expectComparisonOk(report.mp350Diagnostics, "mp350.meterWeightKg");
    expectComparisonOk(report.mp350Diagnostics, "mp350.buildingWeightKg");
    expectDiagnosticSectionNoFail(report.mp350Diagnostics);
  });

  it("keeps normalized MP390 purlin parity with VELICAN oracle", async () => {
    const report = await buildPurlinDiagnosticReport();

    expectComparisonOk(report.mp390Diagnostics, "mp390.profile");
    expectComparisonOk(report.mp390Diagnostics, "mp390.meterWeightKg");
    expectComparisonOk(report.mp390Diagnostics, "mp390.buildingWeightKg");
    expectDiagnosticSectionNoFail(report.mp390Diagnostics);
  });
});
