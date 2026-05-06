# Window Riegel Calculation Block

`src/calc/window-riegel` is the stable public `colonna` module for window
riegel calculation. It currently uses the migrated VELICAN Excel/workbook oracle
as its backend.

No native window-riegel formulas are implemented in this stage. The module is a
typed wrapper that prepares the block for future UI and `BuildingInput`
integration.

## Public API

- `calculateWindowRiegel(input)`
- `runWindowRiegelCalculationWithDebug(input)`
- `defaultWindowRiegelInput`

## Normalized Input

`WindowRiegelInput` exposes:

- `openingWidthM`
- `openingHeightM`
- `wallHeightM`
- `facadePostStepM`
- `windLoadKpa`
- `terrainType`
- `buildingHeightM`
- `wallLoadKpa`
- `steel`
- `pricePerTonRub`
- `extraOptions`
- `rawOracleInput`

## VELICAN Mapping

Direct mapping currently used:

- `openingHeightM` -> `windowHeightM`
- `facadePostStepM` -> `frameStepM`
- `buildingHeightM` -> `buildingHeightM`
- `terrainType` -> `terrainType`
- `windLoadKpa` -> `windLoadKpa`
- `rawOracleInput` -> final oracle override for workbook-specific fields

The VELICAN oracle still owns workbook-specific fields such as `city`,
`responsibilityLevel`, `windowType`, `buildingSpanM`, `buildingLengthM`,
`windowConstruction`, and `maxUtilization`. They can be provided through
`rawOracleInput` until a shared building input mapping is designed.

## Normalized Result

`WindowRiegelResult` returns:

- `lowerProfile`
- `upperProfile`
- `sideProfile`
- `utilization`
- `massKg`
- `costRub`
- `checks`
- `warnings`
- `notes`
- `source: "velican-oracle"`

`lowerProfile` and `upperProfile` currently use the first VELICAN
`lowerAndUpperProfiles` option. `sideProfile` uses the first `upperType1Profiles`
option when available.

`costRub` is calculated only when `pricePerTonRub` is provided. The oracle does
not expose direct cost.

## Debug Trace

`runWindowRiegelCalculationWithDebug()` returns:

- `inputSnapshot`
- `oracleInputSnapshot`
- `oracleResultSnapshot`
- `lowerProfile`
- `upperProfile`
- `utilization`
- `massKg`
- `costRub`
- `checks`
- `warnings`
- `missingDebugFields`
- `source`

Known missing debug fields include direct utilization/check limits and normalized
fields that are not direct VELICAN inputs yet.

## Running

Run only the window-riegel wrapper tests:

```bash
npm test -- src/calc/window-riegel/window-riegel.test.ts src/calc/verification/window-riegel-acceptance.test.ts
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
opening width and wall loads affect the workbook scenario, and only then design
UI. Until then VELICAN remains the Excel/workbook oracle backend.
