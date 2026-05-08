import { describe, expect, it } from "vitest";
import { calculateProjectBuildingArea, calculateProjectDesignCost } from "./project-costs";
import { defaultProjectInput } from "./defaults";

describe("project UI-safe project costs", () => {
  it("keeps default building system and informational fields on ProjectInput", () => {
    expect(defaultProjectInput.projectInfo.buildingSystem).toBe("velikan");
    expect(defaultProjectInput.projectInfo.buildingEnvelope).toBe("cold");
    expect(defaultProjectInput.roof.drainage).toBe("external");
    expect(defaultProjectInput.openings?.windows).toEqual([]);
    expect(defaultProjectInput.openings?.doors).toEqual([]);
    expect(defaultProjectInput.openings?.gates).toEqual([]);
    expect(defaultProjectInput.calculationSettings.enableOracleBlocks).toBe(false);
  });

  it("calculates design cost by area without changing engineering totals", () => {
    const project = {
      ...defaultProjectInput,
      projectCosts: {
        design: {
          enabled: true,
          method: "perArea" as const,
          pricePerM2Rub: 120,
          fixedRub: 0,
        },
      },
    };

    expect(calculateProjectBuildingArea(project)).toBe(1440);
    expect(calculateProjectDesignCost(project)).toBe(172800);
  });

  it("calculates fixed design cost when selected", () => {
    const project = {
      ...defaultProjectInput,
      projectCosts: {
        design: {
          enabled: true,
          method: "fixed" as const,
          pricePerM2Rub: 120,
          fixedRub: 50000,
        },
      },
    };

    expect(calculateProjectDesignCost(project)).toBe(50000);
  });
});
