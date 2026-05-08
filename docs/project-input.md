# Project Input

`ProjectInput` is the shared building input contract for the `Единое здание`
calculator. It feeds the project mappers and must stay backward compatible with
the existing block calculators.

## Stage 9.UI.1 UI Fields

The card configurator keeps the existing calculation fields and adds several
UI-safe fields:

- `projectInfo.buildingSystem?: "velikan"`
- `projectInfo.buildingEnvelope?: "cold" | "warm"`
- `roof.drainage?: "external" | "internal" | "notSpecified"`
- `openings?: { windows; doors; gates }`
- `projectCosts.design`

`buildingSystem` defaults to `velikan`. The UI currently shows only
`Система: Великан`.

`buildingEnvelope`, `roof.drainage`, `openings` and `projectCosts.design` are
informational in this stage. They do not change formulas, native engines,
VELICAN oracle wrappers, mappers or acceptance tests.

## Structure

`ProjectInput` contains:

- `projectInfo`: project name, customer, city, building system, building
  envelope and notes.
- `climate`: wind, snow, terrain, responsibility level/coefficient.
- `geometry`: span, length, height, roof slope, frame step, facade post step,
  column height, crane rail level.
- `roof`: roof type/shape, construction, load, manual-load flag, deck profile,
  snow bag mode, purlin flags and optional drainage.
- `walls`: wall construction/load, manual-load flag and window opening metadata.
- `openings`: UI list of windows, doors and gates for future specification work.
- `cranes`: support crane and hanging crane data.
- `materials`: preferred steel/material choices for each block.
- `prices`: common rub/ton prices for rolled steel, tubes, channels and LSTK.
- `projectCosts`: UI project cost inputs, currently design cost only.
- `calculationSettings`: max utilization, purlin step limits, purlin system
  preference, deflection limit and oracle backend flags.

## Manual Loads

Roof and wall construction names/loads use the shared envelope construction
catalog. Selecting a construction updates the numeric load from the catalog and
sets the internal manual-load flag to `false`.

Editing the numeric roof or wall load sets the internal manual-load flag to
`true`. The UI no longer exposes manual-load checkboxes.

## Calculation Flow

Input cards edit draft project state only. Project calculation and
specification building happen only after the user presses `Рассчитать`.

`calculateProject(project)` is the fast normal path. It maps all block inputs,
runs native column/truss/purlin, and marks crane beam/window riegel/beam-cell as
skipped without importing VELICAN modules.

`calculateProjectAsync(project)` is the explicit dev/oracle path. It loads
VELICAN-backed modules through dynamic imports only when `enableOracleBlocks`
and the corresponding per-block flag are enabled.
