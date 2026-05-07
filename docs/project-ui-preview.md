# Project UI Preview

The `Единое здание` tab is a technical preview for the future project-level
calculator. It proves that one shared `ProjectInput` can be mapped into all
calculation blocks and summarized as one building.

## Current Role

This is not the final product frontend. It is intentionally small and direct:
edit a few shared fields, recalculate, and inspect the resulting project summary
and first building specification.

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
- roof and wall loads;
- support crane enabled flag, capacity and rail level;
- max utilization and purlin min/max step.

Those fields are intentionally limited, but they already flow through the
ProjectInput mappers into several blocks.

## Calculation Flow

The tab uses:

- `calculateProjectWithSummary(projectInput)` for block results and totals;
- `buildBuildingSpecification(projectInput)` for the first aggregate
  specification table.

All six blocks are recalculated from the same `ProjectInput`:

- column
- truss
- purlin
- craneBeam
- windowRiegel
- beamCell

## Partial Areas

Some mapper notes and specification warnings are expected. Quantity, length and
unit mass are still partial in the first specification layer, so the UI shows
`—` for unknown values instead of inventing them.

The final frontend will come later, after the engineering data model and
specification quantities are stable.
