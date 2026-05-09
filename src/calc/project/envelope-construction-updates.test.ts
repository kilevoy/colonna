import { describe, expect, it } from "vitest";
import {
  getRoofConstructionLoadKpa,
  getWallConstructionLoadKpa,
  roofConstructionOptions,
  wallConstructionOptions,
} from "../shared/envelope-constructions";
import { defaultProjectInput } from "./defaults";
import {
  applyProjectRoofConstruction,
  applyProjectWallConstruction,
  resetProjectRoofLoadFromConstruction,
  resetProjectWallLoadFromConstruction,
  setProjectManualRoofLoad,
  setProjectManualWallLoad,
} from "./envelope-construction-updates";

describe("ProjectInput envelope construction updates", () => {
  it("keeps default project roof and wall constructions inside the shared catalog", () => {
    expect(getRoofConstructionLoadKpa(defaultProjectInput.roof.roofConstruction)).toBeTypeOf("number");
    expect(getWallConstructionLoadKpa(defaultProjectInput.walls.wallConstruction)).toBeTypeOf("number");
  });

  it("updates roof load from selected construction and leaves manual mode disabled", () => {
    const option = roofConstructionOptions.find((item) => item.id !== defaultProjectInput.roof.roofConstruction);
    expect(option).toBeDefined();
    const project = {
      ...defaultProjectInput,
      roof: { ...defaultProjectInput.roof, useManualRoofLoad: true, roofLoadKpa: 9.99 },
    };
    const next = applyProjectRoofConstruction(project, option!.id);

    expect(next.roof.roofConstruction).toBe(option!.id);
    expect(next.roof.roofLoadKpa).toBe(getRoofConstructionLoadKpa(option!.id));
    expect(next.roof.useManualRoofLoad).toBe(false);
  });

  it("marks roof load as manual when the numeric roof load is edited", () => {
    const next = setProjectManualRoofLoad(defaultProjectInput, 0.777);

    expect(next.roof.roofLoadKpa).toBe(0.777);
    expect(next.roof.useManualRoofLoad).toBe(true);
  });

  it("resets manual roof load back to the selected construction catalog value", () => {
    const manual = setProjectManualRoofLoad(defaultProjectInput, 0.777);
    const next = resetProjectRoofLoadFromConstruction(manual);

    expect(next.roof.roofLoadKpa).toBe(getRoofConstructionLoadKpa(defaultProjectInput.roof.roofConstruction));
    expect(next.roof.useManualRoofLoad).toBe(false);
  });

  it("updates wall load from selected construction and leaves manual mode disabled", () => {
    const option = wallConstructionOptions.find((item) => item.id !== defaultProjectInput.walls.wallConstruction);
    expect(option).toBeDefined();
    const project = {
      ...defaultProjectInput,
      walls: { ...defaultProjectInput.walls, useManualWallLoad: true, wallLoadKpa: 9.99 },
    };
    const next = applyProjectWallConstruction(project, option!.id);

    expect(next.walls.wallConstruction).toBe(option!.id);
    expect(next.walls.wallLoadKpa).toBe(getWallConstructionLoadKpa(option!.id));
    expect(next.walls.useManualWallLoad).toBe(false);
  });

  it("marks wall load as manual when the numeric wall load is edited", () => {
    const next = setProjectManualWallLoad(defaultProjectInput, 0.188);

    expect(next.walls.wallLoadKpa).toBe(0.188);
    expect(next.walls.useManualWallLoad).toBe(true);
  });

  it("resets manual wall load back to the selected construction catalog value", () => {
    const manual = setProjectManualWallLoad(defaultProjectInput, 0.188);
    const next = resetProjectWallLoadFromConstruction(manual);

    expect(next.walls.wallLoadKpa).toBe(getWallConstructionLoadKpa(defaultProjectInput.walls.wallConstruction));
    expect(next.walls.useManualWallLoad).toBe(false);
  });
});
