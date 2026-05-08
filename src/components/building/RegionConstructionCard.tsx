import { useState } from "react";
import type { ProjectInput } from "../../calc/project/types";
import type { TerrainType } from "../../calc/types";
import { BuildingInputCard } from "./BuildingInputCard";
import { fieldGridStyle, InlineWarning, NumberField, SelectField, TextField } from "./BuildingFields";

const terrainOptions: Array<{ value: TerrainType; label: string }> = [
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "C", label: "C" },
];

function formatLoad(value: number): string {
  return Number.isFinite(value) ? `${value.toFixed(2)} кПа` : "не задано";
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
  const [manualOpen, setManualOpen] = useState(false);
  const city = project.projectInfo.city ?? project.climate.city ?? "";
  const status = city && project.climate.snowLoadKpa > 0 && project.climate.windLoadKpa > 0 ? "complete" : "warning";

  const setClimate = (patch: Partial<ProjectInput["climate"]>) => {
    onProjectChange({ ...project, climate: { ...project.climate, ...patch } });
  };

  return (
    <BuildingInputCard
      stepNumber={1}
      title="Район строительства"
      status={status}
      defaultOpen={defaultOpen}
      summary={`${city || "город не задан"} · снег ${formatLoad(project.climate.snowLoadKpa)} · ветер ${formatLoad(project.climate.windLoadKpa)}`}
    >
      <div style={fieldGridStyle}>
        <TextField
          label="Город / ближайший населённый пункт"
          value={city}
          onChange={(value) =>
            onProjectChange({
              ...project,
              projectInfo: { ...project.projectInfo, city: value },
              climate: { ...project.climate, city: value },
            })
          }
        />
      </div>
      <div style={fieldGridStyle}>
        <div>Снеговая нагрузка: {formatLoad(project.climate.snowLoadKpa)}</div>
        <div>Ветровая нагрузка: {formatLoad(project.climate.windLoadKpa)}</div>
        <div>Тип местности: {project.climate.terrainType}</div>
        <div>Сейсмичность: не задано</div>
        <div>Снеговой район: не задано</div>
        <div>Ветровой район: не задано</div>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button type="button" className="secondary" onClick={() => setManualOpen((value) => !value)}>
          Изменить вручную
        </button>
        <button type="button" className="secondary" disabled>
          Справочник климатических зон
        </button>
      </div>
      {manualOpen && (
        <>
          <InlineWarning>Ручные значения используются в расчёте вместо данных по городу.</InlineWarning>
          <div style={fieldGridStyle}>
            <NumberField label="Снеговая нагрузка, кПа" value={project.climate.snowLoadKpa} onChange={(snowLoadKpa) => setClimate({ snowLoadKpa })} />
            <NumberField label="Ветровая нагрузка, кПа" value={project.climate.windLoadKpa} onChange={(windLoadKpa) => setClimate({ windLoadKpa })} />
            <SelectField label="Тип местности" value={project.climate.terrainType} options={terrainOptions} onChange={(terrainType) => setClimate({ terrainType })} />
          </div>
        </>
      )}
    </BuildingInputCard>
  );
}
