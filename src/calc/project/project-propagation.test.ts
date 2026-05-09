import { describe, expect, it } from "vitest";
import { defaultProjectInput } from "./defaults";
import { mapProjectToBeamCellInput } from "./map-project-to-beam-cell";
import { mapProjectToColumnInput } from "./map-project-to-column";
import { mapProjectToCraneBeamInput } from "./map-project-to-crane-beam";
import { mapProjectToPurlinInput } from "./map-project-to-purlin";
import { mapProjectToTrussInput } from "./map-project-to-truss";
import { mapProjectToWindowRiegelInput } from "./map-project-to-window-riegel";
import type { ProjectInput } from "./types";

function raw(input: { rawOracleInput?: unknown }): Record<string, unknown> {
  return (input.rawOracleInput ?? {}) as Record<string, unknown>;
}

function notesContain(notes: string[], text: string): boolean {
  return notes.some((note) => note.toLowerCase().includes(text.toLowerCase()));
}

describe("ProjectInput propagation", () => {
  it("propagates wind load to column, purlin and window-riegel inputs", () => {
    const project: ProjectInput = {
      ...defaultProjectInput,
      climate: { ...defaultProjectInput.climate, windLoadKpa: 0.77 },
    };

    expect(mapProjectToColumnInput(project).input.w0_kPa).toBe(0.77);
    expect(mapProjectToPurlinInput(project).input.w0_kPa).toBe(0.77);
    expect(mapProjectToWindowRiegelInput(project).input.windLoadKpa).toBe(0.77);
  });

  it("propagates snow load to column, purlin and truss inputs", () => {
    const project: ProjectInput = {
      ...defaultProjectInput,
      climate: { ...defaultProjectInput.climate, snowLoadKpa: 3.14 },
    };

    expect(mapProjectToColumnInput(project).input.Sg_kPa).toBe(3.14);
    expect(mapProjectToPurlinInput(project).input.Sg_kPa).toBe(3.14);
    expect(mapProjectToTrussInput(project).input.Sg_kPa).toBe(3.14);
  });

  it("propagates building span to column, truss and beam-cell oracle metadata", () => {
    const project: ProjectInput = {
      ...defaultProjectInput,
      geometry: { ...defaultProjectInput.geometry, buildingSpanM: 30 },
    };
    const beamCell = mapProjectToBeamCellInput(project);

    expect(mapProjectToColumnInput(project).input.span_m).toBe(30);
    expect(mapProjectToTrussInput(project).input.span_m).toBe(30);
    expect(raw(beamCell.input).widthAcrossMain).toBe(30);
  });

  it("propagates building length to column, purlin and oracle metadata where supported", () => {
    const project: ProjectInput = {
      ...defaultProjectInput,
      geometry: { ...defaultProjectInput.geometry, buildingLengthM: 72 },
    };

    expect(mapProjectToColumnInput(project).input.length_m).toBe(72);
    expect(mapProjectToPurlinInput(project).input.length_m).toBe(72);
    expect(raw(mapProjectToBeamCellInput(project).input).lengthAlongMain).toBe(72);
    expect(raw(mapProjectToWindowRiegelInput(project).input).buildingLengthM).toBe(72);
  });

  it("propagates building height to purlin and window-riegel, while column uses columnHeightM", () => {
    const project: ProjectInput = {
      ...defaultProjectInput,
      geometry: {
        ...defaultProjectInput.geometry,
        buildingHeightM: 13.2,
        columnHeightM: 12.8,
      },
    };
    const column = mapProjectToColumnInput(project);

    expect(column.input.height_m).toBe(12.8);
    expect(notesContain(column.mappingNotes, "columnHeightM")).toBe(true);
    expect(mapProjectToPurlinInput(project).input.height_m).toBe(13.2);
    expect(mapProjectToWindowRiegelInput(project).input.buildingHeightM).toBe(13.2);
    expect(mapProjectToWindowRiegelInput(project).input.wallHeightM).toBe(13.2);
  });

  it("propagates frame step to column, truss, purlin and beam-cell inputs", () => {
    const project: ProjectInput = {
      ...defaultProjectInput,
      geometry: { ...defaultProjectInput.geometry, frameStepM: 7.2 },
    };
    const beamCell = mapProjectToBeamCellInput(project).input;

    expect(mapProjectToColumnInput(project).input.framePitch_m).toBe(7.2);
    expect(mapProjectToTrussInput(project).input.framePitch_m).toBe(7.2);
    expect(mapProjectToPurlinInput(project).input.framePitch_m).toBe(7.2);
    expect(beamCell.spanM).toBe(7.2);
    expect(beamCell.stepM).toBe(7.2);
  });

  it("propagates facade post step to column and window-riegel inputs", () => {
    const project: ProjectInput = {
      ...defaultProjectInput,
      geometry: { ...defaultProjectInput.geometry, facadePostStepM: 4.5 },
    };
    const windowRiegel = mapProjectToWindowRiegelInput(project).input;

    expect(mapProjectToColumnInput(project).input.fachverkPitch_m).toBe(4.5);
    expect(windowRiegel.facadePostStepM).toBe(4.5);
    expect(windowRiegel.extraOptions?.facadePostStepM).toBe(4.5);
  });

  it("propagates roof load to column, truss, purlin and beam-cell inputs", () => {
    const project: ProjectInput = {
      ...defaultProjectInput,
      roof: { ...defaultProjectInput.roof, roofConstruction: "С-П 150 мм", roofLoadKpa: 0.42 },
    };
    const beamCell = mapProjectToBeamCellInput(project).input;

    expect(mapProjectToColumnInput(project).input.roofLoad_kPa).toBe(0.42);
    expect(mapProjectToColumnInput(project).input.roofStructure).toBe("С-П 150 мм");
    expect(mapProjectToTrussInput(project).input.roofLoad_kPa).toBe(0.42);
    expect(mapProjectToTrussInput(project).input.roofStructure).toBe("С-П 150 мм");
    expect(mapProjectToPurlinInput(project).input.roofLoad_kPa).toBe(0.42);
    expect(mapProjectToPurlinInput(project).input.roofStructure).toBe("С-П 150 мм");
    expect(beamCell.roofLoadKpa).toBe(0.42);
    expect(beamCell.extraOptions?.roofConstruction).toBe("С-П 150 мм");
  });

  it("propagates wall load to column and keeps it in window-riegel normalized input", () => {
    const project: ProjectInput = {
      ...defaultProjectInput,
      walls: { ...defaultProjectInput.walls, wallConstruction: "С-П 200 мм", wallLoadKpa: 0.19 },
    };
    const windowRiegel = mapProjectToWindowRiegelInput(project);

    expect(mapProjectToColumnInput(project).input.wallLoad_kPa).toBe(0.19);
    expect(mapProjectToColumnInput(project).input.wallStructure).toBe("С-П 200 мм");
    expect(windowRiegel.input.wallLoadKpa).toBe(0.19);
    expect(windowRiegel.input.extraOptions?.wallConstruction).toBe("С-П 200 мм");
    expect(notesContain(windowRiegel.mappingNotes, "wall load")).toBe(true);
  });

  it("propagates support crane data to column and crane-beam where the wrapper supports it", () => {
    const project: ProjectInput = {
      ...defaultProjectInput,
      cranes: {
        ...defaultProjectInput.cranes,
        supportCrane: {
          ...defaultProjectInput.cranes.supportCrane,
          enabled: true,
          capacityT: 10,
          railLevelM: 6.3,
        },
      },
    };
    const column = mapProjectToColumnInput(project).input;
    const craneBeam = mapProjectToCraneBeamInput(project);

    expect(column.overheadCrane.enabled).toBe(true);
    expect(column.overheadCrane.capacity).toBe("10");
    expect(column.overheadCrane.railLevel_m).toBe(6.3);
    expect(craneBeam.input.capacityT).toBe(10);
    expect(notesContain(craneBeam.mappingNotes, "enabled flag")).toBe(true);
    expect(notesContain(craneBeam.mappingNotes, "rail level")).toBe(true);
  });
});
