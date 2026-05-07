# Project Input

`ProjectInput` is the first shared building input contract for `colonna`.

The goal is architectural: every calculation block should eventually calculate
the same building instead of carrying isolated default inputs. This stage does
not change UI, formulas, acceptance tests, persistence, PDF export, or server
behavior.

## Structure

`ProjectInput` contains:

- `projectInfo`: project name, customer, city, notes.
- `climate`: wind, snow, terrain, responsibility level/coefficient.
- `geometry`: span, length, height, roof slope, frame step, facade post step,
  column height, crane rail level.
- `roof`: roof type/shape, construction, roof load, manual roof load flag, deck
  profile, snow bag mode, snow retention and barrier purlin flags.
- `walls`: wall construction/load, manual wall load flag and window opening
  metadata.
- `cranes`: support crane and hanging crane data.
- `materials`: preferred steel/material choices for each block.
- `prices`: common rub/ton prices for rolled steel, tubes, channels and LSTK.
- `calculationSettings`: max utilization, purlin step limits, preliminary
  purlin system preference, deflection limit, and oracle backend flags for new
  blocks.

## Mappers

The project layer exposes adapters:

- `mapProjectToColumnInput`
- `mapProjectToTrussInput`
- `mapProjectToPurlinInput`
- `mapProjectToCraneBeamInput`
- `mapProjectToWindowRiegelInput`
- `mapProjectToBeamCellInput`

Each mapper returns `{ input, mappingNotes, warnings }`. Direct mappings are
applied where the target calculation module supports the field. Partial mappings
are kept explicit through notes instead of inventing engineering values.

## Direct Mappings

Column, truss and purlin map the shared climate, geometry and roof load fields
directly into the native calculators.

`PurlinLayout` also reads `roof.roofShape` / `roof.roofType`,
`calculationSettings.purlinSystemPreference`, purlin step limits and
`BuildingLayout` to derive preliminary purlin quantity and total length for the
building specification. This does not change purlin formulas.

Roof and wall construction names/loads use the shared envelope construction
catalog from the legacy column block. Selecting a construction updates the
numeric load from the catalog; editing the numeric load turns the internal
manual-load flag on.

Crane beam maps support crane capacity, span, wheel data, rail, duty group and
price metadata into the oracle wrapper.

Window riegel maps opening height, frame step, wind, terrain, building height and
window workbook metadata into the oracle wrapper.

Beam cell maps frame step/span, roof load, steel and price metadata into the
oracle wrapper.

## Partial Mappings

Some project fields exist before every block supports them directly:

- LSTK MP350/MP390 prices are not native purlin input fields yet.
- Window riegel keeps opening width, wall load and steel as normalized metadata.
- Beam cell keeps snow, wind, roof slope and deflection limit as normalized
  metadata.
- Crane beam keeps explicit wheel load, trolley/crane mass, steel and deflection
  limit as normalized metadata where the current VELICAN wrapper does not expose
  direct workbook input cells.

## Project Calculation

`calculateProject(project)` maps all block inputs and runs:

- native column calculation;
- native truss calculation;
- native purlin calculation;
- VELICAN oracle-backed crane beam;
- VELICAN oracle-backed window riegel;
- VELICAN oracle-backed beam cell.

If a block fails, the project calculation records a warning for that block
instead of failing the whole project.

## Next Step

The UI still uses existing independent tabs. The next product-oriented stage can
build unified building specification and then move UI state onto `ProjectInput`.
