# Project Summary

`ProjectCalculationSummary` is a compact building-level summary built on top of
`calculateProject()`. It does not replace engineering results, detailed debug
reports, acceptance tests, or a future bill of materials. Its job is to collect
the current block outputs into one predictable object.

## What It Contains

The summary contains one `ProjectBlockStatus` for each block:

- column
- truss
- purlin
- craneBeam
- windowRiegel
- beamCell

For every block it records status, calculation source, selected profiles, mass,
cost, utilization, warnings, and notes. Native blocks keep source `native`.
Oracle-wrapper blocks keep source `velican-oracle`.

## Mass And Cost

`totalMassKg` is calculated only from blocks that expose a numeric mass. Missing
mass is not invented.

`totalCostRub` is calculated only from blocks that expose a numeric cost in
rubles. If a block has `costRub = null`, it is excluded from the total and the
field is recorded in `incompleteFields`.

Column legacy `cost_rub` is stored as thousand rubles in the native result.
`ProjectSummary` normalizes it to rubles before including it in `totalCostRub`.

## What This Is Not

This is not a full specification. It does not split steel into bill-of-material
positions, does not produce PDF/export files, and does not change formulas or
block inputs.

The next product layer should be a Building Specification that turns accepted
block results into explicit positions, quantities, units, prices, and protocol
notes.

## Usage

```ts
import { calculateProjectWithSummary, defaultProjectInput } from "./calc/project";

const { result, summary } = calculateProjectWithSummary(defaultProjectInput);
```

For a simple text report:

```ts
import { formatProjectSummaryMarkdown } from "./calc/project";

const markdown = formatProjectSummaryMarkdown(summary);
```
