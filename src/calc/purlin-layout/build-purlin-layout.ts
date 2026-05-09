import { buildBuildingLayout, type BuildingLayout } from "../layout";
import { isLstkOutput, type LstkCandidate, type PurlinOutput, type RolledCandidate } from "../purlin";
import type { ProjectInput } from "../project";
import type { PurlinLayout, PurlinLayoutRoofShape, PurlinSystemKey } from "./types";

function finitePositive(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function round(value: number): number {
  return Number(value.toFixed(6));
}

function selectedSystem(project: ProjectInput): {
  system: PurlinSystemKey;
  notes: string[];
} {
  const preference = project.calculationSettings.purlinSystemPreference;
  if (preference === "sortSteel" || preference === "mp350" || preference === "mp390") {
    return {
      system: preference,
      notes: ["Selected purlin system follows ProjectInput.calculationSettings.purlinSystemPreference."],
    };
  }
  return {
    system: "mp350",
    notes: ["Selected purlin system is preliminary; UI selection will be added later."],
  };
}

function resolveRoofShape(project: ProjectInput): {
  roofShape: PurlinLayoutRoofShape;
  warnings: string[];
} {
  const explicit = project.roof.roofShape;
  if (explicit === "gable" || explicit === "singleSlope") {
    return { roofShape: explicit, warnings: [] };
  }
  if (project.roof.roofType === "gable") {
    return { roofShape: "gable", warnings: [] };
  }
  if (project.roof.roofType === "single_slope") {
    return { roofShape: "singleSlope", warnings: [] };
  }
  return {
    roofShape: "gable",
    warnings: ["Roof shape is unknown; gable roof is used as preliminary default."],
  };
}

function slopeLength(project: ProjectInput, roofShape: PurlinLayoutRoofShape): {
  value: number | null;
  warnings: string[];
} {
  const spanM = finitePositive(project.geometry.buildingSpanM);
  if (spanM === null) {
    return { value: null, warnings: ["Purlin slope length cannot be derived without positive buildingSpanM."] };
  }

  const slopeDeg =
    typeof project.geometry.roofSlopeDeg === "number" && Number.isFinite(project.geometry.roofSlopeDeg)
      ? project.geometry.roofSlopeDeg
      : 0;
  const cos = Math.cos((slopeDeg * Math.PI) / 180);
  if (cos <= 0) {
    return { value: null, warnings: ["Purlin slope length cannot be derived because roofSlopeDeg gives invalid cosine."] };
  }

  const runM = roofShape === "singleSlope" ? spanM : spanM / 2;
  const warnings = slopeDeg === 0 ? ["Roof slope is zero or missing; purlin slope length equals horizontal run."] : [];
  return { value: round(runM / cos), warnings };
}

function bestLstkForSystem(output: PurlinOutput, system: "mp350" | "mp390"): LstkCandidate | null {
  if (!isLstkOutput(output)) return null;
  const ry = system === "mp350" ? 350 : 390;
  const candidates = output.sections
    .filter((section) => section.grade === system.toUpperCase())
    .map((section) => section.best)
    .filter((candidate): candidate is LstkCandidate => candidate !== null && candidate.profile.Ry_MPa === ry);
  candidates.sort((a, b) => a.massPerBuilding_kg - b.massPerBuilding_kg);
  return candidates[0] ?? null;
}

function bestRolled(output: PurlinOutput): RolledCandidate | null {
  if (isLstkOutput(output)) return null;
  return output.top10[0] ?? null;
}

function stepFromResult(output: PurlinOutput | null | undefined, system: PurlinSystemKey): number | null {
  if (!output) return null;
  const spacingMm =
    system === "sortSteel"
      ? finitePositive(bestRolled(output)?.spacing_mm)
      : finitePositive(bestLstkForSystem(output, system)?.spacing_mm);
  return spacingMm === null ? null : spacingMm / 1000;
}

function purlinStep(project: ProjectInput, output: PurlinOutput | null | undefined, system: PurlinSystemKey): {
  value: number | null;
  warnings: string[];
} {
  const fromResult = stepFromResult(output, system);
  if (fromResult !== null) return { value: fromResult, warnings: [] };

  const fromSettings = finitePositive(project.calculationSettings.purlinMaxStepMm);
  if (fromSettings !== null) {
    return {
      value: fromSettings / 1000,
      warnings: ["Purlin step is preliminary and uses ProjectInput.calculationSettings.purlinMaxStepMm."],
    };
  }

  return {
    value: 1.5,
    warnings: ["Purlin step is preliminary and uses 1.5 m fallback because no calculation step was available."],
  };
}

function lengthBaysAreExact(layout: BuildingLayout): boolean {
  return Math.abs(layout.buildingLengthM / layout.frameStepM - Math.round(layout.buildingLengthM / layout.frameStepM)) < 1e-9;
}

export function buildPurlinLayout(
  project: ProjectInput,
  options: {
    buildingLayout?: BuildingLayout;
    purlinResult?: PurlinOutput | null;
    selectedSystem?: PurlinSystemKey;
    selectedStepMm?: number | null;
  } = {},
): PurlinLayout {
  const buildingLayout = options.buildingLayout ?? buildBuildingLayout(project);
  const system = options.selectedSystem
    ? {
        system: options.selectedSystem,
        notes: ["Selected purlin system is provided by PurlinAlternativesSummary."],
      }
    : selectedSystem(project);
  const roofShape = resolveRoofShape(project);
  const slope = slopeLength(project, roofShape.roofShape);
  const step = options.selectedStepMm
    ? { value: options.selectedStepMm / 1000, warnings: [] }
    : purlinStep(project, options.purlinResult, system.system);
  const warnings = [...roofShape.warnings, ...slope.warnings, ...step.warnings];
  const notes = [
    ...system.notes,
    "Includes eave/ridge edge lines as preliminary layout.",
    "Purlin layout is quantity/length only; purlin strength formulas are not changed.",
  ];

  const purlinLinesPerSlope =
    slope.value !== null && step.value !== null ? Math.ceil(slope.value / step.value) + 1 : null;
  const totalPurlinLines =
    purlinLinesPerSlope === null ? null : roofShape.roofShape === "singleSlope" ? purlinLinesPerSlope : purlinLinesPerSlope * 2;
  const frameBayCount = Math.max(buildingLayout.frameCount - 1, 0);
  const exactBays = lengthBaysAreExact(buildingLayout);
  const pieceLengthM = exactBays ? buildingLayout.frameStepM : null;
  if (!exactBays) {
    warnings.push("Last bay adjusted; piece lengths are variable.");
  }

  const piecesPerLine = totalPurlinLines === null ? null : frameBayCount;
  const totalPieces = totalPurlinLines === null ? null : totalPurlinLines * frameBayCount;
  const totalLengthM =
    totalPurlinLines === null
      ? null
      : exactBays
        ? totalPieces === null || pieceLengthM === null
          ? null
          : round(totalPieces * pieceLengthM)
        : round(totalPurlinLines * buildingLayout.buildingLengthM);

  return {
    roofShape: roofShape.roofShape,
    selectedSystem: system.system,
    purlinStepM: step.value,
    slopeLengthM: slope.value,
    purlinLinesPerSlope,
    totalPurlinLines,
    frameBayCount,
    piecesPerLine,
    totalPieces,
    pieceLengthM,
    totalLengthM,
    notes,
    warnings,
  };
}
