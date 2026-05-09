import type { ProjectCalculationSummary, ProjectInput } from "../../calc/project";
import { calculateProjectBuildingArea, calculateProjectDesignCost } from "../../calc/project";
import type { BuildingSpecification } from "../../calc/specification";
import type { PurlinAlternative, PurlinAlternativesSummary, PurlinSystemKey } from "../../calc/purlin-layout";
import { BuildingInputCard } from "./BuildingInputCard";

export type ProjectCalculationView =
  | {
      summary: ProjectCalculationSummary;
      specification: BuildingSpecification;
      purlinAlternativesSummary: PurlinAlternativesSummary;
      durationMs: number;
      error: null;
      loading: false;
    }
  | {
      summary: null;
      specification: null;
      purlinAlternativesSummary: null;
      durationMs: null;
      error: string;
      loading: false;
    }
  | {
      summary: null;
      specification: null;
      purlinAlternativesSummary: null;
      durationMs: null;
      error: null;
      loading: true;
    };

function formatNumber(value: number | null | undefined, fractionDigits = 2): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return value.toLocaleString("ru-RU", {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: 0,
  });
}

function formatRub(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return `${formatNumber(value, 0)} руб`;
}

function formatPercent(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return `${formatNumber(value * 100, 1)}%`;
}

function purlinSystemLabel(system: PurlinSystemKey): string {
  if (system === "sortSteel") return "Сортовой металл";
  if (system === "mp350") return "ЛСТК MP350";
  return "ЛСТК MP390";
}

function notesForAlternative(alternative: PurlinAlternative): string {
  const messages = alternative.status === "ok" ? alternative.notes : [...alternative.warnings, ...alternative.notes];
  return messages.join("; ") || "—";
}

