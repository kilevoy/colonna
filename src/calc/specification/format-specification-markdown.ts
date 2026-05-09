import type { BuildingSpecification } from "./types";

function formatNumber(value: number | null): string {
  return value === null ? "" : String(Number(value.toFixed(3)));
}

function formatText(value: string | null): string {
  return value ?? "";
}

export function formatSpecificationMarkdown(spec: BuildingSpecification): string {
  const rows = spec.items.map((item) =>
    [
      item.group,
      item.elementName,
      formatText(item.profile),
      formatText(item.steel),
      formatNumber(item.quantity),
      formatNumber(item.lengthM),
      formatNumber(item.totalLengthM ?? null),
      formatNumber(item.unitMassKg),
      formatNumber(item.totalMassKg),
      formatNumber(item.unitPriceRub),
      formatNumber(item.totalCostRub),
      item.calculationSource,
      item.status,
    ].join(" | "),
  );

  const lines = [
    "# Building Specification",
    "",
    `Project: ${spec.projectName}`,
    `Created at: ${spec.createdAt}`,
    "",
    "| Group | Element | Profile | Steel | Qty | Length m | Общая длина, м | Unit kg | Total kg | Unit price | Total cost | Source | Status |",
    "|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|---|",
    ...rows.map((row) => `| ${row} |`),
    "",
    "## Totals",
    "",
    `- Total mass: ${formatNumber(spec.totals.totalMassKg)} kg`,
    `- Total cost: ${formatNumber(spec.totals.totalCostRub)} rub`,
    `- Item count: ${spec.totals.itemCount}`,
    "",
    "## Warnings",
    "",
    ...(spec.warnings.length > 0 ? spec.warnings.map((warning) => `- ${warning}`) : ["- None"]),
  ];

  return lines.join("\n");
}
