import { describe, expect, it } from "vitest";
import { calculateProject, calculateProjectAsync } from "./calculate-project";
import { defaultProjectInput } from "./defaults";
import type { ProjectInput } from "./types";

function withOracleBlocksEnabled(project: ProjectInput): ProjectInput {
  return {
    ...project,
    calculationSettings: {
      ...project.calculationSettings,
      enableOracleBlocks: true,
      useOracleForCraneBeam: true,
      useOracleForWindowRiegel: true,
      useOracleForBeamCell: true,
    },
  };
}

describe("calculateProject", () => {
  it("calculates native blocks and skips VELICAN blocks for the default project", () => {
    const result = calculateProject(defaultProjectInput);

    expect(result.projectInputSnapshot).toEqual(defaultProjectInput);
    expect(result.columnResult).toBeTruthy();
    expect(result.trussResult).toBeTruthy();
    expect(result.purlinResult).toBeTruthy();
    expect(result.craneBeamResult).toBeNull();
    expect(result.windowRiegelResult).toBeNull();
    expect(result.beamCellResult).toBeNull();
    expect(result.warnings.join(" ")).toContain("VELICAN oracle is disabled");
    expect(result.warnings).toBeInstanceOf(Array);
    expect(result.mappingNotes).toBeInstanceOf(Array);
  }, 60_000);

  it("loads VELICAN blocks through the async dev/oracle path", async () => {
    const result = await calculateProjectAsync(withOracleBlocksEnabled(defaultProjectInput));

    expect(result.craneBeamResult).toBeTruthy();
    expect(result.windowRiegelResult).toBeTruthy();
    expect(result.beamCellResult).toBeTruthy();
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
