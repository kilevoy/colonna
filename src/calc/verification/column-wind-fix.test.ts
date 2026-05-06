import { beforeAll, describe, expect, it } from "vitest";
import {
  buildColumnDiagnosticReport,
  type ColumnDiagnosticReport,
} from "./column-diagnostics";

function findField(report: ColumnDiagnosticReport, section: keyof Pick<ColumnDiagnosticReport, "loadDiagnostics" | "forceDiagnostics">, field: string) {
  const item = report[section].find((candidate) => candidate.field === field);
  expect(item, `Missing ${field}`).toBeDefined();
  return item;
}

describe("column wind parity after effective climate alignment", () => {
  let report: ColumnDiagnosticReport;

  beforeAll(() => {
    report = buildColumnDiagnosticReport();
  }, 20000);

  it("builds column diagnostic report with windDesign field", () => {
    expect(report.scenarioId).toBeTruthy();
    expect(findField(report, "loadDiagnostics", "windDesign")).toBeDefined();
  });

  it("keeps windDesign aligned with VELICAN column oracle", () => {
    const windDesign = findField(report, "loadDiagnostics", "windDesign");

    expect(windDesign?.status).toBe("ok");
  });

  it("keeps final moment aligned after wind input parity", () => {
    const finalMoment = findField(report, "forceDiagnostics", "final_M_kNm");

    expect(finalMoment?.status).toBe("ok");
  });

  it("keeps cranes untouched and aligned", () => {
    const failures = report.craneDiagnostics.filter((item) => item.status === "fail");

    expect(failures).toEqual([]);
  });

  it("keeps snow, roof and wall diagnostics aligned", () => {
    for (const field of ["snowDesign", "roofDesign", "wallDesign"]) {
      const item = findField(report, "loadDiagnostics", field);
      expect(item?.status).toBe("ok");
    }
  });
});
