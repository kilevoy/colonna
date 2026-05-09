import { defaultWindowRiegelInput } from "../calculate-window-riegel";
import type {
  WindowRiegelCheck,
  WindowRiegelInput,
  WindowRiegelProfile,
  WindowRiegelResult,
} from "../types";
import type {
  WindowRiegelNativeCandidateProfile,
  WindowRiegelNativeGeometryTrace,
  WindowRiegelNativeLoadTrace,
} from "./types";

const PRELIMINARY_WARNINGS = [
  "Native window-riegel is a preliminary skeleton and is not parity-approved.",
  "Use VELICAN oracle for accepted results until parity is reached.",
];

const CANDIDATES = [
  { profile: "kv.80x3", meterWeightKgM: 7.07, capacityMomentKnM: 8 },
  { profile: "kv.100x3", meterWeightKgM: 8.96, capacityMomentKnM: 14 },
  { profile: "kv.120x3", meterWeightKgM: 10.85, capacityMomentKnM: 23 },
  { profile: "kv.140x4", meterWeightKgM: 16.76, capacityMomentKnM: 42 },
] as const;

function finiteOrFallback(value: number | null | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}

export function buildWindowRiegelNativeGeometryTrace(
  input: WindowRiegelInput,
): WindowRiegelNativeGeometryTrace {
  const openingHeightM = finiteOrFallback(input.openingHeightM, defaultWindowRiegelInput.openingHeightM);
  const spanM = finiteOrFallback(input.facadePostStepM, input.openingWidthM ?? defaultWindowRiegelInput.facadePostStepM);
  const openingWidthM =
    typeof input.openingWidthM === "number" && Number.isFinite(input.openingWidthM) && input.openingWidthM > 0
      ? input.openingWidthM
      : null;

  return {
    spanM,
    openingWidthM,
    openingHeightM,
    totalLengthM: spanM * 2 + openingHeightM * 2,
  };
}

export function buildWindowRiegelNativeLoadTrace(
  input: WindowRiegelInput,
  geometry: WindowRiegelNativeGeometryTrace,
): WindowRiegelNativeLoadTrace {
  const windLoadKpa = finiteOrFallback(input.windLoadKpa, defaultWindowRiegelInput.windLoadKpa);
  const tributaryHeightM = geometry.openingHeightM;
  const windLineLoadKnM = windLoadKpa * tributaryHeightM;
  const simpleMomentKnM = (windLineLoadKnM * geometry.spanM ** 2) / 8;

  return {
    windLoadKpa,
    tributaryHeightM,
    windLineLoadKnM,
    simpleMomentKnM,
  };
}

export function buildWindowRiegelNativeCandidateProfiles(
  loadTrace: WindowRiegelNativeLoadTrace,
): WindowRiegelNativeCandidateProfile[] {
  return CANDIDATES.map((candidate) => {
    const utilization = loadTrace.simpleMomentKnM / candidate.capacityMomentKnM;
    const status = utilization <= 1 ? "ok" : "fail";
    return {
      ...candidate,
      utilization,
      status,
      reason:
        status === "ok"
          ? "Preliminary moment demand does not exceed skeleton capacity."
          : "Preliminary moment demand exceeds skeleton capacity.",
    };
  });
}

function toProfile(
  candidate: WindowRiegelNativeCandidateProfile | null,
  totalMassKg: number | null,
): WindowRiegelProfile | null {
  if (!candidate) return null;
  return {
    profile: candidate.profile,
    steel: "native-skeleton",
    weightKg: totalMassKg,
  };
}

function buildChecks(
  loadTrace: WindowRiegelNativeLoadTrace,
  selected: WindowRiegelNativeCandidateProfile | null,
): WindowRiegelCheck[] {
  return [
    {
      name: "windLineLoadKnM",
      value: loadTrace.windLineLoadKnM,
      status: "not-comparable",
      note: "Preliminary native skeleton load trace; not parity-approved.",
    },
    {
      name: "simpleMomentKnM",
      value: loadTrace.simpleMomentKnM,
      limit: selected?.capacityMomentKnM ?? null,
      utilization: selected?.utilization ?? null,
      status: selected ? selected.status : "missing",
      note: "Simple qL^2/8 baseline check for migration diagnostics.",
    },
  ];
}

export function calculateWindowRiegelNative(
  input: WindowRiegelInput = defaultWindowRiegelInput,
): WindowRiegelResult {
  const geometryTrace = buildWindowRiegelNativeGeometryTrace(input);
  const loadTrace = buildWindowRiegelNativeLoadTrace(input, geometryTrace);
  const candidateProfiles = buildWindowRiegelNativeCandidateProfiles(loadTrace);
  const selected =
    candidateProfiles.find((candidate) => candidate.status === "ok") ??
    candidateProfiles[candidateProfiles.length - 1] ??
    null;
  const massKg = selected ? selected.meterWeightKgM * geometryTrace.totalLengthM : null;
  const costRub =
    massKg !== null && typeof input.pricePerTonRub === "number" && Number.isFinite(input.pricePerTonRub)
      ? (massKg / 1000) * input.pricePerTonRub
      : null;
  const selectedProfile = toProfile(selected, massKg);

  return {
    lowerProfile: selectedProfile,
    upperProfile: selectedProfile,
    sideProfile: selectedProfile,
    utilization: selected?.utilization ?? null,
    massKg,
    costRub,
    checks: buildChecks(loadTrace, selected),
    warnings: [...PRELIMINARY_WARNINGS],
    notes: [
      "Native window-riegel skeleton uses a simple wind line load and qL^2/8 moment baseline.",
      "Candidate capacities are local diagnostic placeholders for migration planning.",
    ],
    source: "native-skeleton",
  };
}

export { PRELIMINARY_WARNINGS as windowRiegelNativePreliminaryWarnings };
