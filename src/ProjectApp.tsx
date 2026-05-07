import { useMemo, useState, type ReactNode } from "react";
import {
  calculateProjectWithSummary,
  defaultProjectInput,
  type ProjectInput,
  type ProjectCalculationSummary,
} from "./calc/project";
import { buildBuildingSpecification, type BuildingSpecification } from "./calc/specification";
import type { TerrainType } from "./calc/types";

type ProjectCalculationView =
  | {
      summary: ProjectCalculationSummary;
      specification: BuildingSpecification;
      error: null;
    }
  | {
      summary: null;
      specification: null;
      error: string;
    };

function formatNumber(value: number | null | undefined, fractionDigits = 2): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return value.toLocaleString("ru-RU", {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: 0,
  });
}

function updateProjectInfo(
  project: ProjectInput,
  patch: Partial<ProjectInput["projectInfo"]>,
): ProjectInput {
  return {
    ...project,
    projectInfo: { ...project.projectInfo, ...patch },
  };
}

function updateClimate(
  project: ProjectInput,
  patch: Partial<ProjectInput["climate"]>,
): ProjectInput {
  return {
    ...project,
    climate: { ...project.climate, ...patch },
  };
}

function updateGeometry(
  project: ProjectInput,
  patch: Partial<ProjectInput["geometry"]>,
): ProjectInput {
  return {
    ...project,
    geometry: { ...project.geometry, ...patch },
  };
}

function updateRoof(project: ProjectInput, patch: Partial<ProjectInput["roof"]>): ProjectInput {
  return {
    ...project,
    roof: { ...project.roof, ...patch },
  };
}

function updateWalls(project: ProjectInput, patch: Partial<ProjectInput["walls"]>): ProjectInput {
  return {
    ...project,
    walls: { ...project.walls, ...patch },
  };
}

function updateSupportCrane(
  project: ProjectInput,
  patch: Partial<ProjectInput["cranes"]["supportCrane"]>,
): ProjectInput {
  return {
    ...project,
    cranes: {
      ...project.cranes,
      supportCrane: {
        ...project.cranes.supportCrane,
        ...patch,
      },
    },
  };
}

function updateSettings(
  project: ProjectInput,
  patch: Partial<ProjectInput["calculationSettings"]>,
): ProjectInput {
  return {
    ...project,
    calculationSettings: {
      ...project.calculationSettings,
      ...patch,
    },
  };
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label style={{ display: "grid", gap: 4, fontSize: 13, color: "#334155" }}>
      {label}
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{ padding: "7px 8px", border: "1px solid #cbd5e1", borderRadius: 6 }}
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  step = 0.1,
  onChange,
}: {
  label: string;
  value: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label style={{ display: "grid", gap: 4, fontSize: 13, color: "#334155" }}>
      {label}
      <input
        type="number"
        step={step}
        value={value}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (Number.isFinite(next)) onChange(next);
        }}
        style={{ padding: "7px 8px", border: "1px solid #cbd5e1", borderRadius: 6 }}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: TerrainType;
  onChange: (value: TerrainType) => void;
}) {
  return (
    <label style={{ display: "grid", gap: 4, fontSize: 13, color: "#334155" }}>
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as TerrainType)}
        style={{ padding: "7px 8px", border: "1px solid #cbd5e1", borderRadius: 6 }}
      >
        <option value="A">A</option>
        <option value="B">B</option>
        <option value="C">C</option>
      </select>
    </label>
  );
}

function CheckField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#334155" }}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

function FieldGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ padding: 12, border: "1px solid #e2e8f0", borderRadius: 8 }}>
      <h3 style={{ margin: "0 0 10px", fontSize: 15, color: "#0f172a" }}>{title}</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10 }}>
        {children}
      </div>
    </section>
  );
}

