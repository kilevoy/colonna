import { describe, expect, it } from "vitest";
import { defaultProjectInput, type ProjectInput } from "../project";
import {
  deriveColumnQuantity,
  deriveCraneBeamQuantity,
  deriveFrameCount,
  derivePurlinQuantity,
  deriveTrussQuantity,
  deriveWindowRiegelQuantity,
} from "./quantity-rules";

function withSupportCraneEnabled(project: ProjectInput): ProjectInput {
  return {
    ...project,
    cranes: {
      ...project.cranes,
      supportCrane: {
        ...project.cranes.supportCrane,
        enabled: true,
      },
    },
  };
}

describe("specification quantity rules", () => {
  it("derives a preliminary frame count from building length and frame step", () => {
    const frameCount = deriveFrameCount(defaultProjectInput);

    expect(frameCount).toBeGreaterThan(0);
    expect(frameCount).toBe(11);
  });

  it("derives preliminary column and truss quantities for a single-span building", () => {
    const columns = deriveColumnQuantity(defaultProjectInput);
    const trusses = deriveTrussQuantity(defaultProjectInput);

    expect(columns.quantity).toBeGreaterThan(0);
    expect(columns.lengthM).toBe(defaultProjectInput.geometry.columnHeightM);
    expect(columns.warnings.join(" ")).toContain("Preliminary");
    expect(trusses.quantity).toBeGreaterThan(0);
    expect(trusses.lengthM).toBe(defaultProjectInput.geometry.buildingSpanM);
  });

  it("derives two crane beams only when the support crane is enabled", () => {
    const disabled = deriveCraneBeamQuantity(defaultProjectInput);
    const enabled = deriveCraneBeamQuantity(withSupportCraneEnabled(defaultProjectInput));

    expect(disabled.quantity).toBe(0);
    expect(disabled.warnings.join(" ")).toContain("not included as a building quantity");
    expect(enabled.quantity).toBe(2);
    expect(enabled.lengthM).toBe(defaultProjectInput.geometry.buildingLengthM);
  });

  it("keeps purlin and window-riegel quantities incomplete until layout data exists", () => {
    const purlins = derivePurlinQuantity(defaultProjectInput);
    const windowRiegels = deriveWindowRiegelQuantity(defaultProjectInput);

    expect(purlins.quantity).toBeNull();
    expect(purlins.lengthM).toBe(defaultProjectInput.geometry.buildingLengthM);
    expect(purlins.warnings.join(" ")).toContain("line count is not derived yet");
    expect(windowRiegels.quantity).toBeNull();
    expect(windowRiegels.warnings.join(" ")).toContain("opening count and layout");
  });
});
