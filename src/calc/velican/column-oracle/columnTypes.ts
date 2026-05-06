import type { ClimateSettlement } from '../shared/climate-types';

export interface ColumnInputs {
  city: string;
  responsibilityLevel: number;
  roofType: string;
  buildingSpanM: number;
  buildingLengthM: number;
  buildingHeightM: number;
  roofSlopeDeg: number;
  frameStepM: number;
  facadePostStepM: number;
  spanCount: string;
  perimeterBracing: string;
  terrainType: string;
  windLoadKpa: number;
  snowLoadKpa: number;
  roofConstruction: string;
  wallConstruction: string;
  supportCrane: string;
  supportCraneSingleSpan: string;
  supportCraneCapacityT: string | number;
  supportCraneSpanM: number;
  supportCraneCount: string;
  railTopMarkM: number;
  suspensionCrane: string;
  suspensionCraneSingleSpan: string;
  suspensionCraneCapacityT: number;
  columnType: string;
  loadAllowancePercent: number;
  priceIbeamC255: number;
  priceIbeamC355: number;
  priceTubeC245: number;
  priceTubeC345: number;
}

export interface ColumnOption {
  number: number;
  profile: string | null;
  steel: string | null;
  utilization: number | null;
  governingCheck: string | null;
  meterWeightKg: number | null;
  columnWeightKg: number | null;
  braceCount: number | null;
  totalWeightKg: number | null;
  costThousandRub: number | null;
}

export interface ColumnResult {
  snowDesignKpa: number | null;
  windDesignKpa: number | null;
  windInternalKpa: number | null;
  roofDesignKpa: number | null;
  wallDesignKpa: number | null;
  supportWheelLoadKn: number | null;
  supportCraneGKn: number | null;
  supportCraneTKn: number | null;
  supportCraneMomentKnM: number | null;
  normalForceKn: number | null;
  baseMomentKnM: number | null;
  momentFactor: number | null;
  momentKnM: number | null;
  effectiveWindLoadKpa: number;
  effectiveSnowLoadKpa: number;
  climateSettlement: ClimateSettlement | null;
  options: ColumnOption[];
  warnings: string[];
}
