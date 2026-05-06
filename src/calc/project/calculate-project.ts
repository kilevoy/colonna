import { runCalculation } from "../engine";
import { runTrussCalculation } from "../truss/engine";
import { runPurlinCalculation } from "../purlin";
import { calculateCraneBeam } from "../crane-beam";
import { calculateWindowRiegel } from "../window-riegel";
import { calculateBeamCell } from "../beam-cell";
import { mapProjectToBeamCellInput } from "./map-project-to-beam-cell";
import { mapProjectToColumnInput } from "./map-project-to-column";
import { mapProjectToCraneBeamInput } from "./map-project-to-crane-beam";
import { mapProjectToPurlinInput } from "./map-project-to-purlin";
import { mapProjectToTrussInput } from "./map-project-to-truss";
import { mapProjectToWindowRiegelInput } from "./map-project-to-window-riegel";
import { buildProjectSummary } from "./project-summary";
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
  let craneBeamResult: ProjectCalculationResult["craneBeamResult"] = null;
  let windowRiegelResult: ProjectCalculationResult["windowRiegelResult"] = null;
  let beamCellResult: ProjectCalculationResult["beamCellResult"] = null;

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
  try {
    craneBeamResult = calculateCraneBeam(craneBeamInput);
  } catch (error) {
    warnings.push(blockWarning("craneBeam", error));
  }
  try {
    windowRiegelResult = calculateWindowRiegel(windowRiegelInput);
  } catch (error) {
    warnings.push(blockWarning("windowRiegel", error));
  }
  try {
    beamCellResult = calculateBeamCell(beamCellInput);
  } catch (error) {
    warnings.push(blockWarning("beamCell", error));
  }

  return {
    projectInputSnapshot: project,
    columnResult,
    trussResult,
    purlinResult,
    craneBeamResult,
    windowRiegelResult,
    beamCellResult,
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

export function calculateProjectWithSummary(project: ProjectInput): ProjectCalculationWithSummary {
  const result = calculateProject(project);
  return {
    result,
    summary: buildProjectSummary(result),
  };
}
