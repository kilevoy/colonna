import { describe, expect, it } from "vitest";
import { buildPurlinDiagnosticReport } from "./purlin-diagnostics";

describe("purlin hot-rolled diagnostics", () => {
  it("builds hot-rolled candidate diagnostics", async () => {
    const report = await buildPurlinDiagnosticReport();
    const diagnostics = report.hotRolledCandidateDiagnostics;

    expect(diagnostics.nativeTop10.length).toBeGreaterThan(0);
    expect(diagnostics.oracleTop10.length).toBeGreaterThan(0);
    expect(Array.isArray(diagnostics.suspectedCauses)).toBe(true);
  });

  it("explains remaining hot-rolled profile or weight mismatch", async () => {
    const report = await buildPurlinDiagnosticReport();
    const profile = report.hotRolledDiagnostics.find((item) => item.field === "hotRolled.profile");
    const weight = report.hotRolledDiagnostics.find((item) => item.field === "hotRolled.weightKg");

    expect(profile).toBeDefined();
    expect(weight).toBeDefined();

    if (profile?.status === "fail") {
      expect(report.hotRolledCandidateDiagnostics.suspectedCauses.length).toBeGreaterThan(0);
    }
    if (profile?.status === "ok" && weight?.status === "fail") {
      expect(report.hotRolledCandidateDiagnostics.suspectedCauses).toContain(
        "Профиль совпал, следующий этап — масса/количество/длина.",
      );
    }
  });

  it("keeps the selected hot-rolled profile aligned with oracle after the selection fix", async () => {
    const report = await buildPurlinDiagnosticReport();
    const profile = report.hotRolledDiagnostics.find((item) => item.field === "hotRolled.profile");

    expect(profile?.status).toBe("ok");
  });
});
