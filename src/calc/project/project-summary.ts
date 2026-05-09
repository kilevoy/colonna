import { isLstkOutput } from "../purlin";
import type { LstkOutput, PurlinOutput, RolledOutput } from "../purlin";
import type { TrussOutput } from "../truss/types";
import type { CalculationOutput } from "../types";
import type { BeamCellResult } from "../beam-cell";
import type { CraneBeamResult } from "../crane-beam";
import type { WindowRiegelResult } from "../window-riegel";
import type {
  ProjectBlockCalculationSource,
  ProjectBlockCalculationStatus,
  ProjectBlockName,
  ProjectBlockStatus,
  ProjectCalculationResult,
  ProjectCalculationSummary,
} from "./types";

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function compactText(values: Array<string | null | undefined>): string[] {
  return values
    .map((value) => (value ?? "").trim())
    .filter((value, index, array) => value.length > 0 && array.indexOf(value) === index);
}

function statusFor(
  result: unknown,
  warnings: string[],
  selectedProfiles: string[],
): ProjectBlockCalculationStatus {
  if (!result) return "notCalculated";
  if (warnings.length > 0) return "warning";
  if (selectedProfiles.length === 0) return "warning";
  return "ok";
}

function warningForBlock(block: ProjectBlockName, warnings: string[]): string[] {
  const prefix = `${block}: `;
  return warnings
    .filter((warning) => warning.startsWith(prefix))
    .map((warning) => warning.slice(prefix.length));
}

function notCalculatedBlock(
  block: ProjectBlockName,
  source: ProjectBlockCalculationSource,
  warnings: string[],
): ProjectBlockStatus {
  return {
    block,
    status: "notCalculated",
    source,
    selectedProfiles: [],
    massKg: null,
    costRub: null,
    utilization: null,
    warnings,
    notes: ["Block result is not available in ProjectCalculationResult."],
  };
}

function skippedBlock(block: ProjectBlockName, warnings: string[]): ProjectBlockStatus {
  return {
    block,
    status: "skipped",
    source: "skipped",
    selectedProfiles: [],
    massKg: null,
    costRub: null,
    utilization: null,
    warnings,
    notes: ["VELICAN oracle block is skipped in normal ProjectApp mode."],
  };
}

function columnStatus(result: CalculationOutput | null, warnings: string[]): ProjectBlockStatus {
  if (!result) return notCalculatedBlock("column", "native", warnings);
  const top = result.results[0] ?? null;
  const costRub = top ? finiteNumber(top.cost_rub * 1000) : null;
  const selectedProfiles = compactText([top?.profileName]);
  const blockWarnings = [...warnings];
  const notes: string[] = [
    "Native column calculation result.",
    "Legacy native column cost_rub is stored in thousand rubles; ProjectSummary normalizes it to rubles.",
  ];
  if (costRub === null) notes.push("Column cost is not available for totalCostRub.");

  return {
    block: "column",
    status: statusFor(result, blockWarnings, selectedProfiles),
    source: "native",
    selectedProfiles,
    massKg: finiteNumber(top?.totalMass_kg),
    costRub,
    utilization: finiteNumber(top?.maxUtilization),
    warnings: blockWarnings,
    notes,
  };
}

function trussProfiles(result: TrussOutput): string[] {
  return compactText(Object.values(result.sections).map((section) => section.selected?.profile.name));
}

function trussUtilization(result: TrussOutput): number | null {
  const utilizations = Object.values(result.sections)
    .map((section) => finiteNumber(section.selected?.maxUtilization))
    .filter((value): value is number => value !== null);
  return utilizations.length > 0 ? Math.max(...utilizations) : null;
}

function trussStatus(result: TrussOutput | null, warnings: string[]): ProjectBlockStatus {
  if (!result) return notCalculatedBlock("truss", "native", warnings);
  const selectedProfiles = trussProfiles(result);
  const blockWarnings = [...warnings, ...result.warnings];

  return {
    block: "truss",
    status: statusFor(result, blockWarnings, selectedProfiles),
    source: "native",
    selectedProfiles,
    massKg: finiteNumber(result.totalMass_kg),
    costRub: null,
    utilization: trussUtilization(result),
    warnings: blockWarnings,
    notes: [
      "Native truss calculation result.",
      "Truss cost is not exposed by the native truss result yet and is not included in totalCostRub.",
    ],
  };
}

function bestLstk(output: LstkOutput) {
  return output.top10[0] ?? null;
}

function bestRolled(output: RolledOutput) {
  return output.top10[0] ?? null;
}

function purlinProfiles(result: PurlinOutput): string[] {
  if (isLstkOutput(result)) {
    return compactText([bestLstk(result)?.profile.name]);
  }
  return compactText([bestRolled(result)?.profile.name]);
}

function purlinMass(result: PurlinOutput): number | null {
  if (isLstkOutput(result)) return finiteNumber(bestLstk(result)?.massPerBuilding_kg);
  return finiteNumber(bestRolled(result)?.massPerBuilding_kg);
}

function purlinUtilization(result: PurlinOutput): number | null {
  if (isLstkOutput(result)) return finiteNumber(bestLstk(result)?.K);
  return finiteNumber(bestRolled(result)?.K_max);
}

function purlinStatus(result: PurlinOutput | null, warnings: string[]): ProjectBlockStatus {
  if (!result) return notCalculatedBlock("purlin", "native", warnings);
  const selectedProfiles = purlinProfiles(result);

  return {
    block: "purlin",
    status: statusFor(result, warnings, selectedProfiles),
    source: "native",
    selectedProfiles,
    massKg: purlinMass(result),
    costRub: null,
    utilization: purlinUtilization(result),
    warnings,
    notes: [
      "Native purlin calculation result.",
      "Purlin cost is not exposed by the native purlin result yet and is not included in totalCostRub.",
    ],
  };
}

