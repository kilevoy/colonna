# Project UI Preview

## Stage 9.UI.1 Card Configurator

The `Единое здание` tab is now a step-by-step building configurator. The input
area is split into cards:

1. `Район строительства`
2. `Габариты здания`
3. `Каркас: система Великан`
4. `Стены`
5. `Кровля`
6. `Окна, двери, ворота`
7. `Проектирование`
8. `Расчёт и спецификация`

Each card has a step number, status, collapse control and short summary. The
first card opens by default. The UI uses a warm orange accent, but keeps the
existing calculation model and result tables.

## Draft And Calculated State

All input cards edit `draftProjectInput` only. `calculateProjectWithSummary()` or
`calculateProjectWithSummaryAsync()` runs only after the user presses
`Рассчитать`.

The summary, building specification and `Варианты прогонов` table are tied to
the last `calculatedProjectInput`. If the user changes a select or numeric field
without pressing `Рассчитать`, the UI shows the pending-changes warning and keeps
displaying the previous calculated result.

## Building System

Only `Система: Великан` is active. `projectInfo.buildingSystem` defaults to
`velikan`. Other building systems are not exposed in this stage, so there is no
separate system-selection card.

The combined `Каркас: система Великан` card lists columns, `Балки покрытия`,
roof purlins, end fakhverk, bracing/spacers and skipped oracle-only blocks. This
is presentation-only and does not rename internal calculation keys.

## Roof, Walls And Purlins

Roof and wall construction selects continue to use the shared envelope catalog.
Selecting a construction updates the load from the catalog and resets the
manual-load flag. Editing the numeric load turns manual mode on and shows
`Ручная нагрузка` plus `Вернуть из справочника`.

The roof card keeps `Система прогонов`: `Авто`, `Сортовой металл`, `ЛСТК MP350`
and `ЛСТК MP390`. The select changes draft state only. The purlin alternative
table remains in the final calculation card and displays the last calculated
alternatives.

## Informational UI Fields

The stage adds UI-safe fields that are not connected to engineering formulas:

- `projectInfo.buildingEnvelope`
- `roof.drainage`
- `openings`
- `projectCosts.design`

Openings are captured for future specification work. Design cost is shown as a
separate UI total and is not added to engineering metal-frame totals.

## Oracle Blocks

`calculationSettings.enableOracleBlocks` remains `false` by default. In normal
mode the project path stays fast: column, truss and purlin use native paths,
while crane beam, window riegel and beam-cell stay skipped/warning.

When oracle mode is enabled in the frame card and the user presses `Рассчитать`,
the UI uses the async calculation path. Heavy VELICAN-backed modules must remain
dynamic imports only.

## Specification

The final card keeps:

- `ProjectCalculationSummary`
- `Building Specification`
- `Варианты прогонов`
- warnings and mapping notes

The specification still includes `Общая длина, м` from
`SpecificationItem.totalLengthM`, especially for `purlins.main`.
