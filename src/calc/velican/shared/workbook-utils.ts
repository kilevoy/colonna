export type VelicanSheetData = Record<string, (string | number | boolean | null)[][]>;

export const VELICAN_HYPERFORMULA_LICENSE_KEY = "gpl-v3";

export function colToIndex(col: string): number {
  return col.split("").reduce((sum, char) => sum * 26 + char.charCodeAt(0) - 64, 0) - 1;
}

export function address(cell: string, sheet: number) {
  const match = /^([A-Z]+)(\d+)$/.exec(cell);
  if (!match) throw new Error(`Unsupported cell address: ${cell}`);
  return { sheet, col: colToIndex(match[1]), row: Number(match[2]) - 1 };
}

export function normalizeCellValue(value: unknown): string | number | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "object") return String((value as { value?: string }).value ?? "#ERROR");
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  return String(value);
}

export function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function normalizeSettlementName(value: string): string {
  return value.trim().toLocaleLowerCase("ru-RU").replace(/ё/g, "е");
}
