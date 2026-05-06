import { useState } from "react";
import {
  defaultWindowRiegelInput,
  runWindowRiegelCalculationWithDebug,
  type WindowRiegelDebugResult,
} from "./calc/window-riegel";

export function WindowRiegelApp() {
  const [result, setResult] = useState<WindowRiegelDebugResult>(() =>
    runWindowRiegelCalculationWithDebug(defaultWindowRiegelInput),
  );
  const [error, setError] = useState<string | null>(null);

  const handleCalc = () => {
    setError(null);
    try {
      setResult(runWindowRiegelCalculationWithDebug(defaultWindowRiegelInput));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Оконный ригель</h1>
      <p style={{ color: "#666", fontSize: 13, marginTop: 0 }}>
        Технический preview. Расчет временно основан на VELICAN Excel/workbook oracle. Полноценный интерфейс будет добавлен позже.
      </p>
      <button onClick={handleCalc} style={buttonStyle}>Рассчитать default scenario</button>
      {error && <div style={{ color: "red", marginTop: 12 }}>{error}</div>}
      <div style={panelStyle}>
        <Stat label="Источник расчета" value={result.source} />
        <Stat label="Нижний профиль" value={result.lowerProfile?.profile ?? "нет решения"} />
        <Stat label="Верхний профиль" value={result.upperProfile?.profile ?? "нет решения"} />
        <Stat label="Боковой профиль" value={result.sideProfile?.profile ?? "нет решения"} />
        <Stat label="Utilization" value={formatNumber(result.utilization)} />
        <Stat label="Масса" value={formatKg(result.massKg)} />
        <Stat label="Стоимость" value={formatRub(result.costRub)} />
      </div>
      <List title="Warnings" items={result.warnings} empty="Нет warnings" />
      <List title="Missing debug fields" items={result.missingDebugFields} empty="Нет missing debug fields" />
      <List title="Notes" items={result.notes} empty="Нет notes" />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#64748b" }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function List({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div style={{ marginTop: 14 }}>
      <h2 style={{ fontSize: 15, marginBottom: 6 }}>{title}</h2>
      {items.length === 0 ? (
        <div style={{ color: "#64748b", fontSize: 13 }}>{empty}</div>
      ) : (
        <ul style={{ marginTop: 0, paddingLeft: 20 }}>
          {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      )}
    </div>
  );
}

function formatNumber(value: number | null): string {
  return value === null ? "не раскрыто oracle" : value.toFixed(3);
}

function formatKg(value: number | null): string {
  return value === null ? "не раскрыто oracle" : `${value.toFixed(2)} кг`;
}

function formatRub(value: number | null): string {
  return value === null ? "не раскрыто oracle" : `${value.toFixed(2)} руб`;
}

const buttonStyle: React.CSSProperties = {
  padding: "8px 18px",
  fontSize: 14,
  fontWeight: 600,
  background: "#0369a1",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  marginBottom: 14,
};

const panelStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
  padding: 12,
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  background: "#f8fafc",
};
