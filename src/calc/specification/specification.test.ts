import { describe, expect, it } from "vitest";
import { defaultProjectInput } from "../project";
import { buildBuildingSpecification } from "./build-building-specification";
import { formatSpecificationMarkdown } from "./format-specification-markdown";

describe("BuildingSpecification", () => {
  it("builds specification items for defaultProjectInput", () => {
    const spec = buildBuildingSpecification(defaultProjectInput);

    expect(spec.projectName).toBe(defaultProjectInput.projectInfo.name);
    expect(spec.items.length).toBeGreaterThanOrEqual(6);
    expect(spec.totals.totalMassKg).toBeGreaterThan(0);
    expect(spec.totals.itemCount).toBe(spec.items.length);
  }, 60_000);

  it("contains mass by all available calculation groups", () => {
    const spec = buildBuildingSpecification(defaultProjectInput);

    expect(spec.totals.massByGroup.columns).toBeGreaterThan(0);
    expect(spec.totals.massByGroup.trusses).toBeGreaterThan(0);
    expect(spec.totals.massByGroup.purlins).toBeGreaterThan(0);
    expect(spec.totals.massByGroup.craneBeams).toBeGreaterThan(0);
    expect(spec.totals.massByGroup.windowRiegels).toBeGreaterThan(0);
    expect(spec.totals.massByGroup.beamCells).toBeGreaterThan(0);
  }, 60_000);

  it("formats specification as markdown table", () => {
    const spec = buildBuildingSpecification(defaultProjectInput);
    const markdown = formatSpecificationMarkdown(spec);

    expect(markdown).toContain("# Building Specification");
    expect(markdown).toContain("| Group | Element | Profile | Steel | Qty |");
    expect(markdown).toContain("## Totals");
  }, 60_000);

  it("uses warning or missing status for items without derived quantity and length", () => {
    const spec = buildBuildingSpecification(defaultProjectInput);
    const incompleteItems = spec.items.filter((item) => item.quantity === null || item.lengthM === null);

    expect(incompleteItems.length).toBeGreaterThan(0);
    for (const item of incompleteItems) {
      expect(["warning", "missing"]).toContain(item.status);
      expect(item.warnings.join(" ")).toContain("Quantity and length are not derived");
    }
  }, 60_000);

  it("keeps specification as an aggregation layer over existing calculations", () => {
    const spec = buildBuildingSpecification(defaultProjectInput);

    expect(spec.items.map((item) => item.sourceBlock).sort()).toEqual([
      "beamCell",
      "column",
      "craneBeam",
      "purlin",
      "truss",
      "windowRiegel",
    ]);
  }, 60_000);
});
