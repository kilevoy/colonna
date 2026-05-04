/** Purlin calculator — unifies LSTK and rolled-steel backends */
export { runLstkPurlinCalculation, computeLoads, getCassetteHeightFilter } from "./engine";
export { runRolledPurlinCalculation } from "./rolled";
export type {
  PurlinInput,
  PurlinOutput,
  LstkOutput,
  RolledOutput,
  LstkSteelGrade,
  RolledSteelGrade,
  LstkProfileType,
  MaterialType,
  SnowDriftMode,
  RoofShape,
} from "./types";
export { isLstkOutput } from "./types";
export type { LstkCandidate, RolledCandidate } from "./types";

import { runLstkPurlinCalculation, computeLoads } from "./engine";
import { runRolledPurlinCalculation } from "./rolled";
import { computeSnowDrift } from "./loads";
import type { PurlinInput, PurlinOutput } from "./types";

/** Dispatcher: calls the right engine based on materialType */
export function runPurlinCalculation(input: PurlinInput): PurlinOutput {
  if (input.materialType === "lstk") {
    return runLstkPurlinCalculation(input);
  }
  const loads = computeLoads(input);
  const { mu2, designSpan_m } = computeSnowDrift(input);
  const slopeFactor = input.roofShape === "gable" ? 2 : 1;
  const L_slope_m = (input.span_m - 0.3) / slopeFactor;
  return runRolledPurlinCalculation(
    input,
    { ...loads, mu2, designSpan_m },
    L_slope_m,
  );
}