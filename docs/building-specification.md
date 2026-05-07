# Building Specification

`BuildingSpecification` is the first structured specification layer for the
project-level calculator. It is built from `ProjectInput` through
`calculateProjectWithSummary()` and returns a list of specification items grouped
by building block.

Quantity rules now use `BuildingLayout` as the shared structural-layout source
for columns, main trusses, end roof beams, and end fakhverk columns.
Purlins now use `PurlinLayout` for preliminary line/piece counts and total
length.

## Difference From Project Summary

`ProjectCalculationSummary` is a compact status and totals report. The
specification is closer to a future bill of materials: it has item ids, groups,
element names, profiles, steel, mass, cost, source block, notes, and warnings.

It is still intentionally lightweight. It is not a PDF, Excel export, protocol,
server object, or final commercial specification.

## Current Groups

The specification creates items for:

- columns, now split into:
  - `columns.edge`;
  - `columns.endFakhverk`;
  - `columns.middle`, only for multi-span layouts;
  - `columns.aggregate`, preserving total column mass/cost;
- trusses
- purlins, with preliminary `PurlinLayout` quantity/length
- craneBeams
- windowRiegels
- beamCells

Each item keeps the calculation source: `native` for native colonna blocks and
`velican-oracle` for blocks currently backed by VELICAN workbook/oracle wrappers.

Beam-cell specification is split into:

- `beamCells.endRoofBeams`: quantity-only end roof beams from `BuildingLayout`;
- `beamCells.aggregate`: aggregate mass/cost from the current beam-cell
  calculation result.

## Quantity And Length

The specification now has a first conservative quantity derivation layer in
`src/calc/specification/quantity-rules.ts`.

Implemented preliminary rules:

- `frameCount = floor(buildingLengthM / frameStepM) + 1`;
- columns: split by the column specification layer:
  - edge columns for interior frames;
  - end fakhverk posts across both end walls;
  - middle columns for multi-span layouts;
- trusses: `BuildingLayout.mainTrussQuantity`, so main trusses are counted only
  on interior axes;
- crane beams: `2` runway beams along building length when support crane is enabled.
- end roof beams: `BuildingLayout.endRoofBeamQuantity`, currently quantity-only.
- purlins: `PurlinLayout.totalPieces`, `pieceLengthM` and `totalLengthM`.

For trusses and enabled crane beams `unitMassKg` and `unitPriceRub` are derived
from aggregate totals when quantity is greater than zero.

Column group masses are intentionally not split yet. The detailed column groups
carry quantity/geometry, while `columns.aggregate` carries the calculation mass
and cost so totals are not lost or duplicated.

Beam-cell mass is also not multiplied by end roof beam quantity. The detailed
end-roof-beam row carries quantity only, while `beamCells.aggregate` keeps the
calculation mass/cost. This avoids double counting until beam-cell output
semantics are approved.

Purlin mass is not recalculated from the preliminary layout. The purlin row uses
layout quantity/length for specification and keeps aggregate mass from the
selected purlin calculation result. The selected system is preliminary and
preserves the `sortSteel` / `MP350` / `MP390` alternatives for later UI choice.

Some calculation outputs still expose aggregate mass but do not yet expose
reliable quantity, member length, or per-unit mass. In those cases values stay
`null`.

This is deliberate. The specification must not invent engineering quantities.
Items with preliminary or missing quantity/length are marked with `warning` and
include notes/warnings explaining the rule.

## Totals

`totalMassKg` and `massByGroup` are calculated only from numeric item masses.
`totalCostRub` and `costByGroup` are calculated only from numeric item costs.
If a block does not expose cost yet, it is omitted from cost totals.

## Next Steps

The next engineering/product step is to refine quantities and lengths per group:

- derive frame and column counts safely;
- split column mass between edge/fakhverk/middle groups after engineering rules
  are approved;
- split truss members into specification positions;
- refine purlin line counts, overlaps, stock lengths and system choice;
- split window riegel lower/upper/side positions when the data is approved;
- then add export/protocol formatting on top of the structured data.
