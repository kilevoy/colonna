import { getCassetteHeightFilter } from "../purlin";
import type { PurlinInput } from "../purlin";
import type { ProjectBlockMapping, ProjectInput } from "./types";

function priceRubPerKg(valueRubPerTon: number): number {
  return valueRubPerTon / 1000;
}

export function mapProjectToPurlinInput(project: ProjectInput): ProjectBlockMapping<PurlinInput> {
  const roofStructure = project.roof.roofConstruction;
  const input: PurlinInput = {
    materialType: "lstk",
    gamma_n: project.climate.responsibilityCoeff,
    roofShape: project.roof.roofType === "gable" ? "gable" : "monoslope",
    span_m: project.geometry.buildingSpanM,
    length_m: project.geometry.buildingLengthM,
    height_m: project.geometry.buildingHeightM,
    roofSlope_deg: project.geometry.roofSlopeDeg,
    framePitch_m: project.geometry.frameStepM,
    terrainType: project.climate.terrainType,
    w0_kPa: project.climate.windLoadKpa,
    Sg_kPa: project.climate.snowLoadKpa,
    roofStructure,
    roofLoad_kPa: project.roof.roofLoadKpa,
    snowDrift: project.roof.snowBagMode ?? "none",
    drift_dropHeight_m: 4.5,
    drift_existingSize_m: 9.5,
    maxStep_mm: project.calculationSettings.purlinMaxStepMm,
    minStep_mm: project.calculationSettings.purlinMinStepMm,
    snowGuardPurlin: project.roof.snowRetentionPurlin,
    fencePurlin: project.roof.barrierPurlin,
    maxUtilization: project.calculationSettings.maxUtilization,
    cassetteHeightFilter_mm: getCassetteHeightFilter(roofStructure),
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
      "ProjectInput climate, geometry, roof construction/load, step limits and purlin extras mapped to native purlin input.",
      "LSTK MP350/MP390 prices are present in ProjectInput but native purlin input currently exposes only rolled steel prices.",
    ],
    warnings: [],
  };
}
