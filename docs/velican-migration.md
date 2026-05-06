# VELICAN Migration

Stage 2 brings VELICAN calculation blocks into `colonna` as an isolated oracle/domain layer.

## Migrated Blocks

- Crane beam: `src/calc/velican/crane-beam`
- Window riegel: `src/calc/velican/window-riegel`
- Beam cell / roof beam: `src/calc/velican/beam-cell`
- Column Excel oracle: `src/calc/velican/column-oracle`
- Molodechno truss oracle: `src/calc/velican/molodechno-oracle`
- Purlin oracle: `src/calc/velican/purlin-oracle`
- Shared workbook helpers and climate reference: `src/calc/velican/shared`

These modules are Excel/workbook-oracle code and donor domain logic. They do not replace the native `colonna` calculators in `src/calc`.

## Exports

Each block has an `index.ts` facade with `Velican`-prefixed exports, for example `calculateVelicanColumn` and `defaultVelicanColumnInputs`. This keeps oracle functions separate from native public functions.

## Smoke Tests

Run the VELICAN smoke checks with:

```bash
npm test -- src/calc/velican/velican-smoke.test.ts
```

Run the full project gate with:

```bash
npm run typecheck
npm test
npm run build
```

## Next Work

The next phase is not to merge these formulas into native calculators. First create verification cases that compare native outputs against VELICAN oracle outputs, generate discrepancy reports, and only then fix one documented mismatch at a time.
