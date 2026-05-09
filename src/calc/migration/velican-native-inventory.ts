export type VelicanNativeMigrationBlockKey = "windowRiegel" | "beamCell" | "craneBeam";

export interface VelicanNativeMigrationBlock {
  blockKey: VelicanNativeMigrationBlockKey;
  displayName: string;
  currentStatus: "oracle-wrapper" | "native" | "hybrid";
  publicModulePath: string;
  oracleModulePath: string;
  priority: number;
  complexity: "low" | "medium" | "high";
  directMappedInputs: string[];
  partialInputs: string[];
  missingInputs: string[];
  availableOutputs: string[];
  missingOutputs: string[];
  risks: string[];
  recommendedNextStep: string;
}

export const velicanNativeMigrationInventory: VelicanNativeMigrationBlock[] = [
  {
    blockKey: "windowRiegel",
    displayName: "Window riegel",
    currentStatus: "oracle-wrapper",
    publicModulePath: "src/calc/window-riegel",
    oracleModulePath: "src/calc/velican/window-riegel",
    priority: 1,
    complexity: "medium",
    directMappedInputs: [
      "openingHeightM",
      "facadePostStepM",
      "windLoadKpa",
      "terrainType",
      "buildingHeightM",
      "rawOracleInput.city",
      "rawOracleInput.responsibilityLevel",
      "rawOracleInput.frameStepM",
      "rawOracleInput.buildingSpanM",
      "rawOracleInput.buildingLengthM",
      "rawOracleInput.windowType",
      "rawOracleInput.maxUtilization",
    ],
    partialInputs: [
      "openingWidthM",
      "wallHeightM",
      "wallLoadKpa",
      "steel",
      "pricePerTonRub",
      "extraOptions.wallConstruction",
    ],
    missingInputs: [
      "native load combination model",
      "native profile catalog contract",
      "native quantity and mass split for lower/upper/side riegels",
    ],
    availableOutputs: [
      "lowerProfile",
      "upperProfile",
      "sideProfile",
      "utilization",
      "massKg",
      "costRub",
      "checks",
      "warnings",
      "notes",
      "source",
    ],
    missingOutputs: [
      "per-position quantities",
      "per-position lengths",
      "native formula trace",
      "explicit pass/fail reason per selected member",
    ],
    risks: [
      "Workbook option selection must be preserved before replacing the oracle.",
      "Opening width and wall load are normalized today but not fully direct workbook inputs.",
      "Mass semantics for lower, upper and side riegels need approval before specification split.",
    ],
    recommendedNextStep:
      "Extract a small parity fixture set from runWindowRiegelCalculationWithDebug and define native candidate selection boundaries.",
  },
  {
    blockKey: "beamCell",
    displayName: "Beam cell",
    currentStatus: "oracle-wrapper",
    publicModulePath: "src/calc/beam-cell",
    oracleModulePath: "src/calc/velican/beam-cell",
    priority: 2,
    complexity: "medium",
    directMappedInputs: [
      "spanM",
      "stepM",
      "roofLoadKpa",
      "steel",
      "pricePerTonRub",
      "rawOracleInput.lengthAlongMain",
      "rawOracleInput.widthAcrossMain",
      "rawOracleInput.columnHeight",
      "rawOracleInput.mainBeamSpan",
      "rawOracleInput.mainBeamStep",
      "rawOracleInput.acceptedMainSteel",
    ],
    partialInputs: [
      "snowLoadKpa",
      "windLoadKpa",
      "roofSlopeDeg",
      "deflectionLimit",
      "extraOptions.roofConstruction",
    ],
    missingInputs: [
      "native load combination model",
      "approved member role semantics",
      "approved aggregate-vs-member mass semantics",
    ],
    availableOutputs: [
      "selectedProfile",
      "utilization",
      "massKg",
      "costRub",
      "checks",
      "warnings",
      "notes",
      "source",
    ],
    missingOutputs: [
      "separate member quantities",
      "separate member lengths",
      "confirmed totalMassKg meaning for specification rows",
      "native formula trace",
    ],
    risks: [
      "Specification currently treats beam-cell mass as aggregate because output semantics are not confirmed.",
      "Snow, wind, roof slope and deflection limit are normalized but not direct oracle inputs.",
      "Native migration needs a clear split between end roof beam layout quantities and calculated beam-cell output.",
    ],
    recommendedNextStep:
      "Approve beam-cell output semantics, then build parity fixtures for selectedProfile, utilization and mass before writing native formulas.",
  },
  {
    blockKey: "craneBeam",
    displayName: "Crane beam",
    currentStatus: "oracle-wrapper",
    publicModulePath: "src/calc/crane-beam",
    oracleModulePath: "src/calc/velican/crane-beam",
    priority: 3,
    complexity: "high",
    directMappedInputs: [
      "capacityT",
      "craneSpanM",
      "beamSpanM",
      "wheelCount",
      "railType",
      "dutyGroup",
      "regimeGroup",
      "rawOracleInput.craneCount",
      "rawOracleInput.rail",
      "rawOracleInput.workGroup",
    ],
    partialInputs: [
      "wheelBaseM",
      "maxWheelLoadKn",
      "trolleyWeightT",
      "craneWeightT",
      "steel",
      "pricePerTonRub",
      "deflectionLimit",
    ],
    missingInputs: [
      "support crane enabled semantics in crane-beam wrapper",
      "rail level direct input",
      "native fatigue/load-cycle model",
      "native rail and wheel-load distribution model",
    ],
    availableOutputs: [
      "selectedProfile",
      "utilization",
      "massKg",
      "costRub",
      "dimensions",
      "checks.strength",
      "checks.crane78",
      "checks.globalStability",
      "checks.localStability",
      "checks.deflections",
      "checks.geometry",
      "warnings",
      "notes",
      "source",
    ],
    missingOutputs: [
      "native fatigue trace",
      "native wheel-load envelope trace",
      "native rail influence trace",
      "approved cost semantics for all crane configurations",
    ],
    risks: [
      "Crane beam combines wheel loads, duty group, fatigue, deflection, rail data and stability checks.",
      "Several normalized project inputs are only partially mapped by the current wrapper.",
      "Changing this block before smaller oracle blocks would carry the largest parity and acceptance risk.",
    ],
    recommendedNextStep:
      "Keep VELICAN as oracle, expand debug fixtures around wheel loads/duty groups/rail choices, and migrate after window-riegel and beam-cell.",
  },
];

export function getVelicanNativeMigrationBlock(
  blockKey: VelicanNativeMigrationBlockKey,
): VelicanNativeMigrationBlock {
  const block = velicanNativeMigrationInventory.find((item) => item.blockKey === blockKey);
  if (!block) {
    throw new Error(`Unknown VELICAN native migration block: ${blockKey}`);
  }
  return block;
}
