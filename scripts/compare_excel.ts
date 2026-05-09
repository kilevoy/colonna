import { runPurlinCalculation } from '../src/calc/purlin/index';

const input = {
  materialType: 'rolled' as const,
  gamma_n: 1.0,
  roofShape: 'gable' as const,
  span_m: 24,
  length_m: 60,
  height_m: 12,
  roofSlope_deg: 6,
  framePitch_m: 6,
  terrainType: 'B' as const,
  w0_kPa: 0.6,
  Sg_kPa: 2.45,
  roofStructure: 'сэндвич 150 мм',
  roofLoad_kPa: 0.32028,
  snowDrift: 'none' as const,
  drift_dropHeight_m: 0,
  drift_existingSize_m: 0,
  maxStep_mm: 1500,
  minStep_mm: 1000,
  snowGuardPurlin: false,
  fencePurlin: false,
  maxUtilization: 0.8,
  cassetteHeightFilter_mm: 0,
};

const out = runPurlinCalculation(input);
console.log('=== Мой код (γn=1.0, maxUtil=0.8) ===');
console.log('q_total =', out.q_total_kPa);
const t = (out as any).top10;
console.log('\nТоп-10 сортовой:');
for (let i = 0; i < Math.min(10, t.length); i++) {
  const c = t[i];
  console.log((i+1) + '. ' + c.profile.name + ' ' + c.steel + ' ш=' + c.spacing_mm + ' Kmax=' + c.K_max + ' [' + c.limitingCheck + '] M=' + c.massPerBuilding_kg + ' кг');
}
