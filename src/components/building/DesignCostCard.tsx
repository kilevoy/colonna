import type { ProjectDesignCostMethod, ProjectInput } from "../../calc/project/types";
import { calculateProjectBuildingArea, calculateProjectDesignCost } from "../../calc/project";
import { BuildingInputCard } from "./BuildingInputCard";
import { CheckField, fieldGridStyle, NumberField, SelectField } from "./BuildingFields";

const methodOptions: Array<{ value: ProjectDesignCostMethod; label: string }> = [
  { value: "perArea", label: "₽/м²" },
  { value: "fixed", label: "Фиксированная сумма" },
];

function getDesign(project: ProjectInput) {
  return project.projectCosts?.design ?? { enabled: false, method: "perArea" as const, pricePerM2Rub: 0, fixedRub: 0 };
}

function formatRub(value: number): string {
  return `${value.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} руб`;
}

export function DesignCostCard({
  project,
  onProjectChange,
}: {
  project: ProjectInput;
  onProjectChange: (project: ProjectInput) => void;
}) {
  const design = getDesign(project);
  const area = calculateProjectBuildingArea(project);
  const total = calculateProjectDesignCost(project);
  const status = design.enabled && total <= 0 ? "warning" : "complete";

  const setDesign = (patch: Partial<typeof design>) => {
    onProjectChange({
      ...project,
      projectCosts: {
        ...project.projectCosts,
        design: { ...design, ...patch },
      },
    });
  };

  return (
    <BuildingInputCard
      stepNumber={7}
      title="Проектирование"
      status={status}
      summary={design.enabled ? `стоимость проектирования ${formatRub(total)}` : "не включено в итог UI"}
      helpText="Стоимость проектирования показывается отдельным UI-итогом и не меняет инженерную стоимость металлокаркаса."
    >
      <CheckField label="Учитывать стоимость проектирования" checked={design.enabled} onChange={(enabled) => setDesign({ enabled })} />
      <div style={fieldGridStyle}>
        <SelectField label="Способ расчёта" value={design.method} options={methodOptions} onChange={(method) => setDesign({ method })} />
        <NumberField label="Стоимость проектирования, ₽/м²" value={design.pricePerM2Rub} step={50} onChange={(pricePerM2Rub) => setDesign({ pricePerM2Rub })} />
        <NumberField label="Фиксированная сумма, ₽" value={design.fixedRub} step={1000} onChange={(fixedRub) => setDesign({ fixedRub })} />
      </div>
      <div style={{ color: "#334155" }}>
        Площадь для расчёта: {area.toFixed(0)} м². Итог проектирования: <strong>{formatRub(total)}</strong>.
      </div>
    </BuildingInputCard>
  );
}
