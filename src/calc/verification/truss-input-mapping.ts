import { getDefaultMinThickness } from "../truss/engine";
import type { TrussInput } from "../truss/types";
import type { MolodechnoInputs } from "../velican/molodechno-oracle";
import { compareInputField, createInputComparisonResult } from "./input-comparison";
import type { InputComparisonResult, InputComparisonRow } from "./input-comparison";

export const defaultNativeTrussComparisonInput: TrussInput = {
  height_m: 12,
  span_m: 24,
  length_m: 30,
  framePitch_m: 6,
  purlinPitch_mm: 0,
  roofSlope_deg: 6,
  responsibilityCoeff: 1,
  terrainType: "B",
  w0_kPa: 0.3,
  Sg_kPa: 1.2,
  roofStructure: "temporary-comparison",
  roofLoad_kPa: 0.24,
  loadAddition_pct: 15,
  maxUtilization: 0.85,
  minThickness_mm: getDefaultMinThickness(),
  maxWidth_mm: { VP: 500, NP: 500 },
  minWidth_mm: { ORb: 80, OR: 80, RR: 60 },
};

function terrainType(input: TrussInput): string {
  if (input.terrainType === "A") return "А";
  if (input.terrainType === "B") return "В";
  return "С";
}

export function compareTrussInputs(
  nativeInput: TrussInput,
  oracleInput: MolodechnoInputs,
): InputComparisonResult {
  const rows: InputComparisonRow[] = [
    compareInputField("city", undefined, oracleInput.city, "Native comparison fixture uses manual climate loads and has no city input."),
    compareInputField("windLoadKpa", nativeInput.w0_kPa, oracleInput.windLoadKpa),
    compareInputField("snowLoadKpa", nativeInput.Sg_kPa, oracleInput.snowLoadKpa),
    compareInputField("terrainType", terrainType(nativeInput), oracleInput.terrainType),
    compareInputField("span", nativeInput.span_m, oracleInput.spanM),
    compareInputField("frame step", nativeInput.framePitch_m, oracleInput.frameStepM),
    compareInputField("roof slope", nativeInput.roofSlope_deg, oracleInput.roofSlopeDeg),
    compareInputField("height", nativeInput.height_m, oracleInput.buildingHeightM),
    compareInputField("covering load", nativeInput.roofLoad_kPa, undefined, "VELICAN Molodechno input has roofConstruction, not direct numeric roofLoadKpa."),
    compareInputField("roof construction", nativeInput.roofStructure, oracleInput.roofConstruction),
    compareInputField("responsibility level", nativeInput.responsibilityCoeff, oracleInput.responsibilityLevel),
  ];

  return createInputComparisonResult("truss", rows);
}
