import { buildBuildingLayout, type BuildingLayout } from "../layout";
import {
  buildPurlinLayout,
  type PurlinAlternativesSummary,
  type PurlinLayout,
} from "../purlin-layout";
import {
  calculateProjectWithSummary,
  type ProjectBlockStatus,
  type ProjectCalculationWithSummary,
  type ProjectCalculationResult,
  type ProjectCalculationSummary,
  type ProjectInput,
} from "../project";
import type { PurlinOutput } from "../purlin";
import { deriveCraneBeamQuantity, deriveWindowRiegelQuantity, type DerivedQuantity } from "./quantity-rules";
import { buildColumnSpecificationSummary, type ColumnSpecificationGroup } from "./column-specification";
import type { BuildingSpecification, SpecificationGroup, SpecificationItem } from "./types";

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function compactText(values: Array<string | null | undefined>): string[] {
  return values
    .map((value) => (value ?? "").trim())
    .filter((value, index, array) => value.length > 0 && array.indexOf(value) === index);
}

function block(summaryBlock: ProjectBlockStatus[], blockName: ProjectBlockStatus["block"]): ProjectBlockStatus {
  const found = summaryBlock.find((item) => item.block === blockName);
  if (!found) {
    return {
      block: blockName,
      status: "notCalculated",
      source: "unknown",
      selectedProfiles: [],
      massKg: null,
      costRub: null,
      utilization: null,
      warnings: [`${blockName} summary block is missing.`],
      notes: [],
    };
  }
  return found;
}

function statusFor(item: Pick<SpecificationItem, "profile" | "totalMassKg" | "warnings">): SpecificationItem["status"] {
  if (!item.profile && item.totalMassKg === null) return "missing";
  if (item.warnings.length > 0) return "warning";
  return "ok";
}

function withStatus(item: Omit<SpecificationItem, "status">, statusOverride?: SpecificationItem["status"]): SpecificationItem {
  return {
    ...item,
    status: statusOverride ?? statusFor(item),
  };
}

function unitValue(totalValue: number | null, quantity: number | null): number | null {
  if (totalValue === null || quantity === null || quantity <= 0) return null;
  return totalValue / quantity;
}

function lengthForGeometry(lengths: number[]): number | null {
  return lengths.length === 1 ? lengths[0] : null;
}

function buildFromBlock(params: {
  id: string;
  group: SpecificationGroup;
  elementName: string;
  sourceBlock: string;
  block: ProjectBlockStatus;
  profile?: string | null;
  steel?: string | null;
  quantity: DerivedQuantity;
  notes?: string[];
  warnings?: string[];
}): SpecificationItem {
  const totalMassKg = finiteNumber(params.block.massKg);
  const totalCostRub = finiteNumber(params.block.costRub);
  const unitMassKg = params.quantity.unitMassKg ?? unitValue(totalMassKg, params.quantity.quantity);
  return withStatus({
    id: params.id,
    group: params.group,
    elementName: params.elementName,
    profile: (params.profile ?? params.block.selectedProfiles.join(", ")) || null,
    steel: params.steel ?? null,
    quantity: params.quantity.quantity,
    lengthM: params.quantity.lengthM,
    totalLengthM: params.quantity.totalLengthM ?? null,
    unitMassKg,
    totalMassKg,
    unitPriceRub: unitValue(totalCostRub, params.quantity.quantity),
    totalCostRub,
    sourceBlock: params.sourceBlock,
    calculationSource: params.block.source,
    notes: [...params.block.notes, ...params.quantity.notes, ...(params.notes ?? [])],
    warnings: [...params.block.warnings, ...params.quantity.warnings, ...(params.warnings ?? [])],
  }, params.block.status === "skipped" ? "skipped" : undefined);
}

function buildColumnItemFromGroup(params: {
  group: ColumnSpecificationGroup;
  block: ProjectBlockStatus;
}): SpecificationItem {
  const group = params.group;
  const quantity = group.quantity;
  const totalMassKg = finiteNumber(group.totalMassKg);
  const totalCostRub = finiteNumber(group.totalCostRub);
  const variableLengthNote =
    group.geometryLengthsM.length > 1 ? ["Variable heights; see column geometry in column specification diagnostics."] : [];

  return withStatus({
    id: `columns.${group.key}`,
    group: "columns",
    elementName: group.label,
    profile: group.profile,
    steel: group.steel,
    quantity,
    lengthM: lengthForGeometry(group.geometryLengthsM),
    unitMassKg: group.unitMassKg ?? unitValue(totalMassKg, quantity),
    totalMassKg,
    unitPriceRub: unitValue(totalCostRub, quantity),
    totalCostRub,
    sourceBlock: "column",
    calculationSource: params.block.source,
    notes: [...params.block.notes, ...group.notes, ...variableLengthNote],
    warnings: [...params.block.warnings, ...group.warnings],
  });
}