function SummaryTable({ summary }: { summary: ProjectCalculationSummary }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {["Блок", "Статус", "Источник", "Профили", "Масса, кг", "Стоимость, руб", "Использование"].map((label) => (
              <th key={label} style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #cbd5e1" }}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {summary.blocks.map((block) => (
            <tr key={block.block}>
              <td style={{ padding: 8, borderBottom: "1px solid #e2e8f0" }}>{block.block}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #e2e8f0" }}>{block.status}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #e2e8f0" }}>{block.source}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #e2e8f0" }}>{block.selectedProfiles.join(", ") || "—"}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #e2e8f0", textAlign: "right" }}>{formatNumber(block.massKg)}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #e2e8f0", textAlign: "right" }}>{formatNumber(block.costRub)}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #e2e8f0", textAlign: "right" }}>{formatNumber(block.utilization, 3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SpecificationTable({ specification }: { specification: BuildingSpecification }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {["Группа", "Элемент", "Профиль", "Сталь", "Количество", "Длина, м", "Общая длина, м", "Масса, кг", "Стоимость", "Статус"].map((label) => (
              <th key={label} style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #cbd5e1" }}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {specification.items.map((item) => (
            <tr key={item.id}>
              <td style={{ padding: 8, borderBottom: "1px solid #e2e8f0" }}>{item.group}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #e2e8f0" }}>{item.elementName}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #e2e8f0" }}>{item.profile ?? "—"}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #e2e8f0" }}>{item.steel ?? "—"}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #e2e8f0", textAlign: "right" }}>{formatNumber(item.quantity)}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #e2e8f0", textAlign: "right" }}>{formatNumber(item.lengthM)}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #e2e8f0", textAlign: "right" }}>{formatNumber(item.totalLengthM)}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #e2e8f0", textAlign: "right" }}>{formatNumber(item.totalMassKg)}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #e2e8f0", textAlign: "right" }}>{formatNumber(item.totalCostRub)}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #e2e8f0" }}>{item.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PurlinAlternativesTable({ summary }: { summary: PurlinAlternativesSummary }) {
  const bySystem = new Map(summary.alternatives.map((alternative) => [alternative.system, alternative]));
  const systems: PurlinSystemKey[] = ["sortSteel", "mp350", "mp390"];

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {["Система", "Статус", "Профиль", "Шаг, мм", "Использование", "Масса, кг", "Стоимость, руб", "Примечания"].map((label) => (
              <th key={label} style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #cbd5e1" }}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {systems.map((system) => {
            const alternative = bySystem.get(system);
            const selected = summary.selectedSystem === system;
            return (
              <tr key={system} style={{ background: selected ? "#fff7ed" : "transparent" }}>
                <td style={{ padding: 8, borderBottom: "1px solid #e2e8f0" }}>{alternative?.label ?? purlinSystemLabel(system)}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #e2e8f0" }}>{selected ? `Выбрано · ${alternative?.status ?? "missing"}` : alternative?.status ?? "missing"}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #e2e8f0" }}>{alternative?.profile ?? "—"}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #e2e8f0", textAlign: "right" }}>{formatNumber(alternative?.stepMm, 0)}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #e2e8f0", textAlign: "right" }}>{formatPercent(alternative?.utilization)}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #e2e8f0", textAlign: "right" }}>{formatNumber(alternative?.massKg)}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #e2e8f0", textAlign: "right" }}>{formatRub(alternative?.costRub)}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #e2e8f0" }}>{alternative ? notesForAlternative(alternative) : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TextList({ title, items }: { title: string; items: string[] }) {
  return (
    <details style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 10 }}>
      <summary style={{ cursor: "pointer", fontWeight: 600 }}>{title} ({items.length})</summary>
      {items.length === 0 ? (
        <div style={{ marginTop: 8, color: "#64748b" }}>Нет записей</div>
      ) : (
        <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
          {items.map((item, index) => (
            <li key={`${item}-${index}`} style={{ marginBottom: 4 }}>{item}</li>
          ))}
        </ul>
      )}
    </details>
  );
}

export function CalculationSummaryCard({
  calculatedProject,
  view,
  hasPendingChanges,
  onCalculate,
  onReset,
}: {
  calculatedProject: ProjectInput;
  view: ProjectCalculationView;
  hasPendingChanges: boolean;
  onCalculate: () => void;
  onReset: () => void;
}) {
  const area = calculateProjectBuildingArea(calculatedProject);
  const designCost = calculateProjectDesignCost(calculatedProject);
  const status = view.error ? "error" : view.loading || hasPendingChanges ? "warning" : "complete";
  const metalCost = view.summary?.totalCostRub ?? null;
  const totalWithDesign = typeof metalCost === "number" ? metalCost + designCost : null;

  return (
    <BuildingInputCard
      stepNumber={8}
      title="Расчёт и спецификация"
      status={status}
      summary={view.loading ? "расчёт выполняется" : `последний расчёт · ${formatNumber(view.durationMs, 0)} мс`}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <button type="button" onClick={onCalculate}>
          Рассчитать
        </button>
        <button type="button" className="secondary" onClick={onReset}>
          Сбросить
        </button>
        {hasPendingChanges && (
          <div style={{ color: "#92400e", fontSize: 13 }}>
            Есть несохранённые изменения. Таблицы ниже показывают результат последнего расчёта.
          </div>
        )}
      </div>

      {view.loading ? (
        <div style={{ padding: 12, border: "1px solid #fed7aa", borderRadius: 8, color: "#9a3412", background: "#fff7ed" }}>
          Выполняется dev/oracle расчёт VELICAN...
        </div>
      ) : view.error || !view.summary || !view.specification || !view.purlinAlternativesSummary ? (
        <div style={{ padding: 12, border: "1px solid #fecaca", borderRadius: 8, color: "#991b1b", background: "#fef2f2" }}>
          Ошибка расчёта: {view.error ?? "результаты недоступны"}
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
            <div>Площадь здания<br /><strong>{formatNumber(area, 0)} м²</strong></div>
            <div>Вес металлокаркаса<br /><strong>{formatNumber(view.summary.totalMassKg)} кг</strong></div>
            <div>Ориентировочная стоимость<br /><strong>{formatRub(view.summary.totalCostRub)}</strong></div>
            <div>Стоимость проектирования<br /><strong>{formatRub(designCost)}</strong></div>
            <div>Сумма с проектированием<br /><strong>{formatRub(totalWithDesign)}</strong></div>
            <div>Время расчёта<br /><strong>{formatNumber(view.durationMs, 0)} мс</strong></div>
          </div>

          <section style={{ display: "grid", gap: 10 }}>
            <h3 style={{ margin: 0 }}>ProjectCalculationSummary</h3>
            <SummaryTable summary={view.summary} />
          </section>

          <section style={{ display: "grid", gap: 10 }}>
            <h3 style={{ margin: 0 }}>Building Specification</h3>
            <SpecificationTable specification={view.specification} />
          </section>

          <section style={{ display: "grid", gap: 10 }}>
            <h3 style={{ margin: 0 }}>Варианты прогонов</h3>
            <PurlinAlternativesTable summary={view.purlinAlternativesSummary} />
          </section>

          <div style={{ display: "grid", gap: 8 }}>
            <TextList title="Warnings" items={view.summary.warnings} />
            <TextList title="Mapping notes" items={view.summary.mappingNotes} />
            <TextList title="Specification warnings" items={view.specification.warnings} />
          </div>
        </>
      )}
    </BuildingInputCard>
  );
}
