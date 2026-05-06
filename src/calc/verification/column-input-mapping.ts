import type { CalculationInput } from "../types";
import type { ColumnInputs } from "../velican/column-oracle";
import { compareInputField, createInputComparisonResult, notComparableInputField } from "./input-comparison";
import type { InputComparisonResult, InputComparisonRow } from "./input-comparison";
import { defaultNativeColumnComparisonInput } from "./column-comparison";

export { defaultNativeColumnComparisonInput };

function craneMode(enabled: boolean): string {
  return enabled ? "есть" : "нет";
}

function spanCount(input: CalculationInput): string {
  return input.spanCount === "multi" ? "более одного" : "один";
}

function perimeterBracing(input: CalculationInput): string {
  return input.perimeterTies ? "есть" : "нет";
}

function columnType(input: CalculationInput): string {
  if (input.columnType === "fachwerk") return "фахверковая";
  if (input.columnType === "edge") return "крайняя";
  return "средняя";
}

function terrainType(input: CalculationInput): string {
  if (input.terrainType === "A") return "А";
  if (input.terrainType === "B") return "В";
  return "С";
}

function roofType(input: CalculationInput): string {
  return input.roofType === "gable" ? "двускатная" : "односкатная";
}

export function compareColumnInputs(
  nativeInput: CalculationInput,
  oracleInput: ColumnInputs,
): InputComparisonResult {
  const rows: InputComparisonRow[] = [
    compareInputField("city", undefined, oracleInput.city, "Native comparison fixture uses manual climate loads and has no city input."),
    compareInputField("windLoadKpa / w0", nativeInput.w0_kPa, oracleInput.windLoadKpa),
    compareInputField("snowLoadKpa / Sg", nativeInput.Sg_kPa, oracleInput.snowLoadKpa),
    compareInputField("terrainType", terrainType(nativeInput), oracleInput.terrainType),
    compareInputField("responsibility level / coefficient", nativeInput.responsibilityCoeff, oracleInput.responsibilityLevel),
    compareInputField("building span", nativeInput.span_m, oracleInput.buildingSpanM),
    compareInputField("building length", nativeInput.length_m, oracleInput.buildingLengthM),
    compareInputField("building height", nativeInput.height_m, oracleInput.buildingHeightM),
    compareInputField("roof slope", nativeInput.roofSlope_deg, oracleInput.roofSlopeDeg),
    compareInputField("frame step", nativeInput.framePitch_m, oracleInput.frameStepM),
    compareInputField("facade/fachwerk step", nativeInput.fachverkPitch_m, oracleInput.facadePostStepM),
    compareInputField("roof type", roofType(nativeInput), oracleInput.roofType, "Native enum is normalized to workbook text for input comparison."),
    compareInputField("span count", spanCount(nativeInput), oracleInput.spanCount),
    compareInputField("perimeter bracing", perimeterBracing(nativeInput), oracleInput.perimeterBracing),
    notComparableInputField("roof covering/load", nativeInput.roofLoad_kPa, oracleInput.roofConstruction, "Native fixture has numeric roofLoad_kPa; VELICAN has construction name."),
    notComparableInputField("wall covering/load", nativeInput.wallLoad_kPa, oracleInput.wallConstruction, "Native fixture has numeric wallLoad_kPa; VELICAN has construction name."),
    compareInputField("extra load percent", nativeInput.loadAddition_pct, oracleInput.loadAllowancePercent),
    compareInputField("support crane mode", craneMode(nativeInput.overheadCrane.enabled), oracleInput.supportCrane),
    compareInputField("support crane capacity", Number(nativeInput.overheadCrane.capacity), Number(oracleInput.supportCraneCapacityT)),
    compareInputField("support crane count", nativeInput.overheadCrane.count === "two" ? "два" : "один", oracleInput.supportCraneCount),
    compareInputField("support crane rail level", nativeInput.overheadCrane.railLevel_m, oracleInput.railTopMarkM),
    compareInputField("support crane single span mode", nativeInput.overheadCrane.singleSpan ? "да" : "нет", oracleInput.supportCraneSingleSpan),
    compareInputField("hanging crane mode", craneMode(nativeInput.suspendedCrane.enabled), oracleInput.suspensionCrane),
    compareInputField("hanging crane capacity", nativeInput.suspendedCrane.capacity_t, oracleInput.suspensionCraneCapacityT),
    compareInputField("hanging crane single span mode", nativeInput.suspendedCrane.singleSpan ? "да" : "нет", oracleInput.suspensionCraneSingleSpan),
    compareInputField("column type", columnType(nativeInput), oracleInput.columnType),
    compareInputField("price ibeam C255", nativeInput.prices["С255Б"], oracleInput.priceIbeamC255),
    compareInputField("price ibeam C355", nativeInput.prices["С355Б"], oracleInput.priceIbeamC355),
    compareInputField("price tube C245", nativeInput.prices["С245"], oracleInput.priceTubeC245),
    compareInputField("price tube C345", nativeInput.prices["С345"], oracleInput.priceTubeC345),
  ];

  return createInputComparisonResult("column", rows);
}
