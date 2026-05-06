import { purlinWorkbook } from './purlinWorkbook.generated';
import { climateSettlements } from '../shared/settlementsClimate.generated';
import { calculateInsiPurlinRaw } from './insiPurlinRuntime.generated';
import type { ClimateSettlement } from '../shared/climate-types';
import type { PurlinInputs, PurlinResult } from './purlinTypes';

export const purlinOptions = purlinWorkbook.options;
export const defaultPurlinInputs = purlinWorkbook.defaultScenario.inputs as PurlinInputs;
export const purlinClimateSettlements = climateSettlements;

function normalizeSettlementName(value: string): string {
  return value.trim().toLocaleLowerCase('ru-RU').replace(/ё/g, 'е');
}

export function findPurlinClimateSettlement(city: string): ClimateSettlement | null {
  const normalized = normalizeSettlementName(city);
  const matches = climateSettlements.filter((item) => normalizeSettlementName(item.settlement) === normalized);
  return matches.find((item) => normalizeSettlementName(item.region).startsWith('г.'))
    ?? matches.find((item) => item.sourceList === 'base-205')
    ?? matches[0]
    ?? null;
}

export function applyPurlinClimateLoads(inputs: PurlinInputs): PurlinInputs {
  const climateSettlement = findPurlinClimateSettlement(inputs.city);
  return {
    ...inputs,
    windLoadKpa: typeof climateSettlement?.w0Kpa === 'number' ? climateSettlement.w0Kpa : inputs.windLoadKpa,
    snowLoadKpa: typeof climateSettlement?.sgKpa === 'number' ? climateSettlement.sgKpa : inputs.snowLoadKpa,
  };
}

function normalizeNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && Math.abs(value) < 900_000_000_000 ? value : null;
}

function normalizeText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value);
  return text === '#N/A' ? null : text;
}

function toInsiInput(inputs: PurlinInputs) {
  const effective = applyPurlinClimateLoads(inputs);
  return {
    city: effective.city,
    normativeMode: 'по СП 20.13330.20ХХ',
    responsibilityLevel: String(effective.responsibilityLevel),
    roofType: effective.roofType,
    spanM: effective.buildingSpanM,
    buildingLengthM: effective.buildingLengthM,
    buildingHeightM: effective.buildingHeightM,
    roofSlopeDeg: effective.roofSlopeDeg,
    frameStepM: effective.frameStepM,
    fakhverkSpacingM: effective.facadePostStepM,
    terrainType: effective.terrainType,
    coveringType: effective.roofConstruction,
    profileSheet: effective.deckProfile,
    snowBagMode: effective.snowBag === 'поперёк здания' ? 'поперек здания' : effective.snowBag,
    heightDifferenceM: effective.heightDifferenceM,
    adjacentBuildingSizeM: effective.existingBuildingSizeM,
    manualMaxStepMm: effective.maxStepMm,
    manualMinStepMm: effective.minStepMm,
    maxUtilizationRatio: effective.maxUtilization,
    tiesSetting: String(effective.tieInstallation),
    braceSpacingM: effective.braceStepM,
    snowRetentionPurlin: String(effective.snowRetentionPurlin),
    barrierPurlin: String(effective.wallPurlin),
    iBeamS255PriceRubPerKg: effective.priceIbeamC255,
    iBeamS355PriceRubPerKg: effective.priceIbeamC355,
    tubeS245PriceRubPerKg: effective.priceTubeC245,
    tubeS345PriceRubPerKg: effective.priceTubeC345,
    channelS245PriceRubPerKg: effective.priceChannelC245,
    channelS345PriceRubPerKg: effective.priceChannelC345,
    lstkMp350PriceRubPerKg: 170,
    lstkMp390PriceRubPerKg: 170,
  };
}

export function calculatePurlin(inputs: PurlinInputs, _signal?: AbortSignal): Promise<PurlinResult> {
  const raw = calculateInsiPurlinRaw(toInsiInput(inputs)) as any;
  const effective = applyPurlinClimateLoads(inputs);
  const warnings = findPurlinClimateSettlement(inputs.city) ? [] : ['Город не найден в справочнике климата; снеговая и ветровая нагрузки задаются вручную.'];

  return Promise.resolve({
    calculatedSpanM: effective.buildingSpanM,
    roofLoadKpa: normalizeNumber(raw.loadSummary?.coveringKpa),
    mu2: normalizeNumber(raw.derivedContext?.snowBagFactor),
    snowBagLengthM: null,
    autoMaxStepMm: normalizeNumber(raw.autoMaxStepMm),
    loadAtMaxStepKpa: normalizeNumber(raw.loadSummary?.designTotalKpa),
    loadAtMaxStepKgM2: normalizeNumber(raw.loadSummary?.designTotalKpa) === null ? null : normalizeNumber(raw.loadSummary.designTotalKpa * 100),
    hotRolled: (raw.sortSteelTop10 ?? []).slice(0, 10).map((row: any, index: number) => ({
      number: index + 1,
      profile: normalizeText(row.profile),
      steel: normalizeText(row.steelGrade),
      stepMm: normalizeNumber(row.stepMm),
      weightKg: normalizeNumber(row.totalMassKg),
      costThousandRub: normalizeNumber(row.estimatedCostRub / 1000),
    })),
    mp350: (raw.lstkMp350Top ?? []).slice(0, 3).map((row: any, index: number) => ({
      number: index + 1,
      system: normalizeText(row.family ?? row.system),
      profile: normalizeText(row.profile),
      stepMm: normalizeNumber(row.stepMm),
      meterWeightKg: normalizeNumber(row.unitMassKg ?? row.unitMassKgPerM),
      stepWeightKg: normalizeNumber(row.stepMassKg),
      buildingWeightKg: normalizeNumber(row.totalMassKg),
      blackWeightKg: normalizeNumber(row.blackMassKg),
      galvanizedWeightKg: normalizeNumber(row.galvanizedMassKg),
      bracedWeightKg: normalizeNumber(row.massWithBracesKg ?? row.totalMassKg),
      lengthM: normalizeNumber(row.developedLengthM),
      singleMeterWeightKg: normalizeNumber(row.unitMassKg ?? row.unitMassKgPerM),
    })),
    mp390: (raw.lstkMp390Top ?? []).slice(0, 3).map((row: any, index: number) => ({
      number: index + 1,
      system: normalizeText(row.family ?? row.system),
      profile: normalizeText(row.profile),
      stepMm: normalizeNumber(row.stepMm),
      meterWeightKg: normalizeNumber(row.unitMassKg ?? row.unitMassKgPerM),
      stepWeightKg: normalizeNumber(row.stepMassKg),
      buildingWeightKg: normalizeNumber(row.totalMassKg),
      blackWeightKg: normalizeNumber(row.blackMassKg),
      galvanizedWeightKg: normalizeNumber(row.galvanizedMassKg),
      bracedWeightKg: normalizeNumber(row.massWithBracesKg ?? row.totalMassKg),
      lengthM: normalizeNumber(row.developedLengthM),
      singleMeterWeightKg: normalizeNumber(row.unitMassKg ?? row.unitMassKgPerM),
    })),
    warnings,
  });
}

export { purlinWorkbook };
