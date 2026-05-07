# Building Specification

`BuildingSpecification` is the first structured specification layer for the
project-level calculator. It is built from `ProjectInput` through
`calculateProjectWithSummary()` and returns a list of specification items grouped
by building block.

## Difference From Project Summary

`ProjectCalculationSummary` is a compact status and totals report. The
specification is closer to a future bill of materials: it has item ids, groups,
element names, profiles, steel, mass, cost, source block, notes, and warnings.

It is still intentionally lightweight. It is not a PDF, Excel export, protocol,
server object, or final commercial specification.

## Current Groups

The first version creates aggregate items for:

- columns
- trusses
- purlins
- craneBeams
- windowRiegels
- beamCells

Each item keeps the calculation source: `native` for native colonna blocks and
`velican-oracle` for blocks currently backed by VELICAN workbook/oracle wrappers.

## Quantity And Length

Some calculation outputs expose aggregate mass but do not yet expose reliable
quantity, member length, or per-unit mass for specification positions. In those
cases `quantity`, `lengthM`, and `unitMassKg` stay `null`.

This is deliberate. The specification must not invent engineering quantities.
Items with missing quantity or length are marked with `warning` and include a
note that aggregate mass from the calculation result is used.

## Totals

`totalMassKg` and `massByGroup` are calculated only from numeric item masses.
`totalCostRub` and `costByGroup` are calculated only from numeric item costs.
If a block does not expose cost yet, it is omitted from cost totals.

## Next Steps

The next engineering/product step is to refine quantities and lengths per group:

- derive frame and column counts safely;
- split truss members into specification positions;
- expose purlin line counts and total lengths;
- split window riegel lower/upper/side positions when the data is approved;
- then add export/protocol formatting on top of the structured data.