function SummaryTable({ summary }: { summary: ProjectCalculationSummary }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {["Block", "Status", "Source", "Profiles", "Mass kg", "Cost rub", "Utilization"].map((label) => (
              <th key={label} style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #cbd5e1" }}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {summary.blocks.map((block) => (
            <tr key={block.block}>
              <td style={{ padding: 8, borderBottom: "1px solid #e2e8f0" }}>{block.block}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #e2e8f0" }}>{block.status}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #e2e8f0" }}>{block.source}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #e2e8f0" }}>
                {block.selectedProfiles.join(", ") || "—"}
              </td>
              <td style={{ padding: 8, borderBottom: "1px solid #e2e8f0", textAlign: "right" }}>
                {formatNumber(block.massKg)}
              </td>
              <td style={{ padding: 8, borderBottom: "1px solid #e2e8f0", textAlign: "right" }}>
                {formatNumber(block.costRub)}
              </td>
              <td style={{ padding: 8, borderBottom: "1px solid #e2e8f0", textAlign: "right" }}>
                {formatNumber(block.utilization, 3)}
              </td>
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
            {["Group", "Element", "Profile", "Steel", "Qty", "Length", "Total kg", "Cost", "Status"].map((label) => (
              <th key={label} style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #cbd5e1" }}>
                {label}
              </th>
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
              <td style={{ padding: 8, borderBottom: "1px solid #e2e8f0", textAlign: "right" }}>
                {formatNumber(item.quantity)}
              </td>
              <td style={{ padding: 8, borderBottom: "1px solid #e2e8f0", textAlign: "right" }}>
                {formatNumber(item.lengthM)}
              </td>
              <td style={{ padding: 8, borderBottom: "1px solid #e2e8f0", textAlign: "right" }}>
                {formatNumber(item.totalMassKg)}
              </td>
              <td style={{ padding: 8, borderBottom: "1px solid #e2e8f0", textAlign: "right" }}>
                {formatNumber(item.totalCostRub)}
              </td>
              <td style={{ padding: 8, borderBottom: "1px solid #e2e8f0" }}>{item.status}</td>
            </tr>
          ))}
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
            <li key={`${item}-${index}`} style={{ marginBottom: 4 }}>
              {item}
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}

export function ProjectApp() {
  const [project, setProject] = useState<ProjectInput>(defaultProjectInput);

  const view = useMemo<ProjectCalculationView>(() => {
    try {
      const { summary } = calculateProjectWithSummary(project);
      const specification = buildBuildingSpecification(project);
      return { summary, specification, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { summary: null, specification: null, error: message };
    }
  }, [project]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ color: "#475569", fontSize: 14 }}>
        Техническая вкладка. Все блоки ниже считаются от одного ProjectInput; старые вкладки остаются legacy/debug preview.
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <FieldGroup title="Project">
          <TextField
            label="Название проекта"
            value={project.projectInfo.name}
            onChange={(name) => setProject((current) => updateProjectInfo(current, { name }))}
          />
          <TextField
            label="Город"
            value={project.projectInfo.city ?? ""}
            onChange={(city) =>
              setProject((current) => updateClimate(updateProjectInfo(current, { city }), { city }))
            }
          />
        </FieldGroup>

        <FieldGroup title="Climate">
          <NumberField
            label="Ветер, кПа"
            value={project.climate.windLoadKpa}
            step={0.01}
            onChange={(windLoadKpa) => setProject((current) => updateClimate(current, { windLoadKpa }))}
          />
          <NumberField
            label="Снег, кПа"
            value={project.climate.snowLoadKpa}
            step={0.01}
            onChange={(snowLoadKpa) => setProject((current) => updateClimate(current, { snowLoadKpa }))}
          />
          <SelectField
            label="Тип местности"
            value={project.climate.terrainType}
            onChange={(terrainType) => setProject((current) => updateClimate(current, { terrainType }))}
          />
        </FieldGroup>

        <FieldGroup title="Geometry">
          <NumberField label="Пролет, м" value={project.geometry.buildingSpanM} onChange={(buildingSpanM) => setProject((current) => updateGeometry(current, { buildingSpanM }))} />
          <NumberField label="Длина, м" value={project.geometry.buildingLengthM} onChange={(buildingLengthM) => setProject((current) => updateGeometry(current, { buildingLengthM }))} />
          <NumberField label="Высота, м" value={project.geometry.buildingHeightM} onChange={(buildingHeightM) => setProject((current) => updateGeometry(current, { buildingHeightM, columnHeightM: buildingHeightM }))} />
          <NumberField label="Уклон кровли, град" value={project.geometry.roofSlopeDeg} onChange={(roofSlopeDeg) => setProject((current) => updateGeometry(current, { roofSlopeDeg }))} />
          <NumberField label="Шаг рам, м" value={project.geometry.frameStepM} onChange={(frameStepM) => setProject((current) => updateGeometry(current, { frameStepM }))} />
          <NumberField label="Шаг фахверка, м" value={project.geometry.facadePostStepM} onChange={(facadePostStepM) => setProject((current) => updateGeometry(current, { facadePostStepM }))} />
        </FieldGroup>

        <FieldGroup title="Roof / Walls">
          <NumberField label="Кровля, кПа" value={project.roof.roofLoadKpa} step={0.01} onChange={(roofLoadKpa) => setProject((current) => updateRoof(current, { roofLoadKpa }))} />
          <NumberField label="Стены, кПа" value={project.walls.wallLoadKpa} step={0.01} onChange={(wallLoadKpa) => setProject((current) => updateWalls(current, { wallLoadKpa }))} />
        </FieldGroup>

        <FieldGroup title="Cranes">
          <CheckField label="Есть опорный кран" checked={project.cranes.supportCrane.enabled} onChange={(enabled) => setProject((current) => updateSupportCrane(current, { enabled }))} />
          <NumberField label="Грузоподъемность, т" value={Number(project.cranes.supportCrane.capacityT)} step={0.5} onChange={(capacityT) => setProject((current) => updateSupportCrane(current, { capacityT }))} />
          <NumberField label="Отметка рельса, м" value={project.cranes.supportCrane.railLevelM} onChange={(railLevelM) => setProject((current) => updateSupportCrane(updateGeometry(current, { craneRailLevelM: railLevelM }), { railLevelM }))} />
        </FieldGroup>

        <FieldGroup title="Settings">
          <NumberField label="Max utilization" value={project.calculationSettings.maxUtilization} step={0.01} onChange={(maxUtilization) => setProject((current) => updateSettings(current, { maxUtilization }))} />
          <NumberField label="Мин. шаг прогонов, мм" value={project.calculationSettings.purlinMinStepMm} step={5} onChange={(purlinMinStepMm) => setProject((current) => updateSettings(current, { purlinMinStepMm }))} />
          <NumberField label="Макс. шаг прогонов, мм" value={project.calculationSettings.purlinMaxStepMm} step={5} onChange={(purlinMaxStepMm) => setProject((current) => updateSettings(current, { purlinMaxStepMm }))} />
        </FieldGroup>
      </div>

      {view.error || !view.summary || !view.specification ? (
        <div style={{ padding: 12, border: "1px solid #fecaca", borderRadius: 8, color: "#991b1b", background: "#fef2f2" }}>
          Ошибка расчета: {view.error}
        </div>
      ) : (
        <>
          <section style={{ display: "grid", gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>Project Summary</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
              <div><strong>{view.summary.projectName}</strong><br />{view.summary.city ?? "—"}</div>
              <div>Total mass<br /><strong>{formatNumber(view.summary.totalMassKg)} кг</strong></div>
              <div>Total cost<br /><strong>{formatNumber(view.summary.totalCostRub)} руб</strong></div>
              <div>Warnings<br /><strong>{view.summary.warnings.length}</strong></div>
              <div>Mapping notes<br /><strong>{view.summary.mappingNotes.length}</strong></div>
            </div>
            <SummaryTable summary={view.summary} />
          </section>

          <section style={{ display: "grid", gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>Building Specification</h2>
            <SpecificationTable specification={view.specification} />
          </section>

          <div style={{ display: "grid", gap: 8 }}>
            <TextList title="Warnings" items={view.summary.warnings} />
            <TextList title="Mapping notes" items={view.summary.mappingNotes} />
            <TextList title="Specification warnings" items={view.specification.warnings} />
          </div>
        </>
      )}
    </div>
  );
}
