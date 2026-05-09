# Truss Acceptance

Truss acceptance locks the current normalized parity between native `colonna`
truss calculation and the migrated VELICAN Molodechno oracle.

This stage does not replace native truss logic with the oracle. The oracle is
used only as an Excel/workbook-backed comparison reference.

## Protected Fields

`src/calc/verification/truss-acceptance.test.ts` checks that these fields stay
`ok`:

- `topChord.profile`
- `topChord.weightKg`
- `topChord.utilization`
- `bottomChord.profile`
- `bottomChord.weightKg`
- `bottomChord.utilization`
- `supportBrace.profile`
- `supportBrace.weightKg`
- `web.profile`
- `web.weightKg`
- `totalWeightKg`
- `specificWeightKgM2`

The test also asserts that the normalized truss comparison has no `fail`
statuses.

## Not Comparable Fields

These fields are intentionally required to remain `not-comparable` rather than
`fail`:

- `supportBrace.utilization`
- `web.utilization`

Native `colonna` and VELICAN Molodechno expose close but not identical element
schemes for these diagnostics. The profiles and weights are comparable and are
accepted; the utilization values are documented as not directly equivalent.

## Running

Run only truss acceptance:

```bash
npm test -- src/calc/verification/truss-acceptance.test.ts
```

Run the full engineering gate:

```bash
npm run typecheck
npm test
npm run build
npm run verify
npm run verify:all
```

If this test fails, do not patch the acceptance values first. Re-run normalized
comparison, identify the changed field, and confirm whether the source of truth
is the native calculation, the VELICAN oracle, or a workbook update.
