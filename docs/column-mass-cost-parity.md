# Column Mass/Cost Parity

Stage 4.3 finishes normalized column parity after loads, cranes, forces, and selected profile were aligned.

## Limiting Check

The remaining profile failure was text-only:

- native: `по sigma уст X`
- oracle: `по sigm уст X`

Comparison now uses `normalizeCheckName()`, which normalizes sigma spellings, whitespace, and case. Native calculation output is not changed.

## Mass

The mass mismatch was a workbook formula mismatch.

Before:

- native column mass: `unitMass * height`
- native brace mass: `12 kg/m * spacing * 1.15 * braceCount`

Workbook/oracle:

- column mass: `unitMass * height * 1.15`
- brace mass: `9.6 kg/m * spacing * 1.15 * braceCount`

For the normalized first option:

- profile: `kv.200x7`
- steel: `C345`
- unit mass: `41.4 kg/m`
- height: `11.5 m`
- brace count: `1`
- column mass: `547.515 kg`
- brace mass: `66.24 kg`
- total mass: `613.755 kg`

## Cost

Native legacy field `costRub` actually stores thousand rubles. The debug/comparison layer now exposes:

- `costThousandRub`
- `costRubNormalized`

The comparison uses normalized rubles against oracle `costThousandRub * 1000`.

The residual cost delta is about `1.38 rub`. It comes from the workbook cost formula using a tiny sort-key epsilon inside the cost source cell. This is documented and covered by the column-specific cost tolerance.

## Protected Acceptance Fields

`src/calc/verification/column-acceptance.test.ts` protects:

- `snowDesign`
- `windDesign`
- `supportCraneVerticalLoad`
- `supportCraneMoment`
- `final_N_kN`
- `final_M_kNm`
- `topCandidateProfile`
- `topCandidateSteel`
- `topCandidateUtilization`
- normalized `limitingCheck`
- `massKg`
- `costRubNormalized`

## Not Changed

- UI
- load formulas
- force formulas
- profile selection checks
- VELICAN oracle
