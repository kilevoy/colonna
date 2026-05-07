import type { ProjectInput } from "../project";

export interface DerivedQuantity {
  quantity: number | null;
  lengthM: number | null;
  totalLengthM?: number | null;
  unitMassKg: number | null;
  notes: string[];
  warnings: string[];
}

function finitePositive(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function spanCountAsNumber(project: ProjectInput): number | null {
  if (project.geometry.spanCount === "single") return 1;
  return null;
}

function derived(params: {
  quantity?: number | null;
  lengthM?: number | null;
  totalLengthM?: number | null;
  unitMassKg?: number | null;
  notes?: string[];
  warnings?: string[];
}): DerivedQuantity {
  return {
    quantity: params.quantity ?? null,
    lengthM: params.lengthM ?? null,
    totalLengthM: params.totalLengthM ?? null,
    unitMassKg: params.unitMassKg ?? null,
    notes: params.notes ?? [],
    warnings: params.warnings ?? [],
  };
}

export function deriveFrameCount(project: ProjectInput): number | null {
  const buildingLengthM = finitePositive(project.geometry.buildingLengthM);
  const frameStepM = finitePositive(project.geometry.frameStepM);
  if (buildingLengthM === null || frameStepM === null) return null;
  return Math.floor(buildingLengthM / frameStepM) + 1;
}

export function deriveColumnQuantity(project: ProjectInput): DerivedQuantity {
  const frameCount = deriveFrameCount(project);
  const spanCount = spanCountAsNumber(project);
  const lengthM = finitePositive(project.geometry.columnHeightM) ?? finitePositive(project.geometry.buildingHeightM);
  const notes = ["Preliminary column quantity based on frame count and span count."];
  const warnings = ["Preliminary rule does not account for special end frames, expansion joints, or facade-only columns."];

  if (frameCount === null) {
    return derived({
      lengthM,
      notes,
      warnings: [...warnings, "Frame count cannot be derived from building length and frame step."],
    });
  }
  if (spanCount === null) {
    return derived({
      lengthM,
      notes,
      warnings: [...warnings, "Multi-span column quantity requires explicit span layout and is not derived yet."],
    });
  }

  return derived({
    quantity: frameCount * (spanCount + 1),
    lengthM,
    notes,
    warnings,
  });
}

export function deriveTrussQuantity(project: ProjectInput): DerivedQuantity {
  const frameCount = deriveFrameCount(project);
  const spanCount = spanCountAsNumber(project);
  const lengthM = finitePositive(project.geometry.buildingSpanM);
  const notes = ["Preliminary truss quantity assumes one truss per span per frame."];
  const warnings = ["Preliminary rule does not account for gable end simplifications or nonstandard frame layouts."];

  if (frameCount === null) {
    return derived({
      lengthM,
      notes,
      warnings: [...warnings, "Frame count cannot be derived from building length and frame step."],
    });
  }
  if (spanCount === null) {
    return derived({
      lengthM,
      notes,
      warnings: [...warnings, "Multi-span truss quantity requires explicit span layout and is not derived yet."],
    });
  }

  return derived({
    quantity: frameCount * spanCount,
    lengthM,
    notes,
    warnings,
  });
}

export function derivePurlinQuantity(project: ProjectInput): DerivedQuantity {
  return derived({
    lengthM: finitePositive(project.geometry.buildingLengthM),
    notes: ["Purlin length uses building length as a preliminary longitudinal reference."],
    warnings: ["Purlin line count is not derived yet; roof geometry and reliable purlin spacing/layout are required."],
  });
}

export function deriveCraneBeamQuantity(project: ProjectInput): DerivedQuantity {
  if (!project.cranes.supportCrane.enabled) {
    return derived({
      quantity: 0,
      notes: ["Support crane is disabled in ProjectInput; crane beam quantity is set to zero."],
      warnings: ["Crane-beam oracle preview may still return an aggregate result, but it is not included as a building quantity."],
    });
  }

  return derived({
    quantity: 2,
    lengthM: finitePositive(project.geometry.buildingLengthM),
    notes: ["Preliminary rule assumes two runway beams along the building length."],
    warnings: ["Preliminary rule does not account for crane runway segmentation, end stops, or multiple crane aisles."],
  });
}

export function deriveWindowRiegelQuantity(_project: ProjectInput): DerivedQuantity {
  return derived({
    notes: ["Window riegel profiles remain aggregate until opening layout is modeled."],
    warnings: ["Window riegel quantity and length are not derived yet; opening count and layout are required."],
  });
}

export function deriveBeamCellQuantity(_project: ProjectInput): DerivedQuantity {
  return derived({
    notes: ["Beam-cell result remains an aggregate item until roof beam layout is modeled."],
    warnings: ["Beam-cell quantity and length are not derived yet; bay layout and beam-cell placement are required."],
  });
}
