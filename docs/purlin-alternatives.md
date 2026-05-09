# Purlin Alternatives

`PurlinAlternativesSummary` keeps the purlin systems as separate specification
choices:

- `sortSteel` - hot-rolled steel;
- `mp350` - LSTK MP350;
- `mp390` - LSTK MP390.

This preserves the important `insi-next` idea that purlins are alternatives, not
one unnamed result.

## Model

Each `PurlinAlternative` contains:

- system and label;
- selected profile;
- step in mm;
- utilization;
- mass and cost when available;
- status, notes and warnings.

The alternative model is separate from `PurlinLayout`:

- `PurlinLayout` owns quantity, piece length and total length;
- `PurlinAlternative` owns profile, system, utilization, mass and cost.

Mass is taken from the existing native purlin calculation result. It is not
recalculated from layout length.

## Sources

`buildPurlinAlternatives(projectInput, purlinResult)` uses the existing native
purlin engine:

- sortSteel uses the rolled-steel branch;
- MP350 and MP390 use the LSTK branch.

No purlin formulas, candidate checks, native engine code, VELICAN oracle code, or
acceptance tests are changed by this layer.

## Selection

`ProjectInput.calculationSettings.purlinSystemPreference` controls selection:

- `sortSteel`: force hot-rolled steel;
- `mp350`: force LSTK MP350;
- `mp390`: force LSTK MP390;
- `auto`: preliminary automatic choice.

The current auto rule is intentionally simple:

1. choose MP350 if available;
2. otherwise MP390 if available;
3. otherwise sortSteel if available;
4. otherwise first non-missing alternative.

Optimization by cost, mass, supply constraints or engineering policy is a later
stage.

## UI

The `Единое здание` technical tab exposes a simple `Система прогонов` select.
Changing it updates only `draftProjectInput`; calculation still runs only after
pressing `Рассчитать`.

The same tab now shows `Варианты прогонов` after calculation. The table has one
row for each alternative:

- `Сортовой металл`;
- `ЛСТК MP350`;
- `ЛСТК MP390`.

The table shows system, status, profile, step in mm, utilization, mass, cost and
notes/warnings. Unknown values are displayed as `—`. The selected system is
marked directly in the status cell with `Выбрано`.

The table is based on the last calculated project result. Changing the select
updates only the draft input and the warning about pending changes is shown; the
table and specification stay on the previous calculated result until the user
presses `Рассчитать`.

The current `auto` mode is preliminary. Optimization by mass, cost, supply
constraints or engineering policy is planned for a later stage.