function buildPurlinItem(params: {
  block: ProjectBlockStatus;
  layout: PurlinLayout;
  alternatives: PurlinAlternativesSummary;
}): SpecificationItem {
  const selected = params.alternatives.alternatives.find((item) => item.system === params.alternatives.selectedSystem);
  const totalMassKg = selected?.massKg ?? finiteNumber(params.block.massKg);
  const totalCostRub = finiteNumber(params.block.costRub);
  const quantity = params.layout.totalPieces;
  const warnings = [...params.block.warnings, ...params.layout.warnings, ...(selected?.warnings ?? [])];
  if (!selected?.profile) {
    warnings.push("Selected purlin system profile is not available in the current purlin calculation result.");
  }

  return withStatus({
    id: "purlins.main",
    group: "purlins",
    elementName: "Selected purlin profile",
    profile: (selected?.profile ?? params.block.selectedProfiles.join(", ")) || null,
    steel: selected?.system === "sortSteel" ? null : selected?.system.toUpperCase() ?? null,
    quantity,
    lengthM: params.layout.pieceLengthM,
    totalLengthM: params.layout.totalLengthM,
    unitMassKg: unitValue(totalMassKg, quantity),
    totalMassKg,
    unitPriceRub: unitValue(totalCostRub, quantity),
    totalCostRub,
    sourceBlock: "purlin",
    calculationSource: params.block.source,
    notes: [
      ...params.block.notes,
      ...params.layout.notes,
      ...params.alternatives.notes,
      ...(selected?.notes ?? []),
      `Selected purlin alternative: ${selected?.label ?? params.alternatives.selectedSystem}.`,
      "Purlin mass is taken from calculation result; layout quantity is preliminary.",
    ],
    warnings,
  });
}

function buildColumnItems(
  projectInput: ProjectInput,
  result: ProjectCalculationResult,
  columnBlock: ProjectBlockStatus,
  layout: BuildingLayout,
): SpecificationItem[] {
  const columnSummary = buildColumnSpecificationSummary({
    project: projectInput,
    columnResult: result.columnResult,
    aggregateMassKg: finiteNumber(columnBlock.massKg),
    aggregateCostRub: finiteNumber(columnBlock.costRub),
    layout,
  });

  return columnSummary.groups
    .filter((group) => group.key !== "middle" || (group.quantity ?? 0) > 0)
    .map((group) => buildColumnItemFromGroup({ group, block: columnBlock }));
}

function derivedQuantity(params: DerivedQuantity): DerivedQuantity {
  return params;
}

function buildBeamCellItems(
  projectInput: ProjectInput,
  beamCellBlock: ProjectBlockStatus,
  layout: BuildingLayout,
): SpecificationItem[] {
  const selectedProfile = beamCellBlock.selectedProfiles.join(", ") || null;
  const totalMassKg = finiteNumber(beamCellBlock.massKg);
  const totalCostRub = finiteNumber(beamCellBlock.costRub);

  const statusOverride = beamCellBlock.status === "skipped" ? "skipped" : undefined;

  const endRoofBeams = withStatus({
    id: "beamCells.endRoofBeams",
    group: "beamCells" as const,
    elementName: "Балки покрытия торцов",
    profile: selectedProfile,
    steel: projectInput.materials.beamCellSteel ?? null,
    quantity: layout.endRoofBeamQuantity,
    lengthM: projectInput.geometry.buildingSpanM,
    unitMassKg: null,
    totalMassKg: null,
    unitPriceRub: null,
    totalCostRub: null,
    sourceBlock: "beamCell",
    calculationSource: beamCellBlock.source,
    notes: [
      ...beamCellBlock.notes,
      "Quantity is derived from BuildingLayout: 2 * spanCount.",
      "Mass is not multiplied because BeamCell output semantics is not confirmed.",
    ],
    warnings: [
      ...beamCellBlock.warnings,
      "End roof beam quantity is layout-only; mass and cost are intentionally not derived yet.",
    ],
  }, statusOverride);

  const aggregate = withStatus({
    id: "beamCells.aggregate",
    group: "beamCells" as const,
    elementName: "Балки покрытия, агрегированная масса",
    profile: selectedProfile,
    steel: projectInput.materials.beamCellSteel ?? null,
    quantity: null,
    lengthM: null,
    unitMassKg: null,
    totalMassKg,
    unitPriceRub: null,
    totalCostRub,
    sourceBlock: "beamCell",
    calculationSource: beamCellBlock.source,
    notes: [
      ...beamCellBlock.notes,
      "Aggregate beam-cell mass from calculation result; quantity split is not derived yet.",
    ],
    warnings: [
      ...beamCellBlock.warnings,
      "BeamCell aggregate mass is kept separate from end roof beam quantity to avoid double counting.",
    ],
  }, statusOverride);

  return [endRoofBeams, aggregate];
}

