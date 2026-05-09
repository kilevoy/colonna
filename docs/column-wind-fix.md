# Column Wind Fix

Stage 4.2 investigates the normalized column wind mismatch between native colonna and the VELICAN column oracle.

## Before

The diagnostic report showed a clean x2 mismatch:

| Field | Native | Oracle |
|---|---:|---:|
| `windDesign` | 1.036248 | 0.518124 |
| `baseMomentKnM` | 411.13 | 205.57 |
| `final_M_kNm` | 143.90 | 71.95 |

Cranes, snow, roof load, and wall load were already aligned.

## Root Cause

The cause was not an accidental x2 multiplier in the wind formula.

The VELICAN oracle resolves `city = Petrozavodsk` through the climate settlement table. That city has:

- effective `w0 = 0.3 kPa`
- effective `Sg = 1.7 kPa`

The normalized native fixture still used explicit `w0_kPa = 0.6`. Since the wind formula is linear in `w0`, native wind and moments were exactly x2.

## Change

The normalized column scenario now uses the same effective wind load as the oracle:

- native `w0_kPa`: `0.6 -> 0.3`

The wind formula was not divided by two. The calculation kernel remains based on the same wind expression:

```text
windDesign = max(longB, shortB) + FGH+
baseMoment = windDesign * tributaryWidth * height^2 / 2
finalM = baseMoment * momentFactor + craneMoment
```

## Added Trace

`columnLoadTrace.windTrace` now exposes:

- `w0Kpa`
- `terrainType`
- `heightM`
- `kZe`
- `zeta`
- `nu.longB`
- `nu.shortB`
- `nu.fghPlus`
- `externalPressureCoeff`
- `windBeforeSideFactor`
- `sideFactor`
- `windDesignKpa`
- `windInternalKpa`
- `windForMomentKpa`
- `tributaryHeightM`
- `tributaryWidthM`
- `frameStepM`
- `momentArmM`
- `baseMomentKnM`
- notes and missing debug fields

## After

| Section | Before FAIL | After FAIL |
|---|---:|---:|
| Loads | 1 | 0 |
| Forces | 3 | 0 |
| Profile | 4 | 1 |
| Mass/Cost | 2 | 2 |

Remaining failures are downstream diagnostics:

- `limitingCheck` text differs: native `по sigma уст X`, oracle `по sigm уст X`;
- `massKg` still differs;
- `costRub` still differs and native currently stores cost in thousands of rubles despite the debug field name.

## Not Changed

- UI
- crane calculation
- snow calculation
- roof/wall loads
- profile selection logic
- mass/cost formulas
- VELICAN oracle

## Run

```bash
npm test -- src/calc/verification/column-wind-fix.test.ts
```
