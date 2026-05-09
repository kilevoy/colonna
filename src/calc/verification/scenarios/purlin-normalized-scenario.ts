import type { PurlinInput } from "../../purlin/types";
import type { PurlinInputs } from "../../velican/purlin-oracle";
import { getCassetteHeightFilter } from "../../purlin";

export interface NormalizedPurlinScenario {
  scenarioId: string;
  title: string;
  notes: string[];
  nativeInput: PurlinInput;
  nativeRolledInput: PurlinInput;
  oracleInput: PurlinInputs;
  inputMappingNotes: Record<string, string>;
}

const prices = {
  "С255Б": 150,
  "С355Б": 160,
  "С245": 160,
  "С345": 170,
};

export const purlinNormalizedScenario: NormalizedPurlinScenario = {
  scenarioId: "purlin-normalized-001",
  title: "Normalized 24 m roof purlin",
  notes: [
    "Native calculation uses explicit w0/Sg instead of city; city is oracle-only metadata.",
    "VELICAN purlin-oracle applies climate lookup by city before calculation; for Ufa the effective w0 is 0.3 kPa, so native explicit w0 is normalized to the same value.",
    "Native purlin input does not expose facade/fakhverk spacing, deck profile sheet, tie installation, brace step, channel prices, or separate LSTK prices.",
    "Native maxUtilization uses the same numeric cap as VELICAN for this scenario.",
  ],
  nativeInput: {
    materialType: "lstk",
    gamma_n: 1,
    roofShape: "gable",
    span_m: 24,
    length_m: 60,
    height_m: 12,
    roofSlope_deg: 6,
    framePitch_m: 6,
    terrainType: "B",
    w0_kPa: 0.3,
    Sg_kPa: 2.45,
    roofStructure: "С-П 150 мм",
    roofLoad_kPa: 0.32028,
    snowDrift: "none",
    drift_dropHeight_m: 4.5,
    drift_existingSize_m: 9.5,
    maxStep_mm: 1500,
    minStep_mm: 1500,
    snowGuardPurlin: false,
    fencePurlin: false,
    maxUtilization: 0.8,
    cassetteHeightFilter_mm: getCassetteHeightFilter("С-П 150 мм"),
    prices,
  },
  nativeRolledInput: {
    materialType: "rolled",
    gamma_n: 1,
    roofShape: "gable",
    span_m: 24,
    length_m: 60,
    height_m: 12,
    roofSlope_deg: 6,
    framePitch_m: 6,
    terrainType: "B",
    w0_kPa: 0.3,
    Sg_kPa: 2.45,
    roofStructure: "С-П 150 мм",
    roofLoad_kPa: 0.32028,
    snowDrift: "none",
    drift_dropHeight_m: 4.5,
    drift_existingSize_m: 9.5,
    maxStep_mm: 1500,
    minStep_mm: 1500,
    snowGuardPurlin: false,
    fencePurlin: false,
    maxUtilization: 0.8,
    cassetteHeightFilter_mm: 0,
    prices,
  },
  oracleInput: {
    city: "Уфа",
    responsibilityLevel: 1,
    roofType: "двускатная",
    buildingSpanM: 24,
    buildingLengthM: 60,
    buildingHeightM: 12,
    roofSlopeDeg: 6,
    frameStepM: 6,
    facadePostStepM: 6,
    terrainType: "В",
    windLoadKpa: 0.3,
    snowLoadKpa: 2.45,
    roofConstruction: "С-П 150 мм",
    deckProfile: "С44-1000-0,7",
    snowBag: "нет",
    heightDifferenceM: 4.5,
    existingBuildingSizeM: 9.5,
    maxStepMm: 1500,
    minStepMm: 1500,
    tieInstallation: "нет",
    snowRetentionPurlin: "нет",
    wallPurlin: "нет",
    braceStepM: 3,
    maxUtilization: 0.8,
    priceIbeamC255: 150,
    priceIbeamC355: 160,
    priceTubeC245: 160,
    priceTubeC345: 170,
    priceChannelC245: 170,
    priceChannelC345: 180,
  },
  inputMappingNotes: {
    city: "Native has no city field; w0/Sg are explicit. Oracle applies city climate lookup; this scenario uses Ufa effective w0/Sg.",
    terrainType: "Native uses Latin B; VELICAN workbook uses Cyrillic В.",
    deckProfile: "Native purlin type has no deck/profile sheet field.",
    tieInstallation: "Native purlin type has no tie installation field.",
    braceStep: "Native purlin type has no brace step field.",
    prices: "Native purlin prices are steel-grade based; oracle separates ibeam/tube/channel and hardcodes LSTK runtime prices.",
  },
};
