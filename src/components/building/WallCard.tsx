import type { ProjectInput } from "../../calc/project/types";
import {
  applyProjectWallConstruction,
  resetProjectWallLoadFromConstruction,
  setProjectManualWallLoad,
} from "../../calc/project/envelope-construction-updates";
import { wallConstructionOptions } from "../../calc/shared/envelope-constructions";
import { BuildingInputCard } from "./BuildingInputCard";
import { fieldGridStyle, InfoPill, NumberField, SelectField } from "./BuildingFields";

export function WallCard({
  project,
  onProjectChange,
}: {
  project: ProjectInput;
  onProjectChange: (project: ProjectInput) => void;
}) {
  return (
    <BuildingInputCard
      stepNumber={4}
      title="Стены"
      status={project.walls.useManualWallLoad ? "warning" : "complete"}
      summary={`${project.walls.wallConstruction} · ${project.walls.wallLoadKpa.toFixed(3)} кПа`}
    >
      <div style={fieldGridStyle}>
        <SelectField
          label="Конструкция ограждения / стен"
          value={project.walls.wallConstruction}
          options={wallConstructionOptions.map((option) => ({ value: option.id, label: option.label }))}
          onChange={(wallConstruction) => onProjectChange(applyProjectWallConstruction(project, wallConstruction))}
        />
        <NumberField
          label="Нагрузка ограждения, кПа"
          value={project.walls.wallLoadKpa}
          step={0.001}
          onChange={(wallLoadKpa) => onProjectChange(setProjectManualWallLoad(project, wallLoadKpa))}
        />
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        {project.walls.useManualWallLoad && <InfoPill>Ручная нагрузка</InfoPill>}
        {project.walls.useManualWallLoad && (
          <button type="button" className="secondary" onClick={() => onProjectChange(resetProjectWallLoadFromConstruction(project))}>
            Вернуть из справочника
          </button>
        )}
        <span style={{ color: "#64748b", fontSize: 13 }}>Цоколь и парапет пока не участвуют в расчёте.</span>
      </div>
    </BuildingInputCard>
  );
}
