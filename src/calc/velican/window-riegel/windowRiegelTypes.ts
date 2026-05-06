export interface WindowRiegelInputs {
  city: string;
  responsibilityLevel: string | number;
  windowHeightM: number;
  frameStepM: number;
  windowType: number;
  buildingHeightM: number;
  buildingSpanM: number;
  buildingLengthM: number;
  terrainType: string;
  windLoadKpa: number;
  windStandard: string;
  windowConstruction: string;
  maxUtilization: number;
}

export interface WindowRiegelOption {
  number: number;
  profile: string | null;
  steel: string | null;
  weightKg: number | null;
}

export type { ClimateSettlement } from '../shared/climate-types';

export interface WindowRiegelResult {
  verticalLoadKpa: number | null;
  horizontalLoadKpa: number | null;
  outOfPlaneLengthM: number | null;
  inPlaneLengthM: number | null;
  effectiveWindLoadKpa: number;
  climateSettlement: ClimateSettlement | null;
  lowerAndUpperProfiles: WindowRiegelOption[];
  upperType1Profiles: WindowRiegelOption[];
  warnings: string[];
}
import type { ClimateSettlement } from '../shared/climate-types';
