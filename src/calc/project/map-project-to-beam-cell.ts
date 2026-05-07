import type { BeamCellInput } from "../beam-cell";
import type { ProjectBlockMapping, ProjectInput } from "./types";

export function mapProjectToBeamCellInput(project: ProjectInput): ProjectBlockMapping<BeamCellInput> {
  const input: BeamCellInput = {
    spanM: project.geometry.frameStepM,
    stepM: project.geometry.frameStepM,
    roofLoadKpa: project.roof.roofLoadKpa,
    snowLoadKpa: project.climate.snowLoadKpa,
    windLoadKpa: project.climate.windLoadKpa,
    roofSlopeDeg: project.geometry.roofSlopeDeg,
    steel: project.materials.beamCellSteel,
    pricePerTonRub: project.prices.iBeamC345RubPerTon,
    deflectionLimit: project.calculationSettings.deflectionLimit,
    extraOptions: {
      roofConstruction: project.roof.roofConstruction,
    },
    rawOracleInput: {
      lengthAlongMain: project.geometry.buildingLengthM,
      widthAcrossMain: project.geometry.buildingSpanM,
      columnHeight: project.geometry.columnHeightM,
      mainBeamSpan: project.geometry.frameStepM,
      mainBeamStep: project.geometry.frameStepM,
      acceptedMainSteel: project.materials.beamCellSteel === "C245" ? "C245" : "C345",
    },
  };

  return {
    input,
    mappingNotes: [
      "ProjectInput frame step, roof construction/load, steel and price mapped to beam-cell oracle wrapper.",
      "Snow, wind, roof slope and deflection limit are kept in normalized input but are not direct VELICAN beam-cell inputs yet.",
    ],
    warnings: project.calculationSettings.useOracleForBeamCell ? [] : ["Project setting disables oracle beam-cell, but no native beam-cell backend exists yet."],
  };
}
