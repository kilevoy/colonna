import type { CalculationOutput } from "../types";
import type { ProjectInput } from "../project";
import type { BuildingLayout } from "../layout";
import { deriveFrameCount } from "./quantity-rules";

export type ColumnGroupKey = "edge" | "endFakhverk" | "middle" | "aggregate";

export interface ColumnGeometryRow {
  xM: number;
  lengthM: number;
  quantity: number;
  notes: string[];
}

export interface ColumnSpecificationGroup {
  key: ColumnGroupKey;
  label: string;
  quantity: number | null;
  profile: string | null;
  steel: string | null;
  geometryLengthsM: number[];
  criticalHeightM: number | null;
  unitMassKg: number | null;
  totalMassKg: number | null;
  totalCostRub: number | null;
  rows: ColumnGeometryRow[];
  notes: string[];
  warnings: string[];
}

export interface ColumnSpecificationSummary {
  groups: ColumnSpecificationGroup[];
  totalQuantity: number;
  totalMassKg: number | null;
  totalCostRub: number | null;
  warnings: string[];
}

function finitePositive(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function projectSpanCount(project: ProjectInput): number {
  const rawSpanCount = project.geometry.spanCount as unknown;
  if (typeof rawSpanCount === "number" && Number.isFinite(rawSpanCount) && rawSpanCount > 0) {
    return Math.floor(rawSpanCount);
  }
  if (rawSpanCount === "multi") return 2;
  return 1;
}

function columnProfile(columnResult: CalculationOutput | null): string | null {
  return columnResult?.results[0]?.profileName ?? null;
}

function columnSteel(columnResult: CalculationOutput | null): string | null {
  return columnResult?.results[0]?.steel ?? null;
}

function uniqueNumbers(values: number[]): number[] {
  return [...new Set(values.map((value) => Number(value.toFixed(6))))];
}

function criticalHeight(rows: ColumnGeometryRow[]): number | null {
  if (rows.length === 0) return null;
  return Math.max(...rows.map((row) => row.lengthM));
}

function isMonoSlopeRoof(project: ProjectInput): boolean {
  const roofText = `${project.roof.roofType ?? ""} ${project.roof.roofConstruction ?? ""}`.toLowerCase();
  return roofText.includes("mono") || roofText.includes("shed") || roofText.includes("односкат");
}

export { deriveFrameCount };

export function deriveInteriorFrameCount(project: ProjectInput): number | null {
  const frameCount = deriveFrameCount(project);
  return frameCount === null ? null : Math.max(frameCount - 2, 0);
}

export function resolveColumnHeightAtX(project: ProjectInput, xM: number): number | null {
  const spanM = finitePositive(project.geometry.buildingSpanM);
  const heightM = finitePositive(project.geometry.buildingHeightM);
  if (spanM === null || heightM === null || !Number.isFinite(xM)) return null;

  const slopeRad = (project.geometry.roofSlopeDeg * Math.PI) / 180;
  const clampedX = Math.min(Math.max(xM, 0), spanM);
  if (isMonoSlopeRoof(project)) {
    return heightM + clampedX * Math.tan(slopeRad);
  }
  return heightM + Math.min(clampedX, spanM - clampedX) * Math.tan(slopeRad);
}

function groupFromRows(params: {
  key: ColumnGroupKey;
  label: string;
  quantity: number | null;
  columnResult: CalculationOutput | null;
  rows: ColumnGeometryRow[];
  notes: string[];
  warnings: string[];
  totalMassKg?: number | null;
  totalCostRub?: number | null;
}): ColumnSpecificationGroup {
  const geometryLengthsM = uniqueNumbers(params.rows.map((row) => row.lengthM));
  const quantity = params.quantity;
  const totalMassKg = params.totalMassKg ?? null;
  return {
    key: params.key,
    label: params.label,
    quantity,
    profile: columnProfile(params.columnResult),
    steel: columnSteel(params.columnResult),
    geometryLengthsM,
    criticalHeightM: criticalHeight(params.rows),
    unitMassKg: totalMassKg !== null && quantity !== null && quantity > 0 ? totalMassKg / quantity : null,
    totalMassKg,
    totalCostRub: params.totalCostRub ?? null,
    rows: params.rows,
    notes: params.notes,
    warnings: params.warnings,
  };
}

export function deriveEdgeColumnGroup(project: ProjectInput, columnResult: CalculationOutput | null): ColumnSpecificationGroup {
  const interiorFrameCount = deriveInteriorFrameCount(project);
  const spanM = finitePositive(project.geometry.buildingSpanM);
  const notes = [
    "Preliminary edge column quantity based on interior frame count.",
    "Edge columns are derived for interior frames; end frames are represented by end fakhverk posts.",
  ];
  const warnings = ["Detailed edge column mass split is not derived yet; aggregate column mass is kept separately."];

  if (interiorFrameCount === null || spanM === null) {
    return groupFromRows({
      key: "edge",
      label: "Крайние колонны основных рам",
      quantity: null,
      columnResult,
      rows: [],
      notes,
      warnings: [...warnings, "Cannot derive edge columns without frame count and building span."],
    });
  }

  const rows = [0, spanM]
    .map((xM) => {
      const lengthM = resolveColumnHeightAtX(project, xM);
      return lengthM === null
        ? null
        : {
            xM,
            lengthM,
            quantity: interiorFrameCount,
            notes: ["Edge column line on an interior frame."],
          };
    })
    .filter((row): row is ColumnGeometryRow => row !== null);

  return groupFromRows({
    key: "edge",
    label: "Крайние колонны основных рам",
    quantity: interiorFrameCount * 2,
    columnResult,
    rows,
    notes,
    warnings,
  });
}

function endFakhverkPositions(project: ProjectInput): { positions: number[]; warnings: string[] } {
  const spanM = finitePositive(project.geometry.buildingSpanM);
  const stepM = finitePositive(project.geometry.facadePostStepM);
  if (spanM === null || stepM === null) {
    return { positions: [], warnings: ["Cannot derive end fakhverk positions without building span and facade post step."] };
  }

  const positions: number[] = [];
  for (let xM = 0; xM < spanM; xM += stepM) {
    positions.push(Number(xM.toFixed(6)));
  }
  if (positions.length === 0 || positions[positions.length - 1] !== spanM) {
    positions.push(spanM);
  }

  const exactBays = Math.abs(spanM / stepM - Math.round(spanM / stepM)) < 1e-9;
  return {
    positions,
    warnings: exactBays ? [] : ["Facade post step does not divide span exactly; last bay has adjusted spacing."],
  };
}

export function deriveEndFakhverkColumnGroup(
  project: ProjectInput,
  columnResult: CalculationOutput | null,
): ColumnSpecificationGroup {
  const { positions, warnings: positionWarnings } = endFakhverkPositions(project);
  const notes = [
    "End fakhverk includes end wall positions and may include edge positions; follows insi-next preliminary layout logic.",
  ];
  const rows = positions
    .map((xM) => {
      const lengthM = resolveColumnHeightAtX(project, xM);
      return lengthM === null
        ? null
        : {
            xM,
            lengthM,
            quantity: 2,
            notes: ["Two end walls use this fakhverk post position."],
          };
    })
    .filter((row): row is ColumnGeometryRow => row !== null);

  return groupFromRows({
    key: "endFakhverk",
    label: "Фахверковые колонны торцов",
    quantity: rows.length > 0 ? rows.reduce((sum, row) => sum + row.quantity, 0) : null,
    columnResult,
    rows,
    notes,
    warnings: [
      "Detailed end fakhverk mass split is not derived yet; aggregate column mass is kept separately.",
      ...positionWarnings,
    ],
  });
}

export function deriveMiddleColumnGroup(project: ProjectInput, columnResult: CalculationOutput | null): ColumnSpecificationGroup {
  const interiorFrameCount = deriveInteriorFrameCount(project);
  const spanM = finitePositive(project.geometry.buildingSpanM);
  const spanCount = projectSpanCount(project);
  const notes = ["Middle columns are derived only for multi-span buildings."];
  const warnings = ["Detailed middle column mass split is not derived yet; aggregate column mass is kept separately."];

  if (spanCount <= 1) {
    return groupFromRows({
      key: "middle",
      label: "Средние колонны",
      quantity: 0,
      columnResult,
      rows: [],
      notes: [...notes, "No middle columns for single-span building."],
      warnings: [],
    });
  }

  if (interiorFrameCount === null || spanM === null) {
    return groupFromRows({
      key: "middle",
      label: "Средние колонны",
      quantity: null,
      columnResult,
      rows: [],
      notes,
      warnings: [...warnings, "Cannot derive middle columns without frame count and building span."],
    });
  }

  const spacingAcrossSpan = spanM / spanCount;
  const rows: ColumnGeometryRow[] = [];
  for (let index = 1; index <= spanCount - 1; index += 1) {
    const xM = spacingAcrossSpan * index;
    const lengthM = resolveColumnHeightAtX(project, xM);
    if (lengthM !== null) {
      rows.push({
        xM,
        lengthM,
        quantity: interiorFrameCount,
        notes: ["Middle column line on an interior frame."],
      });
    }
  }

  return groupFromRows({
    key: "middle",
    label: "Средние колонны",
    quantity: interiorFrameCount * (spanCount - 1),
    columnResult,
    rows,
    notes,
    warnings,
  });
}

export function buildColumnSpecificationSummary(params: {
  project: ProjectInput;
  columnResult: CalculationOutput | null;
  aggregateMassKg: number | null;
  aggregateCostRub: number | null;
  layout?: BuildingLayout;
}): ColumnSpecificationSummary {
  const aggregateGroup = groupFromRows({
    key: "aggregate",
    label: "Колонны, агрегированная масса",
    quantity: null,
    columnResult: params.columnResult,
    rows: [],
    totalMassKg: params.aggregateMassKg,
    totalCostRub: params.aggregateCostRub,
    notes: ["Aggregate column mass from calculation result; detailed group mass split is not derived yet."],
    warnings: ["Column mass and cost are not split between edge, end fakhverk, and middle groups yet."],
  });

  const groups = [
    deriveEdgeColumnGroup(params.project, params.columnResult),
    deriveEndFakhverkColumnGroup(params.project, params.columnResult),
    deriveMiddleColumnGroup(params.project, params.columnResult),
    aggregateGroup,
  ].map((group) => {
    if (!params.layout) return group;
    if (group.key === "edge") {
      return {
        ...group,
        quantity: params.layout.edgeColumnQuantity,
        notes: [...group.notes, "Quantity is sourced from BuildingLayout.edgeColumnQuantity."],
      };
    }
    if (group.key === "endFakhverk") {
      return {
        ...group,
        quantity: params.layout.endFakhverkColumnQuantity,
        notes: [...group.notes, "Quantity is sourced from BuildingLayout.endFakhverkColumnQuantity."],
      };
    }
    if (group.key === "middle") {
      return {
        ...group,
        quantity: params.layout.middleColumnQuantity,
        notes: [...group.notes, "Quantity is sourced from BuildingLayout.middleColumnQuantity."],
      };
    }
    return group;
  });

  return {
    groups,
    totalQuantity: groups.reduce((sum, group) => sum + (group.key !== "aggregate" ? (group.quantity ?? 0) : 0), 0),
    totalMassKg: params.aggregateMassKg,
    totalCostRub: params.aggregateCostRub,
    warnings: groups.flatMap((group) => group.warnings.map((warning) => `${group.key}: ${warning}`)),
  };
}
