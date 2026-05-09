import { runRolledPurlinCalculation, enumerateRolledCandidates } from '../src/calc/purlin/rolled';
import { computeLoads } from '../src/calc/purlin/loads';
import profilesJson from '../src/data/profiles/profiles.json';

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

const loads = computeLoads(input);

// Debug: find кв.160х5
const profile = (profilesJson as any[]).find(p => p.name === 'кв.160х5');
console.log('Profile кв.160х5:', JSON.stringify(profile, null, 2));

const all = enumerateRolledCandidates(input, loads.q_total_kPa, 11.85);
const found = all.filter(c => c.profile.name === 'кв.160х5');
console.log('\nFound кв.160х5 candidates:', found.length);
for (const c of found.slice(0, 5)) {
  console.log('  ' + c.steel + ' ш=' + c.spacing_mm + ' Kmax=' + c.K_max + ' [' + c.limitingCheck + '] M=' + c.massPerBuilding_kg);
}

// Also find кв.160х4, кв.180х5
for (const name of ['кв.160х4', 'кв.180х5']) {
  const f = all.filter(c => c.profile.name === name);
  console.log('\nFound ' + name + ':', f.length);
  for (const c of f.slice(0, 3)) {
    console.log('  ' + c.steel + ' ш=' + c.spacing_mm + ' Kmax=' + c.K_max + ' [' + c.limitingCheck + ']');
  }
}

// Full top10
const out = runRolledPurlinCalculation(input, {...loads, mu2: 1, designSpan_m: 24}, 11.85);
console.log('\n=== Топ-10 ===');
for (let i = 0; i < Math.min(10, out.top10.length); i++) {
  const c = out.top10[i];
  console.log((i+1) + '. ' + c.profile.name + ' ' + c.steel + ' ш=' + c.spacing_mm + ' Kmax=' + c.K_max + ' [' + c.limitingCheck + '] M=' + c.massPerBuilding_kg);
}
