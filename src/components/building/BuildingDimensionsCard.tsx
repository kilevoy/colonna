import { useState } from "react";
import type { ProjectInput, ProjectBuildingEnvelope } from "../../calc/project/types";
import cranesJson from "../../data/cranes/cranes.json";

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

interface CraneRow {
  capacity: string;
  span_m: number;
  base_mm: number;
  gauge_mm: number;
  wheelLoad_kN: number;
  trolleyMass_t: number;
  craneMass_t: number;
}

const CRANES = cranesJson as CraneRow[];
const CRANE_CAPACITIES = ["5", "8", "10", "12.5", "16", "16/3.2", "20/5", "32/5", "50/12.5"];

function lookupCrane(capacity: string, span_m: number): CraneRow | undefined {
  return CRANES.find((c) => c.capacity === capacity && c.span_m === span_m);
}

function getCraneSpanOptions(capacity: string, buildingSpanM: number): [string, string][] {
  const spans = [12, 18, 24, 30, 36].filter((s) => s <= buildingSpanM);
  return spans.map((s) => [String(s), `${s} м`]);
}

function CraneCatalogSelect({
  spanM,
  value,
  onChange,
}: {
  spanM: number;
  value: string;
  onChange: (capacity: string, auto: CraneRow) => void;
}) {
  return (
    <div style={fieldRowStyle}>
      <span style={{ fontSize: 15, color: "#0f172a", fontWeight: 500 }}>Грузоподъёмность</span>
      <select
        value={value}
        onChange={(e) => {
          const capacity = e.target.value;
          const spans = getCraneSpanOptions(capacity, spanM).map(([v]) => Number(v));
          const bestSpan = spans.length > 0 ? spans[0] : 12;
          const row = lookupCrane(capacity, bestSpan);
          if (row) onChange(capacity, row);
        }}
        style={selectStyle}
      >
        {CRANE_CAPACITIES.map((c) => (
          <option key={c} value={c}>{c} т</option>
        ))}
      </select>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (value: string) => void;
}) {
  return (
    <div style={fieldRowStyle}>
      <span style={{ fontSize: 15, color: "#0f172a", fontWeight: 500 }}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={selectStyle}
      >
        {options.map(([v, label]) => (
          <option key={v} value={v}>{label}</option>
        ))}
      </select>
    </div>
  );
}

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

/* Slider field (Ширина, Длина, Высота) */
const sliderTrackStyle = {
  width: "100%",
  height: 6,
  borderRadius: 3,
  background: "#e2e8f0",
  outline: "none",
  cursor: "pointer",
} as const;

const sliderInputStyle = {
  width: 75,
  height: 38,
  padding: "0 6px",
  border: "1px solid #b8bec7",
  borderRadius: 2,
  fontSize: 15,
  textAlign: "center",
  color: "#111827",
  boxSizing: "border-box",
} as const;

