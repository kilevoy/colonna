import type { ProjectBlockCalculationSource } from "../project";

export type SpecificationGroup =
  | "columns"
  | "trusses"
  | "purlins"
  | "craneBeams"
  | "windowRiegels"
  | "beamCells"
  | "misc";

export type SpecificationItemStatus = "ok" | "warning" | "missing";

export interface SpecificationItem {
  id: string;
  group: SpecificationGroup;
  elementName: string;
  profile: string | null;
  steel: string | null;
  quantity: number | null;
  lengthM: number | null;
  totalLengthM?: number | null;
  unitMassKg: number | null;
  totalMassKg: number | null;
  unitPriceRub: number | null;
  totalCostRub: number | null;
  sourceBlock: string;
  calculationSource: ProjectBlockCalculationSource | "manual";
  status: SpecificationItemStatus;
  notes: string[];
  warnings: string[];
}

export interface BuildingSpecificationTotals {
  totalMassKg: number;
  totalCostRub: number;
  massByGroup: Partial<Record<SpecificationGroup, number>>;
  costByGroup: Partial<Record<SpecificationGroup, number>>;
  itemCount: number;
}

export interface BuildingSpecification {
  projectName: string;
  createdAt: string;
  items: SpecificationItem[];
  totals: BuildingSpecificationTotals;
  warnings: string[];
  mappingNotes: string[];
}