function buildItems(
  projectInput: ProjectInput,
  result: ProjectCalculationResult,
  summary: ProjectCalculationSummary,
  layout: BuildingLayout,
  purlinLayout: PurlinLayout,
  purlinAlternatives: PurlinAlternativesSummary,
): BuildingSpecification["items"] {
  const blocks = summary.blocks;
  const columnBlock = block(blocks, "column");
  const trussBlock = block(blocks, "truss");
  const purlinBlock = block(blocks, "purlin");
  const craneBeamBlock = block(blocks, "craneBeam");
  const windowRiegelBlock = block(blocks, "windowRiegel");
  const beamCellBlock = block(blocks, "beamCell");

  return [
    ...buildColumnItems(projectInput, result, columnBlock, layout),
    buildFromBlock({
      id: "trusses.main",
      group: "trusses",
      elementName: "Selected truss set",
      sourceBlock: "truss",
      block: trussBlock,
      profile: trussBlock.selectedProfiles.join(", ") || null,
      quantity: derivedQuantity({
        quantity: layout.mainTrussQuantity,
        lengthM: projectInput.geometry.buildingSpanM,
        unitMassKg: null,
        notes: [
          "Main trusses are counted on interior axes only. End axes are represented by end fakhverk and end roof beams.",
        ],
        warnings: ["Truss quantity is sourced from BuildingLayout.mainTrussQuantity."],
      }),
      notes: ["Truss item is an aggregate of selected chord/brace/web profiles."],
    }),
    buildPurlinItem({
      block: purlinBlock,
      layout: purlinLayout,
      alternatives: purlinAlternatives,
    }),
    buildFromBlock({
      id: "craneBeams.main",
      group: "craneBeams",
      elementName: "Selected crane beam profile",
      sourceBlock: "craneBeam",
      block: craneBeamBlock,
      steel: projectInput.materials.craneBeamSteel ?? null,
      quantity: deriveCraneBeamQuantity(projectInput),
    }),
    buildFromBlock({
      id: "windowRiegels.main",
      group: "windowRiegels",
      elementName: "Selected window riegel profiles",
      sourceBlock: "windowRiegel",
      block: windowRiegelBlock,
      steel: projectInput.materials.windowRiegelSteel ?? null,
      quantity: deriveWindowRiegelQuantity(projectInput),
      notes: ["Lower, upper and side window riegel profiles are kept as one aggregate item for now."],
    }),
    ...buildBeamCellItems(projectInput, beamCellBlock, layout),
  ];
}

function buildTotals(items: SpecificationItem[]): BuildingSpecification["totals"] {
  const massByGroup: BuildingSpecification["totals"]["massByGroup"] = {};
  const costByGroup: BuildingSpecification["totals"]["costByGroup"] = {};
  let totalMassKg = 0;
  let totalCostRub = 0;

  for (const item of items) {
    if (item.totalMassKg !== null) {
      massByGroup[item.group] = (massByGroup[item.group] ?? 0) + item.totalMassKg;
      totalMassKg += item.totalMassKg;
    }
    if (item.totalCostRub !== null) {
      costByGroup[item.group] = (costByGroup[item.group] ?? 0) + item.totalCostRub;
      totalCostRub += item.totalCostRub;
    }
  }

  return {
    totalMassKg,
    totalCostRub,
    massByGroup,
    costByGroup,
    itemCount: items.length,
  };
}

export function buildBuildingSpecificationFromCalculation(
  projectInput: ProjectInput,
  calculation: ProjectCalculationWithSummary,
): BuildingSpecification {
  const { result, summary, purlinAlternativesSummary } = calculation;
  const layout = buildBuildingLayout(projectInput);
  const purlinAlternatives = purlinAlternativesSummary;
  const selectedPurlinAlternative = purlinAlternatives.alternatives.find(
    (item) => item.system === purlinAlternatives.selectedSystem,
  );
  const purlinLayout = buildPurlinLayout(projectInput, {
    buildingLayout: layout,
    purlinResult: result.purlinResult,
    selectedSystem: purlinAlternatives.selectedSystem,
    selectedStepMm: selectedPurlinAlternative?.stepMm ?? null,
  });
  const items = buildItems(projectInput, result, summary, layout, purlinLayout, purlinAlternatives);
  const itemWarnings = items.flatMap((item) => item.warnings.map((warning) => `${item.id}: ${warning}`));

  return {
    projectName: projectInput.projectInfo.name,
    createdAt: new Date().toISOString(),
    items,
    totals: buildTotals(items),
    warnings: compactText([
      ...summary.warnings,
      ...layout.warnings.map((warning) => `layout: ${warning}`),
      ...purlinLayout.warnings.map((warning) => `purlinLayout: ${warning}`),
      ...purlinAlternatives.warnings.map((warning) => `purlinAlternatives: ${warning}`),
      ...itemWarnings,
    ]),
    mappingNotes: [
      ...summary.mappingNotes,
      ...layout.notes.map((note) => `layout: ${note}`),
      ...purlinLayout.notes.map((note) => `purlinLayout: ${note}`),
      ...purlinAlternatives.notes.map((note) => `purlinAlternatives: ${note}`),
    ],
  };
}

export function buildBuildingSpecification(projectInput: ProjectInput): BuildingSpecification {
  return buildBuildingSpecificationFromCalculation(projectInput, calculateProjectWithSummary(projectInput));
}
