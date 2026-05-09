import { runPurlinCalculation } from '../src/calc/purlin/index';
import { PurlinInput } from '../src/calc/purlin/types';
import * as fs from 'fs';

const prices: Record<"С255Б" | "С355Б" | "С245" | "С345", number> = {
  "С255Б": 75000,
  "С355Б": 85000,
  "С245": 70000,
  "С345": 82000,
};

function base(name: string, overrides: Partial<PurlinInput> & { materialType: "lstk" | "rolled" }): { name: string; input: PurlinInput } {
  const baseLstk: PurlinInput = {
    materialType: "lstk",
    gamma_n: 0.95,
    roofShape: "gable",
    span_m: 24,
    length_m: 72,
    height_m: 8,
    roofSlope_deg: 5,
    framePitch_m: 6,
    terrainType: "B",
    w0_kPa: 0.3,
    Sg_kPa: 1.5,
    roofStructure: "сэндвич 150 мм",
    roofLoad_kPa: 0.15,
    snowDrift: "none",
    drift_dropHeight_m: 0,
    drift_existingSize_m: 0,
    maxStep_mm: 1500,
    minStep_mm: 1000,
    snowGuardPurlin: false,
    fencePurlin: false,
    maxUtilization: "default",
    cassetteHeightFilter_mm: 0,
  };
  const baseRolled: PurlinInput = { ...baseLstk, materialType: "rolled", prices };
  const input = (overrides.materialType === "lstk" ? baseLstk : baseRolled);
  return { name, input: { ...input, ...overrides } as PurlinInput };
}

const scenarios = [
  // --- ЛСТК ---
  base("С1: ЛСТК, двускатная, снег 1.5, шаг 1500", { materialType: "lstk" }),
  base("С2: ЛСТК, односкатная, снег 2.4, along-занос", {
    materialType: "lstk",
    roofShape: "monoslope",
    span_m: 18,
    length_m: 60,
    height_m: 6,
    roofSlope_deg: 3,
    Sg_kPa: 2.4,
    roofLoad_kPa: 0.18,
    snowDrift: "along",
    drift_dropHeight_m: 3.0,
    snowGuardPurlin: true,
  }),
  base("С5: ЛСТК, террен A, 15м, ураган", {
    materialType: "lstk",
    span_m: 21,
    length_m: 60,
    height_m: 15,
    terrainType: "A",
    w0_kPa: 0.48,
    Sg_kPa: 0.8,
    roofLoad_kPa: 0.22,
  }),
  base("С6: ЛСТК, малый пролёт 6м, минимум материала", {
    materialType: "lstk",
    span_m: 6,
    length_m: 24,
    height_m: 4,
    roofSlope_deg: 3,
    framePitch_m: 6,
    Sg_kPa: 0.8,
    roofLoad_kPa: 0.12,
    maxStep_mm: 1800,
    minStep_mm: 1200,
  }),
  base("С7: ЛСТК, фильтр кассеты 150мм, снег 2.0", {
    materialType: "lstk",
    span_m: 18,
    length_m: 48,
    height_m: 6,
    Sg_kPa: 2.0,
    roofLoad_kPa: 0.18,
    cassetteHeightFilter_mm: 150,
  }),

  // --- Сортовой ---
  base("С3: Сортовой, двускат 30м, снег 1.8", {
    materialType: "rolled",
    span_m: 30,
    length_m: 84,
    height_m: 10,
    roofSlope_deg: 6,
    maxStep_mm: 1800,
    minStep_mm: 1200,
    Sg_kPa: 1.8,
  }),
  base("С4: Сортовой, across-занос, квадр.труба", {
    materialType: "rolled",
    span_m: 18,
    length_m: 36,
    height_m: 6,
    roofSlope_deg: 4,
    w0_kPa: 0.48,
    Sg_kPa: 2.4,
    roofLoad_kPa: 0.22,
    snowDrift: "across",
    drift_dropHeight_m: 2.5,
    snowGuardPurlin: true,
    fencePurlin: true,
  }),
  base("С8: Сортовой, террен C, широкий 30м, жёсткая проверка", {
    materialType: "rolled",
    span_m: 30,
    length_m: 60,
    height_m: 5,
    terrainType: "C",
    w0_kPa: 0.4,
    Sg_kPa: 0.5,
    roofLoad_kPa: 0.12,
    maxStep_mm: 1500,
    minStep_mm: 1000,
  }),
  base("С9: Сортовой, односкат 12м, сильный снег+ветер", {
    materialType: "rolled",
    roofShape: "monoslope",
    span_m: 12,
    length_m: 36,
    height_m: 5,
    roofSlope_deg: 6,
    terrainType: "B",
    w0_kPa: 0.48,
    Sg_kPa: 2.4,
    roofLoad_kPa: 0.18,
    snowDrift: "along",
    drift_dropHeight_m: 2.0,
  }),
  base("С10: Сортовой, across с existingSize 5м", {
    materialType: "rolled",
    span_m: 24,
    length_m: 72,
    height_m: 8,
    Sg_kPa: 2.0,
    snowDrift: "across",
    drift_dropHeight_m: 3.0,
    drift_existingSize_m: 5.0,
  }),
];

const results: any[] = [];

for (const sc of scenarios) {
  console.log("\n===============", sc.name, "===============");
  try {
    const out = runPurlinCalculation(sc.input);
    const isLstk = (out as any).sections && (out as any).sections[0] && 'type' in (out as any).sections[0];

    console.log("Нагрузки:");
    console.log(`  q_total_kPa = ${out.q_total_kPa}`);
    console.log(`  q_snow_kPa  = ${out.q_snow_kPa}`);
    console.log(`  q_wind_kPa  = ${out.q_windRoof_kPa}`);
    console.log(`  q_roof_kPa  = ${out.q_roof_kPa}`);
    console.log(`  mu2         = ${out.mu2}`);
    console.log(`  designSpan  = ${out.designSpan_m} м`);
    console.log(`  L_slope     = ${out.L_slope_m} м`);

    if (isLstk) {
      console.log("\nЛСТК лучшие по группам:");
      for (const sec of (out as any).sections) {
        const b = sec.best;
        if (b) {
          console.log(`  ${sec.grade} ${sec.type}: ${b.profile.name} (шаг ${b.spacing_mm} мм, K=${b.K}, масса здания ${b.massPerBuilding_kg} кг)`);
        } else {
          console.log(`  ${sec.grade} ${sec.type}: — нет решения —`);
        }
      }
    } else {
      console.log("\nСортовой прокат лучшие по группам:");
      for (const sec of (out as any).sections) {
        const b = sec.best;
        if (b) {
          console.log(`  ${sec.steel} ${sec.category}: ${b.profile.name} (шаг ${b.spacing_mm} мм, Kmax=${b.K_max}, лимит=${b.limitingCheck}, масса ${b.massPerBuilding_kg} кг)`);
        } else {
          console.log(`  ${sec.steel} ${sec.category}: — нет решения —`);
        }
      }
    }

    results.push({ scenario: sc.name, input: sc.input, output: out });
  } catch (e) {
    console.error("ОШИБКА:", e);
    results.push({ scenario: sc.name, input: sc.input, error: String(e) });
  }
}

fs.writeFileSync('./scripts/purlin_test_results_full.json', JSON.stringify(results, null, 2), 'utf-8');
console.log("\n✅ JSON written to ./scripts/purlin_test_results_full.json");
