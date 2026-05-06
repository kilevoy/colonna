import { describe, expect, it } from "vitest";
import { calculateProjectWithSummary } from "./calculate-project";
import { defaultProjectInput } from "./defaults";
import { formatProjectSummaryMarkdown } from "./project-summary";
import type { ProjectBlockName } from "./types";

const BLOCKS: ProjectBlockName[] = [
  "column",
  "truss",
  "purlin",
  "craneBeam",
  "windowRiegel",
  "beamCell",
];

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
    expect(summary.massByBlock.craneBeam).toBeGreaterThan(0);
    expect(summary.massByBlock.windowRiegel).toBeGreaterThan(0);
    expect(summary.massByBlock.beamCell).toBeGreaterThan(0);
  }, 60_000);

  it("marks oracle and native block sources", () => {
    const { summary } = calculateProjectWithSummary(defaultProjectInput);
    const byBlock = Object.fromEntries(summary.blocks.map((block) => [block.block, block]));

    expect(byBlock.craneBeam.source).toBe("velican-oracle");
    expect(byBlock.windowRiegel.source).toBe("velican-oracle");
    expect(byBlock.beamCell.source).toBe("velican-oracle");
    expect(byBlock.column.source).toBe("native");
    expect(byBlock.truss.source).toBe("native");
    expect(byBlock.purlin.source).toBe("native");
  }, 60_000);

  it("formats a markdown report", () => {
    const { summary } = calculateProjectWithSummary(defaultProjectInput);
    const markdown = formatProjectSummaryMarkdown(summary);

    expect(markdown).toContain("# Project Summary");
    expect(markdown).toContain("## Blocks");
    expect(markdown).toContain("Total mass");
  }, 60_000);
});
