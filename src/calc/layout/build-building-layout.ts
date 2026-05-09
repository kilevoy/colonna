import type { ProjectInput } from "../project";
import type { BuildingAxis, BuildingLayout } from "./types";

function finitePositive(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function spanCountAsNumber(project: ProjectInput): number {
  const rawSpanCount = project.geometry.spanCount as unknown;
  if (typeof rawSpanCount === "number" && Number.isFinite(rawSpanCount) && rawSpanCount > 0) {
    return Math.floor(rawSpanCount);
  }
  return rawSpanCount === "multi" ? 2 : 1;
}

function deriveFrameCount(buildingLengthM: number, frameStepM: number): number {
  return Math.floor(buildingLengthM / frameStepM) + 1;
}

function buildAxes(buildingLengthM: number, frameStepM: number, frameCount: number): BuildingAxis[] {
  const axes: BuildingAxis[] = [];
  for (let index = 0; index < frameCount; index += 1) {
    const isLast = index === frameCount - 1;
    axes.push({
      index,
      positionM: isLast ? buildingLengthM : Number((index * frameStepM).toFixed(6)),
      kind: index === 0 || isLast ? "end" : "interior",
    });
  }
  return axes;
}

function endFakhverkPositionCount(buildingSpanM: number, facadePostStepM: number): {
  count: number;
  warnings: string[];
} {
  const positions: number[] = [];
  for (let xM = 0; xM < buildingSpanM; xM += facadePostStepM) {
    positions.push(Number(xM.toFixed(6)));
  }
  if (positions.length === 0 || positions[positions.length - 1] !== buildingSpanM) {
    positions.push(buildingSpanM);
  }

  const exactBays = Math.abs(buildingSpanM / facadePostStepM - Math.round(buildingSpanM / facadePostStepM)) < 1e-9;
  return {
    count: positions.length,
    warnings: exactBays ? [] : ["Facade post step does not divide span exactly; last end-fakhverk bay has adjusted spacing."],
  };
}

export function buildBuildingLayout(project: ProjectInput): BuildingLayout {
  const buildingLengthM = finitePositive(project.geometry.buildingLengthM);
  const buildingSpanM = finitePositive(project.geometry.buildingSpanM);
  const frameStepM = finitePositive(project.geometry.frameStepM);
  const facadePostStepM = finitePositive(project.geometry.facadePostStepM);
  const warnings: string[] = [];
  const notes: string[] = [
    "Main trusses are counted on interior axes only. End axes are represented by end fakhverk and roof beams.",
    "End roof beams are preliminary counted for two end axes. BeamCell mass semantics is not multiplied here.",
    "Longitudinal fakhverk is outside the first BuildingLayout scope.",
  ];

  if (buildingLengthM === null || buildingSpanM === null || frameStepM === null) {
    throw new Error("BuildingLayout requires positive buildingLengthM, buildingSpanM and frameStepM.");
  }

  const frameCount = deriveFrameCount(buildingLengthM, frameStepM);
  const interiorFrameCount = Math.max(frameCount - 2, 0);
  const axes = buildAxes(buildingLengthM, frameStepM, frameCount);
  const spanCount = spanCountAsNumber(project);

  const exactLengthBays = Math.abs(buildingLengthM / frameStepM - Math.round(buildingLengthM / frameStepM)) < 1e-9;
  if (!exactLengthBays) {
    warnings.push("Building length is not divisible by frame step; last bay has adjusted spacing.");
  }

  let endFakhverkColumnQuantity = 0;
  if (facadePostStepM === null) {
    warnings.push("End fakhverk column quantity cannot be derived without positive facadePostStepM.");
  } else {
    const endFakhverk = endFakhverkPositionCount(buildingSpanM, facadePostStepM);
    endFakhverkColumnQuantity = endFakhverk.count * 2;
    warnings.push(...endFakhverk.warnings);
  }

  return {
    buildingLengthM,
    buildingSpanM,
    frameStepM,
    spanCount: project.geometry.spanCount,
    frameCount,
    interiorFrameCount,
    endAxisCount: axes.filter((axis) => axis.kind === "end").length,
    axes,
    mainTrussQuantity: interiorFrameCount * spanCount,
    endRoofBeamQuantity: 2 * spanCount,
    edgeColumnQuantity: interiorFrameCount * 2,
    middleColumnQuantity: spanCount > 1 ? interiorFrameCount * (spanCount - 1) : 0,
    endFakhverkColumnQuantity,
    notes,
    warnings,
  };
}
