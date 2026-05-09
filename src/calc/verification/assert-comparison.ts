import { expect } from "vitest";
import type { ComparisonFieldResult } from "./comparison-types";

export function findComparisonField(
  result: ComparisonFieldResult[],
  field: string,
): ComparisonFieldResult | undefined {
  return result.find((item) => item.field === field);
}

export function expectComparisonOk(
  result: ComparisonFieldResult[],
  field: string,
): ComparisonFieldResult {
  const item = findComparisonField(result, field);

  expect(item, `Missing comparison field: ${field}`).toBeDefined();
  expect(item?.status, `Expected ${field} to be ok`).toBe("ok");

  return item as ComparisonFieldResult;
}

export function expectDiagnosticSectionNoFail(
  section: ComparisonFieldResult[],
): void {
  const failures = section.filter((item) => item.status === "fail");

  expect(failures, `Unexpected failed fields: ${failures.map((item) => item.field).join(", ")}`).toEqual([]);
}
