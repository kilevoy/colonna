# Verification

This folder contains small, reusable primitives for comparing the native TypeScript calculators against Excel/workbook oracle outputs.

`VerificationCase` stores the input, expected values, source of truth, and tolerances for a single scenario. Use `source: "excel"` or `source: "velican-oracle"` for workbook-backed evidence. Use `source: "temporary-current-engine-baseline"` only as a short-lived regression snapshot before an Excel oracle is wired.

`compareWithTolerance(actual, expected, tolerance)` returns a simple `ok` or `fail` result and keeps the raw delta for reports.