function SliderField({
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
  unit: string;
  onChange: (value: number) => void;
}) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <span style={{ fontSize: 15, color: "#0f172a", fontWeight: 500 }}>
        {label}: {value} {unit}
      </span>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 12, alignItems: "center" }}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (Number.isFinite(v)) onChange(v);
          }}
          style={sliderTrackStyle}
        />
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
          style={sliderInputStyle}
        />
      </div>
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

          {/* Размеры здания */}
          <div style={{ display: "grid", gap: 10 }}>
            <SectionTitle label="Размеры здания" />
            <SliderField label="Ширина" value={g.buildingSpanM} min={6} max={60} step={0.1} unit="м" onChange={(v) => setGeometry({ buildingSpanM: v })} />
            <SliderField label="Длина" value={g.buildingLengthM} min={6} max={120} step={0.1} unit="м" onChange={(v) => setGeometry({ buildingLengthM: v })} />
            <SliderField label="Высота" value={g.buildingHeightM} min={3} max={30} step={0.1} unit="м" onChange={(v) => setGeometry({ buildingHeightM: v })} />
          </div>

          {/* Шаги */}
          <div style={{ display: "grid", gap: 10 }}>
            <SectionTitle label="Шаги" />
            <NumberField label="Шаг рам" value={g.frameStepM} min={3} max={12} step={0.1} unit="м" onChange={(v) => setGeometry({ frameStepM: v })} />
            <NumberField label="Шаг стоек фахверка" value={g.facadePostStepM} min={3} max={12} step={0.1} unit="м" onChange={(v) => setGeometry({ facadePostStepM: v })} />
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
          <div style={{ display: "grid", gap: 14 }}>
            <SectionTitle label="Крановое оборудование" />

            {/* Подвесной кран */}
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 15, color: "#0f172a", fontWeight: 600 }}>Кран подвесной</span>
                <span style={{ fontSize: 13, color: cranes.hangingCrane.enabled ? "#16a34a" : "#94a3b8", fontWeight: 600 }}>
                  {cranes.hangingCrane.enabled ? "Есть" : "Нет"}
                </span>
              </div>
              <div style={toggleGroupStyle}>
                <ToggleButton
                  active={cranes.hangingCrane.enabled === false}
                  label="Нет"
                  onClick={() => setHangingCrane({ enabled: false, capacityT: 2, count: 1 })}
                />
                <ToggleButton
                  active={cranes.hangingCrane.enabled === true}
                  label="Есть"
                  onClick={() => setHangingCrane({ enabled: true })}
                />
              </div>
              {cranes.hangingCrane.enabled && (
                <div style={{ display: "grid", gap: 10, paddingTop: 4 }}>
                  <NumberField
                    label="Грузоподъёмность"
                    value={cranes.hangingCrane.capacityT}
                    min={0.5}
                    max={10}
                    step={0.5}
                    unit="т"
                    onChange={(v) => setHangingCrane({ capacityT: v })}
                  />
                  <NumberField
                    label="Кол-во кранов"
                    value={cranes.hangingCrane.count}
                    min={1}
                    max={10}
                    step={1}
                    onChange={(v) => setHangingCrane({ count: v })}
                  />
                </div>
              )}
            </div>

            {/* Опорный кран */}
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 15, color: "#0f172a", fontWeight: 600 }}>Кран опорный</span>
                <span style={{ fontSize: 13, color: cranes.supportCrane.enabled ? "#16a34a" : "#94a3b8", fontWeight: 600 }}>
                  {cranes.supportCrane.enabled ? "Есть" : "Нет"}
                </span>
              </div>
              <div style={toggleGroupStyle}>
                <ToggleButton
                  active={cranes.supportCrane.enabled === false}
                  label="Нет"
                  onClick={() => setSupportCrane({ enabled: false, capacityT: "5", count: "one", craneSpanM: 24, railLevelM: 3.5, wheelCount: 4 })}
                />
                <ToggleButton
                  active={cranes.supportCrane.enabled === true}
                  label="Есть"
                  onClick={() => setSupportCrane({ enabled: true })}
                />
              </div>
              {cranes.supportCrane.enabled && (
                <div style={{ display: "grid", gap: 10, paddingTop: 4 }}>
                  <CraneCatalogSelect
                    spanM={g.buildingSpanM}
                    value={cranes.supportCrane.capacityT as string}
                    onChange={(capacityT, auto) => {
                      setSupportCrane({
                        capacityT,
                        craneSpanM: auto.span_m,
                        wheelBaseM: auto.base_mm / 1000,
                        maxWheelLoadKn: auto.wheelLoad_kN,
                        trolleyWeightT: auto.trolleyMass_t,
                        craneWeightT: auto.craneMass_t,
                      });
                    }}
                  />
                  <SelectField
                    label="Пролёт крана"
                    value={String(cranes.supportCrane.craneSpanM)}
                    options={getCraneSpanOptions(cranes.supportCrane.capacityT as string, g.buildingSpanM)}
                    onChange={(v) => {
                      const spanM = Number(v);
                      const row = lookupCrane(cranes.supportCrane.capacityT as string, spanM);
                      if (row) {
                        setSupportCrane({
                          craneSpanM: spanM,
                          wheelBaseM: row.base_mm / 1000,
                          maxWheelLoadKn: row.wheelLoad_kN,
                          trolleyWeightT: row.trolleyMass_t,
                          craneWeightT: row.craneMass_t,
                        });
                      } else {
                        setSupportCrane({ craneSpanM: spanM });
                      }
                    }}
                  />
                  <SelectField
                    label="Кол-во кранов"
                    value={cranes.supportCrane.count}
                    options={[
                      ["one", "Один"],
                      ["two", "Два"],
                    ]}
                    onChange={(v) => setSupportCrane({ count: v as "one" | "two" })}
                  />
                  <NumberField
                    label="Отметка рельса"
                    value={cranes.supportCrane.railLevelM}
                    min={1}
                    max={30}
                    step={0.1}
                    unit="м"
                    onChange={(v) => setSupportCrane({ railLevelM: v })}
                  />
                  <div style={fieldRowStyle}>
                    <span style={{ fontSize: 14, color: "#64748b" }}>Нагрузка на колесо, кН</span>
                    <input
                      readOnly
                      value={cranes.supportCrane.maxWheelLoadKn.toFixed(0)}
                      style={{ ...inputStyle, background: "#f8fafc", color: "#64748b", cursor: "default" }}
                    />
                  </div>
                  <div style={fieldRowStyle}>
                    <span style={{ fontSize: 14, color: "#64748b" }}>База, м</span>
                    <input
                      readOnly
                      value={cranes.supportCrane.wheelBaseM?.toFixed(2) ?? "—"}
                      style={{ ...inputStyle, background: "#f8fafc", color: "#64748b", cursor: "default" }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
