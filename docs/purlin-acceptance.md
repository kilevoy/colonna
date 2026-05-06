# Purlin Acceptance Tests

Stage 3.8 freezes the current normalized purlin parity result as regression coverage. These tests compare native colonna diagnostics with the VELICAN purlin oracle and fail if a key parity field regresses to `fail`.

## Required Parity Fields

Loads:

- `totalDesignLoadKpa`
- `loadAtMaxStepKpa`

Hot-rolled purlins:

- `hotRolled.profile`
- `hotRolled.stepMm`
- `hotRolled.weightKg`

MP350:

- `mp350.profile`
- `mp350.meterWeightKg`
- `mp350.buildingWeightKg`

MP390:

- `mp390.profile`
- `mp390.meterWeightKg`
- `mp390.buildingWeightKg`

## Not Required Yet

These fields remain diagnostic-only and are not considered calculation failures in this stage:

- native `autoMaxStepMm`
- native LSTK `blackWeightKg`
- native LSTK `galvanizedWeightKg`
- native LSTK `bracedWeightKg`
- oracle standalone `snowLoadKpa`
- oracle standalone `windLoadKpa`
- oracle hot-rolled `utilization`
- oracle hot-rolled `limitingCheck`

## How To Run

Run only the acceptance test:

```bash
npm test -- src/calc/verification/purlin-acceptance.test.ts
```

Run the full local verification pipeline:

```bash
npm run verify:all
```

## If A Test Fails

Do not adjust the expected values first. Re-run `buildPurlinDiagnosticReport()` or inspect the markdown diagnostic output, then identify whether the regression is in loads, hot-rolled selection/mass, or MP350/MP390 selection/mass. Fix one confirmed cause at a time.
