import { useMemo, useState, type ReactNode } from "react";
import {
  applyProjectRoofConstruction,
  applyProjectWallConstruction,
  calculateProjectWithSummary,
  defaultProjectInput,
  resetProjectRoofLoadFromConstruction,
  resetProjectWallLoadFromConstruction,
  setProjectManualRoofLoad,
  setProjectManualWallLoad,
  type ProjectInput,
  type ProjectCalculationSummary,
} from "./calc/project";
import { buildBuildingSpecification, type BuildingSpecification } from "./calc/specification";
import type { TerrainType } from "./calc/types";
import {
  roofConstructionOptions,
  wallConstructionOptions,
} from "./calc/shared/envelope-constructions";

type ProjectCalculationView =
  | {
      summary: ProjectCalculationSummary;
      specification: BuildingSpecification;
      durationMs: number;
      error: null;
    }
  | {
      summary: null;
      specification: null;
      durationMs: null;
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

function ConstructionSelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ id: string; label: string; kPa: number }>;
  onChange: (value: string) => void;
}) {
  return (
    <label style={{ display: "grid", gap: 4, fontSize: 13, color: "#334155" }}>
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{ padding: "7px 8px", border: "1px solid #cbd5e1", borderRadius: 6 }}
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label} ({option.kPa.toFixed(3)} кПа)
          </option>
        ))}
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

