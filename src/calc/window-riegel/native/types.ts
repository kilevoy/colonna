import type { WindowRiegelInput, WindowRiegelResult } from "../types";

export interface WindowRiegelNativeLoadTrace {
  windLoadKpa: number;
  tributaryHeightM: number;
  windLineLoadKnM: number;
  simpleMomentKnM: number;
}

export interface WindowRiegelNativeGeometryTrace {
  spanM: number;
  openingWidthM: number | null;
  openingHeightM: number;
  totalLengthM: number;
}

export interface WindowRiegelNativeCandidateProfile {
  profile: string;
  meterWeightKgM: number;
  capacityMomentKnM: number;
  utilization: number;
  status: "ok" | "fail";
  reason: string;
}

export interface WindowRiegelNativeDebugResult extends WindowRiegelResult {
  inputSnapshot: WindowRiegelInput;
  loadTrace: WindowRiegelNativeLoadTrace;
  geometryTrace: WindowRiegelNativeGeometryTrace;
  candidateProfiles: WindowRiegelNativeCandidateProfile[];
  selectedProfile: WindowRiegelNativeCandidateProfile | null;
  missingDebugFields: string[];
  source: "native-skeleton";
}
