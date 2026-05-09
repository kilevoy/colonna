import { useState } from "react";
import type { ProjectInput, ProjectBuildingEnvelope } from "../../calc/project/types";

const cardStyle = {
  border: "1px solid #fb923c",
  borderRadius: 2,
  background: "#ffffff",
  overflow: "hidden",
  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)",
} as const;

const headerStyle = {
  width: "100%",
  border: "none",
  background: "linear-gradient(180deg, #ffa726 0%, #fb8c16 100%)",
  color: "#ffffff",
  padding: "21px 18px",
  display: "grid",
  gridTemplateColumns: "26px minmax(0, 1fr) 22px 22px",
  alignItems: "center",
  gap: 10,
  cursor: "pointer",
  textAlign: "left",
} as const;

const bodyStyle = {
  padding: "26px 18px 28px",
  display: "grid",
  gap: 22,
} as const;

const sectionTitleStyle = {
  display: "inline-flex",
  gap: 9,
  alignItems: "center",
  fontSize: 18,
  color: "#0f172a",
  lineHeight: 1.15,
  fontWeight: 600,
} as const;

const toggleGroupStyle = {
  display: "flex",
  gap: 0,
  flexWrap: "wrap",
} as const;

const toggleInactive = {
  padding: "10px 18px",
  border: "1px solid #e2e8f0",
  background: "#fff7ed",
  color: "#334155",
  fontSize: 15,
  cursor: "pointer",
  fontWeight: 500,
} as const;

const toggleActive = {
  ...toggleInactive,
  background: "#fb8c16",
  color: "#ffffff",
  borderColor: "#fb8c16",
  fontWeight: 700,
} as const;

const inputStyle = {
  width: "100%",
  height: 40,
  padding: "0 10px",
  border: "1px solid #b8bec7",
  borderRadius: 2,
  fontSize: 15,
  color: "#111827",
  background: "#fff",
  boxSizing: "border-box",
} as const;

const fieldRowStyle = {
  display: "grid",
  gridTemplateColumns: "140px 1fr",
  gap: 12,
  alignItems: "center",
} as const;

const craneRowStyle = {
  display: "grid",
  gridTemplateColumns: "120px 1fr 55px auto auto",
  gap: 8,
  alignItems: "center",
  padding: "10px 0",
  borderBottom: "1px solid #f1f5f9",
} as const;

const selectStyle = {
  width: "100%",
  height: 40,
  padding: "0 8px",
  border: "1px solid #b8bec7",
  borderRadius: 2,
  background: "#fff",
  fontSize: 14,
  color: "#111827",
  boxSizing: "border-box",
} as const;

const qtyStyle = {
  width: 50,
  height: 40,
  padding: "0 4px",
  border: "1px solid #b8bec7",
  borderRadius: 2,
  fontSize: 14,
  textAlign: "center",
  color: "#111827",
  boxSizing: "border-box",
} as const;

const btnApplyStyle = {
  padding: "8px 12px",
  border: "1px solid #fb8c16",
  borderRadius: 2,
  background: "#fff7ed",
  color: "#c2410c",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
} as const;

const btnApplyActiveStyle = {
  ...btnApplyStyle,
  background: "#fb8c16",
  color: "#ffffff",
} as const;

const btnDeleteStyle = {
  padding: "8px 12px",
  border: "1px solid #e2e8f0",
  borderRadius: 2,
  background: "#f8fafc",
  color: "#64748b",
  fontSize: 13,
  cursor: "pointer",
  whiteSpace: "nowrap",
} as const;

const suspendedOptions = [
  { value: "none", label: "Нет" },
  { value: "1t", label: "1 тонна" },
  { value: "2t", label: "2 тонны" },
  { value: "3.2t", label: "3.2 тонны" },
  { value: "5t", label: "5 тонн" },
];

const supportOptions = [
  { value: "none", label: "Нет" },
  { value: "3.2t", label: "3.2 тонны" },
  { value: "5t", label: "5 тонн" },
  { value: "10t", label: "10 тонн" },
];

