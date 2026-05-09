# Column Diagnostics

Stage 4.1 adds deep diagnostics for native colonna columns vs the VELICAN column oracle.

This stage does not fix formulas, replace native calculation, or change UI. It only exposes where the normalized column scenario diverges.

## Remaining Normalized FAIL Candidates

The normalized column comparison still has calculation mismatches in:

- `windDesign`
- `final_N_kN`
- `final_M_kNm`
- `topCandidateProfile`
- `topCandidateSteel`
- `topCandidateUtilization`
- `massKg`
- `costRub`

## Diagnostic Sections

`buildColumnDiagnosticReport()` splits the comparison into:

- Loads: snow, wind, roof, wall.
- Cranes: support crane vertical/horizontal load and moment.
- Forces: final N, base moment, moment factor, final M.
- Profile: first profile, steel, utilization, governing check.
- Mass/Cost: weight and cost.

## How To Read It

Start with loads and forces. If `windDesign` fails, `final_M_kNm` and the selected profile may differ as a consequence. If `final_N_kN` fails, check snow, roof/wall loads, tributary areas, and crane vertical load before changing profile selection.

Profile, mass, and cost are downstream checks. Do not tune profile ranking or prices until N/M parity is understood.

## Suspected Causes

The report adds simple suspected causes:

- wind fail: check wind coefficients, terrain, and height;
- wind and M fail: moment may be downstream of wind;
- N fail: check snow, roof/wall load, tributary area, and crane vertical;
- N/M and profile fail: profile may be downstream of efforts;
- profile ok but mass/cost fail: check mass, length, bracing, and prices;
- profile fail while N/M ok: check assortment, steel grades, utilization, and ranking.

## How To Run

```bash
npm test -- src/calc/verification/column-diagnostics.test.ts
```

Full verification:

```bash
npm run verify:all
```

## Next Step

The next stage should fix the first confirmed root mismatch, likely starting from wind/load parity before profile, mass, or cost.

## Stage 4.3 Parity Status

Loads, cranes, forces and selected profile are aligned for the normalized column scenario.

Additional parity work:

- `limitingCheck` is compared through `normalizeCheckName()` because native uses `sigma` while the workbook facade exposes `sigm`.
- `massKg` now follows workbook summary semantics: `unitMass * height * 1.15 + 9.6 kg/m * spacing * 1.15 * braceCount`.
- legacy native `costRub` stores thousand rubles; diagnostics expose `costThousandRub` and `costRubNormalized`.

Remaining diagnostic caveats:

- `windInternal` is still missing in native debug.
- `mu` remains not-comparable with oracle `momentFactor`; these are different engineering coefficients.

Column acceptance coverage lives in `src/calc/verification/column-acceptance.test.ts`.
