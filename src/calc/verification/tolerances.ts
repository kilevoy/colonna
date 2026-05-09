import type { VerificationTolerance } from "./types";

export const STRICT_ZERO_TOLERANCE = 0;
export const DEFAULT_ABS_TOLERANCE = 1e-6;

export const DEFAULT_ENGINE_TOLERANCES = {
  loads: { abs: 1e-4 },
  force: { abs: 1e-3 },
  utilization: { abs: 1e-4 },
  mass: { abs: 1e-2 },
} satisfies Record<string, VerificationTolerance>;

export function getAbsoluteTolerance(
  tolerance: VerificationTolerance,
  expected: number,
): number {
  if (typeof tolerance === "number") return tolerance;

  const abs = tolerance.abs ?? 0;
  const relative = tolerance.relativePct === undefined
    ? 0
    : Math.abs(expected) * tolerance.relativePct / 100;

  return Math.max(abs, relative);
}
