export type PurlinSystemKey = "sortSteel" | "mp350" | "mp390";

export type PurlinLayoutRoofShape = "gable" | "singleSlope" | "unknown";

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
