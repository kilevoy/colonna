import { runCalculation } from "../engine";
import { runTrussCalculation } from "../truss/engine";
import { runPurlinCalculation } from "../purlin";
import { mapProjectToBeamCellInput } from "./map-project-to-beam-cell";
import { mapProjectToColumnInput } from "./map-project-to-column";
import { mapProjectToCraneBeamInput } from "./map-project-to-crane-beam";
import { mapProjectToPurlinInput } from "./map-project-to-purlin";
import { mapProjectToTrussInput } from "./map-project-to-truss";
import { mapProjectToWindowRiegelInput } from "./map-project-to-window-riegel";
import { buildProjectSummary } from "./project-summary";
import { buildPurlinAlternatives } from "../purlin-layout";
import type {
  ProjectBlockMapping,
  ProjectCalculationResult,
  ProjectCalculationWithSummary,
  ProjectInput,
} from "./types";

function collectMapping<T>(block: string, mapped: ProjectBlockMapping<T>, notes: string[], warnings: string[]): T {
  notes.push(...mapped.mappingNotes.map((note) => `${block}: ${note}`));
  warnings.push(...mapped.warnings.map((warning) => `${block}: ${warning}`));
  return mapped.input;
}

function blockWarning(block: string, error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return `${block}: calculation failed: ${message}`;
}

function oracleEnabled(
  project: ProjectInput,
  setting: "useOracleForCraneBeam" | "useOracleForWindowRiegel" | "useOracleForBeamCell",
): boolean {
  return project.calculationSettings.enableOracleBlocks === true && project.calculationSettings[setting] === true;
}

function oracleSkippedWarning(block: string): string {
  return `${block}: skipped: VELICAN oracle is disabled for normal ProjectApp mode. Enable dev/oracle mode to run this block.`;
}

function oracleAsyncWarning(block: string): string {
  return `${block}: skipped: VELICAN oracle was requested, but calculateProject() is synchronous. Use calculateProjectAsync() for dev/oracle mode.`;
}

export function calculateProject(project: ProjectInput): ProjectCalculationResult {
  const warnings: string[] = [];
  const mappingNotes: string[] = [];

  const columnInput = collectMapping("column", mapProjectToColumnInput(project), mappingNotes, warnings);
  const trussInput = collectMapping("truss", mapProjectToTrussInput(project), mappingNotes, warnings);
  const purlinInput = collectMapping("purlin", mapProjectToPurlinInput(project), mappingNotes, warnings);
  const craneBeamInput = collectMapping("craneBeam", mapProjectToCraneBeamInput(project), mappingNotes, warnings);
  const windowRiegelInput = collectMapping("windowRiegel", mapProjectToWindowRiegelInput(project), mappingNotes, warnings);
  const beamCellInput = collectMapping("beamCell", mapProjectToBeamCellInput(project), mappingNotes, warnings);

  let columnResult: ProjectCalculationResult["columnResult"] = null;
  let trussResult: ProjectCalculationResult["trussResult"] = null;
  let purlinResult: ProjectCalculationResult["purlinResult"] = null;

  try {
    columnResult = runCalculation(columnInput);
  } catch (error) {
    warnings.push(blockWarning("column", error));
  }
  try {
    trussResult = runTrussCalculation(trussInput);
  } catch (error) {
    warnings.push(blockWarning("truss", error));
  }
  try {
    purlinResult = runPurlinCalculation(purlinInput);
  } catch (error) {
    warnings.push(blockWarning("purlin", error));
  }

  warnings.push(
    oracleEnabled(project, "useOracleForCraneBeam") ? oracleAsyncWarning("craneBeam") : oracleSkippedWarning("craneBeam"),
  );
  warnings.push(
    oracleEnabled(project, "useOracleForWindowRiegel")
      ? oracleAsyncWarning("windowRiegel")
      : oracleSkippedWarning("windowRiegel"),
  );
  warnings.push(
    oracleEnabled(project, "useOracleForBeamCell") ? oracleAsyncWarning("beamCell") : oracleSkippedWarning("beamCell"),
  );

  return {
    projectInputSnapshot: project,
    columnResult,
    trussResult,
    purlinResult,
    craneBeamResult: null,
    windowRiegelResult: null,
    beamCellResult: null,
    mappedInputs: {
      column: columnInput,
      truss: trussInput,
      purlin: purlinInput,
      craneBeam: craneBeamInput,
      windowRiegel: windowRiegelInput,
      beamCell: beamCellInput,
    },
    warnings,
    mappingNotes,
  };
}

function removeOracleSkipWarnings(result: ProjectCalculationResult, blocks: string[]): void {
  result.warnings = result.warnings.filter((warning) => !blocks.some((block) => warning.startsWith(`${block}: skipped:`)));
}

export async function calculateProjectAsync(project: ProjectInput): Promise<ProjectCalculationResult> {
  const result = calculateProject(project);
  const enabledBlocks: string[] = [];
  if (oracleEnabled(project, "useOracleForCraneBeam")) enabledBlocks.push("craneBeam");
  if (oracleEnabled(project, "useOracleForWindowRiegel")) enabledBlocks.push("windowRiegel");
  if (oracleEnabled(project, "useOracleForBeamCell")) enabledBlocks.push("beamCell");
  removeOracleSkipWarnings(result, enabledBlocks);

  if (oracleEnabled(project, "useOracleForCraneBeam") && result.mappedInputs.craneBeam) {
    try {
      const { calculateCraneBeam } = await import("../crane-beam");
      result.craneBeamResult = calculateCraneBeam(result.mappedInputs.craneBeam);
    } catch (error) {
      result.warnings.push(blockWarning("craneBeam", error));
    }
  }
  if (oracleEnabled(project, "useOracleForWindowRiegel") && result.mappedInputs.windowRiegel) {
    try {
      const { calculateWindowRiegel } = await import("../window-riegel");
      result.windowRiegelResult = calculateWindowRiegel(result.mappedInputs.windowRiegel);
    } catch (error) {
      result.warnings.push(blockWarning("windowRiegel", error));
    }
  }
  if (oracleEnabled(project, "useOracleForBeamCell") && result.mappedInputs.beamCell) {
    try {
      const { calculateBeamCell } = await import("../beam-cell");
      result.beamCellResult = calculateBeamCell(result.mappedInputs.beamCell);
    } catch (error) {
      result.warnings.push(blockWarning("beamCell", error));
    }
  }

  return result;
}

export function calculateProjectWithSummary(project: ProjectInput): ProjectCalculationWithSummary {
  const result = calculateProject(project);
  const purlinAlternativesSummary = buildPurlinAlternatives(project, result.purlinResult);
  return {
    result,
    summary: buildProjectSummary(result),
    purlinAlternativesSummary,
  };
}

export async function calculateProjectWithSummaryAsync(project: ProjectInput): Promise<ProjectCalculationWithSummary> {
  const result = await calculateProjectAsync(project);
  const purlinAlternativesSummary = buildPurlinAlternatives(project, result.purlinResult);
  return {
    result,
    summary: buildProjectSummary(result),
    purlinAlternativesSummary,
  };
}
