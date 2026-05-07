import { describe, expect, it } from "vitest";
import { buildBuildingLayout } from "../layout";
import { defaultProjectInput } from "../project";
import { buildPurlinLayout } from "./build-purlin-layout";

function withPreference(preference: "sortSteel" | "mp350" | "mp390") {
  return {
    ...defaultProjectInput,
    calculationSettings: {
      ...defaultProjectInput.calculationSettings,
      purlinSystemPreference: preference,
    },
  };
}

describe("PurlinLayout", () => {
  it("builds preliminary gable layout for defaultProjectInput", () => {
    const buildingLayout = buildBuildingLayout(defaultProjectInput);
    const layout = buildPurlinLayout(defaultProjectInput, { buildingLayout });

    expect(layout.roofShape).toBe("gable");
    expect(layout.slopeLengthM).toBeCloseTo(
      (defaultProjectInput.geometry.buildingSpanM / 2) /
        Math.cos((defaultProjectInput.geometry.roofSlopeDeg * Math.PI) / 180),
      5,
    );
    expect(layout.purlinLinesPerSlope).toBeGreaterThan(0);
    expect(layout.totalPurlinLines).toBe((layout.purlinLinesPerSlope ?? 0) * 2);
    expect(layout.frameBayCount).toBe(buildingLayout.frameCount - 1);
    expect(layout.totalPieces).toBe((layout.totalPurlinLines ?? 0) * (layout.frameBayCount ?? 0));
  });

  it("counts single-slope total lines without doubling", () => {
    const project = {
      ...defaultProjectInput,
      roof: {
        ...defaultProjectInput.roof,
        roofShape: "singleSlope" as const,
        roofType: "single_slope" as const,
      },
    };
    const layout = buildPurlinLayout(project);

    expect(layout.roofShape).toBe("singleSlope");
    expect(layout.totalPurlinLines).toBe(layout.purlinLinesPerSlope);
  });

  it("uses explicit purlin system preferences", () => {
    expect(buildPurlinLayout(withPreference("mp350")).selectedSystem).toBe("mp350");
    expect(buildPurlinLayout(withPreference("mp390")).selectedSystem).toBe("mp390");
    expect(buildPurlinLayout(withPreference("sortSteel")).selectedSystem).toBe("sortSteel");
  });

  it("warns when building length is not divisible by frame step", () => {
    const project = {
      ...defaultProjectInput,
      geometry: {
        ...defaultProjectInput.geometry,
        buildingLengthM: 61,
      },
    };
    const layout = buildPurlinLayout(project);

    expect(layout.pieceLengthM).toBeNull();
    expect(layout.totalLengthM).toBeGreaterThan(0);
    expect(layout.warnings.join(" ")).toContain("Last bay adjusted");
  });
});
