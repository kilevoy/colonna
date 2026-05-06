import type { WindowRiegelInput } from "../window-riegel";
import type { ProjectBlockMapping, ProjectInput } from "./types";

export function mapProjectToWindowRiegelInput(project: ProjectInput): ProjectBlockMapping<WindowRiegelInput> {
  const input: WindowRiegelInput = {
    openingWidthM: project.walls.openingWidthM,
    openingHeightM: project.walls.openingHeightM ?? 1,
    wallHeightM: project.geometry.buildingHeightM,
    facadePostStepM: project.geometry.frameStepM,
    windLoadKpa: project.climate.windLoadKpa,
    terrainType: project.climate.terrainType === "B" ? "В" : project.climate.terrainType,
    buildingHeightM: project.geometry.buildingHeightM,
    wallLoadKpa: project.walls.wallLoadKpa,
    steel: project.materials.windowRiegelSteel,
    pricePerTonRub: project.prices.tubeC245RubPerTon,
    rawOracleInput: {
      city: project.climate.city ?? project.projectInfo.city ?? "",
      responsibilityLevel: project.climate.responsibilityLevel ?? project.climate.responsibilityCoeff,
      frameStepM: project.geometry.frameStepM,
      buildingSpanM: project.geometry.buildingSpanM,
      buildingLengthM: project.geometry.buildingLengthM,
      windowType: project.walls.windowType ?? 1,
      maxUtilization: project.calculationSettings.maxUtilization,
    },
  };

  return {
    input,
    mappingNotes: [
      "ProjectInput opening height, frame step, wind, terrain and building height mapped to window-riegel oracle wrapper.",
      "Opening width, wall load and steel are kept in normalized input but are not direct VELICAN window-riegel inputs yet.",
    ],
    warnings: project.calculationSettings.useOracleForWindowRiegel ? [] : ["Project setting disables oracle window riegel, but no native window-riegel backend exists yet."],
  };
}
