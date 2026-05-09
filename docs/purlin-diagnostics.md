# Purlin Diagnostics

Этап 3.3 добавляет глубокий diagnostic report для прогонов native colonna vs VELICAN purlin-oracle.

После normalized scenarios по прогонам на этапе 3.3 оставались расчетные расхождения:

- `loadAtMaxStepKpa`
- `hotRolled.profile`
- `hotRolled.weightKg`
- `mp350.profile`
- `mp350.buildingWeightKg`
- `mp390.profile`
- `mp390.buildingWeightKg`

Этап 3.4 отдельно разобрал нагрузки. Причина load FAIL была не в формуле, а в том, что VELICAN purlin-oracle применяет climate lookup по городу: для Уфы effective `windLoadKpa = 0.3`, а normalized native fixture использовал ручное `w0_kPa = 0.6`. После выравнивания effective wind load `totalDesignLoadKpa` и `loadAtMaxStepKpa` стали `ok`.

## Зачем это нужно

Профиль нельзя исправлять первым, пока не проверена итоговая нагрузка. Если `loadAtMaxStepKpa` отличается, подбор профиля, масса и стоимость могут отличаться как следствие, а не как самостоятельная ошибка сортамента.

Diagnostics разделяет проверку на группы:

- нагрузки;
- ограничения шага;
- кандидаты сортового металла;
- кандидаты MP350;
- кандидаты MP390.

## Что раскрывает native debug

`runPurlinCalculationWithDebug()` теперь возвращает доступные промежуточные поля без изменения расчета:

- входной snapshot;
- снеговую, ветровую, кровельную и итоговую нагрузки;
- ручные ограничения шага;
- выбранный шаг первого кандидата;
- top 10 кандидатов сортового металла;
- top 10 кандидатов MP350/MP390;
- предупреждения;
- список `missingDebugFields`.

Если поле нельзя получить из текущего native расчета без изменения формул, оно не выдумывается и попадает в `missingDebugFields`.

## Native поля, которые пока не раскрыты

Сейчас native debug не раскрывает:

- `autoMaxStepMm`;
- стоимость сортовых прогонов;
- раздельные LSTK массы `blackWeightKg`, `galvanizedWeightKg`, `bracedWeightKg`.

## Oracle-only параметры

VELICAN purlin-oracle имеет параметры, которых нет в native input прогонов:

- deck/profile sheet;
- tie installation;
- brace step;
- LSTK prices.

Они могут влиять на LSTK результат, поэтому diagnostics явно выводит их как oracle-only контекст.

## Suspected Causes

`suspectedCauses` строится простыми правилами:

- если отличается `loadAtMaxStepKpa`, сначала проверять расчет итоговой нагрузки и коэффициентов;
- если одновременно отличаются нагрузка и профиль, профиль может быть следствием ошибки нагрузки;
- если нагрузка совпала, но профиль отличается, проверять сортамент, фильтры, utilization и min/max step;
- если профиль совпал, но масса отличается, проверять массу, количество, длину и коэффициенты распорок;
- если расходятся MP350/MP390 и есть native missing по oracle-only параметрам, проверять влияние deck/profile sheet, tie installation, brace step и LSTK prices.

## Как запускать

Полная проверка:

```bash
npm run verify
```

Все verification-команды:

```bash
npm run verify:all
```

Только unit tests:

```bash
npm test
```

## Следующий этап

Следующий этап должен исправлять прогоны группами:

1. нагрузки;
2. шаги;
3. подбор профиля;
4. массы и стоимость.

Этот документ и diagnostic layer не исправляют формулы и не заменяют native расчет на VELICAN oracle.

## Current Parity Status

Stage 3.8 locks the normalized purlin parity status with regression/acceptance tests.

Fields that now match the VELICAN purlin oracle:

- `totalDesignLoadKpa`
- `loadAtMaxStepKpa`
- `hotRolled.profile`
- `hotRolled.stepMm`
- `hotRolled.weightKg`
- `mp350.profile`
- `mp350.meterWeightKg`
- `mp350.buildingWeightKg`
- `mp390.profile`
- `mp390.meterWeightKg`
- `mp390.buildingWeightKg`

Fields that remain missing diagnostics, not calculation FAIL:

- native `autoMaxStepMm`
- native LSTK `blackWeightKg`
- native LSTK `galvanizedWeightKg`
- native LSTK `bracedWeightKg`
- oracle standalone `snowLoadKpa`
- oracle standalone `windLoadKpa`
- oracle hot-rolled `utilization`
- oracle hot-rolled `limitingCheck`

The protected regression test is `src/calc/verification/purlin-acceptance.test.ts`. It fails if any required parity field above becomes `fail`.
