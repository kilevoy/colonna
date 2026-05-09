import { runPurlinCalculation } from '../src/calc/purlin/index.ts';

const f2 = n => n.toFixed(2);
const f4 = n => n.toFixed(4);

const scenarios = [
  {
    name: "Сценарий 1: ЛСТК, двускатная, Челябинск, снег 1.5, шаг 1500",
    input: {
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
    },
  },
  {
    name: "Сценарий 2: ЛСТК, односкатная, снег 2.4, снегозанос along",
    input: {
      materialType: "lstk",
      gamma_n: 0.95,
      roofShape: "monoslope",
      span_m: 18,
      length_m: 60,
      height_m: 6,
      roofSlope_deg: 3,
      framePitch_m: 6,
      terrainType: "B",
      w0_kPa: 0.3,
      Sg_kPa: 2.4,
      roofStructure: "сэндвич 200 мм",
      roofLoad_kPa: 0.18,
      snowDrift: "along",
      drift_dropHeight_m: 3.0,
      drift_existingSize_m: 0,
      maxStep_mm: 1500,
      minStep_mm: 1000,
      snowGuardPurlin: true,
      fencePurlin: false,
      maxUtilization: "default",
      cassetteHeightFilter_mm: 0,
    },
  },
  {
    name: "Сценарий 3: Сортовой, двускатная, широкий пролёт 30м, С255Б",
    input: {
      materialType: "rolled",
      gamma_n: 0.95,
      roofShape: "gable",
      span_m: 30,
      length_m: 84,
      height_m: 10,
      roofSlope_deg: 6,
      framePitch_m: 6,
      terrainType: "B",
      w0_kPa: 0.3,
      Sg_kPa: 1.8,
      roofStructure: "сэндвич 150 мм",
      roofLoad_kPa: 0.15,
      snowDrift: "none",
      drift_dropHeight_m: 0,
      drift_existingSize_m: 0,
      maxStep_mm: 1800,
      minStep_mm: 1200,
      snowGuardPurlin: false,
      fencePurlin: false,
      maxUtilization: "default",
      cassetteHeightFilter_mm: 0,
    },
  },
  {
    name: "Сценарий 4: Сортовой, across занос, труба квадратная",
    input: {
      materialType: "rolled",
      gamma_n: 0.95,
      roofShape: "gable",
      span_m: 18,
      length_m: 36,
      height_m: 6,
      roofSlope_deg: 4,
      framePitch_m: 6,
      terrainType: "B",
      w0_kPa: 0.48,
      Sg_kPa: 2.4,
      roofStructure: "сэндвич 250 мм",
      roofLoad_kPa: 0.22,
      snowDrift: "across",
      drift_dropHeight_m: 2.5,
      drift_existingSize_m: 0,
      maxStep_mm: 1500,
      minStep_mm: 1000,
      snowGuardPurlin: true,
      fencePurlin: true,
      maxUtilization: "default",
      cassetteHeightFilter_mm: 0,
    },
  },
  {
    name: "Сценарий 5: ЛСТК, террен A, высота 15м, ураганный ветер",
    input: {
      materialType: "lstk",
      gamma_n: 0.95,
      roofShape: "gable",
      span_m: 21,
      length_m: 60,
      height_m: 15,
      roofSlope_deg: 5,
      framePitch_m: 6,
      terrainType: "A",
      w0_kPa: 0.48,
      Sg_kPa: 0.8,
      roofStructure: "сэндвич 250 мм",
      roofLoad_kPa: 0.22,
      snowDrift: "none",
      drift_dropHeight_m: 0,
      drift_existingSize_m: 0,
      maxStep_mm: 1500,
      minStep_mm: 1000,
      snowGuardPurlin: false,
      fencePurlin: false,
      maxUtilization: "default",
      cassetteHeightFilter_mm: 0,
    },
  },
];

for (const sc of scenarios) {
  console.log("\n===============", sc.name, "===============");
  try {
    const out = runPurlinCalculation(sc.input);
    console.log("Нагрузки:");
    console.log(`  q_total_kPa = ${f4(out.q_total_kPa)}`);
    console.log(`  q_snow_kPa  = ${f4(out.q_snow_kPa)}`);
    console.log(`  q_wind_kPa  = ${f4(out.q_windRoof_kPa)}`);
    console.log(`  q_roof_kPa  = ${f4(out.q_roof_kPa)}`);
    console.log(`  mu2         = ${f4(out.mu2)}`);
    console.log(`  designSpan  = ${f2(out.designSpan_m)} м`);
    console.log(`  L_slope     = ${f2(out.L_slope_m)} м`);

    const firstSection = out.sections ? out.sections[0] : null;
    if (firstSection && 'type' in firstSection) {
      console.log("\nЛСТК лучшие по группам:");
      for (const sec of out.sections) {
        const b = sec.best;
        if (b) {
          console.log(`  ${sec.grade} ${sec.type}: ${b.profile.name} (шаг ${b.spacing_mm} мм, K=${f4(b.K)}, масса здания ${f2(b.massPerBuilding_kg)} кг)`);
        } else {
          console.log(`  ${sec.grade} ${sec.type}: — нет решения —`);
        }
      }
      const t = out.top10;
      if (t && t.length > 0) {
        console.log(`\nТоп-3 по массе здания:`);
        for (let i = 0; i < Math.min(3, t.length); i++) {
          const c = t[i];
          console.log(`  ${i+1}. ${c.profile.name} ${c.profile.type} γn:${c.profile.default_coef} шаг=${c.spacing_mm} K=${f4(c.K)} масса=${f2(c.massPerBuilding_kg)} кг`);
        }
      }
    } else {
      console.log("\nСортовой прокат лучшие по группам:");
      for (const sec of out.sections || []) {
        const b = sec.best;
        if (b) {
          console.log(`  ${sec.steel} ${sec.category}: ${b.profile.name} (шаг ${b.spacing_mm} мм, Kmax=${f4(b.K_max)}, лимит=${b.limitingCheck}, масса ${f2(b.massPerBuilding_kg)} кг)`);
        } else {
          console.log(`  ${sec.steel} ${sec.category}: — нет решения —`);
        }
      }
      const t = out.top10;
      if (t && t.length > 0) {
        console.log(`\nТоп-3 по массе здания:`);
        for (let i = 0; i < Math.min(3, t.length); i++) {
          const c = t[i];
          console.log(`  ${i+1}. ${c.profile.name} ${c.steel} шаг=${c.spacing_mm} Kmax=${f4(c.K_max)} [${c.limitingCheck}] масса=${f2(c.massPerBuilding_kg)} кг`);
        }
      }
    }
  } catch (e) {
    console.error("ОШИБКА:", e);
  }
}
