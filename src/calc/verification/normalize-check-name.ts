export function normalizeCheckName(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;

  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/σ/g, "sigm")
    .replace(/сигм/gi, "sigm")
    .toLocaleLowerCase("ru-RU");
}
