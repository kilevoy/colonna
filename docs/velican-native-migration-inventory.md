# VELICAN Native Migration Inventory

Stage 9.0 is an inventory only. It does not change formulas, runtime behavior,
UI, acceptance tests, or VELICAN oracle modules. The goal is to define the
technical map for migrating the remaining oracle-only project blocks to native
engines later.

Current project behavior:

- `calculateProject()` normal mode runs native `column`, `truss` and `purlin`.
- `craneBeam`, `windowRiegel` and `beamCell` are skipped in normal mode.
- `calculateProjectAsync()` can load those oracle blocks with dynamic imports
  when `calculationSettings.enableOracleBlocks = true`.

Recommended migration order:

1. `windowRiegel`
2. `beamCell`
3. `craneBeam`

## window-riegel

- Current public module path: `src/calc/window-riegel`
- Current oracle wrapper path: `src/calc/velican/window-riegel`
- Public entry points: `calculateWindowRiegel()`,
  `runWindowRiegelCalculationWithDebug()`, `buildVelicanWindowRiegelInput()`
- Input type: `WindowRiegelInput`
- Result type: `WindowRiegelResult`
- Debug result type: `WindowRiegelDebugResult`

Direct mapped inputs:

- `openingHeightM`
- `facadePostStepM`
- `windLoadKpa`
- `terrainType`
- `buildingHeightM`
- `rawOracleInput.city`
- `rawOracleInput.responsibilityLevel`
- `rawOracleInput.frameStepM`
- `rawOracleInput.buildingSpanM`
- `rawOracleInput.buildingLengthM`
- `rawOracleInput.windowType`
- `rawOracleInput.maxUtilization`

Partial or not-directly mapped inputs:

- `openingWidthM`
- `wallHeightM`
- `wallLoadKpa`
- `steel`
- `pricePerTonRub`
- `extraOptions.wallConstruction`

Missing native inputs or contracts:

- Native load combination model.
- Native profile catalog contract.
- Native quantity/mass split for lower, upper and side riegels.

Available outputs:

- `lowerProfile`
- `upperProfile`
- `sideProfile`
- `utilization`
- `massKg`
- `costRub`
- `checks`
- `warnings`
- `notes`
- `source`

Missing outputs:

- Per-position quantities.
- Per-position lengths.
- Native formula trace.
- Explicit pass/fail reason per selected member.

Debug fields:

- `inputSnapshot`
- `oracleInputSnapshot`
- `oracleResultSnapshot`
- normalized profiles
- `checks`
- `warnings`
- `missingDebugFields`

Existing tests:

- `src/calc/window-riegel/window-riegel.test.ts`
- `src/calc/verification/window-riegel-acceptance.test.ts`
- `src/calc/velican/velican-smoke.test.ts`

Risks:

- Workbook option selection must be preserved before replacing the oracle.
- Opening width and wall load are normalized today but not fully direct workbook
  inputs.
- Mass semantics for lower, upper and side riegels need approval before a richer
  specification split.

Recommended migration priority: `1`.

Reason: this is simpler than crane beam, has a stable wrapper and can likely
become native earlier.

Recommended next step: extract a small parity fixture set from
`runWindowRiegelCalculationWithDebug()` and define native candidate selection
boundaries.

Stage 9.1 note: a separate native skeleton now exists at
`src/calc/window-riegel/native`. It is diagnostic only, not production, and not
parity-approved. The public `calculateWindowRiegel()` path still uses VELICAN.

## beam-cell

- Current public module path: `src/calc/beam-cell`
- Current oracle wrapper path: `src/calc/velican/beam-cell`
- Public entry points: `calculateBeamCell()`, `runBeamCellCalculationWithDebug()`,
  `buildVelicanBeamCellInput()`
- Input type: `BeamCellInput`
- Result type: `BeamCellResult`
- Debug result type: `BeamCellDebugResult`

Direct mapped inputs:

- `spanM`
- `stepM`
- `roofLoadKpa`
- `steel`
- `pricePerTonRub`
- `rawOracleInput.lengthAlongMain`
- `rawOracleInput.widthAcrossMain`
- `rawOracleInput.columnHeight`
- `rawOracleInput.mainBeamSpan`
- `rawOracleInput.mainBeamStep`
- `rawOracleInput.acceptedMainSteel`

