export type PurlinSystemKey = "sortSteel" | "mp350" | "mp390";

export type PurlinLayoutRoofShape = "gable" | "singleSlope" | "unknown";

export type PurlinAlternativeStatus = "ok" | "warning" | "missing";

export interface PurlinAlternative {
  system: PurlinSystemKey;
  label: string;
  profile: string | null;
  stepMm: number | null;
  utilization: number | null;
  massKg: number | null;
  costRub: number | null;
  status: PurlinAlternativeStatus;
  notes: string[];
  warnings: string[];
}

export interface PurlinAlternativesSummary {
  alternatives: PurlinAlternative[];
  selectedSystem: PurlinSystemKey;
  autoSelectedSystem: PurlinSystemKey | null;
  notes: string[];
  warnings: string[];
}

export interface PurlinLayout {
  roofShape: PurlinLayoutRoofShape;
  selectedSystem: PurlinSystemKey;
  purlinStepM: number | null;
  slopeLengthM: number | null;
  purlinLinesPerSlope: number | null;
  totalPurlinLines: number | null;
  frameBayCount: number | null;
  piecesPerLine: number | null;
  totalPieces: number | null;
  pieceLengthM: number | null;
  totalLengthM: number | null;
  notes: string[];
  warnings: string[];
}
