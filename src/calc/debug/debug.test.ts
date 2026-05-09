import { describe, expect, it } from "vitest";
import { runColumnCalculationWithDebug } from "./column-debug";
import { runPurlinCalculationWithDebug } from "./purlin-debug";
import { runTrussCalculationWithDebug } from "./truss-debug";
import { getCassetteHeightFilter } from "../purlin";
import { getDefaultMinThickness } from "../truss/engine";
import type { CalculationInput } from "../types";
import type { PurlinInput } from "../purlin/types";
import type { TrussInput } from "../truss/types";

const columnInput: CalculationInput = {
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
  w0_kPa: 0.6,
  Sg_kPa: 1.7,
  roofStructure: "test",
  roofLoad_kPa: 0.105,
  wallStructure: "test",
  wallLoad_kPa: 0.105,
  loadAddition_pct: 15,
  overheadCrane: {
    enabled: false,
    capacity: "5",
    span_m: 12,
    count: "one",
    singleSpan: true,
    railLevel_m: 6,
    wheelLoad_kN: 0,
    base_m: 0,
    gauge_m: 0,
  },
  suspendedCrane: {
    enabled: false,
    capacity_t: 0,
    singleSpan: true,
  },
  prices: {
    "С255Б": 148.8,
    "С355Б": 155.88,
    "С245": 130.2,
    "С345": 141,
  },
};

const trussInput: TrussInput = {
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
  roofStructure: "test",
  roofLoad_kPa: 0.24,
  loadAddition_pct: 15,
  maxUtilization: 0.85,
  minThickness_mm: getDefaultMinThickness(),
  maxWidth_mm: { VP: 500, NP: 500 },
  minWidth_mm: { ORb: 80, OR: 80, RR: 60 },
};

const purlinInput: PurlinInput = {
  materialType: "lstk",
  gamma_n: 1,
  roofShape: "gable",
  span_m: 24,
  length_m: 60,
  height_m: 12,
  roofSlope_deg: 6,
  framePitch_m: 6,
  terrainType: "B",
  w0_kPa: 0.6,
  Sg_kPa: 2.45,
  roofStructure: "РЎ-Рџ 150 РјРј",
  roofLoad_kPa: 0.32028,
  snowDrift: "none",
  drift_dropHeight_m: 4.5,
  drift_existingSize_m: 9.5,
  maxStep_mm: 1500,
  minStep_mm: 500,
  snowGuardPurlin: false,
  fencePurlin: false,
  maxUtilization: "default",
  cassetteHeightFilter_mm: getCassetteHeightFilter("РЎ-Рџ 150 РјРј"),
};

describe("debug calculation wrappers", () => {
  it("returns column calculation debug values", () => {
    const result = runColumnCalculationWithDebug(columnInput);

    expect(result.final_N_kN).toBeGreaterThan(0);
    expect(result.final_M_kNm).toBeGreaterThan(0);
    expect(result.mu).toBeGreaterThan(0);
    expect(result.topCandidateProfile).toEqual(expect.any(String));
  });

  it("does not throw for truss debug", () => {
    const result = runTrussCalculationWithDebug(trussInput);

    expect(result.totalMassKg).toBeGreaterThan(0);
    expect(result.selectedProfiles.VP).toEqual(expect.any(String));
  });

  it("does not throw for purlin debug", () => {
    const result = runPurlinCalculationWithDebug(purlinInput);

    expect(result.loads.q_total_kPa).toBeGreaterThan(0);
    expect(result.topCandidateProfile).toEqual(expect.any(String));
  });
});
