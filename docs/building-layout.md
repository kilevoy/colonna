# Building Layout

`BuildingLayout` is the first structural-layout layer for the project-level
calculator. It derives a preliminary calculation scheme from `ProjectInput`
without changing engineering formulas or multiplying masses.

The implementation lives in `src/calc/layout/`.

## Axes

If `buildingLengthM > 0` and `frameStepM > 0`:

`frameCount = floor(buildingLengthM / frameStepM) + 1`

Axes are built along the building length:

- first axis: `end`;
- last axis: `end`;
- every axis between them: `interior`.

If the length is not divisible by frame step, the last axis is still placed at
`buildingLengthM` and the layout adds a warning:

`Building length is not divisible by frame step; last bay has adjusted spacing.`

## Main Trusses

Main trusses are counted on interior axes only:

`mainTrussQuantity = interiorFrameCount * spanCount`

This follows real KM modeling more closely: end axes are not automatically
treated as full main truss frames.

## End Roof Beams

End roof beams are counted separately:

`endRoofBeamQuantity = 2 * spanCount`

This is quantity-only. The current beam-cell output is an oracle-backed
aggregate, and its mass semantics are not multiplied by layout yet.

## Columns

Edge columns:

`edgeColumnQuantity = interiorFrameCount * 2`

Middle columns:

`middleColumnQuantity = interiorFrameCount * (spanCount - 1)` when
`spanCount > 1`, otherwise `0`.

End fakhverk columns use the same preliminary cross-span layout as the column
specification layer:

- points from `0` to `buildingSpanM` by `facadePostStepM`;
- `buildingSpanM` is always included;
- quantity is `pointsCount * 2` for two end walls.

Longitudinal fakhverk is intentionally out of scope for this first version.

## Relationship To Specification

`BuildingLayout` is now used by `BuildingSpecification` as the quantity source
for:

- main trusses;
- end roof beams;
- edge columns;
- middle columns;
- end fakhverk columns.

The specification still does not multiply beam-cell mass. It creates a
quantity-only `beamCells.endRoofBeams` row and keeps current beam-cell
calculation mass/cost in `beamCells.aggregate`.

## Scope Boundaries

This layer does not:

- change native engines;
- change VELICAN oracle wrappers;
- change UI;
- change acceptance tests;
- count end roof beams as full trusses;
- multiply beam-cell mass;
- model longitudinal fakhverk.
