import { HyperFormula } from 'hyperformula';
import { columnWorkbook } from './columnWorkbook.generated';
import { climateSettlements } from '../shared/settlementsClimate.generated';
import type { ClimateSettlement } from '../shared/climate-types';
import type { ColumnInputs, ColumnOption, ColumnResult } from './columnTypes';

type SheetData = Record<string, (string | number | boolean | null)[][]>;

const SUMMARY_SHEET = 'Сводка';
const LICENSE_KEY = 'gpl-v3';
const SP20_WIND_STANDARD = 'по СП 20.13330.20ХХ';

export const columnOptions = columnWorkbook.options;
export const defaultColumnInputs = {
  ...(columnWorkbook.defaultScenario.inputs as ColumnInputs),
  windStandard: SP20_WIND_STANDARD,
};
export const columnClimateSettlements = climateSettlements;

const inputCells: Record<keyof ColumnInputs, string> = columnWorkbook.inputCells as Record<keyof ColumnInputs, string>;

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

export function findColumnClimateSettlement(city: string): ClimateSettlement | null {
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

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function textOrNull(value: unknown): string | null {
  const normalized = normalizeCellValue(value);
  return normalized === null ? null : String(normalized);
}

function cellValue(hf: HyperFormula, sheet: number, cell: string): string | number | null {
  return normalizeCellValue(hf.getCellValue(address(cell, sheet)));
}

function buildEngine(inputs: ColumnInputs): { hf: HyperFormula; summarySheet: number } {
  const hf = HyperFormula.buildFromSheets(columnWorkbook.sheets as unknown as SheetData, { licenseKey: LICENSE_KEY, useArrayArithmetic: true });
  const summarySheet = hf.getSheetId(SUMMARY_SHEET);
  if (summarySheet === undefined) throw new Error('Лист "Сводка" не найден в сгенерированной книге.');

  for (const [key, cell] of Object.entries(inputCells) as [keyof ColumnInputs, string][]) {
    hf.setCellContents(address(cell, summarySheet), [[inputs[key] as string | number]]);
  }
  hf.setCellContents(address('D19', summarySheet), [[SP20_WIND_STANDARD]]);

  return { hf, summarySheet };
}

function readOptions(hf: HyperFormula, sheet: number): ColumnOption[] {
  return Array.from({ length: 50 }, (_, index) => {
    const row = 63 + index;
    return {
      number: index + 1,
      profile: textOrNull(cellValue(hf, sheet, `B${row}`)),
      steel: textOrNull(cellValue(hf, sheet, `C${row}`)),
      utilization: numberOrNull(cellValue(hf, sheet, `D${row}`)),
      governingCheck: textOrNull(cellValue(hf, sheet, `E${row}`)),
      meterWeightKg: numberOrNull(cellValue(hf, sheet, `F${row}`)),
      columnWeightKg: numberOrNull(cellValue(hf, sheet, `G${row}`)),
      braceCount: numberOrNull(cellValue(hf, sheet, `H${row}`)),
      totalWeightKg: numberOrNull(cellValue(hf, sheet, `I${row}`)),
      costThousandRub: numberOrNull(cellValue(hf, sheet, `J${row}`)),
    };
  }).filter((item) => item.profile && item.profile !== '#ERROR');
}

export function calculateColumn(inputs: ColumnInputs): ColumnResult {
  const climateSettlement = findColumnClimateSettlement(inputs.city);
  const effectiveInputs = {
    ...inputs,
    windLoadKpa: typeof climateSettlement?.w0Kpa === 'number' ? climateSettlement.w0Kpa : inputs.windLoadKpa,
    snowLoadKpa: typeof climateSettlement?.sgKpa === 'number' ? climateSettlement.sgKpa : inputs.snowLoadKpa,
  };
  const { hf, summarySheet } = buildEngine(effectiveInputs);

  return {
    snowDesignKpa: numberOrNull(cellValue(hf, summarySheet, 'B24')),
    windDesignKpa: numberOrNull(cellValue(hf, summarySheet, 'B25')),
    windInternalKpa: numberOrNull(cellValue(hf, summarySheet, 'C25')),
    roofDesignKpa: numberOrNull(cellValue(hf, summarySheet, 'B26')),
    wallDesignKpa: numberOrNull(cellValue(hf, summarySheet, 'B27')),
    supportWheelLoadKn: numberOrNull(cellValue(hf, summarySheet, 'B36')),
    supportCraneGKn: numberOrNull(cellValue(hf, summarySheet, 'B44')),
    supportCraneTKn: numberOrNull(cellValue(hf, summarySheet, 'B45')),
    supportCraneMomentKnM: numberOrNull(cellValue(hf, summarySheet, 'B46')),
    normalForceKn: numberOrNull(cellValue(hf, summarySheet, 'B51')),
    baseMomentKnM: numberOrNull(cellValue(hf, summarySheet, 'B52')),
    momentFactor: numberOrNull(cellValue(hf, summarySheet, 'B53')),
    momentKnM: numberOrNull(cellValue(hf, summarySheet, 'B54')),
    effectiveWindLoadKpa: effectiveInputs.windLoadKpa,
    effectiveSnowLoadKpa: effectiveInputs.snowLoadKpa,
    climateSettlement,
    options: readOptions(hf, summarySheet),
    warnings: climateSettlement ? [] : ['Город не найден в справочнике климата; снеговая и ветровая нагрузки задаются вручную.'],
  };
}

export { columnWorkbook };
