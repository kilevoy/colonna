# Native vs VELICAN Input Comparison

The input comparison layer checks whether native `colonna` calculators and VELICAN oracle calculators are being run with equivalent source data.

This is a prerequisite for formula work. A calculation comparison `FAIL` is not proof of a formula bug while the input comparison still contains `different`, `missing-native-input`, `missing-oracle-input`, or `not-comparable` rows.

## Statuses

- `ok`: the mapped native and oracle inputs match exactly.
- `different`: both sides expose mapped values, but they differ.
- `missing-native-input`: native input does not expose the mapped field.
- `missing-oracle-input`: oracle input does not expose the mapped field.
- `not-comparable`: both sides have related information, but not in the same form.

## Workflow

1. Run input comparison.
2. Align scenario inputs or document why a field cannot be aligned.
3. Re-run native vs VELICAN calculation comparison.
4. Only then fix formula differences one field and one block at a time.

## Commands

```bash
npm test -- src/calc/verification/input-comparison.test.ts
npm run verify
```

The comparison is diagnostic only. It does not change formulas, UI, native calculators, or VELICAN oracle code.
