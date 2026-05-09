import structuresJson from "../../data/structures/structures.json";

export interface EnvelopeConstructionOption {
  id: string;
  label: string;
  kPa: number;
}

interface StructureRow {
  id: string;
  kPa: number;
}

const envelopeConstructionOptions = (structuresJson as StructureRow[]).map((row) => ({
  id: row.id,
  label: row.id,
  kPa: row.kPa,
}));

export const roofConstructionOptions: EnvelopeConstructionOption[] = envelopeConstructionOptions;
export const wallConstructionOptions: EnvelopeConstructionOption[] = envelopeConstructionOptions;

function getConstructionLoadKpa(options: EnvelopeConstructionOption[], id: string): number | null {
  return options.find((option) => option.id === id)?.kPa ?? null;
}

export function getRoofConstructionLoadKpa(id: string): number | null {
  return getConstructionLoadKpa(roofConstructionOptions, id);
}

export function getWallConstructionLoadKpa(id: string): number | null {
  return getConstructionLoadKpa(wallConstructionOptions, id);
}
