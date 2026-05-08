import { defaultWindowRiegelInput } from "../calculate-window-riegel";
import type { WindowRiegelInput } from "../types";
import {
  buildWindowRiegelNativeCandidateProfiles,
  buildWindowRiegelNativeGeometryTrace,
  buildWindowRiegelNativeLoadTrace,
  calculateWindowRiegelNative,
} from "./calculate-window-riegel-native";
import type { WindowRiegelNativeDebugResult } from "./types";

function buildMissingDebugFields(input: WindowRiegelInput): string[] {
  const missing = [
    "parityApproval",
    "nativeFormulaTrace",
    "nativeProfileCatalog",
    "deflectionCheck",
  ];

  if (input.wallLoadKpa !== undefined && input.wallLoadKpa !== null) {
    missing.push("wallLoadKpa.nativeLoadCombination");
  }
  if (input.steel) {
    missing.push("steel.nativeCandidateFilter");
  }
  if (input.openingWidthM === undefined || input.openingWidthM === null) {
    missing.push("openingWidthM");
  }

  return missing;
}

export function runWindowRiegelNativeCalculationWithDebug(
  input: WindowRiegelInput = defaultWindowRiegelInput,
): WindowRiegelNativeDebugResult {
  const geometryTrace = buildWindowRiegelNativeGeometryTrace(input);
  const loadTrace = buildWindowRiegelNativeLoadTrace(input, geometryTrace);
  const candidateProfiles = buildWindowRiegelNativeCandidateProfiles(loadTrace);
  const result = calculateWindowRiegelNative(input);
  const selectedProfile = candidateProfiles.find((candidate) => candidate.profile === result.lowerProfile?.profile) ?? null;

  return {
    ...result,
    inputSnapshot: input,
    loadTrace,
    geometryTrace,
    candidateProfiles,
    selectedProfile,
    missingDebugFields: buildMissingDebugFields(input),
    source: "native-skeleton",
  };
}