Partial or not-directly mapped inputs:

- `snowLoadKpa`
- `windLoadKpa`
- `roofSlopeDeg`
- `deflectionLimit`
- `extraOptions.roofConstruction`

Missing native inputs or contracts:

- Native load combination model.
- Approved member role semantics.
- Approved aggregate-vs-member mass semantics.

Available outputs:

- `selectedProfile`
- `utilization`
- `massKg`
- `costRub`
- `checks`
- `warnings`
- `notes`
- `source`

Missing outputs:

- Separate member quantities.
- Separate member lengths.
- Confirmed `totalMassKg` meaning for specification rows.
- Native formula trace.

Debug fields:

- `inputSnapshot`
- `oracleInputSnapshot`
- `oracleResultSnapshot`
- `selectedProfile`
- `utilization`
- `massKg`
- `costRub`
- `checks`
- `warnings`
- `missingDebugFields`

Existing tests:

- `src/calc/beam-cell/beam-cell.test.ts`
- `src/calc/verification/beam-cell-acceptance.test.ts`
- `src/calc/velican/velican-smoke.test.ts`

Risks:

- Specification currently treats beam-cell mass as aggregate because output
  semantics are not confirmed.
- Snow, wind, roof slope and deflection limit are normalized but not direct
  oracle inputs.
- Native migration needs a clear split between end roof beam layout quantities
  and calculated beam-cell output.

Recommended migration priority: `2`.

Reason: complexity is medium, but migration depends on confirming mass/output
semantics first.

Recommended next step: approve beam-cell output semantics, then build parity
fixtures for `selectedProfile`, `utilization` and `massKg`.

## crane-beam

- Current public module path: `src/calc/crane-beam`
- Current oracle wrapper path: `src/calc/velican/crane-beam`
- Public entry points: `calculateCraneBeam()`,
  `runCraneBeamCalculationWithDebug()`, `buildVelicanCraneBeamInput()`
- Input type: `CraneBeamInput`
- Result type: `CraneBeamResult`
- Debug result type: `CraneBeamDebugResult`

Direct mapped inputs:

- `capacityT`
- `craneSpanM`
- `beamSpanM`
- `wheelCount`
- `railType`
- `dutyGroup`
- `regimeGroup`
- `rawOracleInput.craneCount`
- `rawOracleInput.rail`
- `rawOracleInput.workGroup`

Partial or not-directly mapped inputs:

- `wheelBaseM`
- `maxWheelLoadKn`
- `trolleyWeightT`
- `craneWeightT`
- `steel`
- `pricePerTonRub`
- `deflectionLimit`

Missing native inputs or contracts:

- Support crane enabled semantics in the crane-beam wrapper.
- Rail level direct input.
- Native fatigue/load-cycle model.
- Native rail and wheel-load distribution model.

Available outputs:

- `selectedProfile`
- `utilization`
- `massKg`
- `costRub`
- `dimensions`
- `checks.strength`
- `checks.crane78`
- `checks.globalStability`
- `checks.localStability`
- `checks.deflections`
- `checks.geometry`
- `warnings`
- `notes`
- `source`

Missing outputs:

- Native fatigue trace.
- Native wheel-load envelope trace.
- Native rail influence trace.
- Approved cost semantics for all crane configurations.

Debug fields:

- `inputSnapshot`
- `oracleInputSnapshot`
- `oracleResultSnapshot`
- `strengthChecks`
- `fatigueChecks`
- `stabilityChecks`
- `localStabilityChecks`
- `deflectionChecks`
- `missingDebugFields`

Existing tests:

- `src/calc/crane-beam/crane-beam.test.ts`
- `src/calc/verification/crane-beam-acceptance.test.ts`
- `src/calc/velican/velican-smoke.test.ts`

Risks:

- Crane beam combines wheel loads, duty group, fatigue, deflection, rail data
  and stability checks.
- Several normalized project inputs are only partially mapped by the current
  wrapper.
- Changing this block before smaller oracle blocks would carry the largest
  parity and acceptance risk.

Recommended migration priority: `3`.

Reason: this is the highest-risk block because it includes wheel loads, duty
group, fatigue, deflection and rail-dependent behavior.

Recommended next step: keep VELICAN as oracle, expand debug fixtures around
wheel loads, duty groups and rail choices, and migrate after `windowRiegel` and
`beamCell`.
