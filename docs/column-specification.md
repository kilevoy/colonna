# Column Specification

Column specification is now split into preliminary column groups instead of one
coarse `columns.main` item.

This is a specification/layout layer only. It does not change native column
formulas, VELICAN oracle output, profile selection, mass calculation, or
acceptance tests.

## Column Groups

### Edge Columns

Item id: `columns.edge`

Label: `Крайние колонны основных рам`

Quantity is derived from interior frames:

`interiorFrameCount = max(frameCount - 2, 0)`

`quantity = interiorFrameCount * 2`

The note follows the insi-next preliminary layout idea: edge columns are derived
for interior frames, while end frames are represented by end fakhverk posts.

For the current `defaultProjectInput`:

- `frameCount = 11`;
- `interiorFrameCount = 9`;
- `edge quantity = 18`.

### End Fakhverk

Item id: `columns.endFakhverk`

Label: `Фахверковые колонны торцов`

End fakhverk posts are placed across the building span using
`geometry.facadePostStepM`. The last point is always forced to
`buildingSpanM`.

For the current default span `24 m` and facade step `6 m`:

- points: `0, 6, 12, 18, 24`;
- quantity per point: `2`, because there are two end walls;
- total quantity: `10`.

If the facade post step does not divide the span exactly, the last bay is
adjusted and a warning is added.

### Middle Columns

Item id: `columns.middle`

Label: `Средние колонны`

Middle columns are emitted only for multi-span layouts.

For numeric span counts:

- `spanCount = 1`: no middle columns;
- `spanCount = 2`: one middle line, quantity `interiorFrameCount * 1`;
- `spanCount = 3`: two middle lines, quantity `interiorFrameCount * 2`.

This improves the earlier binary "single / multi" idea by supporting numeric
span counts inside the specification helper. The current public `ProjectInput`
still uses the existing span type, so numeric span counts are a layout-extension
path for future work.

### Aggregate Column Mass

Item id: `columns.aggregate`

Label: `Колонны, агрегированная масса`

The calculation result currently exposes aggregate column mass and cost, but it
does not expose a reliable split between edge, end fakhverk, and middle groups.
To avoid inventing group masses, the detailed groups have `totalMassKg = null`
and the aggregate item keeps the total column mass/cost for specification
totals.

## Column Height By X

`resolveColumnHeightAtX(project, xM)` derives a preliminary column height from
building span, building height, and roof slope.

For mono/shed roofs:

`height = buildingHeightM + xM * tan(slope)`

For gable or unknown roof type:

`height = buildingHeightM + min(xM, buildingSpanM - xM) * tan(slope)`

Unknown roof types default to the gable scheme.

## Known Gaps

The current layer does not yet model:

- longitudinal fakhverk;
- doors, gates, or opening interruptions;
- different profiles for fakhverk and main columns;
- crane columns and stepped columns;
- special end frames;
- exact group mass split.

Those should be added as explicit layout inputs before the specification becomes
a production bill of materials.
