import type { CalculationInput, CalculationOutput, RoofType, SpanCount, TerrainType } from "../types";
import type { TrussInput, TrussOutput } from "../truss/types";
import type { PurlinInput, PurlinOutput, SnowDriftMode } from "../purlin";
import type { CraneBeamInput, CraneBeamResult } from "../crane-beam";
import type { WindowRiegelInput, WindowRiegelResult } from "../window-riegel";
import type { BeamCellInput, BeamCellResult } from "../beam-cell";

export interface ProjectInput {
  projectInfo: {
    name: string;
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
    roofConstruction: string;
    roofLoadKpa: number;
    deckProfile?: string;
    snowBagMode?: SnowDriftMode;
    snowRetentionPurlin: boolean;
    barrierPurlin: boolean;
  };
  walls: {
    wallConstruction: string;
    wallLoadKpa: number;
    openingWidthM?: number;
    openingHeightM?: number;
    windowType?: number;
  };
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
  calculationSettings: {
    maxUtilization: number;
    purlinMinStepMm: number;
    purlinMaxStepMm: number;
    deflectionLimit?: number;
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
