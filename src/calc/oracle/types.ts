export type OracleSource = "excel" | "velican-oracle" | "temporary-current-engine-baseline";

export interface OracleMetadata {
  workbookPath?: string;
  sheetName?: string;
  commit?: string;
  notes?: string;
}
