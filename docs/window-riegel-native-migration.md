# Window Riegel Native Migration

Stage 9.1 adds a native window-riegel skeleton for diagnostics. It is not a
production calculator and is not parity-approved.

The accepted path remains:

- public wrapper: `src/calc/window-riegel/calculate-window-riegel.ts`
- VELICAN oracle: `src/calc/velican/window-riegel`
- accepted function: `calculateWindowRiegel()`

The new diagnostic path is:

- native skeleton: `src/calc/window-riegel/native`
- function: `calculateWindowRiegelNative()`
- debug function: `runWindowRiegelNativeCalculationWithDebug()`
- comparison: `src/calc/verification/window-riegel-native-comparison.ts`

## What The Skeleton Calculates

The skeleton uses a deliberately small baseline:

- reads `windLoadKpa`;
- derives a tributary height from `openingHeightM`;
- uses `facadePostStepM` as the preliminary span;
- calculates `windLineLoadKnM = windLoadKpa * tributaryHeightM`;
- calculates `simpleMomentKnM = q * L^2 / 8`;
- selects from local placeholder tube candidates:
  - `kv.80x3`
  - `kv.100x3`
  - `kv.120x3`
  - `kv.140x4`
- estimates `massKg` from candidate meter weight and total riegel length;
- estimates `costRub` only when `pricePerTonRub` is supplied.

Every result includes warnings:

- `Native window-riegel is a preliminary skeleton and is not parity-approved.`
- `Use VELICAN oracle for accepted results until parity is reached.`

## Debug Trace

`runWindowRiegelNativeCalculationWithDebug()` returns:

- `inputSnapshot`
- `loadTrace`
- `geometryTrace`
- `candidateProfiles`
- `selectedProfile`
- `utilization`
- `massKg`
- `costRub`
- `warnings`
- `missingDebugFields`
- `source`

Candidate profiles include:

- `profile`
- `meterWeightKgM`
- `capacityMomentKnM`
- `utilization`
- `status`
- `reason`

This is intended to support future "why this profile was selected" diagnostics.

## Native Vs Oracle Comparison

`compareWindowRiegelNativeToVelican()` calls both:

- `calculateWindowRiegelNative()`
- `calculateWindowRiegel()`

It compares:

- `lowerProfile.profile`
- `upperProfile.profile`
- `sideProfile.profile`
- `massKg`
- `costRub`
- `utilization`

Expected differences are currently normal. Profile and mass differences are
expected because the skeleton uses local placeholder candidates. Oracle
utilization is not available from the current wrapper, so utilization is not
parity-comparable yet.

This comparison is diagnostic only. It must not be treated as acceptance.

## Missing Before Parity

Before this can become a native accepted engine, the project needs:

- approved native load combinations;
- approved profile catalog and candidate filtering;
- parity fixtures from VELICAN debug traces;
- lower/upper/side quantity and length semantics;
- mass and cost semantics aligned with building specification;
- accepted utilization/check limits.

VELICAN remains the oracle for verification until those items are complete.
