/** Common load computation for purlin calculators (LSTK + rolled). */
import { calcWind } from "../wind";
import type { PurlinInput, PurlinLoads, SnowDriftResult } from "./types";

/** Cassette filter map: roof structure name → required purlin h (mm). 0 = no filter. */
const CASSETTE_HEIGHT_MAP: Record<string, number> = {
  "наше 150 мм": 150,
  "наше 200 мм": 200,
  "наше 250 мм": 250,
  "наше 150 мм 1 слой ГВЛ": 150,
  "наше 200 мм 1 слой ГВЛ": 200,
  "наше 250 мм 1 слой ГВЛ": 250,
  "наше 150 мм 2 слоя ГВЛ": 150,
  "наше 200 мм 2 слоя ГВЛ": 200,
  "наше 250 мм 2 слоя ГВЛ": 250,
};

export function getCassetteHeightFilter(roofStructure: string): number {
  return CASSETTE_HEIGHT_MAP[roofStructure] ?? 0;
}

export function computeSnowDrift(input: PurlinInput): SnowDriftResult {
  const {
    snowDrift,
    span_m,
    length_m,
    drift_dropHeight_m: hDrop,
    drift_existingSize_m: bExist,
    Sg_kPa,
  } = input;
  if (snowDrift === "none") {
    return { mu2: 1, designSpan_m: span_m };
  }
  const dim = snowDrift === "along" ? span_m : length_m;
  const mu2_raw = hDrop > 0 ? 1 + (1 / hDrop) * (0.4 * dim + 0.4 * bExist) : 1;
  const cap = Math.min(Sg_kPa > 0 ? (2 * hDrop) / Sg_kPa : 4, 4);
  const mu2 = Math.min(mu2_raw, cap);
  const driftExtent =
    bExist === 0
      ? 2 * hDrop
      : mu2_raw <= cap
        ? Math.min(2 * hDrop, 16)
        : Math.min(
            ((mu2_raw - 1 + 0.8) / (cap - 1 + 0.8)) * 2 * hDrop,
            5 * hDrop,
            16,
          );
  const designSpan_m = snowDrift === "across" ? Math.ceil(driftExtent) : span_m;
  return { mu2, designSpan_m };
}

export function computeLoads(input: PurlinInput): PurlinLoads {
  const { mu2 } = computeSnowDrift(input);
  const cosAlpha = Math.cos((input.roofSlope_deg * Math.PI) / 180);
  const q_snow = 1.4 * 1.1 * 1.13 * mu2 * input.Sg_kPa * cosAlpha * input.gamma_n;
  const wind = calcWind(
    input.w0_kPa,
    input.terrainType,
    input.height_m,
    input.span_m,
    input.length_m,
  );
  const q_wind = wind.verticalRoof_kPa * input.gamma_n;
  const q_roof = input.roofLoad_kPa * input.gamma_n;
  return {
    q_snow_kPa: q_snow,
    q_windRoof_kPa: q_wind,
    q_roof_kPa: q_roof,
    q_total_kPa: q_snow + q_wind + q_roof,
  };
}
