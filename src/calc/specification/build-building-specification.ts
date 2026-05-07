import { isLstkOutput } from "../purlin";
import {
  calculateProjectWithSummary,
  type ProjectBlockStatus,
  type ProjectCalculationResult,
  type ProjectCalculationSummary,
  type ProjectInput,
} from "../project";
import type { LstkOutput, PurlinOutput, RolledOutput } from "../purlin";
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

function withStatus(item: Omit<SpecificationItem, "status">): SpecificationItem {
  return {
    ...item,
    status: statusFor(item),
  };
}

function aggregateMissingQuantityNotes(): { notes: string[]; warnings: string[] } {
  return {
    notes: ["Quantity is not derived yet; aggregate mass from calculation result is used."],
    warnings: ["Quantity and length are not derived in the first specification layer."],
  };
}

function unitPrice(totalCostRub: number | null, totalMassKg: number | null): number | null {
  if (totalCostRub === null || totalMassKg === null || totalMassKg === 0) return null;
  return totalCostRub / totalMassKg;
}

function buildFromBlock(params: {
  id: string;
  group: SpecificationGroup;
  elementName: string;
  sourceBlock: string;
  block: ProjectBlockStatus;
  profile?: string | null;
  steel?: string | null;
  notes?: string[];
  warnings?: string[];
}): SpecificationItem {
  const missingQuantity = aggregateMissingQuantityNotes();
  const totalMassKg = finiteNumber(params.block.massKg);
  const totalCostRub = finiteNumber(params.block.costRub);
  return withStatus({
    id: params.id,
    group: params.group,
    elementName: params.elementName,
    profile: (params.profile ?? params.block.selectedProfiles.join(", ")) || null,
    steel: params.steel ?? null,
    quantity: null,
    lengthM: null,
    unitMassKg: null,
    totalMassKg,
    unitPriceRub: unitPrice(totalCostRub, totalMassKg),
    totalCostRub,
    sourceBlock: params.sourceBlock,
    calculationSource: params.block.source,
    notes: [...params.block.notes, ...missingQuantity.notes, ...(params.notes ?? [])],
    warnings: [...params.block.warnings, ...missingQuantity.warnings, ...(params.warnings ?? [])],
  });
}

function purlinSteel(output: PurlinOutput | null): string | null {
  if (!output) return null;
  if (isLstkOutput(output)) {
    const best = (output as LstkOutput).top10[0] ?? null;
    if (!best) return null;
    return best.profile.Ry_MPa === 390 ? "MP390" : "MP350";
  }
  const best = (output as RolledOutput).top10[0] ?? null;
  return best?.steel ?? null;
}

function columnSteel(projectResult: ProjectCalculationResult): string | null {
  return projectResult.columnResult?.results[0]?.steel ?? null;
}

function buildItems(
  projectInput: ProjectInput,
  result: ProjectCalculationResult,
  summary: ProjectCalculationSummary,
): BuildingSpecification["items"] {
  const blocks = summary.blocks;
  const columnBlock = block(blocks, "column");
  const trussBlock = block(blocks, "truss");
  const purlinBlock = block(blocks, "purlin");
  const craneBeamBlock = block(blocks, "craneBeam");
  const windowRiegelBlock = block(blocks, "windowRiegel");
  const beamCellBlock = block(blocks, "beamCell");

  return [
    buildFromBlock({
      id: "columns.main",
      group: "columns",
      elementName: "Selected column profile",
      sourceBlock: "column",
      block: columnBlock,
      steel: columnSteel(result),
      notes: ["Column item is an aggregate position from the selected native column result."],
    }),
    buildFromBlock({
      id: "trusses.main",
      group: "trusses",
      elementName: "Selected truss set",
      sourceBlock: "truss",
      block: trussBlock,
      profile: trussBlock.selectedProfiles.join(", ") || null,
      notes: ["Truss item is an aggregate of selected chord/brace/web profiles."],
    }),
    buildFromBlock({
      id: "purlins.main",
      group: "purlins",
      elementName: "Selected purlin profile",
      sourceBlock: "purlin",
      block: purlinBlock,
      steel: purlinSteel(result.purlinResult),
      notes: ["Purlin item uses aggregate building mass from native purlin result."],
    }),
    buildFromBlock({
      id: "craneBeams.main",
      group: "craneBeams",
      elementName: "Selected crane beam profile",
      sourceBlock: "craneBeam",
      block: craneBeamBlock,
      steel: projectInput.materials.craneBeamSteel ?? null,
    }),
    buildFromBlock({
      id: "windowRiegels.main",
      group: "windowRiegels",
      elementName: "Selected window riegel profiles",
      sourceBlock: "windowRiegel",
      block: windowRiegelBlock,
      steel: projectInput.materials.windowRiegelSteel ?? null,
      notes: ["Lower, upper and side window riegel profiles are kept as one aggregate item for now."],
    }),
    buildFromBlock({
      id: "beamCells.main",
      group: "beamCells",
      elementName: "Selected roof beam-cell profile",
      sourceBlock: "beamCell",
      block: beamCellBlock,
      steel: projectInput.materials.beamCellSteel ?? null,
    }),
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

export function buildBuildingSpecification(projectInput: ProjectInput): BuildingSpecification {
  const { result, summary } = calculateProjectWithSummary(projectInput);
  const items = buildItems(projectInput, result, summary);
  const itemWarnings = items.flatMap((item) => item.warnings.map((warning) => `${item.id}: ${warning}`));

  return {
    projectName: projectInput.projectInfo.name,
    createdAt: new Date().toISOString(),
    items,
    totals: buildTotals(items),
    warnings: compactText([...summary.warnings, ...itemWarnings]),
    mappingNotes: [...summary.mappingNotes],
  };
}
