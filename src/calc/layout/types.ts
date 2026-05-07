import type { SpanCount } from "../types";

export interface BuildingAxis {
  index: number;
  positionM: number;
  kind: "end" | "interior";
}

export interface BuildingLayout {
  buildingLengthM: number;
  buildingSpanM: number;
  frameStepM: number;
  spanCount: SpanCount | number;
  frameCount: number;
  interiorFrameCount: number;
  endAxisCount: number;
  axes: BuildingAxis[];
  mainTrussQuantity: number;
  endRoofBeamQuantity: number;
  edgeColumnQuantity: number;
  middleColumnQuantity: number;
  endFakhverkColumnQuantity: number;
  notes: string[];
  warnings: string[];
}
