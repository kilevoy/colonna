import type { CraneBeamInput } from "../crane-beam";
import type { ProjectBlockMapping, ProjectInput } from "./types";

export function mapProjectToCraneBeamInput(project: ProjectInput): ProjectBlockMapping<CraneBeamInput> {
  const crane = project.cranes.supportCrane;
  const input: CraneBeamInput = {
    capacityT: crane.capacityT,
    craneSpanM: crane.craneSpanM,
    beamSpanM: crane.beamSpanM,
    wheelCount: crane.wheelCount,
    wheelBaseM: crane.wheelBaseM,
    maxWheelLoadKn: crane.maxWheelLoadKn,
    trolleyWeightT: crane.trolleyWeightT,
    craneWeightT: crane.craneWeightT,
    railType: crane.railType,
    dutyGroup: crane.dutyGroup,
    regimeGroup: crane.dutyGroup,
    steel: project.materials.craneBeamSteel,
    pricePerTonRub: project.prices.iBeamC345RubPerTon,
    deflectionLimit: project.calculationSettings.deflectionLimit,
    rawOracleInput: {
      craneCount: crane.count === "two" ? "два" : "один",
      rail: crane.railType,
      workGroup: crane.dutyGroup,
    },
  };

  return {
    input,
    mappingNotes: [
      "ProjectInput support crane data mapped to crane-beam oracle wrapper.",
      "Explicit wheel load, trolley mass, crane mass, steel and deflection limit are kept in normalized input but only partially mapped by the current VELICAN wrapper.",
      "Support crane enabled flag and rail level are project/column inputs; current crane-beam wrapper does not expose direct enabled or rail-level fields.",
    ],
    warnings: project.calculationSettings.useOracleForCraneBeam ? [] : ["Project setting disables oracle crane beam, but no native crane-beam backend exists yet."],
  };
}
