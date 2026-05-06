# Purlin Hot-Rolled Mass

Этап 3.6 разбирает только массу первого hotRolled прогона native colonna vs VELICAN purlin-oracle.

## До исправления

После этапа 3.5 профиль, сталь и шаг совпадали:

- profile: `кв.160х5`;
- steel: `С345`;
- step: `1500 мм`.

Но масса отличалась:

- native: `23136 кг`;
- oracle: `26808.84 кг`.

## Native formula before

Native считал:

```text
halfSpan = (span - 0.3) / 2 = 11.85 м
linesPerSlope = ceil(halfSpan / step) = ceil(11.85 / 1.5) = 8
numberOfPurlinLines = 8 * 2 = 16
totalLinearLength = 16 * 60 = 960 м
mass = 960 * 24.1 = 23136 кг
```

## Oracle implied formula

VELICAN oracle implied mass раскладывается так:

```text
roofSlopeLength = (span - 0.3) / 2 / cos(6°) = 11.915273 м
linesPerSlope = ceil(roofSlopeLength / step) + 1 = ceil(11.915273 / 1.5) + 1 = 9
numberOfPurlinLines = 9 * 2 = 18
totalLinearLength = 18 * 60 = 1080 м
baseMass = 1080 * 24.1 = 26028 кг
overlapOrWasteFactor = 1.03
mass = 26028 * 1.03 = 26808.84 кг
```

Oracle implied effective length:

```text
26808.84 / 24.1 = 1112.4 м
1112.4 / 1080 = 1.03
```

## Найденная причина

Native не учитывал три workbook-parity правила:

- длину по скату вместо горизонтальной проекции;
- дополнительную линию прогонов на каждый скат;
- коэффициент `1.03` на нахлест/запас для hotRolled массы.

## Что исправлено

В hotRolled mass calculation добавлено:

- `roofSlopeLengthM = horizontalHalfSpan / cos(roofSlopeDeg)`;
- `linesPerSlope = ceil(roofSlopeLengthM / stepM) + 1`;
- `overlapOrWasteFactor = 1.03`.

## Что не менялось

Не менялись:

- нагрузки;
- выбор профиля;
- проверки прочности/прогиба;
- MP350/MP390;
- стоимость;
- UI;
- VELICAN oracle.

## После исправления

HotRolled summary:

| Section | Total | OK | FAIL | Missing native | Missing oracle | Not comparable |
|---|---:|---:|---:|---:|---:|---:|
| HotRolled | 7 | 4 | 0 | 1 | 2 | 0 |

`hotRolled.weightKg` стал `ok`:

- native: `26808.84 кг`;
- oracle: `26808.84 кг`.

Оставшиеся missing поля не являются расчетными FAIL:

- native не раскрывает `hotRolled.costRub`;
- VELICAN facade не раскрывает `hotRolled.utilization`;
- VELICAN facade не раскрывает `hotRolled.limitingCheck`.

## Следующий этап

Следующий рекомендуемый этап: MP350/MP390. После этапа 3.6 hotRolled профиль и масса совпадают, а оставшиеся FAIL относятся к LSTK:

- `mp350.profile`;
- `mp350.meterWeightKg`;
- `mp350.buildingWeightKg`;
- `mp390.profile`;
- `mp390.meterWeightKg`;
- `mp390.buildingWeightKg`.
