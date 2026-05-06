import type { ClimateSettlement } from '../shared/climate-types';

export interface MolodechnoInputs {
  city: string;
  responsibilityLevel: number;
  spanM: number;
  buildingLengthM: number;
  buildingHeightM: number;
  roofSlopeDeg: number;
  frameStepM: number;
  purlinStepMm: number;
  terrainType: string;
  windLoadKpa: number;
  snowLoadKpa: number;
  roofConstruction: string;
  minTopChordThicknessMm: number;
  minBottomChordThicknessMm: number;
  minBraceNoRidgeThicknessMm: number;
  minBraceThicknessMm: number;
  minWebThicknessMm: number;
  maxTopChordWidthMm: number;
  maxBottomChordWidthMm: number;
  minBraceNoRidgeWidthMm: number;
  minBraceWidthMm: number;
  minWebWidthMm: number;
}

export interface MolodechnoMemberResult {
  key: 'topChord' | 'bottomChord' | 'braceNoRidge' | 'brace' | 'web';
  title: string;
  profile: string | null;
  weightKg: number | null;
  utilization: number | null;
  governingCheck: string | null;
}

export interface MolodechnoResult {
  effectiveWindLoadKpa: number;
  effectiveSnowLoadKpa: number;
  climateSettlement: ClimateSettlement | null;
  braceCount: number | null;
  braceCountText: string | null;
  roofLoadKpa: number | null;
  members: MolodechnoMemberResult[];
  totalWeightKg: number | null;
  specificWeightKgM2: number | null;
  warnings: string[];
}
