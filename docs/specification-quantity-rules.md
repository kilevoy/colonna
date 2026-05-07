# Specification Quantity Rules

`BuildingSpecification` now includes a conservative quantity and layout layer.
The structural quantities for columns, main trusses, end roof beams, and end
fakhverk posts come from `src/calc/layout/build-building-layout.ts`.

Local helpers in `src/calc/specification/quantity-rules.ts` still cover blocks
whose quantities are not yet layout-driven.

## Implemented Rules

### Frame Count

If `buildingLengthM > 0` and `frameStepM > 0`:

`frameCount = floor(buildingLengthM / frameStepM) + 1`

This is a preliminary geometric count based only on length and frame step.

### Columns

Column quantities are now handled by `column-specification.ts` rather than a
single aggregate rule.

Implemented column groups:

- `columns.edge`: edge columns on interior frames;
- `columns.endFakhverk`: end-wall fakhverk posts across the span;
- `columns.middle`: middle columns when span count is greater than one;
- `columns.aggregate`: aggregate mass/cost from the column calculation result.

Detailed group masses are not derived yet. This keeps the specification honest:
quantity and geometry are split, but total column mass/cost remain in the
aggregate item until approved rules exist.

### Trusses

Main truss quantity is sourced from `BuildingLayout.mainTrussQuantity`:

`mainTrussQuantity = interiorFrameCount * spanCount`

`lengthM = buildingSpanM`

This intentionally counts main trusses only on interior axes. End axes are
represented by end fakhverk and end roof beams.

### End Roof Beams

End roof beam quantity is sourced from `BuildingLayout.endRoofBeamQuantity`:

`endRoofBeamQuantity = 2 * spanCount`

This is quantity-only. Beam-cell mass remains in `beamCells.aggregate` and is
not multiplied by this quantity yet.

### Crane Beams

If `supportCrane.enabled = true`:

`quantity = 2`

`lengthM = buildingLengthM`

This assumes two runway beams along the building length. It does not yet account
for runway segmentation, end stops, multiple crane aisles, or special crane
layout.

If `supportCrane.enabled = false`, quantity is set to `0`. The oracle preview
can still return an aggregate result, but the item is not included as a building
quantity.

## Intentionally Incomplete

### Column Mass Split

Edge, end fakhverk, and middle column groups have preliminary quantities and
heights, but `totalMassKg` stays `null`. The aggregate column item keeps the
calculation mass/cost so totals are preserved without double counting.

### Purlins

`lengthM` uses `buildingLengthM` as a preliminary longitudinal reference, but
`quantity` remains `null`.

Purlin line count needs reliable roof geometry, purlin spacing, edge zones,
snow-retention/barrier rules, and layout data. It is better to leave this
explicitly incomplete than to invent a count.

### Window Riegels

`quantity` and `lengthM` remain `null` because opening count and opening layout
are not part of `ProjectInput` yet.

### Beam Cells

`beamCells.endRoofBeams` has layout quantity and preliminary length, but mass is
`null`.

`beamCells.aggregate` keeps the beam-cell calculation mass/cost with
`quantity = null`.

This prevents double counting while the beam-cell output semantics are still
being clarified.

## Unit Values

When an item has numeric `totalMassKg` and `quantity > 0`:

`unitMassKg = totalMassKg / quantity`

When an item has numeric `totalCostRub` and `quantity > 0`:

`unitPriceRub = totalCostRub / quantity`

These are specification-level derived values, not changes to engineering
formulas.

## Next Step

The next useful step is to add explicit layout inputs:

- frame layout and special end frames;
- purlin line count / roof-zone layout;
- opening schedule for window riegels;
- beam-cell placement rules.
