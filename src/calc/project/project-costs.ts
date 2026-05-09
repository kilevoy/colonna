import type { ProjectInput } from "./types";

export function calculateProjectBuildingArea(project: ProjectInput): number {
  return project.geometry.buildingSpanM * project.geometry.buildingLengthM;
}

export function calculateProjectDesignCost(project: ProjectInput): number {
  const design = project.projectCosts?.design;
  if (!design?.enabled) return 0;
  if (design.method === "fixed") return Math.max(0, design.fixedRub);
  return Math.max(0, calculateProjectBuildingArea(project) * design.pricePerM2Rub);
}
