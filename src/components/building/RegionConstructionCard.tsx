import { useState } from "react";
import type { ProjectInput } from "../../calc/project/types";
import type { TerrainType } from "../../calc/types";
import { searchSettlements, type SettlementClimateData } from "../../types/climate";

const terrainOptions: Array<{ value: TerrainType; label: string }> = [
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "C", label: "C" },
];

const seismicOptions = [
  { value: "6", label: "6 и меньше" },
  { value: "7", label: "7" },
  { value: "8", label: "8" },
  { value: "9", label: "9" },
];

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
  gap: 16,
} as const;

const twoColumnStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
  gap: 30,
  alignItems: "end",
} as const;

const labelStyle = {
  display: "grid",
  gap: 9,
  minWidth: 0,
  color: "#0f172a",
  fontSize: 18,
  lineHeight: 1.15,
} as const;

const controlStyle = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  height: 40,
  padding: "0 11px",
  border: "1px solid #b8bec7",
  borderRadius: 2,
  background: "#ffffff",
  color: "#111827",
  fontSize: 15,
} as const;

const cityListStyle = {
  position: "absolute",
  zIndex: 20,
  left: 0,
  right: 0,
  top: "calc(100% + 4px)",
  maxHeight: 220,
  overflowY: "auto",
  margin: 0,
  padding: 0,
  listStyle: "none",
  border: "1px solid #b8bec7",
  borderRadius: 2,
  background: "#ffffff",
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.14)",
} as const;

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

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={labelStyle}>
      <span style={{ display: "inline-flex", gap: 9, alignItems: "center" }}>
        {label}
        <HelpIcon />
      </span>
      {children}
    </label>
  );
}

function formatKgM2(kpa: number | null | undefined): string {
  return typeof kpa === "number" && Number.isFinite(kpa) ? `${Math.round(kpa * 100)} кг/м²` : "нет данных";
}

function formatSnowRegion(region: string | null | undefined, sgKpa: number): string {
  const prefix = region ? `${region} Снеговой район` : "Снеговой район";
  return `${prefix} (${formatKgM2(sgKpa)})`;
}

function formatWindRegion(region: string | null | undefined, w0Kpa: number): string {
  const prefix = region ? `${region} Ветровой район` : "Ветровой район";
  return `${prefix} (${formatKgM2(w0Kpa)})`;
}

function cityLabel(settlement: SettlementClimateData): string {
  return `${settlement.settlement} (${settlement.region})`;
}

function findSelectedSettlement(city: string): SettlementClimateData | undefined {
  if (!city.trim()) return undefined;
  return searchSettlements(city).find((settlement) => settlement.settlement.toLowerCase() === city.trim().toLowerCase());
}

export function RegionConstructionCard({
  project,
  onProjectChange,
  defaultOpen,
}: {
  project: ProjectInput;
  onProjectChange: (project: ProjectInput) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const [cityQuery, setCityQuery] = useState(project.projectInfo.city ?? project.climate.city ?? "");
  const [cityFocused, setCityFocused] = useState(false);
  const city = project.projectInfo.city ?? project.climate.city ?? "";
  const cityMatches = cityQuery.trim().length >= 2 ? searchSettlements(cityQuery).slice(0, 12) : [];
  const selectedSettlement = findSelectedSettlement(city);
  const seismicValue = Number(project.climate.responsibilityLevel ?? 6) <= 6 ? "6" : String(project.climate.responsibilityLevel);

  const setCity = (value: string) => {
    onProjectChange({
      ...project,
      projectInfo: { ...project.projectInfo, city: value },
      climate: { ...project.climate, city: value },
    });
  };

  const selectSettlement = (settlement: SettlementClimateData) => {
    const selectedCity = settlement.settlement;
    setCityQuery(selectedCity);
    setCityFocused(false);
    onProjectChange({
      ...project,
      projectInfo: { ...project.projectInfo, city: selectedCity },
      climate: {
        ...project.climate,
        city: selectedCity,
        snowLoadKpa: settlement.snow.sgKpa ?? project.climate.snowLoadKpa,
        windLoadKpa: settlement.wind.w0Kpa ?? project.climate.windLoadKpa,
        terrainType: settlement.terrain.defaultType ?? project.climate.terrainType,
        responsibilityLevel: settlement.seismic.points ?? project.climate.responsibilityLevel,
      },
    });
  };

  const setClimate = (patch: Partial<ProjectInput["climate"]>) => {
    onProjectChange({ ...project, climate: { ...project.climate, ...patch } });
  };

  return (
    <section style={cardStyle}>
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} style={headerStyle}>
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
          1
        </span>
        <strong style={{ color: "#ffffff", fontSize: 20, lineHeight: 1.1 }}>Район строительства</strong>
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
          <FieldLabel label="Город">
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={cityFocused ? cityQuery : city}
                placeholder="Выбрать город"
                onFocus={() => {
                  setCityQuery(city);
                  setCityFocused(true);
                }}
                onChange={(event) => {
                  setCityQuery(event.target.value);
                }}
                onBlur={() =>
                  window.setTimeout(() => {
                    setCityFocused(false);
                    if (!findSelectedSettlement(cityQuery)) setCity(cityQuery);
                  }, 120)
                }
                style={{ ...controlStyle, color: city || cityQuery ? "#111827" : "#6b7280" }}
              />
              {cityFocused && cityMatches.length > 0 && (
                <ul style={cityListStyle}>
                  {cityMatches.map((settlement) => (
                    <li key={settlement.id}>
                      <button
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          selectSettlement(settlement);
                        }}
                        style={{
                          width: "100%",
                          border: "none",
                          borderBottom: "1px solid #eef2f7",
                          background: "#ffffff",
                          padding: "8px 10px",
                          cursor: "pointer",
                          textAlign: "left",
                          color: "#111827",
                          fontSize: 14,
                        }}
                      >
                        {cityLabel(settlement)}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </FieldLabel>

          <FieldLabel label="Снеговой район">
            <input readOnly value={formatSnowRegion(selectedSettlement?.snow.region, project.climate.snowLoadKpa)} style={{ ...controlStyle, background: "#f8fafc" }} />
          </FieldLabel>

          <FieldLabel label="Ветровой район">
            <input readOnly value={formatWindRegion(selectedSettlement?.wind.region, project.climate.windLoadKpa)} style={{ ...controlStyle, background: "#f8fafc" }} />
          </FieldLabel>

          <div style={twoColumnStyle}>
            <label style={labelStyle}>
              <span>Сейсмичность</span>
              <select value={seismicValue} onChange={(event) => setClimate({ responsibilityLevel: Number(event.target.value) })} style={controlStyle}>
                {seismicOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <FieldLabel label="Тип местности">
              <select value={project.climate.terrainType} onChange={(event) => setClimate({ terrainType: event.target.value as TerrainType })} style={controlStyle}>
                {terrainOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FieldLabel>
          </div>

          <a href="https://docs.cntd.ru/document/456044318" target="_blank" rel="noreferrer" style={{ color: "#1683ff", fontSize: 15, textDecoration: "none" }}>
            Карта климатических зон
          </a>
        </div>
      )}
    </section>
  );
}
