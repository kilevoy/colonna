export interface PurlinInputs {
  city: string;
  responsibilityLevel: number;
  roofType: string;
  buildingSpanM: number;
  buildingLengthM: number;
  buildingHeightM: number;
  roofSlopeDeg: number;
  frameStepM: number;
  facadePostStepM: number;
  terrainType: string;
  windLoadKpa: number;
  snowLoadKpa: number;
  roofConstruction: string;
  deckProfile: string;
  snowBag: string;
  heightDifferenceM: number;
  existingBuildingSizeM: number;
  maxStepMm: number;
  minStepMm: number;
  tieInstallation: string;
  snowRetentionPurlin: string;
  wallPurlin: string;
  braceStepM: number;
  maxUtilization: number;
  priceIbeamC255: number;
  priceIbeamC355: number;
  priceTubeC245: number;
  priceTubeC345: number;
  priceChannelC245: number;
  priceChannelC345: number;
}

export interface PurlinHotRolledOption {
  number: number;
  profile: string | null;
  steel: string | null;
  stepMm: number | null;
  weightKg: number | null;
  costThousandRub: number | null;
}

export interface PurlinLstkOption {
  number: number;
  system: string | null;
  profile: string | null;
  stepMm: number | null;
  meterWeightKg: number | null;
  stepWeightKg: number | null;
  buildingWeightKg: number | null;
  blackWeightKg: number | null;
  galvanizedWeightKg: number | null;
  bracedWeightKg: number | null;
  lengthM: number | null;
  singleMeterWeightKg: number | null;
}

export interface PurlinResult {
  calculatedSpanM: number | null;
  roofLoadKpa: number | null;
  mu2: number | null;
  snowBagLengthM: number | null;
  autoMaxStepMm: number | null;
  loadAtMaxStepKpa: number | null;
  loadAtMaxStepKgM2: number | null;
  hotRolled: PurlinHotRolledOption[];
  mp350: PurlinLstkOption[];
  mp390: PurlinLstkOption[];
  warnings: string[];
}
