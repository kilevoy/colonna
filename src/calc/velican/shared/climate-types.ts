export interface ClimateSettlement {
  id: string;
  country: string;
  region: string;
  settlement: string;
  settlementType?: string | null;
  snowRegion: string | null;
  sgKpa: number | null;
  snowStatus: string | null;
  windRegion: string | null;
  w0Kpa: number | null;
  windStatus: string | null;
  inSP131?: boolean;
  sourceList?: string;
}
