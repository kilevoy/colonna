import { describe, expect, it } from "vitest";
import { buildPurlinDiagnosticReport } from "./purlin-diagnostics";

describe("purlin hot-rolled mass diagnostics", () => {
  it("builds hot-rolled mass trace for normalized scenario", async () => {
    const report = await buildPurlinDiagnosticReport();
    const trace = report.hotRolledMassDiagnostics.nativeMassTrace;

    expect(trace).toBeTruthy();
    expect(trace?.selectedProfile).toBe("кв.160х5");
    expect(trace?.totalLinearLengthM ?? 0).toBeGreaterThan(0);
  });

  it("computes oracle implied total length when unit mass is known", async () => {
    const report = await buildPurlinDiagnosticReport();
    const diagnostics = report.hotRolledMassDiagnostics;

    expect(diagnostics.impliedOracleTotalLengthM ?? 0).toBeGreaterThan(0);
    expect(diagnostics.nativeTotalLinearLengthM ?? 0).toBeGreaterThan(0);
  });

  it("keeps hot-rolled weight aligned after mass formula fix", async () => {
    const report = await buildPurlinDiagnosticReport();
    const weight = report.hotRolledDiagnostics.find((item) => item.field === "hotRolled.weightKg");

    expect(weight).toBeDefined();
    if (weight?.status !== "ok") {
      expect(report.hotRolledMassDiagnostics.suspectedCauses.length).toBeGreaterThan(0);
    }
    expect(weight?.status).toBe("ok");
  });
});
