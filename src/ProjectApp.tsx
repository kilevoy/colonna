import { useEffect, useMemo, useState } from "react";
import {
  calculateProjectWithSummary,
  calculateProjectWithSummaryAsync,
  defaultProjectInput,
  type ProjectInput,
} from "./calc/project";
import { buildBuildingSpecificationFromCalculation } from "./calc/specification";
import { RegionConstructionCard } from "./components/building/RegionConstructionCard";
import { BuildingDimensionsCard } from "./components/building/BuildingDimensionsCard";
import { FrameCard } from "./components/building/FrameCard";
import { WallCard } from "./components/building/WallCard";
import { RoofCard } from "./components/building/RoofCard";
import { OpeningsCard } from "./components/building/OpeningsCard";
import { DesignCostCard } from "./components/building/DesignCostCard";
import { CalculationSummaryCard, type ProjectCalculationView } from "./components/building/CalculationSummaryCard";

const twoColumnLayoutStyle = {
  display: "grid",
  gridTemplateColumns: "480px minmax(380px, 1fr)",
  gap: 20,
  alignItems: "start",
} as const;

const leftColumnStyle = {
  display: "grid",
  gap: 14,
  alignItems: "start",
} as const;

const rightColumnStyle = {
  display: "grid",
  gap: 14,
  alignItems: "start",
  position: "sticky",
  top: 14,
} as const;

function buildProjectView(project: ProjectInput): ProjectCalculationView {
  try {
    const startedAt = performance.now();
    const calculation = calculateProjectWithSummary(project);
    const specification = buildBuildingSpecificationFromCalculation(project, calculation);

    return {
      summary: calculation.summary,
      specification,
      purlinAlternativesSummary: calculation.purlinAlternativesSummary,
      durationMs: performance.now() - startedAt,
      error: null,
      loading: false,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      summary: null,
      specification: null,
      purlinAlternativesSummary: null,
      durationMs: null,
      error: message,
      loading: false,
    };
  }
}

export function ProjectApp() {
  const [draftProject, setDraftProject] = useState<ProjectInput>(defaultProjectInput);
  const [calculatedProject, setCalculatedProject] = useState<ProjectInput>(defaultProjectInput);
  const [view, setView] = useState<ProjectCalculationView>(() => buildProjectView(defaultProjectInput));

  useEffect(() => {
    if (!calculatedProject.calculationSettings.enableOracleBlocks) {
      setView(buildProjectView(calculatedProject));
      return;
    }

    let cancelled = false;
    const startedAt = performance.now();
    setView({
      summary: null,
      specification: null,
      purlinAlternativesSummary: null,
      durationMs: null,
      error: null,
      loading: true,
    });

    calculateProjectWithSummaryAsync(calculatedProject)
      .then((calculation) => {
        if (cancelled) return;
        setView({
          summary: calculation.summary,
          specification: buildBuildingSpecificationFromCalculation(calculatedProject, calculation),
          purlinAlternativesSummary: calculation.purlinAlternativesSummary,
          durationMs: performance.now() - startedAt,
          error: null,
          loading: false,
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : String(error);
        setView({
          summary: null,
          specification: null,
          purlinAlternativesSummary: null,
          durationMs: null,
          error: message,
          loading: false,
        });
      });

    return () => {
      cancelled = true;
    };
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
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ color: "#475569", fontSize: 14, lineHeight: 1.5 }}>
        Вкладка «Единое здание» теперь работает как пошаговый конфигуратор. Поля меняют draft-проект,
        а спецификация и варианты прогонов обновляются только после кнопки «Рассчитать».
      </div>

      <div style={twoColumnLayoutStyle}>
        <div style={leftColumnStyle}>
          <RegionConstructionCard project={draftProject} onProjectChange={setDraftProject} defaultOpen />
          <BuildingDimensionsCard project={draftProject} onProjectChange={setDraftProject} defaultOpen />
          <FrameCard project={draftProject} onProjectChange={setDraftProject} />
          <WallCard project={draftProject} onProjectChange={setDraftProject} />
          <RoofCard project={draftProject} onProjectChange={setDraftProject} />
          <OpeningsCard project={draftProject} onProjectChange={setDraftProject} />
          <DesignCostCard project={draftProject} onProjectChange={setDraftProject} />
        </div>
        <div style={rightColumnStyle}>
          <CalculationSummaryCard
            calculatedProject={calculatedProject}
            view={view}
            hasPendingChanges={hasPendingChanges}
            onCalculate={calculateDraft}
            onReset={resetProject}
          />
        </div>
      </div>
    </div>
  );
}
