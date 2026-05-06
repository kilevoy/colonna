# Normalized Scenarios

Normalized scenarios are explicit native/oracle input pairs for fair diagnostics.

Default inputs from `colonna` and VELICAN come from different products and workbook histories. Comparing their outputs directly can produce false formula failures when the real cause is different terrain labels, roof construction names, step limits, prices, crane metadata, or missing fields.

## What Was Aligned

- Column: wind/snow loads, geometry, responsibility coefficient, terrain, roof type, span count, bracing, crane disabled state, crane metadata, and prices.
- Truss: span, frame step, roof slope, height, wind/snow, responsibility level, and roof construction label as far as the native/oracle contracts allow.
- Purlin: wind/snow, geometry, terrain, roof type, roof construction, snow bag settings, manual min/max step, max utilization, retention/barrier purlins, and supported steel prices.

## Remaining Gaps

Some fields remain missing or oracle-only because native input contracts do not expose them:

- City is oracle metadata; native fixtures use explicit `w0/Sg`.
- Purlin native input does not expose facade spacing, deck/profile sheet, tie installation, brace step, channel prices, or LSTK MP350/MP390 prices.
- Molodechno oracle uses `roofConstruction`; native truss also carries numeric `roofLoad_kPa`.

## Important Rule

This is not a formula fix. It does not change UI, native calculators, or VELICAN oracle code. It only makes the diagnostic comparison more honest.

After running normalized comparisons, review the remaining `FAIL` rows as candidates for focused engineering work, one block and one field at a time.
