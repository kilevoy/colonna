# Verification Pipeline

Excel is the engineering source of truth for parity work. VELICAN will be connected as the Excel/workbook oracle for column, truss, purlin, crane beam, window riegel, and beam-cell blocks.

`temporary-current-engine-baseline` is not Excel. Use it only to freeze the current native TypeScript behavior before an Excel oracle is available, and replace it with `excel` or `velican-oracle` evidence as soon as possible.

## Structure

- `src/calc/debug/` wraps native calculators and exposes intermediate debug fields.
- `src/calc/verification/` contains `VerificationCase`, tolerances, and comparison helpers.
- `src/calc/oracle/` defines the Excel oracle interface. It does not contain copied workbook formulas.
- `scripts/` contains current command-line oracle and verification utilities.

## Adding a Verification Case

1. Choose the block: `column`, `truss`, `purlin`, `crane_beam`, `window_riegel`, or `beam_cell`.
2. Capture input exactly as the app/debug wrapper expects it.
3. Capture expected values from Excel or VELICAN oracle output.
4. Set field-level tolerances for numeric outputs.
5. Compare native output to expected values with `compareWithTolerance`.
6. Fix only one documented discrepancy at a time.

Example shape:

```ts
const verificationCase = {
  caseId: "column-default-001",
  title: "Default fachwerk column",
  block: "column",
  source: "excel",
  input,
  expected: { final_N_kN: 63.79, final_M_kNm: 143.9 },
  tolerances: { final_N_kN: 0.01, final_M_kNm: 0.01 },
};
```

## Commands

- `npm run typecheck` checks the app code.
- `npm test` runs Vitest tests.
- `npm run build` checks production build.
- `npm run verify` runs `typecheck`, tests, and build.
- `npm run verify:all` also runs the current legacy verification scripts.

Column Excel oracle:

```bash
COLUMN_XLSX=/path/to/source.xlsx npm run verify:columns:compare
```

Purlin Excel oracle:

```bash
PURLIN_XLSX=/path/to/source.xlsx python scripts/excel_oracle_purlin.py
```

Oracle scripts require `openpyxl` and LibreOffice CLI. If they are missing, record that blocker and do not change formulas based only on assumptions.
