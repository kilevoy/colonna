# Purlin Layout

`PurlinLayout` is a preliminary quantity/length layer for roof purlins. It does
not change native purlin formulas, VELICAN oracle logic, profile checks, mass
calculation, or acceptance tests.

## Purpose

The purlin calculation block can expose alternatives:

- `sortSteel`;
- `mp350`;
- `mp390`.

The specification should not collapse those systems into an unnamed aggregate.
`PurlinAlternativesSummary` selects the system, while `PurlinLayout` derives a
first layout for specification quantities.

## Roof Shape

Roof shape is resolved from `ProjectInput.roof.roofShape` when available:

- `gable`;
- `singleSlope`.

If `roofShape` is absent, the layer falls back to `roof.roofType`. Unknown shape
uses gable as a preliminary default and records a warning.

## Slope Length

For gable roofs:

`slopeLengthM = (buildingSpanM / 2) / cos(roofSlopeDeg)`

For single-slope roofs:

`slopeLengthM = buildingSpanM / cos(roofSlopeDeg)`

## Purlin Step

The preferred source is the selected purlin calculation result:

- `sortSteel` uses hot-rolled candidate spacing;
- `mp350` uses the best MP350 candidate spacing;
- `mp390` uses the best MP390 candidate spacing.

If the current calculation result does not expose the selected system, the layer
uses `ProjectInput.calculationSettings.purlinMaxStepMm / 1000` and records a
warning. This is a layout fallback, not a strength formula.

## Lines And Pieces

For gable roofs:

- `purlinLinesPerSlope = ceil(slopeLengthM / purlinStepM) + 1`;
- `totalPurlinLines = purlinLinesPerSlope * 2`.

For single-slope roofs:

- `totalPurlinLines = purlinLinesPerSlope`.

The line count includes eave/ridge edge lines as a preliminary layout rule.

Along the building length:

- `frameBayCount = BuildingLayout.frameCount - 1`;
- `piecesPerLine = frameBayCount`;
- `totalPieces = totalPurlinLines * piecesPerLine`.

If building length is divisible by frame step, `pieceLengthM = frameStepM` and:

`totalLengthM = totalPieces * pieceLengthM`

If the last bay is adjusted, `pieceLengthM = null`, but:

`totalLengthM = totalPurlinLines * buildingLengthM`

## Selected System

`ProjectInput.calculationSettings.purlinSystemPreference` controls selection:

- `auto`: uses `PurlinAlternativesSummary` preliminary auto selection;
- `sortSteel`;
- `mp350`;
- `mp390`.

The `Единое здание` technical UI now exposes this preference, but it still only
updates draft state. Recalculation happens after pressing `Рассчитать`.

## Specification

`BuildingSpecification` now uses `PurlinLayout` for `purlins.main`:

- `quantity = totalPieces`;
- `lengthM = pieceLengthM` when all pieces have the same length;
- `totalLengthM = totalLengthM`;
- profile and mass are taken from the selected `PurlinAlternative` where
  available.

Mass is still taken from the calculation result. It is not recomputed from
layout length. This preserves engineering parity and keeps the layout layer as a
specification helper.

The project specification UI and markdown formatter display `totalLengthM` as
the overall length column. For purlins, this means:

- `quantity` is the number of purlin pieces;
- `lengthM` is the length of one piece when all pieces are equal;
- `totalLengthM` is the total roof-purlin meterage, including adjusted last-bay
  layouts where individual piece lengths are not uniform.

Excel/VELICAN remains an oracle/reference for workbook-backed calculations, but
this layout does not blindly import rough workbook estimate formulas.
