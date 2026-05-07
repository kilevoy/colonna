# Project Envelope Constructions

`ProjectInput` uses the same construction catalog that the column block uses for:

- `Конструкция покрытия`;
- `Конструкция ограждения`.

The shared source is `src/data/structures/structures.json`, exposed through
`src/calc/shared/envelope-constructions.ts`.

## Shared API

The shared module exports:

- `roofConstructionOptions`;
- `wallConstructionOptions`;
- `getRoofConstructionLoadKpa(id)`;
- `getWallConstructionLoadKpa(id)`.

The options preserve the existing ids and kPa values from the column UI. No new
engineering variants were invented.

## ProjectInput Fields

`ProjectInput.roof` contains:

- `roofConstruction`;
- `roofLoadKpa`;
- `useManualRoofLoad`.

`ProjectInput.walls` contains:

- `wallConstruction`;
- `wallLoadKpa`;
- `useManualWallLoad`.

Selecting a construction always updates the corresponding load from the shared
catalog and turns manual mode off. Editing the numeric load turns manual mode on
automatically.

## UI Behavior

The `Единое здание` tab shows:

- construction select for roof;
- numeric roof load;
- load source status for roof;
- `Вернуть из справочника` action when the roof load is manual;
- construction select for walls;
- numeric wall load;
- load source status for walls;
- `Вернуть из справочника` action when the wall load is manual.

The manual-load checkboxes are intentionally hidden from the UI. Manual mode is
still preserved in `ProjectInput`: it turns on when the user edits a numeric
load, and turns off when the user selects a construction or presses
`Вернуть из справочника`.

These fields edit only `draftProjectInput`. Heavy project calculation still runs
only after pressing `Рассчитать`.

## Mapper Usage

Current direct/partial usage:

- column receives roof/wall construction and roof/wall loads directly;
- truss receives roof construction/load directly;
- purlin receives roof construction/load directly;
- beam-cell receives roof load directly and keeps roof construction in normalized
  extra options;
- window-riegel keeps wall construction/load in normalized input/extra options.

Window-riegel and beam-cell oracle workbooks do not yet consume every envelope
field directly, so their mappings remain partially documented through mapping
notes.
