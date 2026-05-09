# Performance Oracle Isolation

Stage 8.7.2 isolated heavy VELICAN oracle blocks from the normal project
runtime. Stage 9.0 keeps that boundary and documents the native migration plan.
Stage 9.UI.1 keeps the same boundary while moving the `Единое здание` input UI
to step cards.

Normal mode rules:

- `calculateProject()` must not statically import VELICAN-backed
  `crane-beam`, `window-riegel` or `beam-cell` modules.
- `defaultProjectInput.calculationSettings.enableOracleBlocks` is `false`.
- Crane beam, window riegel and beam-cell remain skipped/warning project and
  specification rows in normal mode.
- Heavy oracle blocks may load only through explicit dynamic imports in the
  dev/oracle async path.
- The project UI edits draft state only. Toggling oracle mode or other fields
  must not run the heavy async path until the user presses `Рассчитать`.
- The frame card may expose `Считать тяжёлые oracle-блоки VELICAN`, but the
  default remains off.

Migration plan:

1. `windowRiegel` first: smaller scope, stable wrapper, lower migration risk.
2. `beamCell` second: medium complexity, but output/mass semantics need approval.
3. `craneBeam` last: highest risk because of wheel loads, duty group, fatigue,
   deflection and rail behavior.

VELICAN remains the verification oracle during migration. Native engines should
be introduced only after parity fixtures and acceptance evidence exist for the
specific block being migrated.

This document is informational. It does not change formulas, UI, runtime
behavior, acceptance tests, or VELICAN oracle modules.
