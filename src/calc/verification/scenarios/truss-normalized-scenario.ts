import type { TrussInput } from "../../truss/types";
import type { MolodechnoInputs } from "../../velican/molodechno-oracle";
import { getDefaultMinThickness } from "../../truss/engine";

export interface NormalizedTrussScenario {
  scenarioId: string;
  title: string;
  notes: string[];
  nativeInput: TrussInput;
  oracleInput: MolodechnoInputs;
  inputMappingNotes: Record<string, string>;
}

export const trussNormalizedScenario: NormalizedTrussScenario = {
  scenarioId: "truss-normalized-001",
  title: "Normalized 24 m roof truss",
  notes: [
    "Native calculation uses explicit w0/Sg instead of city; city is oracle-only metadata.",
    "VELICAN Molodechno input uses roofConstruction name instead of direct numeric covering load.",
  ],
  nativeInput: {
    height_m: 12,
    span_m: 24,
    length_m: 30,
    framePitch_m: 6,
    purlinPitch_mm: 0,
    roofSlope_deg: 6,
    responsibilityCoeff: 1,
    terrainType: "B",
    w0_kPa: 0.3,
    Sg_kPa: 1.2,
    roofStructure: "наше 250 мм",
    roofLoad_kPa: 0.24,
    loadAddition_pct: 15,
    maxUtilization: 0.85,
    minThickness_mm: getDefaultMinThickness(),
    maxWidth_mm: { VP: 500, NP: 500 },
    minWidth_mm: { ORb: 80, OR: 80, RR: 60 },
  },
  oracleInput: {
    city: "челябинск",
    responsibilityLevel: 1,
    spanM: 24,
    buildingLengthM: 30,
    buildingHeightM: 12,
    roofSlopeDeg: 6,
    frameStepM: 6,
    purlinStepMm: 0,
    terrainType: "В",
    windLoadKpa: 0.3,
    snowLoadKpa: 1.2,
    roofConstruction: "наше 250 мм",
    minTopChordThicknessMm: 4,
    minBottomChordThicknessMm: 4,
    minBraceNoRidgeThicknessMm: 4,
    minBraceThicknessMm: 4,
    minWebThicknessMm: 3,
    maxTopChordWidthMm: 500,
    maxBottomChordWidthMm: 500,
    minBraceNoRidgeWidthMm: 80,
    minBraceWidthMm: 80,
    minWebWidthMm: 60,
  },
  inputMappingNotes: {
    city: "Native has no city field; w0/Sg are explicit.",
    terrainType: "Native uses Latin B; VELICAN workbook uses Cyrillic В.",
    roofConstruction: "Native keeps numeric roofLoad_kPa and label; oracle uses label.",
  },
};
