import { describe, expect, it } from "vitest";
import { buildPurlinDiagnosticReport } from "./purlin-diagnostics";

describe("purlin LSTK diagnostics", () => {
  it("builds MP350 and MP390 candidate diagnostics", async () => {
    const report = await buildPurlinDiagnosticReport();

    expect(report.lstkCandidateDiagnostics.mp350).toBeTruthy();
    expect(report.lstkCandidateDiagnostics.mp390).toBeTruthy();
    expect(Array.isArray(report.lstkCandidateDiagnostics.mp350.suspectedCauses)).toBe(true);
    expect(Array.isArray(report.lstkCandidateDiagnostics.mp390.suspectedCauses)).toBe(true);
  });

  it("exposes native and oracle top candidates when LSTK is supported", async () => {
    const report = await buildPurlinDiagnosticReport();

    expect(report.lstkCandidateDiagnostics.mp350.nativeTopCandidates.length).toBeGreaterThan(0);
    expect(report.lstkCandidateDiagnostics.mp350.oracleTopCandidates.length).toBeGreaterThan(0);
    expect(report.lstkCandidateDiagnostics.mp390.nativeTopCandidates.length).toBeGreaterThan(0);
    expect(report.lstkCandidateDiagnostics.mp390.oracleTopCandidates.length).toBeGreaterThan(0);
  });

  it("keeps MP350 first candidate aligned with VELICAN oracle", async () => {
    const report = await buildPurlinDiagnosticReport();
    const diagnostics = report.mp350Diagnostics;
    const failingPrimaryFields = diagnostics.filter(
      (item) =>
        item.status === "fail" &&
        ["mp350.profile", "mp350.meterWeightKg", "mp350.buildingWeightKg"].includes(item.field),
    );

    expect(report.lstkCandidateDiagnostics.mp350.firstNative?.profile).toBe("Z 350х2,5");
    expect(failingPrimaryFields).toEqual([]);
  });

  it("keeps MP390 first candidate aligned with VELICAN oracle", async () => {
    const report = await buildPurlinDiagnosticReport();
    const diagnostics = report.mp390Diagnostics;
    const failingPrimaryFields = diagnostics.filter(
      (item) =>
        item.status === "fail" &&
        ["mp390.profile", "mp390.meterWeightKg", "mp390.buildingWeightKg"].includes(item.field),
    );

    expect(report.lstkCandidateDiagnostics.mp390.firstNative?.profile).toBe("2ПС 245х65х2");
    expect(failingPrimaryFields).toEqual([]);
  });
});
