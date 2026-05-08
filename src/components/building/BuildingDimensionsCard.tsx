import type { ProjectBuildingEnvelope, ProjectInput, ProjectRoofShape } from "../../calc/project/types";
import type { SpanCount } from "../../calc/types";
import { buildBuildingLayout } from "../../calc/layout";
import { calculateProjectBuildingArea } from "../../calc/project";
import { BuildingInputCard } from "./BuildingInputCard";
import { fieldGridStyle, NumberField, SelectField } from "./BuildingFields";

const spanOptions: Array<{ value: SpanCount; label: string }> = [
  { value: "single", label: "Один пролёт" },
  { value: "multi", label: "Несколько пролётов" },
];

const envelopeOptions: Array<{ value: ProjectBuildingEnvelope; label: string }> = [
  { value: "cold", label: "Холодное" },
  { value: "warm", label: "Тёплое" },
];

function getApproxFrameCount(project: ProjectInput): number {
  try {
    return buildBuildingLayout(project).frameCount;
  } catch {
    return Math.max(1, Math.floor(project.geometry.buildingLengthM / project.geometry.frameStepM) + 1);
  }
}

export function BuildingDimensionsCard({
  project,
  onProjectChange,
}: {
  project: ProjectInput;
  onProjectChange: (project: ProjectInput) => void;
}) {
  const area = calculateProjectBuildingArea(project);
  const volume = area * project.geometry.buildingHeightM;
  const frameCount = getApproxFrameCount(project);
  const status = area > 0 && project.geometry.buildingHeightM > 0 && project.geometry.frameStepM > 0 ? "complete" : "error";

  const setGeometry = (patch: Partial<ProjectInput["geometry"]>) => {
    onProjectChange({ ...project, geometry: { ...project.geometry, ...patch } });
  };

  return (
    <BuildingInputCard
      stepNumber={2}
      title="Габариты здания"
      status={status}
      summary={`${area.toFixed(0)} м² · ${project.geometry.buildingSpanM}×${project.geometry.buildingLengthM} м · около ${frameCount} рам`}
    >
      <div style={fieldGridStyle}>
        <NumberField label="Ширина / пролёт здания, м" value={project.geometry.buildingSpanM} onChange={(buildingSpanM) => setGeometry({ buildingSpanM })} />
        <NumberField label="Длина здания, м" value={project.geometry.buildingLengthM} onChange={(buildingLengthM) => setGeometry({ buildingLengthM })} />
        <NumberField label="Высота до карниза / низа покрытия, м" value={project.geometry.buildingHeightM} onChange={(buildingHeightM) => setGeometry({ buildingHeightM, columnHeightM: buildingHeightM })} />
        <NumberField label="Шаг рам, м" value={project.geometry.frameStepM} onChange={(frameStepM) => setGeometry({ frameStepM })} />
        <NumberField label="Шаг фахверка, м" value={project.geometry.facadePostStepM} onChange={(facadePostStepM) => setGeometry({ facadePostStepM })} />
        <NumberField label="Уклон кровли, град." value={project.geometry.roofSlopeDeg} onChange={(roofSlopeDeg) => setGeometry({ roofSlopeDeg })} />
        <SelectField label="Количество пролётов" value={project.geometry.spanCount} options={spanOptions} onChange={(spanCount) => setGeometry({ spanCount })} />
        <SelectField
          label="Исполнение"
          value={project.projectInfo.buildingEnvelope ?? "cold"}
          options={envelopeOptions}
          onChange={(buildingEnvelope) => onProjectChange({ ...project, projectInfo: { ...project.projectInfo, buildingEnvelope } })}
        />
      </div>
      <div style={fieldGridStyle}>
        <div>Площадь здания: {area.toFixed(0)} м²</div>
        <div>Строительный объём: {volume.toFixed(0)} м³</div>
        <div>Примерное количество осей/рам: {frameCount}</div>
        <div>Форма кровли: {(project.roof.roofShape ?? "gable") === ("singleSlope" satisfies ProjectRoofShape) ? "односкатная" : "двускатная"}</div>
      </div>
    </BuildingInputCard>
  );
}
