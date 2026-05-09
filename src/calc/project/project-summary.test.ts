import { describe, expect, it } from "vitest";
import { calculateProjectWithSummary, calculateProjectWithSummaryAsync } from "./calculate-project";
import { defaultProjectInput } from "./defaults";
import { formatProjectSummaryMarkdown } from "./project-summary";
import { buildBuildingSpecification } from "../specification";
import type { ProjectBlockName, ProjectInput } from "./types";

const BLOCKS: ProjectBlockName[] = [
  "column",
  "truss",
  "purlin",
  "craneBeam",
  "windowRiegel",
  "beamCell",
];

function withPurlinPreference(preference: ProjectInput["calculationSettings"]["purlinSystemPreference"]): ProjectInput {
  return {
    ...defaultProjectInput,
    calculationSettings: {
      ...defaultProjectInput.calculationSettings,
      purlinSystemPreference: preference,
    },
  };
}

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

describe("ProjectCalculationSummary", () => {
  it("builds a summary for the default project", () => {
    const { result, summary } = calculateProjectWithSummary(defaultProjectInput);

    expect(result.columnResult).toBeTruthy();
    expect(summary.blocks).toHaveLength(6);
    expect(summary.totalMassKg).toBeGreaterThan(0);
    expect(summary.totalCostRub).toBeGreaterThanOrEqual(0);
    expect(summary.warnings).toBeInstanceOf(Array);
    expect(summary.mappingNotes).toBeInstanceOf(Array);
    expect(summary.incompleteFields).toBeInstanceOf(Array);

    for (const block of BLOCKS) {
      const status = summary.blocks.find((item) => item.block === block);
      expect(status).toBeTruthy();
      expect(status?.selectedProfiles).toBeInstanceOf(Array);
    }
  }, 60_000);

  it("collects mass by block where mass is available", () => {
    const { summary } = calculateProjectWithSummary(defaultProjectInput);

    expect(summary.massByBlock.column).toBeGreaterThan(0);
    expect(summary.massByBlock.truss).toBeGreaterThan(0);
    expect(summary.massByBlock.purlin).toBeGreaterThan(0);
    expect(summary.massByBlock.craneBeam).toBeUndefined();
    expect(summary.massByBlock.windowRiegel).toBeUndefined();
    expect(summary.massByBlock.beamCell).toBeUndefined();
  }, 60_000);

  it("marks skipped oracle and native block sources in normal mode", () => {
    const { summary } = calculateProjectWithSummary(defaultProjectInput);
    const byBlock = Object.fromEntries(summary.blocks.map((block) => [block.block, block]));

    expect(byBlock.craneBeam.source).toBe("skipped");
    expect(byBlock.windowRiegel.source).toBe("skipped");
    expect(byBlock.beamCell.source).toBe("skipped");
    expect(byBlock.craneBeam.status).toBe("skipped");
    expect(byBlock.windowRiegel.status).toBe("skipped");
    expect(byBlock.beamCell.status).toBe("skipped");
    expect(byBlock.column.source).toBe("native");
    expect(byBlock.truss.source).toBe("native");
    expect(byBlock.purlin.source).toBe("native");
  }, 60_000);

  it("marks oracle block sources when dev/oracle mode is calculated asynchronously", async () => {
    const { summary } = await calculateProjectWithSummaryAsync(withOracleBlocksEnabled(defaultProjectInput));
    const byBlock = Object.fromEntries(summary.blocks.map((block) => [block.block, block]));

    expect(byBlock.craneBeam.source).toBe("velican-oracle");
    expect(byBlock.windowRiegel.source).toBe("velican-oracle");
    expect(byBlock.beamCell.source).toBe("velican-oracle");
  }, 60_000);

  it("formats a markdown report", () => {
    const { summary } = calculateProjectWithSummary(defaultProjectInput);
    const markdown = formatProjectSummaryMarkdown(summary);

    expect(markdown).toContain("# Project Summary");
    expect(markdown).toContain("## Blocks");
    expect(markdown).toContain("Total mass");
  }, 60_000);

  it("exposes purlin alternatives summary from the project calculation", () => {
    const { purlinAlternativesSummary } = calculateProjectWithSummary(defaultProjectInput);

    expect(purlinAlternativesSummary.alternatives).toHaveLength(3);
    expect(purlinAlternativesSummary.alternatives.map((item) => item.system)).toEqual(["sortSteel", "mp350", "mp390"]);
    expect(purlinAlternativesSummary.selectedSystem).toBe("mp350");
    expect(purlinAlternativesSummary.autoSelectedSystem).toBe("mp350");
  }, 60_000);

  it("uses the requested purlin system preference in project alternatives", () => {
    for (const preference of ["mp350", "mp390", "sortSteel"] as const) {
      const { purlinAlternativesSummary } = calculateProjectWithSummary(withPurlinPreference(preference));

      expect(purlinAlternativesSummary.selectedSystem).toBe(preference);
      expect(purlinAlternativesSummary.autoSelectedSystem).toBeNull();
    }
  }, 120_000);

  it("keeps explicit purlin selection aligned with the specification row", () => {
    for (const preference of ["mp390", "sortSteel"] as const) {
      const project = withPurlinPreference(preference);
      const { purlinAlternativesSummary } = calculateProjectWithSummary(project);
      const selected = purlinAlternativesSummary.alternatives.find((item) => item.system === preference);
      const specification = buildBuildingSpecification(project);
      const purlinItem = specification.items.find((item) => item.id === "purlins.main");

      expect(purlinAlternativesSummary.selectedSystem).toBe(preference);
      expect(purlinItem?.profile).toBe(selected?.profile);
    }
  }, 120_000);
});
