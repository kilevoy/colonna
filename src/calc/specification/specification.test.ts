import { describe, expect, it } from "vitest";
import { defaultProjectInput, type ProjectInput } from "../project";
import { buildBuildingLayout } from "../layout";
import { buildBuildingSpecification } from "./build-building-specification";
import { formatSpecificationMarkdown } from "./format-specification-markdown";

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

function withSpanCount(project: ProjectInput, spanCount: number): ProjectInput {
  return {
    ...project,
    geometry: {
      ...project.geometry,
      spanCount: spanCount as unknown as ProjectInput["geometry"]["spanCount"],
    },
  };
}

describe("BuildingSpecification", () => {
  it("builds specification items for defaultProjectInput", () => {
    const spec = buildBuildingSpecification(defaultProjectInput);

    expect(spec.projectName).toBe(defaultProjectInput.projectInfo.name);
    expect(spec.items.length).toBeGreaterThanOrEqual(8);
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

  it("builds detailed column groups plus aggregate column mass", () => {
    const spec = buildBuildingSpecification(defaultProjectInput);
    const layout = buildBuildingLayout(defaultProjectInput);
    const edge = spec.items.find((item) => item.id === "columns.edge");
    const endFakhverk = spec.items.find((item) => item.id === "columns.endFakhverk");
    const middle = spec.items.find((item) => item.id === "columns.middle");
    const aggregate = spec.items.find((item) => item.id === "columns.aggregate");

    expect(edge?.quantity).toBe(layout.edgeColumnQuantity);
    expect(edge?.totalMassKg).toBeNull();
    expect(endFakhverk?.quantity).toBe(layout.endFakhverkColumnQuantity);
    expect(endFakhverk?.totalMassKg).toBeNull();
    expect(middle).toBeUndefined();
    expect(aggregate?.quantity).toBeNull();
    expect(aggregate?.totalMassKg).toBeGreaterThan(0);
  }, 60_000);

  it("uses BuildingLayout quantity for main trusses", () => {
    const spec = buildBuildingSpecification(defaultProjectInput);
    const trusses = spec.items.find((item) => item.group === "trusses");

    expect(trusses?.quantity).toBe(9);
    expect(trusses?.lengthM).toBe(defaultProjectInput.geometry.buildingSpanM);
    expect(trusses?.unitMassKg).toBeGreaterThan(0);
    expect(trusses?.notes.join(" ")).toContain("interior axes only");
  }, 60_000);

  it("uses BuildingLayout main truss quantities for multi-span layouts", () => {
    const twoSpan = buildBuildingSpecification(withSpanCount(defaultProjectInput, 2));
    const threeSpan = buildBuildingSpecification(withSpanCount(defaultProjectInput, 3));

    expect(twoSpan.items.find((item) => item.id === "trusses.main")?.quantity).toBe(18);
    expect(threeSpan.items.find((item) => item.id === "trusses.main")?.quantity).toBe(27);
  }, 60_000);

  it("fills purlin quantity and total length from PurlinLayout", () => {
    const spec = buildBuildingSpecification(defaultProjectInput);
    const purlins = spec.items.find((item) => item.id === "purlins.main");

    expect(purlins?.quantity).not.toBeNull();
    expect(purlins?.quantity).toBeGreaterThan(0);
    expect(purlins?.lengthM).toBe(defaultProjectInput.geometry.frameStepM);
    expect(purlins?.totalLengthM).not.toBeNull();
    expect(purlins?.totalLengthM).toBeGreaterThan(0);
    expect(purlins?.notes.join(" ")).toContain("layout quantity is preliminary");
  }, 60_000);

  it("passes variable purlin bay warning into specification warnings", () => {
    const project: ProjectInput = {
      ...defaultProjectInput,
      geometry: {
        ...defaultProjectInput.geometry,
        buildingLengthM: 61,
      },
    };
    const spec = buildBuildingSpecification(project);
    const purlins = spec.items.find((item) => item.id === "purlins.main");

    expect(purlins?.lengthM).toBeNull();
    expect(purlins?.totalLengthM).toBeGreaterThan(0);
    expect(spec.warnings.join(" ")).toContain("Last bay adjusted");
  }, 60_000);

  it("keeps beam-cell end roof beam quantity separate from aggregate mass", () => {
    const spec = buildBuildingSpecification(defaultProjectInput);
    const endRoofBeams = spec.items.find((item) => item.id === "beamCells.endRoofBeams");
    const aggregate = spec.items.find((item) => item.id === "beamCells.aggregate");
    const beamCellMassTotal = spec.items
      .filter((item) => item.group === "beamCells")
      .reduce((sum, item) => sum + (item.totalMassKg ?? 0), 0);

    expect(endRoofBeams?.quantity).toBe(2);
    expect(endRoofBeams?.totalMassKg).toBeNull();
    expect(endRoofBeams?.status).toBe("warning");
    expect(endRoofBeams?.warnings.join(" ")).toContain("layout-only");
    expect(aggregate?.quantity).toBeNull();
    expect(aggregate?.totalMassKg).toBeGreaterThan(0);
    expect(beamCellMassTotal).toBe(aggregate?.totalMassKg);
  }, 60_000);

  it("uses BuildingLayout end roof beam quantity for multi-span layouts", () => {
    const twoSpan = buildBuildingSpecification(withSpanCount(defaultProjectInput, 2));
    const endRoofBeams = twoSpan.items.find((item) => item.id === "beamCells.endRoofBeams");

    expect(endRoofBeams?.quantity).toBe(4);
    expect(endRoofBeams?.totalMassKg).toBeNull();
  }, 60_000);

  it("passes adjusted last bay layout warning into specification warnings", () => {
    const project: ProjectInput = {
      ...defaultProjectInput,
      geometry: {
        ...defaultProjectInput.geometry,
        buildingLengthM: 62,
        frameStepM: 6,
      },
    };
    const spec = buildBuildingSpecification(project);

    expect(spec.warnings.join(" ")).toContain("Building length is not divisible by frame step");
  }, 60_000);

  it("fills crane-beam quantity and length when support crane is enabled", () => {
    const enabledProject = withSupportCraneEnabled(defaultProjectInput);
    const spec = buildBuildingSpecification(enabledProject);
    const craneBeams = spec.items.find((item) => item.group === "craneBeams");

    expect(craneBeams?.quantity).toBe(2);
    expect(craneBeams?.lengthM).toBe(defaultProjectInput.geometry.buildingLengthM);
    expect(craneBeams?.unitMassKg).toBeGreaterThan(0);
    expect(craneBeams?.unitPriceRub).toBeGreaterThanOrEqual(0);
  }, 60_000);

  it("uses warning or missing status for items without fully derived quantity and length", () => {
    const spec = buildBuildingSpecification(defaultProjectInput);
    const incompleteItems = spec.items.filter((item) => item.quantity === null || item.lengthM === null);

    expect(incompleteItems.length).toBeGreaterThan(0);
    for (const item of incompleteItems) {
      expect(["warning", "missing"]).toContain(item.status);
      expect(item.warnings.length).toBeGreaterThan(0);
    }
  }, 60_000);

  it("keeps specification as an aggregation layer over existing calculations", () => {
    const spec = buildBuildingSpecification(defaultProjectInput);

    expect(spec.items.map((item) => item.sourceBlock).sort()).toEqual([
      "beamCell",
      "beamCell",
      "column",
      "column",
      "column",
      "craneBeam",
      "purlin",
      "truss",
      "windowRiegel",
    ]);
  }, 60_000);
});
