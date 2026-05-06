import type { CalculationInput } from "../../types";
import type { ColumnInputs } from "../../velican/column-oracle";

export interface NormalizedColumnScenario {
  scenarioId: string;
  title: string;
  notes: string[];
  nativeInput: CalculationInput;
  oracleInput: ColumnInputs;
  inputMappingNotes: Record<string, string>;
}

export const columnNormalizedScenario: NormalizedColumnScenario = {
  scenarioId: "column-normalized-001",
  title: "Normalized fachwerk column without cranes",
  notes: [
    "Native calculation uses explicit w0/Sg instead of city; city is oracle-only metadata.",
    "VELICAN resolves Petrozavodsk climate to effective w0=0.3 kPa and Sg=1.7 kPa; native uses those effective values explicitly.",
    "Roof and wall loads are aligned numerically in native and by workbook construction names in oracle.",
    "Crane modes are disabled on both sides; crane capacity and rail metadata remain oracle workbook metadata.",
  ],
  nativeInput: {
    height_m: 11.5,
    span_m: 40,
    length_m: 80,
    framePitch_m: 6,
    fachverkPitch_m: 6,
    roofSlope_deg: 6,
    roofType: "gable",
    spanCount: "single",
    perimeterTies: false,
    columnType: "fachwerk",
    responsibilityCoeff: 1,
    terrainType: "B",
    w0_kPa: 0.3,
    Sg_kPa: 1.7,
    roofStructure: "профлист",
    roofLoad_kPa: 0.105,
    wallStructure: "профлист",
    wallLoad_kPa: 0.105,
    loadAddition_pct: 15,
    overheadCrane: {
      enabled: false,
      capacity: "5",
      span_m: 42,
      count: "one",
      singleSpan: true,
      railLevel_m: 3.5,
      wheelLoad_kN: 0,
      base_m: 0,
      gauge_m: 0,
    },
    suspendedCrane: {
      enabled: false,
      capacity_t: 2,
      singleSpan: true,
    },
    prices: {
      "С255Б": 148.8,
      "С355Б": 155.88,
      "С245": 130.2,
      "С345": 141,
    },
  },
  oracleInput: {
    city: "Петрозаводск",
    responsibilityLevel: 1,
    roofType: "двускатная",
    buildingSpanM: 40,
    buildingLengthM: 80,
    buildingHeightM: 11.5,
    roofSlopeDeg: 6,
    frameStepM: 6,
    facadePostStepM: 6,
    spanCount: "один",
    perimeterBracing: "нет",
    terrainType: "В",
    windLoadKpa: 0.6,
    snowLoadKpa: 1.7,
    roofConstruction: "профлист",
    wallConstruction: "профлист",
    supportCrane: "нет",
    supportCraneSingleSpan: "да",
    supportCraneCapacityT: 5,
    supportCraneSpanM: 42,
    supportCraneCount: "один",
    railTopMarkM: 3.5,
    suspensionCrane: "нет",
    suspensionCraneSingleSpan: "да",
    suspensionCraneCapacityT: 2,
    columnType: "фахверковая",
    loadAllowancePercent: 15,
    priceIbeamC255: 148.8,
    priceIbeamC355: 155.88,
    priceTubeC245: 130.2,
    priceTubeC345: 141,
  },
  inputMappingNotes: {
    city: "Native has no city field; w0/Sg are explicit. Oracle city Petrozavodsk overrides windLoadKpa=0.6 to effective w0=0.3.",
    terrainType: "Native uses Latin A/B/C; VELICAN workbook uses Cyrillic А/В/С.",
    roofType: "Native enum gable maps to workbook text двускатная.",
    roofConstruction: "Native uses numeric roofLoad_kPa plus label; oracle uses workbook construction name.",
    wallConstruction: "Native uses numeric wallLoad_kPa plus label; oracle uses workbook construction name.",
  },
};
