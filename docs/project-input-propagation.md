# ProjectInput Propagation

The `Единое здание` tab edits one shared `ProjectInput`. The propagation tests
verify that shared fields are passed through mapper functions into block inputs
before any calculation is run.

## Covered Fields

The current tests cover:

- `climate.windLoadKpa` to column, purlin and window-riegel;
- `climate.snowLoadKpa` to column, purlin and truss;
- `geometry.buildingSpanM` to column, truss and beam-cell oracle metadata;
- `geometry.buildingLengthM` to column, purlin, beam-cell metadata and
  window-riegel metadata;
- `geometry.buildingHeightM` to purlin and window-riegel;
- `geometry.frameStepM` to column, truss, purlin and beam-cell;
- `geometry.facadePostStepM` to column and window-riegel;
- `roof.roofLoadKpa` to column, truss, purlin and beam-cell;
- `walls.wallLoadKpa` to column and window-riegel normalized input;
- support crane capacity to column and crane-beam.

## Partial Mappings

Some mappings are intentionally partial:

- Column height uses `geometry.columnHeightM`. `geometry.buildingHeightM` stays
  shared building geometry for purlin/window-riegel and other project-level
  consumers.
- Window-riegel keeps `wallLoadKpa`, opening width and steel in normalized input,
  but these are not direct VELICAN workbook inputs yet.
- Crane-beam receives support crane capacity and crane geometry, but the current
  wrapper does not expose direct `enabled` or rail-level fields. Those values are
  still mapped to the column input and documented in crane-beam mapping notes.
- Beam-cell receives building span and length as oracle metadata/raw input while
  its normalized span/step are based on frame step for the current wrapper.

## Relationship To UI

The UI is not the source of truth for propagation. The tests exercise mapper
functions directly. This keeps the `Единое здание` tab honest while allowing the
frontend to stay a thin technical preview.

Run:

```bash
npm test -- src/calc/project/project-propagation.test.ts
```
