import {
  calculateWindowRiegel,
  defaultWindowRiegelInput,
  type WindowRiegelInput,
  type WindowRiegelProfile,
} from "../window-riegel";
import { calculateWindowRiegelNative } from "../window-riegel/native";
import {
  buildComparisonSummary,
  compareNumberField,
  compareTextField,
  getOverallStatus,
  notComparableField,
} from "./comparison-report";
import type { BlockComparisonResult, ComparisonFieldResult } from "./comparison-types";

const UTILIZATION_TOLERANCE = 0.001;
const MASS_TOLERANCE = 0.1;
const COST_TOLERANCE = 1;

function profileName(profile: WindowRiegelProfile | null | undefined): string | null {
  return profile?.profile ?? null;
}

export function compareWindowRiegelNativeToVelican(
  input: WindowRiegelInput = defaultWindowRiegelInput,
): BlockComparisonResult {
  const nativeResult = calculateWindowRiegelNative(input);
  const oracleResult = calculateWindowRiegel(input);
  const comparisons: ComparisonFieldResult[] = [
    compareTextField(
      "lowerProfile.profile",
      profileName(nativeResult.lowerProfile),
      profileName(oracleResult.lowerProfile),
      "Expected to differ: native skeleton uses local placeholder candidates.",
    ),
    compareTextField(
      "upperProfile.profile",
      profileName(nativeResult.upperProfile),
      profileName(oracleResult.upperProfile),
      "Expected to differ: native skeleton uses local placeholder candidates.",
    ),
    compareTextField(
      "sideProfile.profile",
      profileName(nativeResult.sideProfile),
      profileName(oracleResult.sideProfile),
      "Expected to differ: native skeleton uses local placeholder candidates.",
    ),
    compareNumberField(
      "massKg",
      nativeResult.massKg,
      oracleResult.massKg,
      MASS_TOLERANCE,
      "Expected to differ until native mass semantics are parity-approved.",
    ),
    compareNumberField(
      "costRub",
      nativeResult.costRub,
      oracleResult.costRub,
      COST_TOLERANCE,
      "Comparable only when both paths receive pricePerTonRub.",
    ),
    compareNumberField(
      "utilization",
      nativeResult.utilization,
      oracleResult.utilization,
      UTILIZATION_TOLERANCE,
      "Oracle wrapper does not expose accepted utilization yet; skeleton utilization is diagnostic.",
    ),
    notComparableField(
      "parityStatus",
      nativeResult.source,
      oracleResult.source,
      "Native window-riegel is a preliminary skeleton and is not parity-approved.",
    ),
  ];
  const summary = buildComparisonSummary(comparisons);

  return {
    block: "window_riegel",
    inputSnapshot: input,
    nativeResult,
    oracleResult,
    comparisons,
    summary,
    overallStatus: getOverallStatus(summary),
  };
}

export function compareDefaultWindowRiegelNativeToVelican(): BlockComparisonResult {
  return compareWindowRiegelNativeToVelican();
}
