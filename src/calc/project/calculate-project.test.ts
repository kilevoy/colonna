import { describe, expect, it } from "vitest";
import { calculateProject } from "./calculate-project";
import { defaultProjectInput } from "./defaults";

describe("calculateProject", () => {
  it("calculates all available blocks for the default project", () => {
    const result = calculateProject(defaultProjectInput);

    expect(result.projectInputSnapshot).toEqual(defaultProjectInput);
    expect(result.columnResult).toBeTruthy();
    expect(result.trussResult).toBeTruthy();
    expect(result.purlinResult).toBeTruthy();
    expect(result.craneBeamResult).toBeTruthy();
    expect(result.windowRiegelResult).toBeTruthy();
    expect(result.beamCellResult).toBeTruthy();
    expect(result.warnings).toBeInstanceOf(Array);
    expect(result.mappingNotes).toBeInstanceOf(Array);
  }, 60_000);

  it("returns mapped inputs for all blocks", () => {
    const result = calculateProject(defaultProjectInput);

    expect(result.mappedInputs.column).toBeTruthy();
    expect(result.mappedInputs.truss).toBeTruthy();
    expect(result.mappedInputs.purlin).toBeTruthy();
    expect(result.mappedInputs.craneBeam).toBeTruthy();
    expect(result.mappedInputs.windowRiegel).toBeTruthy();
    expect(result.mappedInputs.beamCell).toBeTruthy();
  }, 60_000);
});
