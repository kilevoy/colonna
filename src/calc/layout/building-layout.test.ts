import { describe, expect, it } from "vitest";
import { defaultProjectInput, type ProjectInput } from "../project";
import { buildBuildingLayout } from "./build-building-layout";

function withSpanCount(project: ProjectInput, spanCount: number): ProjectInput {
  return {
    ...project,
    geometry: {
      ...project.geometry,
      spanCount: spanCount as unknown as ProjectInput["geometry"]["spanCount"],
    },
  };
}

describe("BuildingLayout", () => {
  it("derives default axes and frame counts", () => {
    const layout = buildBuildingLayout(defaultProjectInput);

    expect(layout.frameCount).toBe(11);
    expect(layout.interiorFrameCount).toBe(9);
    expect(layout.endAxisCount).toBe(2);
    expect(layout.axes[0]).toEqual({ index: 0, positionM: 0, kind: "end" });
    expect(layout.axes[layout.axes.length - 1]).toEqual({ index: 10, positionM: 60, kind: "end" });
    expect(layout.axes.filter((axis) => axis.kind === "interior")).toHaveLength(9);
  });

  it("counts main trusses and end roof beams for a single-span building", () => {
    const layout = buildBuildingLayout(defaultProjectInput);

    expect(layout.mainTrussQuantity).toBe(9);
    expect(layout.endRoofBeamQuantity).toBe(2);
    expect(layout.notes.join(" ")).toContain("interior axes only");
    expect(layout.notes.join(" ")).toContain("BeamCell mass semantics is not multiplied");
  });

  it("counts edge, middle and end fakhverk columns for the default building", () => {
    const layout = buildBuildingLayout(defaultProjectInput);

    expect(layout.edgeColumnQuantity).toBe(18);
    expect(layout.middleColumnQuantity).toBe(0);
    expect(layout.endFakhverkColumnQuantity).toBe(10);
  });

  it("counts multi-span trusses and middle columns", () => {
    const twoSpan = buildBuildingLayout(withSpanCount(defaultProjectInput, 2));
    const threeSpan = buildBuildingLayout(withSpanCount(defaultProjectInput, 3));

    expect(twoSpan.mainTrussQuantity).toBe(18);
    expect(twoSpan.middleColumnQuantity).toBe(9);
    expect(threeSpan.mainTrussQuantity).toBe(27);
    expect(threeSpan.middleColumnQuantity).toBe(18);
  });

  it("places the last axis on building length and warns when length does not divide frame step", () => {
    const project: ProjectInput = {
      ...defaultProjectInput,
      geometry: {
        ...defaultProjectInput.geometry,
        buildingLengthM: 62,
        frameStepM: 6,
      },
    };
    const layout = buildBuildingLayout(project);

    expect(layout.frameCount).toBe(11);
    expect(layout.axes[layout.axes.length - 1].positionM).toBe(62);
    expect(layout.warnings.join(" ")).toContain("Building length is not divisible by frame step");
  });

  it("keeps longitudinal fakhverk outside the first layout scope", () => {
    const layout = buildBuildingLayout(defaultProjectInput);

    expect(Object.keys(layout).some((key) => key.toLowerCase().includes("longitudinal"))).toBe(false);
    expect(layout.notes.join(" ")).toContain("Longitudinal fakhverk is outside");
  });
});
