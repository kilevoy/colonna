import { HyperFormula } from 'hyperformula';
import { molodechnoWorkbook } from './molodechnoWorkbook.generated';
import { climateSettlements } from '../shared/settlementsClimate.generated';
import type { ClimateSettlement } from '../shared/climate-types';
import type { MolodechnoInputs, MolodechnoMemberResult, MolodechnoResult } from './molodechnoTypes';

type SheetData = Record<string, (string | number | boolean | null)[][]>;

const SUMMARY_SHEET = 'Лист1';
const LICENSE_KEY = 'gpl-v3';
const SP20_WIND_STANDARD = 'по СП 20.13330.20ХХ';

export const molodechnoOptions = molodechnoWorkbook.options;
export const defaultMolodechnoInputs = molodechnoWorkbook.defaultScenario.inputs as MolodechnoInputs;
export const molodechnoClimateSettlements = climateSettlements;

const inputCells: Record<keyof MolodechnoInputs, string> = molodechnoWorkbook.inputCells as Record<keyof MolodechnoInputs, string>;

function colToIndex(col: string): number {
  return col.split('').reduce((sum, char) => sum * 26 + char.charCodeAt(0) - 64, 0) - 1;
}

function address(cell: string, sheet: number) {
  const match = /^([A-Z]+)(\d+)$/.exec(cell);
  if (!match) throw new Error(`Unsupported cell address: ${cell}`);
  return { sheet, col: colToIndex(match[1]), row: Number(match[2]) - 1 };
}

function normalizeSettlementName(value: string): string {
  return value.trim().toLocaleLowerCase('ru-RU').replace(/ё/g, 'е');
}

export function findMolodechnoClimateSettlement(city: string): ClimateSettlement | null {
  const normalized = normalizeSettlementName(city);
  const matches = climateSettlements.filter((item) => normalizeSettlementName(item.settlement) === normalized);
  return matches.find((item) => normalizeSettlementName(item.region).startsWith('г.'))
    ?? matches.find((item) => item.sourceList === 'base-205')
    ?? matches[0]
    ?? null;
}

function normalizeCellValue(value: unknown): string | number | null {
  if (value === undefined || value === null) return null;
  if (typeof value === 'object') return String((value as { value?: string }).value ?? '#ERROR');
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') return value;
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  return String(value);
}

function normalizeNumber(value: number): number {
  return value > 900_000_000_000 && value < 1_100_000_000_000 ? 999_999_999_999 : value;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? normalizeNumber(value) : null;
}

function textOrNull(value: unknown): string | null {
  const normalized = normalizeCellValue(value);
  return normalized === null ? null : String(normalized);
}

function cellValue(hf: HyperFormula, sheet: number, cell: string): string | number | null {
  return normalizeCellValue(hf.getCellValue(address(cell, sheet)));
}

function buildEngine(inputs: MolodechnoInputs): { hf: HyperFormula; summarySheet: number } {
  const hf = HyperFormula.buildFromSheets(molodechnoWorkbook.sheets as unknown as SheetData, { licenseKey: LICENSE_KEY, useArrayArithmetic: true });
  const summarySheet = hf.getSheetId(SUMMARY_SHEET);
  if (summarySheet === undefined) throw new Error('Лист "Лист1" не найден в сгенерированной книге.');

  for (const [key, cell] of Object.entries(inputCells) as [keyof MolodechnoInputs, string][]) {
    hf.setCellContents(address(cell, summarySheet), [[inputs[key] as string | number]]);
  }
  hf.setCellContents(address('D17', summarySheet), [[SP20_WIND_STANDARD]]);

  return { hf, summarySheet };
}

function readMember(hf: HyperFormula, sheet: number, key: MolodechnoMemberResult['key'], title: string, row: number): MolodechnoMemberResult {
  return {
    key,
    title,
    profile: textOrNull(cellValue(hf, sheet, `B${row}`)),
    weightKg: numberOrNull(cellValue(hf, sheet, `C${row}`)),
    utilization: numberOrNull(cellValue(hf, sheet, `D${row}`)),
    governingCheck: textOrNull(cellValue(hf, sheet, `E${row}`)),
  };
}

export function calculateMolodechno(inputs: MolodechnoInputs): MolodechnoResult {
  const climateSettlement = findMolodechnoClimateSettlement(inputs.city);
  const effectiveInputs = {
    ...inputs,
    windLoadKpa: typeof climateSettlement?.w0Kpa === 'number' ? climateSettlement.w0Kpa : inputs.windLoadKpa,
    snowLoadKpa: typeof climateSettlement?.sgKpa === 'number' ? climateSettlement.sgKpa : inputs.snowLoadKpa,
  };
  const { hf, summarySheet } = buildEngine(effectiveInputs);
  const braceCountValue = cellValue(hf, summarySheet, 'B13');
  const members = [
    readMember(hf, summarySheet, 'topChord', 'Верхний пояс', 41),
    readMember(hf, summarySheet, 'bottomChord', 'Нижний пояс', 45),
    readMember(hf, summarySheet, 'braceNoRidge', 'Опорный раскос без распорки', 49),
    readMember(hf, summarySheet, 'brace', 'Опорный раскос', 53),
    readMember(hf, summarySheet, 'web', 'Решетка', 57),
  ];
  const hasSentinelWeight = members.some((member) => member.weightKg === 999_999_999_999);
  const totalWeightKg = hasSentinelWeight
    ? members.reduce((sum, member) => sum + (member.weightKg ?? 0), 0) + 2 * 2 * 4.81
    : numberOrNull(cellValue(hf, summarySheet, 'B59'));
  const specificWeightKgM2 = hasSentinelWeight && totalWeightKg !== null
    ? totalWeightKg / (effectiveInputs.spanM * effectiveInputs.frameStepM)
    : numberOrNull(cellValue(hf, summarySheet, 'B60'));

  return {
    effectiveWindLoadKpa: effectiveInputs.windLoadKpa,
    effectiveSnowLoadKpa: effectiveInputs.snowLoadKpa,
    climateSettlement,
    braceCount: numberOrNull(braceCountValue),
    braceCountText: textOrNull(braceCountValue),
    roofLoadKpa: numberOrNull(cellValue(hf, summarySheet, 'D19')),
    members,
    totalWeightKg,
    specificWeightKgM2,
    warnings: climateSettlement ? [] : ['Город не найден в справочнике климата; снеговая и ветровая нагрузки задаются вручную.'],
  };
}

export { molodechnoWorkbook };
