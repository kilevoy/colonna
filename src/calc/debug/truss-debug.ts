import { runTrussCalculation } from "../truss/engine";
import type { TrussInput, TrussOutput } from "../truss/types";

export interface TrussCalculationWithDebug {
  inputSnapshot: TrussInput;
  output: TrussOutput;
  loads: TrussOutput["loads"];
  selectedProfiles: Record<string, string | null>;
  totalMassKg: number;
  unitMassKgPerM2: number;
  warnings: string[];
}

export function runTrussCalculationWithDebug(
  input: TrussInput,
): TrussCalculationWithDebug {
  const output = runTrussCalculation(input);
  const selectedProfiles = Object.fromEntries(
    Object.entries(output.sections).map(([section, result]) => [
      section,
      result.selected?.profile.name ?? null,
    ]),
  );

  return {
    inputSnapshot: structuredClone(input),
    output,
    loads: output.loads,
    selectedProfiles,
    totalMassKg: output.totalMass_kg,
    unitMassKgPerM2: output.unitMass_kg_per_m2,
    warnings: [...output.warnings],
  };
}
