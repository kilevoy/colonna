# Purlin LSTK Diagnostics

Stage 3.7 compares native colonna MP350/MP390 purlin results with the VELICAN purlin oracle. It does not change loads, hot-rolled selection, hot-rolled mass, UI, pricing, or the oracle facade.

## Before

The normalized scenario had matching loads and matching hot-rolled results, but LSTK still failed:

| Section | Total | OK | FAIL | Missing native |
|---|---:|---:|---:|---:|
| MP350 | 7 | 1 | 3 | 3 |
| MP390 | 7 | 1 | 3 | 3 |

The failed primary fields were profile, meter weight, and building weight for both MP350 and MP390.

## Cause

Two issues were diagnosed:

1. Native debug compared the global lightest LSTK top10 list, while the VELICAN facade returns workbook family winners in MP order.
2. Native LSTK used `maxUtilization` as a capacity scaling factor. The VELICAN LSTK branch uses profile-specific workbook coefficients for moment resistance; `maxUtilization` is not applied as an LSTK capacity factor there.

## Change

Native LSTK profile resistance now uses each profile's `default_coef`. The debug layer now exposes `lstkSelectionTrace` for MP350 and MP390 and compares family winners in workbook order.

## After

Primary LSTK parity is reached for the normalized scenario:

| System | Native first | Oracle first | Status |
|---|---|---|---|
| MP350 | Z 350х2,5 / 1500 mm / 11.15 kg/m / 12351.6 kg | Z 350х2,5 / 1500 mm / 11.15 kg/m / 12351.6 kg | OK |
| MP390 | 2ПС 245х65х2 / 1500 mm / 12.18 kg/m / 13154.4 kg | 2ПС 245х65х2 / 1500 mm / 12.18 kg/m / 13154.4 kg | OK |

Remaining missing native fields are black/galvanized/braced mass splits. They are not used to choose the first profile and were not invented in native output.

Run:

```bash
npm run verify:all
```
