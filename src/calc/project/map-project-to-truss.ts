import { getDefaultMinThickness } from "../truss/engine";
import type { TrussInput } from "../truss/types";
import type { ProjectBlockMapping, ProjectInput } from "./types";

export function mapProjectToTrussInput(project: ProjectInput): ProjectBlockMapping<TrussInput> {
  const input: TrussInput = {
    height_m: project.geometry.buildingHeightM,
    span_m: project.geometry.buildingSpanM,
    length_m: project.geometry.buildingLengthM,
    framePitch_m: project.geometry.frameStepM,
    purlinPitch_mm: 0,
    roofSlope_deg: project.geometry.roofSlopeDeg,
    responsibilityCoeff: project.climate.responsibilityCoeff,
    terrainType: project.climate.terrainType,
    w0_kPa: project.climate.windLoadKpa,
    Sg_kPa: project.climate.snowLoadKpa,
    roofStructure: project.roof.roofConstruction,
    roofLoad_kPa: project.roof.roofLoadKpa,
    loadAddition_pct: 15,
    maxUtilization: project.calculationSettings.maxUtilization,
    minThickness_mm: getDefaultMinThickness(),
    maxWidth_mm: { VP: 500, NP: 500 },
    minWidth_mm: { ORb: 80, OR: 80, RR: 60 },
  };

  return {
    input,
    mappingNotes: [
      "ProjectInput geometry, climate, roof load and max utilization mapped to native truss input.",
      "Purlin pitch is not yet a shared ProjectInput field; truss mapper keeps purlinPitch_mm=0.",
    ],
    warnings: [],
  };
}
