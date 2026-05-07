import { describe, expect, it } from "vitest";
import { defaultProjectInput } from "./defaults";
import { mapProjectToBeamCellInput } from "./map-project-to-beam-cell";
import { mapProjectToColumnInput } from "./map-project-to-column";
import { mapProjectToCraneBeamInput } from "./map-project-to-crane-beam";
import { mapProjectToPurlinInput } from "./map-project-to-purlin";
import { mapProjectToTrussInput } from "./map-project-to-truss";
import { mapProjectToWindowRiegelInput } from "./map-project-to-window-riegel";
import { getRoofConstructionLoadKpa, getWallConstructionLoadKpa } from "../shared/envelope-constructions";
import type { ProjectInput } from "./types";

describe("ProjectInput mappers", () => {
  it("provides a default project input", () => {
    expect(defaultProjectInput.projectInfo.name).toBeTruthy();
    expect(defaultProjectInput.geometry.buildingSpanM).toBeGreaterThan(0);
    expect(getRoofConstructionLoadKpa(defaultProjectInput.roof.roofConstruction)).toBe(defaultProjectInput.roof.roofLoadKpa);
    expect(getWallConstructionLoadKpa(defaultProjectInput.walls.wallConstruction)).toBe(defaultProjectInput.walls.wallLoadKpa);
  });

  it("maps default project to every block input", () => {
    expect(mapProjectToColumnInput(defaultProjectInput).input).toBeTruthy();
    expect(mapProjectToTrussInput(defaultProjectInput).input).toBeTruthy();
    expect(mapProjectToPurlinInput(defaultProjectInput).input).toBeTruthy();
    expect(mapProjectToCraneBeamInput(defaultProjectInput).input).toBeTruthy();
    expect(mapProjectToWindowRiegelInput(defaultProjectInput).input).toBeTruthy();
    expect(mapProjectToBeamCellInput(defaultProjectInput).input).toBeTruthy();
  });

  it("maps shared wind load to column and purlin inputs", () => {
    const project: ProjectInput = {
      ...defaultProjectInput,
      climate: { ...defaultProjectInput.climate, windLoadKpa: 0.77 },
    };

    expect(mapProjectToColumnInput(project).input.w0_kPa).toBe(0.77);
    expect(mapProjectToPurlinInput(project).input.w0_kPa).toBe(0.77);
  });

  it("maps frame step to column, truss and purlin inputs", () => {
    const project: ProjectInput = {
      ...defaultProjectInput,
      geometry: { ...defaultProjectInput.geometry, frameStepM: 7.5 },
    };

    expect(mapProjectToColumnInput(project).input.framePitch_m).toBe(7.5);
    expect(mapProjectToTrussInput(project).input.framePitch_m).toBe(7.5);
    expect(mapProjectToPurlinInput(project).input.framePitch_m).toBe(7.5);
  });

  it("maps support crane capacity to column and crane-beam inputs", () => {
    const project: ProjectInput = {
      ...defaultProjectInput,
      cranes: {
        ...defaultProjectInput.cranes,
        supportCrane: {
          ...defaultProjectInput.cranes.supportCrane,
          enabled: true,
          capacityT: 8,
        },
      },
    };

    expect(mapProjectToColumnInput(project).input.overheadCrane.capacity).toBe("8");
    expect(mapProjectToCraneBeamInput(project).input.capacityT).toBe(8);
  });
});
