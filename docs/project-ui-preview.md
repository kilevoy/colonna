# Project UI Preview

The `Единое здание` tab is a technical preview for the future project-level
calculator. It proves that one shared `ProjectInput` can be mapped into all
calculation blocks and summarized as one building.

## Current Role

This is not the final product frontend. It is intentionally small and direct:
edit a few shared fields, press `Рассчитать`, and inspect the resulting project
summary and first building specification.

The older tabs remain available as legacy/debug previews:

- Колонна
- Ферма
- Прогоны
- Подкрановая балка
- Оконный ригель
- Балка покрытия

## Editable Shared Fields

The preview currently exposes:

- project name and city;
- wind load, snow load and terrain type;
- span, length, height, roof slope, frame step and facade post step;
- roof construction and roof load;
- wall construction and wall load;
- support crane enabled flag, capacity and rail level;
- max utilization and purlin min/max step.

Those fields are intentionally limited, but they already flow through the
ProjectInput mappers into several blocks.

Roof and wall construction options come from the same catalog that the legacy
column tab uses for `Конструкция покрытия` and `Конструкция ограждения`.
Changing the construction updates the kPa value from that shared catalog and
turns manual mode off. Editing the numeric load turns manual mode on
automatically. When a load is manual, the UI shows `Вернуть из справочника` to
restore the catalog value.

The manual-load checkboxes are not shown in the UI anymore; the flags remain in
`ProjectInput` as internal state.

## Calculation Flow

The tab uses:

- `calculateProjectWithSummary(projectInput)` for block results and totals;
- `buildBuildingSpecification(projectInput)` for the first aggregate
  specification table.

All six blocks are recalculated from the same `ProjectInput` only when the user
presses `Рассчитать` or `Сбросить`:

- column
- truss
- purlin
- craneBeam
- windowRiegel
- beamCell

Changing input fields updates only `draftProjectInput`, so heavy oracle-backed
calculations do not run on every keystroke.

## Partial Areas

Some mapper notes and specification warnings are expected. Quantity, length and
unit mass are still partial in the first specification layers, so the UI shows
`—` for unknown values instead of inventing them.

The final frontend will come later, after the engineering data model and
specification quantities are stable.
