# Native vs VELICAN Comparison

The comparison layer is a diagnostic tool. It compares current native `colonna` calculators against the migrated VELICAN oracle/domain layer and reports differences without changing formulas.

VELICAN is currently treated as an Excel/workbook oracle and donor calculation layer. A comparison result is evidence for engineering review, not an automatic instruction to replace native logic.

## Statuses

- `ok`: values match within tolerance.
- `fail`: both values are comparable, but the delta is outside tolerance.
- `missing-native-field`: native `colonna` output does not expose the requested field.
- `missing-oracle-field`: VELICAN oracle output does not expose the requested field.
- `not-comparable`: both sides expose something, but the engineering meaning is not aligned enough for a direct numeric/text comparison.

## Running

```bash
npm test -- src/calc/verification/comparison.test.ts
```

The full project gate remains:

```bash
npm run typecheck
npm test
npm run build
npm run verify
```

## Current Parity Status

- Purlins: key normalized parity is achieved and protected by acceptance tests.
- Columns: loads, cranes, forces, profile, mass, and normalized cost parity are
  achieved and protected by acceptance tests.
- Trusses: normalized comparison is accepted with `12 ok`, `0 fail`, and `2
  not-comparable` utilization fields documented in `docs/truss-acceptance.md`.

## Next Step

Do not fix formulas from this report in bulk. The next engineering stage is to review one block, choose one failed field or one missing mapping, confirm the workbook source of truth, and only then make a focused calculation change.
