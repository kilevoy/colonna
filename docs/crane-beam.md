# Crane Beam Calculation Block

`src/calc/crane-beam` is the first stable `colonna` calculation module for
crane beams. It is currently backed by the migrated VELICAN Excel/workbook
oracle.

No native crane-beam formulas are implemented in this stage. The wrapper creates
a normalized public contract so future UI and `BuildingInput` integration can use
one `colonna` module while the workbook oracle remains the calculation backend.

## Public API

- `calculateCraneBeam(input)`
- `runCraneBeamCalculationWithDebug(input)`
- `defaultCraneBeamInput`

## Normalized Input

`CraneBeamInput` exposes:

- `capacityT`
- `craneSpanM`
- `beamSpanM`
- `wheelCount`
- `wheelBaseM`
- `maxWheelLoadKn`
- `trolleyWeightT`
- `craneWeightT`
- `railType`
- `dutyGroup` / `regimeGroup`
- `steel`
- `pricePerTonRub`
- `deflectionLimit`
- `extraOptions`
- `rawOracleInput`

The direct workbook mapping currently uses VELICAN fields:

- `capacityT` -> `capacity`
- `craneSpanM` -> `craneSpan`
- `beamSpanM` -> `beamSpan`
- `wheelCount` -> `wheelCount`
- `railType` -> `rail`
- `dutyGroup` / `regimeGroup` -> `workGroup`
- `rawOracleInput` -> final oracle override for workbook-specific fields

Fields such as explicit wheel load, trolley weight, crane weight, steel, and
deflection limit are kept in the public contract but are not direct VELICAN
inputs yet.

## Normalized Result

`CraneBeamResult` returns:

- `selectedProfile`
- `utilization`
- `massKg`
- `costRub`
- `dimensions`
- `checks`
- `warnings`
- `notes`
- `source: "velican-oracle"`

`costRub` is calculated only when `pricePerTonRub` is provided. Otherwise it is
`null`, because the current crane-beam oracle does not expose a direct cost cell.

## Debug Trace

`runCraneBeamCalculationWithDebug()` returns:

- `inputSnapshot`
- `oracleInputSnapshot`
- `oracleResultSnapshot`
- `selectedProfile`
- `utilization`
- `massKg`
- `costRub`
- `dimensions`
- `strengthChecks`
- `fatigueChecks`
- `stabilityChecks`
- `localStabilityChecks`
- `deflectionChecks`
- `warnings`
- `missingDebugFields`
- `source`

`missingDebugFields` documents normalized fields that are not mapped to the
workbook input/output yet.

## Running

Run only the crane-beam wrapper tests:

```bash
npm test -- src/calc/crane-beam/crane-beam.test.ts src/calc/verification/crane-beam-acceptance.test.ts
```

Run the full engineering gate:

```bash
npm run typecheck
npm test
npm run build
npm run verify
npm run verify:all
```

## Next Steps

Later stages should connect this module to shared building inputs, add UI, and
decide whether a native crane-beam calculation is needed. Until then VELICAN is
the Excel/workbook oracle backend.
