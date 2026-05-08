import { describe, expect, it } from "vitest";
import { calculateProject, defaultProjectInput, type ProjectInput } from "../project";
import { buildBuildingSpecification } from "../specification";
import { buildPurlinAlternatives, selectPurlinSystem } from "./purlin-alternatives";
import type { PurlinAlternative } from "./types";

function withPreference(preference: ProjectInput["calculationSettings"]["purlinSystemPreference"]): ProjectInput {
  return {
    ...defaultProjectInput,
    calculationSettings: {
      ...defaultProjectInput.calculationSettings,
      purlinSystemPreference: preference,
    },
  };
}

function alternative(system: PurlinAlternative["system"], status: PurlinAlternative["status"]): PurlinAlternative {
  return {
    system,
    label: system,
    profile: status === "missing" ? null : system,
    stepMm: status === "missing" ? null : 1500,
    utilization: status === "missing" ? null : 0.5,
    massKg: status === "missing" ? null : 1,
    costRub: null,
    status,
    notes: [],
    warnings: status === "missing" ? ["missing"] : [],
  };
}

describe("Purlin alternatives", () => {
  it("builds three purlin alternatives", () => {
    const projectResult = calculateProject(defaultProjectInput);
    const summary = buildPurlinAlternatives(defaultProjectInput, projectResult.purlinResult);

    expect(summary.alternatives.map((item) => item.system)).toEqual(["sortSteel", "mp350", "mp390"]);
    expect(summary.alternatives).toHaveLength(3);
  }, 60_000);

  it("respects explicit purlin system preferences", () => {
    for (const preference of ["mp350", "mp390", "sortSteel"] as const) {
      const project = withPreference(preference);
      const projectResult = calculateProject(project);
      const summary = buildPurlinAlternatives(project, projectResult.purlinResult);

      expect(summary.selectedSystem).toBe(preference);
      expect(summary.autoSelectedSystem).toBeNull();
    }
  }, 120_000);

  it("auto selects MP350 when it is available", () => {
    const projectResult = calculateProject(defaultProjectInput);
    const summary = buildPurlinAlternatives(defaultProjectInput, projectResult.purlinResult);

    expect(summary.selectedSystem).toBe("mp350");
    expect(summary.autoSelectedSystem).toBe("mp350");
  }, 60_000);

  it("auto selects the next available system when MP350 is missing", () => {
    const selected = selectPurlinSystem("auto", [
      alternative("sortSteel", "ok"),
      alternative("mp350", "missing"),
      alternative("mp390", "ok"),
    ]);

    expect(selected.selectedSystem).toBe("mp390");
    expect(selected.autoSelectedSystem).toBe("mp390");
  });

  it("uses the selected purlin alternative in BuildingSpecification", () => {
    for (const preference of ["mp390", "sortSteel"] as const) {
      const project = withPreference(preference);
      const projectResult = calculateProject(project);
      const alternatives = buildPurlinAlternatives(project, projectResult.purlinResult);
      const expected = alternatives.alternatives.find((item) => item.system === preference);
      const spec = buildBuildingSpecification(project);
      const purlins = spec.items.find((item) => item.id === "purlins.main");

      expect(purlins?.profile).toBe(expected?.profile);
      expect(purlins?.totalMassKg).toBe(expected?.massKg);
      expect(purlins?.notes.join(" ")).toContain(`Selected purlin alternative: ${expected?.label}`);
    }
  }, 120_000);
});
