import { beforeAll, describe, it } from "vitest";
import {
  expectComparisonOk,
  expectDiagnosticSectionNoFail,
} from "./assert-comparison";
import {
  buildColumnDiagnosticReport,
  type ColumnDiagnosticReport,
} from "./column-diagnostics";

describe("column normalized acceptance parity", () => {
  let report: ColumnDiagnosticReport;

  beforeAll(() => {
    report = buildColumnDiagnosticReport();
  }, 20000);

  it("keeps normalized column loads and cranes aligned with VELICAN oracle", () => {
    for (const field of ["snowDesign", "windDesign"]) {
      expectComparisonOk(report.loadDiagnostics, field);
    }
    for (const field of ["supportCraneVerticalLoad", "supportCraneMoment"]) {
      expectComparisonOk(report.craneDiagnostics, field);
    }
    expectDiagnosticSectionNoFail(report.loadDiagnostics);
    expectDiagnosticSectionNoFail(report.craneDiagnostics);
  });

  it("keeps normalized column forces aligned with VELICAN oracle", () => {
    for (const field of ["final_N_kN", "final_M_kNm"]) {
      expectComparisonOk(report.forceDiagnostics, field);
    }
    expectDiagnosticSectionNoFail(report.forceDiagnostics);
  });

  it("keeps normalized column profile aligned with VELICAN oracle", () => {
    for (const field of [
      "topCandidateProfile",
      "topCandidateSteel",
      "topCandidateUtilization",
      "limitingCheck",
    ]) {
      expectComparisonOk(report.profileDiagnostics, field);
    }
    expectDiagnosticSectionNoFail(report.profileDiagnostics);
  });

  it("keeps normalized column mass and cost aligned with VELICAN oracle", () => {
    for (const field of ["massKg", "costRubNormalized"]) {
      expectComparisonOk(report.massCostDiagnostics, field);
    }
    expectDiagnosticSectionNoFail(report.massCostDiagnostics);
  });
});
