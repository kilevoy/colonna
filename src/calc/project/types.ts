import type { CalculationInput, CalculationOutput, RoofType, SpanCount, TerrainType } from "../types";
import type { TrussInput, TrussOutput } from "../truss/types";
import type { PurlinInput, PurlinOutput, SnowDriftMode } from "../purlin";
import type { CraneBeamInput, CraneBeamResult } from "../crane-beam";
import type { WindowRiegelInput, WindowRiegelResult } from "../window-riegel";
import type { BeamCellInput, BeamCellResult } from "../beam-cell";
import type { PurlinAlternativesSummary } from "../purlin-layout";

export type PurlinSystemPreference = "auto" | "sortSteel" | "mp350" | "mp390";
export type ProjectRoofShape = "gable" | "singleSlope";
export type ProjectBuildingSystem = "velikan";
export type ProjectBuildingEnvelope = "cold" | "warm";
export type ProjectOpeningType = "window" | "door" | "gate";
export type ProjectDesignCostMethod = "perArea" | "fixed";
export type ProjectRoofDrainage = "external" | "internal" | "notSpecified";

export interface ProjectOpeningItem {
  id: string;
  type: ProjectOpeningType;
  widthM: number;
  heightM: number;
  quantity: number;
  facade?: string;
  comment?: string;
}

export interface ProjectOpenings {
  windows: ProjectOpeningItem[];
  doors: ProjectOpeningItem[];
  gates: ProjectOpeningItem[];
}

export interface ProjectDesignCost {
  enabled: boolean;
  method: ProjectDesignCostMethod;
  pricePerM2Rub: number;
  fixedRub: number;
}

export interface ProjectInput {
  projectInfo: {
    name: string;
    buildingSystem?: ProjectBuildingSystem;
    buildingEnvelope?: ProjectBuildingEnvelope;
    customer?: string;
    city?: string;
    notes?: string;
  };
  climate: {
    city?: string;
    windLoadKpa: number;
    snowLoadKpa: number;
    terrainType: TerrainType;
    responsibilityLevel?: string | number;
    responsibilityCoeff: number;
  };
  geometry: {
    buildingSpanM: number;
    buildingLengthM: number;
    buildingHeightM: number;
    roofSlopeDeg: number;
    spanCount: SpanCount;
    frameStepM: number;
    facadePostStepM: number;
    columnHeightM: number;
    craneRailLevelM: number;
  };
  roof: {
    roofType: RoofType;
    roofShape?: ProjectRoofShape;
    drainage?: ProjectRoofDrainage;
    roofConstruction: string;
    roofLoadKpa: number;
    useManualRoofLoad: boolean;
    deckProfile?: string;
    snowBagMode?: SnowDriftMode;
    snowRetentionPurlin: boolean;
    barrierPurlin: boolean;
  };
  walls: {
    wallConstruction: string;
    wallLoadKpa: number;
    useManualWallLoad: boolean;
    openingWidthM?: number;
    openingHeightM?: number;
    windowType?: number;
  };
  openings?: ProjectOpenings;
  cranes: {
    supportCrane: {
      enabled: boolean;
      capacityT: number | string;
      count: "one" | "two";
      craneSpanM: number;
      beamSpanM: number;
      railLevelM: number;
      wheelCount: number;
      wheelBaseM: number;
      maxWheelLoadKn: number;
      trolleyWeightT: number;
      craneWeightT: number;
      railType: string;
      dutyGroup: string;
    };
    hangingCrane: {
      enabled: boolean;
      capacityT: number;
      count: number;
    };
  };
  materials: {
    columnSteel?: string;
    trussSteel?: string;
    purlinSteel?: string;
    craneBeamSteel?: string;
    windowRiegelSteel?: string;
    beamCellSteel?: string;
  };
  prices: {
    iBeamC245RubPerTon: number;
    iBeamC345RubPerTon: number;
    tubeC245RubPerTon: number;
    tubeC345RubPerTon: number;
    channelC245RubPerTon: number;
    channelC345RubPerTon: number;
    lstkMp350RubPerTon?: number;
    lstkMp390RubPerTon?: number;
  };
  projectCosts?: {
    design: ProjectDesignCost;
  };
  calculationSettings: {
    maxUtilization: number;
    purlinMinStepMm: number;
    purlinMaxStepMm: number;
    purlinSystemPreference: PurlinSystemPreference;
    deflectionLimit?: number;
    enableOracleBlocks: boolean;
    useOracleForCraneBeam: boolean;
    useOracleForWindowRiegel: boolean;
    useOracleForBeamCell: boolean;
  };
}

export interface ProjectBlockMapping<TInput> {
  input: TInput;
  mappingNotes: string[];
  warnings: string[];
}

export interface ProjectCalculationResult {
  projectInputSnapshot: ProjectInput;
  columnResult: CalculationOutput | null;
  trussResult: TrussOutput | null;
  purlinResult: PurlinOutput | null;
  craneBeamResult: CraneBeamResult | null;
  windowRiegelResult: WindowRiegelResult | null;
  beamCellResult: BeamCellResult | null;
  mappedInputs: {
    column: CalculationInput | null;
    truss: TrussInput | null;
    purlin: PurlinInput | null;
    craneBeam: CraneBeamInput | null;
    windowRiegel: WindowRiegelInput | null;
    beamCell: BeamCellInput | null;
  };
  warnings: string[];
  mappingNotes: string[];
}

export type ProjectBlockName =
  | "column"
  | "truss"
  | "purlin"
  | "craneBeam"
  | "windowRiegel"
  | "beamCell";

export type ProjectBlockCalculationStatus = "ok" | "warning" | "error" | "notCalculated" | "skipped";

export type ProjectBlockCalculationSource =
  | "native"
  | "velican-oracle"
  | "native-skeleton"
  | "mixed"
  | "unknown"
  | "skipped";

export interface ProjectBlockStatus {
  block: ProjectBlockName;
  status: ProjectBlockCalculationStatus;
  source: ProjectBlockCalculationSource;
  selectedProfiles: string[];
  massKg: number | null;
  costRub: number | null;
  utilization: number | null;
  warnings: string[];
  notes: string[];
}

export interface ProjectCalculationSummary {
  projectName: string;
  city?: string;
  calculatedAt: string;
  blocks: ProjectBlockStatus[];
  totalMassKg: number;
  totalCostRub: number;
  massByBlock: Partial<Record<ProjectBlockName, number>>;
  costByBlock: Partial<Record<ProjectBlockName, number>>;
  warnings: string[];
  mappingNotes: string[];
  incompleteFields: string[];
}

export interface ProjectCalculationWithSummary {
  result: ProjectCalculationResult;
  summary: ProjectCalculationSummary;
  purlinAlternativesSummary: PurlinAlternativesSummary;
}