function oracleLikeStatus(
  block: "craneBeam" | "windowRiegel" | "beamCell",
  result: CraneBeamResult | WindowRiegelResult | BeamCellResult | null,
  warnings: string[],
): ProjectBlockStatus {
  if (!result && warnings.some((warning) => warning.startsWith("skipped:"))) {
    return skippedBlock(block, warnings);
  }
  if (!result) return notCalculatedBlock(block, "velican-oracle", warnings);

  const selectedProfiles =
    block === "windowRiegel"
      ? compactText([
          (result as WindowRiegelResult).lowerProfile?.profile,
          (result as WindowRiegelResult).upperProfile?.profile,
          (result as WindowRiegelResult).sideProfile?.profile,
        ])
      : compactText([(result as CraneBeamResult | BeamCellResult).selectedProfile]);
  const blockWarnings = [...warnings, ...result.warnings];
  const notes = [...result.notes];
  if (result.costRub === null) notes.push(`${block} cost is not available for totalCostRub.`);

  return {
    block,
    status: statusFor(result, blockWarnings, selectedProfiles),
    source: result.source,
    selectedProfiles,
    massKg: finiteNumber(result.massKg),
    costRub: finiteNumber(result.costRub),
    utilization: finiteNumber(result.utilization),
    warnings: blockWarnings,
    notes,
  };
}

function addTotals(blocks: ProjectBlockStatus[]) {
  const massByBlock: Partial<Record<ProjectBlockName, number>> = {};
  const costByBlock: Partial<Record<ProjectBlockName, number>> = {};
  let totalMassKg = 0;
  let totalCostRub = 0;

  for (const block of blocks) {
    if (block.massKg !== null) {
      massByBlock[block.block] = block.massKg;
      totalMassKg += block.massKg;
    }
    if (block.costRub !== null) {
      costByBlock[block.block] = block.costRub;
      totalCostRub += block.costRub;
    }
  }

  return { massByBlock, costByBlock, totalMassKg, totalCostRub };
}

function buildIncompleteFields(blocks: ProjectBlockStatus[], mappingNotes: string[]): string[] {
  const incomplete = blocks.flatMap((block) => {
    const fields: string[] = [];
    if (block.massKg === null) fields.push(`${block.block}.massKg`);
    if (block.costRub === null) fields.push(`${block.block}.costRub`);
    if (block.selectedProfiles.length === 0) fields.push(`${block.block}.selectedProfiles`);
    return fields;
  });

  for (const note of mappingNotes) {
    if (/not yet|currently|partial|does not|keeps|defaults/i.test(note)) {
      incomplete.push(`mapping: ${note}`);
    }
  }

  return compactText(incomplete);
}

export function buildProjectSummary(result: ProjectCalculationResult): ProjectCalculationSummary {
  const project = result.projectInputSnapshot;
  const blocks: ProjectBlockStatus[] = [
    columnStatus(result.columnResult, warningForBlock("column", result.warnings)),
    trussStatus(result.trussResult, warningForBlock("truss", result.warnings)),
    purlinStatus(result.purlinResult, warningForBlock("purlin", result.warnings)),
    oracleLikeStatus("craneBeam", result.craneBeamResult, warningForBlock("craneBeam", result.warnings)),
    oracleLikeStatus("windowRiegel", result.windowRiegelResult, warningForBlock("windowRiegel", result.warnings)),
    oracleLikeStatus("beamCell", result.beamCellResult, warningForBlock("beamCell", result.warnings)),
  ];
  const totals = addTotals(blocks);

  return {
    projectName: project.projectInfo.name,
    city: project.projectInfo.city ?? project.climate.city,
    calculatedAt: new Date().toISOString(),
    blocks,
    ...totals,
    warnings: [
      ...result.warnings,
      ...blocks.flatMap((block) => block.warnings.map((warning) => `${block.block}: ${warning}`)),
    ],
    mappingNotes: [...result.mappingNotes],
    incompleteFields: buildIncompleteFields(blocks, result.mappingNotes),
  };
}

function formatNumber(value: number | null): string {
  return value === null ? "" : String(Number(value.toFixed(3)));
}

export function formatProjectSummaryMarkdown(summary: ProjectCalculationSummary): string {
  const lines = [
    "# Project Summary",
    "",
    `Project: ${summary.projectName}`,
    summary.city ? `City: ${summary.city}` : "City:",
    `Calculated at: ${summary.calculatedAt}`,
    "",
    "## Blocks",
    "",
    "| Block | Status | Source | Profiles | Mass kg | Cost rub | Utilization |",
    "|---|---|---|---|---:|---:|---:|",
    ...summary.blocks.map((block) =>
      [
        block.block,
        block.status,
        block.source,
        block.selectedProfiles.join(", "),
        formatNumber(block.massKg),
        formatNumber(block.costRub),
        formatNumber(block.utilization),
      ].join(" | "),
    ).map((row) => `| ${row} |`),
    "",
    "## Totals",
    "",
    `- Total mass: ${formatNumber(summary.totalMassKg)} kg`,
    `- Total cost: ${formatNumber(summary.totalCostRub)} rub`,
    "",
    "## Warnings",
    "",
    ...(summary.warnings.length > 0 ? summary.warnings.map((warning) => `- ${warning}`) : ["- None"]),
    "",
    "## Mapping Notes",
    "",
    ...(summary.mappingNotes.length > 0 ? summary.mappingNotes.map((note) => `- ${note}`) : ["- None"]),
  ];

  return lines.join("\n");
}
