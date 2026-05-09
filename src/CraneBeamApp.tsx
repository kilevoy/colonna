import { useState } from "react";
import {
  defaultCraneBeamInput,
  runCraneBeamCalculationWithDebug,
  type CraneBeamDebugResult,
} from "./calc/crane-beam";

export function CraneBeamApp() {
  const [result, setResult] = useState<CraneBeamDebugResult>(() =>
    runCraneBeamCalculationWithDebug(defaultCraneBeamInput),
  );
  const [error, setError] = useState<string | null>(null);

  const handleCalc = () => {
    setError(null);
    try {
      setResult(runCraneBeamCalculationWithDebug(defaultCraneBeamInput));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <PreviewShell
      title="Подкрановая балка"
      onCalculate={handleCalc}
      error={error}
      source={result.source}
      selectedProfile={result.selectedProfile}
      utilization={result.utilization}
      massKg={result.massKg}
      costRub={result.costRub}
      warnings={result.warnings}
      missingDebugFields={result.missingDebugFields}
      notes={result.notes}
    />
  );
}

function PreviewShell({
  title,
  onCalculate,
  error,
  source,
  selectedProfile,
  utilization,
  massKg,
  costRub,
  warnings,
  missingDebugFields,
  notes,
}: {
  title: string;
  onCalculate: () => void;
  error: string | null;
  source: string;
  selectedProfile: string | null;
  utilization: number | null;
  massKg: number | null;
  costRub: number | null;
  warnings: string[];
  missingDebugFields: string[];
  notes: string[];
}) {
  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>{title}</h1>
      <p style={{ color: "#666", fontSize: 13, marginTop: 0 }}>
        Технический preview. Расчет временно основан на VELICAN Excel/workbook oracle. Полноценный интерфейс будет добавлен позже.
      </p>
      <button onClick={onCalculate} style={buttonStyle}>Рассчитать default scenario</button>
      {error && <div style={{ color: "red", marginTop: 12 }}>{error}</div>}
      <div style={panelStyle}>
        <Stat label="Источник расчета" value={source} />
        <Stat label="Выбранный профиль" value={selectedProfile ?? "нет решения"} />
        <Stat label="Utilization" value={formatNumber(utilization)} />
        <Stat label="Масса" value={formatKg(massKg)} />
        <Stat label="Стоимость" value={formatRub(costRub)} />
      </div>
      <List title="Warnings" items={warnings} empty="Нет warnings" />
      <List title="Missing debug fields" items={missingDebugFields} empty="Нет missing debug fields" />
      <List title="Notes" items={notes} empty="Нет notes" />
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
