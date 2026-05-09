# Purlin Loads Fix

Этап 3.4 проверил расхождение нагрузок прогонов native colonna vs VELICAN purlin-oracle.

## Что было

До этапа 3.4 в diagnostic summary по нагрузкам было:

| Section | Total | OK | FAIL | Missing native | Missing oracle | Not comparable |
|---|---:|---:|---:|---:|---:|---:|
| Loads | 5 | 1 | 2 | 0 | 2 | 0 |

Падали:

- `totalDesignLoadKpa`;
- `loadAtMaxStepKpa`.

## Найденная причина

Формула снеговой, ветровой и полной расчетной нагрузки в native совпадает с цепочкой VELICAN для этого normalized scenario.

Расхождение было в исходной ветровой нагрузке:

- native scenario использовал явное `w0_kPa = 0.6`;
- VELICAN purlin-oracle перед расчетом применяет climate lookup по `city`;
- для `city = Уфа` oracle фактически использует `windLoadKpa = 0.3`;
- из-за этого native wind roof был `0.213824733696`, а oracle wind roof `0.106912366848`;
- разница полной нагрузки была ровно разницей ветровой составляющей.

## Что изменено

Normalized purlin scenario приведен к фактическому oracle input:

- native `w0_kPa` изменен с `0.6` на `0.3`;
- native rolled `w0_kPa` изменен с `0.6` на `0.3`;
- oracle fixture `windLoadKpa` изменен с `0.6` на `0.3`, чтобы input comparison отражал effective climate value.

Также добавлен `purlinLoadTrace` в debug output:

- `roofLoadKpa`;
- `snowLoadKpa`;
- `windLoadKpa`;
- `snowBagFactor`;
- `responsibilityCoeff`;
- `loadBeforeFactorsKpa`;
- `loadAfterFactorsKpa`;
- `totalDesignLoadKpa`;
- `loadAtMaxStepKpa`;
- `appliedCoefficients`;
- `notes`.

## Что не менялось

Не менялись:

- UI;
- подбор профилей;
- сортамент;
- ranking;
- расчет массы;
- расчет стоимости;
- LSTK MP350/MP390 формулы;
- native purlin engine formulas.

## Что стало

После выравнивания фактической ветровой нагрузки:

| Section | Total | OK | FAIL | Missing native | Missing oracle | Not comparable |
|---|---:|---:|---:|---:|---:|---:|
| Loads | 5 | 3 | 0 | 0 | 2 | 0 |

`totalDesignLoadKpa` и `loadAtMaxStepKpa` совпали с VELICAN oracle в пределах допуска.

## Что осталось

Остались расхождения не в нагрузках:

- `hotRolled.profile`;
- `hotRolled.weightKg`;
- `mp350.profile`;
- `mp350.meterWeightKg`;
- `mp350.buildingWeightKg`;
- `mp390.profile`;
- `mp390.meterWeightKg`;
- `mp390.buildingWeightKg`.

Теперь можно переходить к следующей группе: шаги и подбор профиля. Так как нагрузки совпали, оставшиеся profile/weight FAIL уже можно рассматривать как реальные кандидаты на проверку сортамента, фильтров, max utilization, правил шага и массы.
