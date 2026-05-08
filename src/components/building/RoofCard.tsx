import type { ProjectInput, ProjectRoofDrainage, ProjectRoofShape, PurlinSystemPreference } from "../../calc/project/types";
import type { RoofType } from "../../calc/types";
import {
  applyProjectRoofConstruction,
  resetProjectRoofLoadFromConstruction,
  setProjectManualRoofLoad,
} from "../../calc/project/envelope-construction-updates";
import { setProjectPurlinSystemPreference } from "../../calc/project/purlin-system-updates";
import { roofConstructionOptions } from "../../calc/shared/envelope-constructions";
import { BuildingInputCard } from "./BuildingInputCard";
import { fieldGridStyle, InfoPill, NumberField, SelectField } from "./BuildingFields";

const roofShapeOptions: Array<{ value: ProjectRoofShape; label: string }> = [
  { value: "gable", label: "Двускатная" },
  { value: "singleSlope", label: "Односкатная" },
];

const drainageOptions: Array<{ value: ProjectRoofDrainage; label: string }> = [
  { value: "external", label: "Наружный" },
  { value: "internal", label: "Внутренний" },
  { value: "notSpecified", label: "Не задано" },
];

const purlinOptions: Array<{ value: PurlinSystemPreference; label: string }> = [
  { value: "auto", label: "Авто" },
  { value: "sortSteel", label: "Сортовой металл" },
  { value: "mp350", label: "ЛСТК MP350" },
  { value: "mp390", label: "ЛСТК MP390" },
];

function roofTypeFromShape(shape: ProjectRoofShape): RoofType {
  return shape === "singleSlope" ? "single_slope" : "gable";
}

export function RoofCard({
  project,
  onProjectChange,
}: {
  project: ProjectInput;
  onProjectChange: (project: ProjectInput) => void;
}) {
  return (
    <BuildingInputCard
      stepNumber={5}
      title="Кровля"
      status={project.roof.useManualRoofLoad ? "warning" : "complete"}
      summary={`${project.roof.roofConstruction} · ${project.roof.roofLoadKpa.toFixed(3)} кПа · прогоны ${project.calculationSettings.purlinSystemPreference}`}
    >
      <div style={fieldGridStyle}>
        <SelectField
          label="Конструкция покрытия"
          value={project.roof.roofConstruction}
          options={roofConstructionOptions.map((option) => ({ value: option.id, label: option.label }))}
          onChange={(roofConstruction) => onProjectChange(applyProjectRoofConstruction(project, roofConstruction))}
        />
        <NumberField
          label="Нагрузка покрытия, кПа"
          value={project.roof.roofLoadKpa}
          step={0.001}
          onChange={(roofLoadKpa) => onProjectChange(setProjectManualRoofLoad(project, roofLoadKpa))}
        />
        <SelectField
          label="Форма кровли"
          value={project.roof.roofShape ?? "gable"}
          options={roofShapeOptions}
          onChange={(roofShape) => onProjectChange({ ...project, roof: { ...project.roof, roofShape, roofType: roofTypeFromShape(roofShape) } })}
        />
        <NumberField
          label="Уклон кровли, град."
          value={project.geometry.roofSlopeDeg}
          onChange={(roofSlopeDeg) => onProjectChange({ ...project, geometry: { ...project.geometry, roofSlopeDeg } })}
        />
        <SelectField
          label="Водосток"
          value={project.roof.drainage ?? "external"}
          options={drainageOptions}
          onChange={(drainage) => onProjectChange({ ...project, roof: { ...project.roof, drainage } })}
        />
        <SelectField
          label="Система прогонов"
          value={project.calculationSettings.purlinSystemPreference}
          options={purlinOptions}
          onChange={(purlinSystemPreference) => onProjectChange(setProjectPurlinSystemPreference(project, purlinSystemPreference))}
        />
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        {project.roof.useManualRoofLoad && <InfoPill>Ручная нагрузка</InfoPill>}
        {project.roof.useManualRoofLoad && (
          <button type="button" className="secondary" onClick={() => onProjectChange(resetProjectRoofLoadFromConstruction(project))}>
            Вернуть из справочника
          </button>
        )}
      </div>
    </BuildingInputCard>
  );
}