function HelpIcon() {
  return (
    <span
      aria-hidden="true"
      title="Справка"
      style={{
        width: 17,
        height: 17,
        border: "1.5px solid #111827",
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 700,
        lineHeight: 1,
        color: "#111827",
      }}
    >
      ?
    </span>
  );
}

function SectionTitle({ label }: { label: string }) {
  return (
    <div style={sectionTitleStyle}>
      {label}
      <HelpIcon />
    </div>
  );
}

function ToggleButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={active ? toggleActive : toggleInactive}>
      {label}
    </button>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div style={fieldRowStyle}>
      <span style={{ fontSize: 15, color: "#0f172a", fontWeight: 500 }}>
        {label}{unit ? `, ${unit}` : ""}
      </span>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (Number.isFinite(v)) onChange(Math.max(min, Math.min(max, v)));
        }}
        style={inputStyle}
      />
    </div>
  );
}

export function BuildingDimensionsCard({
  project,
  onProjectChange,
  defaultOpen = false,
}: {
  project: ProjectInput;
  onProjectChange: (project: ProjectInput) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const g = project.geometry;
  const cranes = project.cranes;

  const setGeometry = (patch: Partial<ProjectInput["geometry"]>) => {
    onProjectChange({ ...project, geometry: { ...g, ...patch } });
  };

  const setEnvelope = (buildingEnvelope: ProjectBuildingEnvelope) => {
    onProjectChange({ ...project, projectInfo: { ...project.projectInfo, buildingEnvelope } });
  };

  const setSupportCrane = (patch: Partial<ProjectInput["cranes"]["supportCrane"]>) => {
    onProjectChange({
      ...project,
      cranes: { ...project.cranes, supportCrane: { ...project.cranes.supportCrane, ...patch } },
    });
  };

  const setHangingCrane = (patch: Partial<ProjectInput["cranes"]["hangingCrane"]>) => {
    onProjectChange({
      ...project,
      cranes: { ...project.cranes, hangingCrane: { ...project.cranes.hangingCrane, ...patch } },
    });
  };

  const area = g.buildingSpanM * g.buildingLengthM;

  return (
    <section style={cardStyle}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} style={headerStyle}>
        <span
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#ffffff",
            color: "#1f2937",
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          2
        </span>
        <strong style={{ color: "#ffffff", fontSize: 20, lineHeight: 1.1 }}>Параметры здания</strong>
        <span
          aria-hidden="true"
          title="Справка"
          style={{
            width: 17,
            height: 17,
            border: "1.5px solid #111827",
            borderRadius: "50%",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 700,
            lineHeight: 1,
            color: "#111827",
            background: "#ffb03a",
          }}
        >
          ?
        </span>
        <span style={{ justifySelf: "end", color: "#ffffff", fontSize: 28, lineHeight: 0.7 }}>{open ? "⌃" : "⌄"}</span>
      </button>

      {open && (
        <div style={bodyStyle}>
          {/* Тип здания */}
          <div style={{ display: "grid", gap: 10 }}>
            <SectionTitle label="Тип здания" />
            <div style={toggleGroupStyle}>
              <ToggleButton active={project.projectInfo.buildingEnvelope === "warm"} label="Теплое" onClick={() => setEnvelope("warm")} />
              <ToggleButton active={project.projectInfo.buildingEnvelope === "cold"} label="Холодное" onClick={() => setEnvelope("cold")} />
            </div>
          </div>

          {/* Система */}
          <div style={{ display: "grid", gap: 10 }}>
            <SectionTitle label="Система" />
            <div style={toggleGroupStyle}>
              <ToggleButton active label="Великан" onClick={() => {}} />
            </div>
            <span style={{ color: "#64748b", fontSize: 13 }}>Базовое решение для расчёта быстровозводимого металлического здания.</span>
          </div>

          {/* Размеры здания */}
          <div style={{ display: "grid", gap: 10 }}>
            <SectionTitle label="Размеры здания" />
            <NumberField label="Ширина" value={g.buildingSpanM} min={6} max={60} step={0.1} unit="м" onChange={(v) => setGeometry({ buildingSpanM: v })} />
            <NumberField label="Длина" value={g.buildingLengthM} min={6} max={120} step={0.1} unit="м" onChange={(v) => setGeometry({ buildingLengthM: v })} />
            <NumberField label="Высота" value={g.buildingHeightM} min={3} max={30} step={0.1} unit="м" onChange={(v) => setGeometry({ buildingHeightM: v })} />
            <NumberField label="Уклон кровли" value={g.roofSlopeDeg} min={1} max={45} step={0.5} unit="%" onChange={(v) => setGeometry({ roofSlopeDeg: v })} />
          </div>

          {/* Шаги */}
          <div style={{ display: "grid", gap: 10 }}>
            <SectionTitle label="Шаги" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <NumberField label="Шаг рам" value={g.frameStepM} min={3} max={12} step={0.1} unit="м" onChange={(v) => setGeometry({ frameStepM: v })} />
              <NumberField label="Шаг стоек" value={g.facadePostStepM} min={3} max={12} step={0.1} unit="м" onChange={(v) => setGeometry({ facadePostStepM: v })} />
            </div>
          </div>

          {/* Площадь */}
          <div style={{ display: "grid", gap: 9 }}>
            <SectionTitle label="Площадь здания" />
            <input
              readOnly
              value={`${area.toFixed(1)} м²`}
              style={{ ...inputStyle, background: "#f8fafc", color: "#64748b", cursor: "default" }}
            />
          </div>

          {/* Крановое оборудование */}
          <div style={{ display: "grid", gap: 10 }}>
            <SectionTitle label="Крановое оборудование" />

            <div style={craneRowStyle}>
              <span style={{ fontSize: 14, color: "#0f172a", fontWeight: 500 }}>Подвесной</span>
              <select
                value={cranes.hangingCrane.enabled ? `${cranes.hangingCrane.capacityT}t` : "none"}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "none") {
                    setHangingCrane({ enabled: false, capacityT: 0 });
                  } else {
                    const capacityT = Number(v.replace("t", ""));
                    setHangingCrane({ enabled: true, capacityT });
                  }
                }}
                style={selectStyle}
              >
                {suspendedOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                max={10}
                step={1}
                value={cranes.hangingCrane.count || 1}
                onChange={(e) => setHangingCrane({ count: Number(e.target.value) })}
                style={qtyStyle}
              />
              <button
                type="button"
                style={cranes.hangingCrane.enabled ? btnApplyActiveStyle : btnApplyStyle}
                onClick={() => setHangingCrane({ enabled: true })}
              >
                Применить
              </button>
              <button
                type="button"
                style={btnDeleteStyle}
                onClick={() => setHangingCrane({ enabled: false, capacityT: 0, count: 1 })}
              >
                Удалить
              </button>
            </div>

            <div style={craneRowStyle}>
              <span style={{ fontSize: 14, color: "#0f172a", fontWeight: 500 }}>Опорный</span>
              <select
                value={cranes.supportCrane.enabled ? `${cranes.supportCrane.capacityT}` : "none"}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "none") {
                    setSupportCrane({ enabled: false, capacityT: 0 });
                  } else {
                    setSupportCrane({ enabled: true, capacityT: v });
                  }
                }}
                style={selectStyle}
              >
                {supportOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                max={10}
                step={1}
                value={cranes.supportCrane.wheelCount || 1}
                onChange={(e) => setSupportCrane({ wheelCount: Number(e.target.value) })}
                style={qtyStyle}
              />
              <button
                type="button"
                style={cranes.supportCrane.enabled ? btnApplyActiveStyle : btnApplyStyle}
                onClick={() => setSupportCrane({ enabled: true })}
              >
                Применить
              </button>
              <button
                type="button"
                style={btnDeleteStyle}
                onClick={() => setSupportCrane({ enabled: false, capacityT: 0, wheelCount: 1 })}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