function LoadModeField({ isManual, onReset }: { isManual: boolean; onReset: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569" }}>
      <span>{isManual ? "Ручная нагрузка" : "Нагрузка из справочника"}</span>
      {isManual && (
        <button
          type="button"
          onClick={onReset}
          style={{
            padding: "6px 9px",
            border: "1px solid #cbd5e1",
            borderRadius: 6,
            background: "white",
            color: "#334155",
            cursor: "pointer",
          }}
        >
          Вернуть из справочника
        </button>
      )}
    </div>
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
  const [draftProject, setDraftProject] = useState<ProjectInput>(defaultProjectInput);
  const [calculatedProject, setCalculatedProject] = useState<ProjectInput>(defaultProjectInput);

  const view = useMemo<ProjectCalculationView>(() => {
    try {
      const startedAt = performance.now();
      const { summary } = calculateProjectWithSummary(calculatedProject);
      const specification = buildBuildingSpecification(calculatedProject);
      return {
        summary,
        specification,
        durationMs: performance.now() - startedAt,
        error: null,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { summary: null, specification: null, durationMs: null, error: message };
    }
  }, [calculatedProject]);

  const hasPendingChanges = useMemo(
    () => JSON.stringify(draftProject) !== JSON.stringify(calculatedProject),
    [draftProject, calculatedProject],
  );

  const calculateDraft = () => {
    setCalculatedProject(draftProject);
  };

  const resetProject = () => {
    setDraftProject(defaultProjectInput);
    setCalculatedProject(defaultProjectInput);
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ color: "#475569", fontSize: 14 }}>
        Техническая вкладка. Все блоки ниже считаются от одного ProjectInput; старые вкладки остаются legacy/debug preview.
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={calculateDraft}
          style={{
            padding: "9px 16px",
            border: "none",
            borderRadius: 6,
            background: "#0369a1",
            color: "white",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Рассчитать
        </button>
        <button
          type="button"
          onClick={resetProject}
          style={{
            padding: "9px 16px",
            border: "1px solid #cbd5e1",
            borderRadius: 6,
            background: "white",
            color: "#334155",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Сбросить
        </button>
        {hasPendingChanges && (
          <div style={{ color: "#92400e", fontSize: 13 }}>
            Есть несохраненные изменения. Нажмите «Рассчитать», чтобы обновить результаты.
          </div>
        )}
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <FieldGroup title="Project">
          <TextField
            label="Название проекта"
            value={draftProject.projectInfo.name}
            onChange={(name) => setDraftProject((current) => updateProjectInfo(current, { name }))}
          />
          <TextField
            label="Город"
            value={draftProject.projectInfo.city ?? ""}
            onChange={(city) =>
              setDraftProject((current) => updateClimate(updateProjectInfo(current, { city }), { city }))
            }
          />
        </FieldGroup>

        <FieldGroup title="Climate">
          <NumberField
            label="Ветер, кПа"
            value={draftProject.climate.windLoadKpa}
            step={0.01}
            onChange={(windLoadKpa) => setDraftProject((current) => updateClimate(current, { windLoadKpa }))}
          />
          <NumberField
            label="Снег, кПа"
            value={draftProject.climate.snowLoadKpa}
            step={0.01}
            onChange={(snowLoadKpa) => setDraftProject((current) => updateClimate(current, { snowLoadKpa }))}
          />
          <SelectField
            label="Тип местности"
            value={draftProject.climate.terrainType}
            onChange={(terrainType) => setDraftProject((current) => updateClimate(current, { terrainType }))}
          />
        </FieldGroup>

        <FieldGroup title="Geometry">
          <NumberField label="Пролет, м" value={draftProject.geometry.buildingSpanM} onChange={(buildingSpanM) => setDraftProject((current) => updateGeometry(current, { buildingSpanM }))} />
          <NumberField label="Длина, м" value={draftProject.geometry.buildingLengthM} onChange={(buildingLengthM) => setDraftProject((current) => updateGeometry(current, { buildingLengthM }))} />
          <NumberField label="Высота, м" value={draftProject.geometry.buildingHeightM} onChange={(buildingHeightM) => setDraftProject((current) => updateGeometry(current, { buildingHeightM, columnHeightM: buildingHeightM }))} />
          <NumberField label="Уклон кровли, град" value={draftProject.geometry.roofSlopeDeg} onChange={(roofSlopeDeg) => setDraftProject((current) => updateGeometry(current, { roofSlopeDeg }))} />
          <NumberField label="Шаг рам, м" value={draftProject.geometry.frameStepM} onChange={(frameStepM) => setDraftProject((current) => updateGeometry(current, { frameStepM }))} />
          <NumberField label="Шаг фахверка, м" value={draftProject.geometry.facadePostStepM} onChange={(facadePostStepM) => setDraftProject((current) => updateGeometry(current, { facadePostStepM }))} />
        </FieldGroup>

        <FieldGroup title="Roof / Walls">
          <ConstructionSelectField
            label="Конструкция покрытия"
            value={draftProject.roof.roofConstruction}
            options={roofConstructionOptions}
            onChange={(roofConstruction) =>
              setDraftProject((current) => applyProjectRoofConstruction(current, roofConstruction))
            }
          />
          <NumberField label="Нагрузка покрытия, кПа" value={draftProject.roof.roofLoadKpa} step={0.001} onChange={(roofLoadKpa) => setDraftProject((current) => setProjectManualRoofLoad(current, roofLoadKpa))} />
          <LoadModeField
            isManual={draftProject.roof.useManualRoofLoad}
            onReset={() => setDraftProject((current) => resetProjectRoofLoadFromConstruction(current))}
          />
          <ConstructionSelectField
            label="Конструкция ограждения"
            value={draftProject.walls.wallConstruction}
            options={wallConstructionOptions}
            onChange={(wallConstruction) =>
              setDraftProject((current) => applyProjectWallConstruction(current, wallConstruction))
            }
          />
          <NumberField label="Нагрузка ограждения, кПа" value={draftProject.walls.wallLoadKpa} step={0.001} onChange={(wallLoadKpa) => setDraftProject((current) => setProjectManualWallLoad(current, wallLoadKpa))} />
          <LoadModeField
            isManual={draftProject.walls.useManualWallLoad}
            onReset={() => setDraftProject((current) => resetProjectWallLoadFromConstruction(current))}
          />
        </FieldGroup>

        <FieldGroup title="Cranes">
          <CheckField label="Есть опорный кран" checked={draftProject.cranes.supportCrane.enabled} onChange={(enabled) => setDraftProject((current) => updateSupportCrane(current, { enabled }))} />
          <NumberField label="Грузоподъемность, т" value={Number(draftProject.cranes.supportCrane.capacityT)} step={0.5} onChange={(capacityT) => setDraftProject((current) => updateSupportCrane(current, { capacityT }))} />
          <NumberField label="Отметка рельса, м" value={draftProject.cranes.supportCrane.railLevelM} onChange={(railLevelM) => setDraftProject((current) => updateSupportCrane(updateGeometry(current, { craneRailLevelM: railLevelM }), { railLevelM }))} />
        </FieldGroup>

        <FieldGroup title="Settings">
          <NumberField label="Max utilization" value={draftProject.calculationSettings.maxUtilization} step={0.01} onChange={(maxUtilization) => setDraftProject((current) => updateSettings(current, { maxUtilization }))} />
          <NumberField label="Мин. шаг прогонов, мм" value={draftProject.calculationSettings.purlinMinStepMm} step={5} onChange={(purlinMinStepMm) => setDraftProject((current) => updateSettings(current, { purlinMinStepMm }))} />
          <NumberField label="Макс. шаг прогонов, мм" value={draftProject.calculationSettings.purlinMaxStepMm} step={5} onChange={(purlinMaxStepMm) => setDraftProject((current) => updateSettings(current, { purlinMaxStepMm }))} />
        </FieldGroup>
      </div>

      {view.error || !view.summary || !view.specification ? (
        <div style={{ padding: 12, border: "1px solid #fecaca", borderRadius: 8, color: "#991b1b", background: "#fef2f2" }}>
          Ошибка расчета: {view.error ?? "результаты недоступны"}
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
              <div>Расчет<br /><strong>{formatNumber(view.durationMs, 0)} мс</strong></div>
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
