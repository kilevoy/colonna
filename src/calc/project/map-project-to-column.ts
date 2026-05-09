import type { CalculationInput, CraneCapacity } from "../types";
import type { ProjectBlockMapping, ProjectInput } from "./types";

function priceRubPerKg(valueRubPerTon: number): number {
  return valueRubPerTon / 1000;
}

function craneCapacity(value: number | string): CraneCapacity {
  const normalized = String(value).replace(",", ".") as CraneCapacity;
  return normalized;
}

export function mapProjectToColumnInput(project: ProjectInput): ProjectBlockMapping<CalculationInput> {
  const supportCrane = project.cranes.supportCrane;
  const hangingCrane = project.cranes.hangingCrane;
  const input: CalculationInput = {
    height_m: project.geometry.columnHeightM,
    span_m: project.geometry.buildingSpanM,
    length_m: project.geometry.buildingLengthM,
    framePitch_m: project.geometry.frameStepM,
    fachverkPitch_m: project.geometry.facadePostStepM,
    roofSlope_deg: project.geometry.roofSlopeDeg,
    roofType: project.roof.roofType,
    spanCount: project.geometry.spanCount,
    perimeterTies: false,
    columnType: "fachwerk",
    responsibilityCoeff: project.climate.responsibilityCoeff,
    terrainType: project.climate.terrainType,
    w0_kPa: project.climate.windLoadKpa,
    Sg_kPa: project.climate.snowLoadKpa,
    roofStructure: project.roof.roofConstruction,
    roofLoad_kPa: project.roof.roofLoadKpa,
    wallStructure: project.walls.wallConstruction,
    wallLoad_kPa: project.walls.wallLoadKpa,
    loadAddition_pct: 15,
    overheadCrane: {
      enabled: supportCrane.enabled,
      capacity: craneCapacity(supportCrane.capacityT),
      span_m: supportCrane.craneSpanM,
      count: supportCrane.count,
      singleSpan: true,
      railLevel_m: supportCrane.railLevelM,
      wheelLoad_kN: supportCrane.maxWheelLoadKn,
      base_m: supportCrane.wheelBaseM,
      gauge_m: supportCrane.craneSpanM,
    },
    suspendedCrane: {
      enabled: hangingCrane.enabled,
      capacity_t: hangingCrane.capacityT,
      singleSpan: hangingCrane.count <= 1,
    },
    prices: {
      "С255Б": priceRubPerKg(project.prices.iBeamC245RubPerTon),
      "С355Б": priceRubPerKg(project.prices.iBeamC345RubPerTon),
      "С245": priceRubPerKg(project.prices.tubeC245RubPerTon),
      "С345": priceRubPerKg(project.prices.tubeC345RubPerTon),
    },
  };

  return {
    input,
    mappingNotes: [
      "ProjectInput climate, geometry, roof construction/load, wall construction/load and crane data mapped directly to native column input.",
      "Native column height uses geometry.columnHeightM; geometry.buildingHeightM remains shared building geometry for other blocks.",
      "Column type defaults to fachwerk for project-level calculation; per-type column sweeps remain a UI/debug concern.",
    ],
    warnings: [],
  };
}
