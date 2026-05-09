import type { ProjectInput } from "../../calc/project/types";
import { BuildingInputCard } from "./BuildingInputCard";
import { CheckField, fieldGridStyle, NumberField } from "./BuildingFields";

function FrameItem({ name, state }: { name: string; state: string }) {
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 10, background: "#f8fafc" }}>
      <strong style={{ display: "block", color: "#0f172a" }}>{name}</strong>
      <span style={{ color: "#64748b", fontSize: 13 }}>{state}</span>
    </div>
  );
}

export function FrameCard({
  project,
  onProjectChange,
}: {
  project: ProjectInput;
  onProjectChange: (project: ProjectInput) => void;
}) {
  const oracleEnabled = project.calculationSettings.enableOracleBlocks;
  const oracleState = oracleEnabled ? "будет рассчитано через VELICAN-oracle после нажатия «Рассчитать»" : "в обычном режиме skipped/warning";

  const setOracleEnabled = (enabled: boolean) => {
    onProjectChange({
      ...project,
      calculationSettings: {
        ...project.calculationSettings,
        enableOracleBlocks: enabled,
        useOracleForCraneBeam: enabled,
        useOracleForWindowRiegel: enabled,
        useOracleForBeamCell: enabled,
      },
    });
  };

  return (
    <BuildingInputCard
      stepNumber={3}
      title="Каркас: система Великан"
      status={oracleEnabled ? "warning" : "complete"}
      summary={oracleEnabled ? "система Великан · oracle/dev режим включён" : "система Великан · быстрый native режим"}
      helpText="Подкрановая балка, оконный ригель и балка покрытия временно считаются через тяжёлый VELICAN-oracle. Для быстрой работы они отключены по умолчанию."
    >
      <div style={{ display: "grid", gap: 6, color: "#334155" }}>
        <strong style={{ color: "#0f172a" }}>Система здания: Великан</strong>
        <span>Базовое решение для расчёта быстровозводимого металлического здания. Выбор других систем в этом этапе не показывается.</span>
      </div>
      <div style={fieldGridStyle}>
        <FrameItem name="Колонны" state="рассчитываются" />
        <FrameItem name="Балки покрытия" state={oracleState} />
        <FrameItem name="Кровельные прогоны" state="рассчитываются" />
        <FrameItem name="Фермы / несущие элементы покрытия" state="рассчитываются, если используются текущим native block" />
        <FrameItem name="Фахверк торцов" state="количество выводится через BuildingLayout и спецификацию" />
        <FrameItem name="Связи / распорки" state="пока отображаются как состав каркаса; расчётная детализация будет добавлена позже" />
        <FrameItem name="Подкрановая балка" state={oracleState} />
        <FrameItem name="Оконный ригель" state={oracleState} />
      </div>
      <CheckField label="Считать тяжёлые oracle-блоки VELICAN" checked={oracleEnabled} onChange={setOracleEnabled} />
      <div style={fieldGridStyle}>
        <CheckField
          label="Есть опорный кран"
          checked={project.cranes.supportCrane.enabled}
          onChange={(enabled) =>
            onProjectChange({ ...project, cranes: { ...project.cranes, supportCrane: { ...project.cranes.supportCrane, enabled } } })
          }
        />
        <NumberField
          label="Грузоподъёмность крана, т"
          value={Number(project.cranes.supportCrane.capacityT) || 0}
          onChange={(capacityT) =>
            onProjectChange({ ...project, cranes: { ...project.cranes, supportCrane: { ...project.cranes.supportCrane, capacityT } } })
          }
        />
        <NumberField
          label="Отметка рельса, м"
          value={project.cranes.supportCrane.railLevelM}
          onChange={(railLevelM) =>
            onProjectChange({
              ...project,
              geometry: { ...project.geometry, craneRailLevelM: railLevelM },
              cranes: { ...project.cranes, supportCrane: { ...project.cranes.supportCrane, railLevelM } },
            })
          }
        />
      </div>
    </BuildingInputCard>
  );
}
