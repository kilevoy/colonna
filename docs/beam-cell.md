# Beam Cell Calculation Block

`src/calc/beam-cell` is the stable public `colonna` module for the beam-cell /
roof beam calculation block. It currently uses the migrated VELICAN
Excel/workbook oracle as its backend.

No native beam-cell formulas are implemented in this stage. The module is a
typed wrapper that prepares the block for future `BuildingInput` integration.

## Public API

- `calculateBeamCell(input)`
- `runBeamCellCalculationWithDebug(input)`
- `defaultBeamCellInput`

## Normalized Input

`BeamCellInput` exposes:

- `spanM`
- `stepM`
- `roofLoadKpa`
- `snowLoadKpa`
- `windLoadKpa`
- `roofSlopeDeg`
- `steel`
- `pricePerTonRub`
- `deflectionLimit`
- `extraOptions`
- `rawOracleInput`

## VELICAN Mapping

Direct mapping currently used:

- `spanM` -> `mainBeamSpan`
- `stepM` -> `mainBeamStep`
- `roofLoadKpa` -> `floorLoadKgM2` as `roofLoadKpa * 100`
- `steel` -> `acceptedMainSteel` when it is `C245` or `C345`
- `pricePerTonRub` -> `ibeamC245` and `ibeamC345` price fields as rub/kg
- `rawOracleInput` -> final oracle override for workbook-specific fields

The VELICAN oracle still owns workbook-specific fields such as cell length,
width, column height, floor type, structure type, secondary beam settings,
accepted secondary/column steel, and detailed prices. They can be provided
through `rawOracleInput` until shared building input mapping is designed.

## Normalized Result

`BeamCellResult` returns:

- `selectedProfile`
- `utilization`
- `massKg`
- `costRub`
- `checks`
- `warnings`
- `notes`
- `source: "velican-oracle"`

The normalized selected result is based on VELICAN `accepted.main`. Secondary
beam and column decisions remain available through `checks` and the debug oracle
snapshot.

## Debug Trace

`runBeamCellCalculationWithDebug()` returns:

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
- `source`

Known missing debug fields include snow, wind, roof slope, and deflection limit
direct mappings. They are part of the public future-facing input but are not
direct VELICAN beam-cell inputs yet.

## Running

Run only the beam-cell wrapper tests:

```bash
npm test -- src/calc/beam-cell/beam-cell.test.ts src/calc/verification/beam-cell-acceptance.test.ts
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

Later stages should connect this module to shared `BuildingInput`, decide how
snow/wind/roof slope enter the beam-cell scenario, and only then design UI. Until
then VELICAN remains the Excel/workbook oracle backend.
