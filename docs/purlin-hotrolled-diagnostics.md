# Purlin Hot-Rolled Diagnostics

Этап 3.5 разбирает только подбор сортового hotRolled профиля прогонов native colonna vs VELICAN purlin-oracle.

## До исправления

После этапа 3.4 нагрузки совпали, но hotRolled profile еще отличался:

| Section | Total | OK | FAIL | Missing native | Missing oracle | Not comparable |
|---|---:|---:|---:|---:|---:|---:|
| HotRolled | 7 | 2 | 2 | 1 | 2 | 0 |

Native first candidate:

- `пр.180х140х4`
- `С345`
- step `1500`
- utilization около `0.782`

Oracle first candidate:

- `кв.160х5`
- `С345`
- step `1500`

## Найденная причина

Причина была в правилах отбора hotRolled:

- native проверял простую одноосную прочность по изгибу от вертикальной нагрузки;
- VELICAN workbook для сортового металла учитывает более полный strength check: фасадный ветер, изгиб по основной оси и составляющую по уклону кровли;
- для `пр.180х140х4 / С345` workbook check дает utilization около `0.848`, что выше лимита `0.8`, поэтому oracle его не принимает;
- профиль `пр.200х120х4` в VELICAN reference помечен как `excluded`, а native раньше такого фильтра не учитывал.

## Что изменено

В native hotRolled selection добавлено минимальное workbook-parity поведение:

- дополнительная проверка `прочность с ветром/уклоном`;
- локальный exclude для `пр.200х120х4`, совпадающий с VELICAN sort-steel reference.

Также расширен debug output:

- `hotRolledSelectionTrace.inputLoadKpa`;
- `minStepMm`;
- `maxStepMm`;
- `maxUtilization`;
- `selectedProfile`;
- `selectedSteel`;
- `selectedStepMm`;
- `selectedUtilization`;
- `selectedWeightKg`;
- `selectedCostRub`;
- `sortingRule`;
- `totalCandidatesCount`;
- `rejectedCandidatesCount`;
- `topCandidates`;
- `rejectedSamples`;
- `missingDebugFields`.

Для top candidates добавлены:

- `profile`;
- `steel`;
- `stepMm`;
- `utilization`;
- `strengthUtilization`;
- `deflectionUtilization`;
- `governingCheck`;
- `limitingCheck`;
- `weightKg`;
- `costRub`;
- `status`;
- `checks`.

## После исправления

Native first candidate:

- `кв.160х5`
- `С345`
- step `1500`
- governing check `прочность с ветром/уклоном`

Oracle first candidate:

- `кв.160х5`
- `С345`
- step `1500`

HotRolled profile стал `ok`. Масса еще отличается и не исправлялась на этом этапе.

| Section | Total | OK | FAIL | Missing native | Missing oracle | Not comparable |
|---|---:|---:|---:|---:|---:|---:|
| HotRolled | 7 | 3 | 1 | 1 | 2 | 0 |

Оставшийся hotRolled FAIL:

- `hotRolled.weightKg`.

## Candidate lists

Common profiles:

- `кв.160х5`;
- `пр.180х140х5`;
- `кв.180х5`;
- `пр.200х160х5`.

Native-only profiles:

- `кв.160х6`;
- `пр.180х140х6`;
- `кв.140х7`;
- `пр.160х120х7`;
- `кв.200х5`.

Oracle-only profiles:

- `кв.140х6`;
- `пр.160х120х6`;
- `пр.180х100х6`;
- `24аП`.

## Что не менялось

Не менялись:

- UI;
- нагрузки;
- MP350/MP390;
- стоимость;
- расчет массы;
- VELICAN oracle;
- LSTK selection.

## Следующий этап

Следующий рекомендуемый этап: hotRolled mass/quantity/length. Теперь профиль совпадает, поэтому разницу `23136 кг` native vs `26808.84 кг` oracle можно разбирать отдельно без шума от подбора профиля.
