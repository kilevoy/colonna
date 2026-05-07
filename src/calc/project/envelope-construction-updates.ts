import {
  getRoofConstructionLoadKpa,
  getWallConstructionLoadKpa,
} from "../shared/envelope-constructions";
import type { ProjectInput } from "./types";

export function applyProjectRoofConstruction(project: ProjectInput, roofConstruction: string): ProjectInput {
  const loadKpa = getRoofConstructionLoadKpa(roofConstruction);
  return {
    ...project,
    roof: {
      ...project.roof,
      roofConstruction,
      deckProfile: roofConstruction,
      roofLoadKpa: loadKpa ?? project.roof.roofLoadKpa,
      useManualRoofLoad: false,
    },
  };
}

export function applyProjectWallConstruction(project: ProjectInput, wallConstruction: string): ProjectInput {
  const loadKpa = getWallConstructionLoadKpa(wallConstruction);
  return {
    ...project,
    walls: {
      ...project.walls,
      wallConstruction,
      wallLoadKpa: loadKpa ?? project.walls.wallLoadKpa,
      useManualWallLoad: false,
    },
  };
}

export function setProjectManualRoofLoad(project: ProjectInput, roofLoadKpa: number): ProjectInput {
  return {
    ...project,
    roof: {
      ...project.roof,
      roofLoadKpa,
      useManualRoofLoad: true,
    },
  };
}

export function setProjectManualWallLoad(project: ProjectInput, wallLoadKpa: number): ProjectInput {
  return {
    ...project,
    walls: {
      ...project.walls,
      wallLoadKpa,
      useManualWallLoad: true,
    },
  };
}

export function resetProjectRoofLoadFromConstruction(project: ProjectInput): ProjectInput {
  const loadKpa = getRoofConstructionLoadKpa(project.roof.roofConstruction);
  return {
    ...project,
    roof: {
      ...project.roof,
      roofLoadKpa: loadKpa ?? project.roof.roofLoadKpa,
      useManualRoofLoad: false,
    },
  };
}

export function resetProjectWallLoadFromConstruction(project: ProjectInput): ProjectInput {
  const loadKpa = getWallConstructionLoadKpa(project.walls.wallConstruction);
  return {
    ...project,
    walls: {
      ...project.walls,
      wallLoadKpa: loadKpa ?? project.walls.wallLoadKpa,
      useManualWallLoad: false,
    },
  };
}
