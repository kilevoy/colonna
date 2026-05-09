import { getAbsoluteTolerance } from "./tolerances";
import type { ToleranceComparison, VerificationTolerance } from "./types";

export function compareWithTolerance(
  actual: number,
  expected: number,
  tolerance: VerificationTolerance,
): ToleranceComparison {
  const delta = actual - expected;
  const absDelta = Math.abs(delta);
  const absoluteTolerance = getAbsoluteTolerance(tolerance, expected);

  return {
    actual,
    expected,
    delta,
    absDelta,
    tolerance,
    status: absDelta <= absoluteTolerance ? "ok" : "fail",
  };
}
