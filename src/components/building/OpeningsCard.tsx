import type { ProjectInput, ProjectOpeningItem, ProjectOpeningType, ProjectOpenings } from "../../calc/project/types";
import { BuildingInputCard } from "./BuildingInputCard";
import { fieldGridStyle, InlineWarning, NumberField, SelectField, TextField } from "./BuildingFields";

const typeLabels: Record<ProjectOpeningType, string> = {
  window: "Окно",
  door: "Дверь",
  gate: "Ворота",
};

const typeOptions: Array<{ value: ProjectOpeningType; label: string }> = [
  { value: "window", label: "Окно" },
  { value: "door", label: "Дверь" },
  { value: "gate", label: "Ворота" },
];

const keyByType: Record<ProjectOpeningType, keyof ProjectOpenings> = {
  window: "windows",
  door: "doors",
  gate: "gates",
};

function getOpenings(project: ProjectInput): ProjectOpenings {
  return project.openings ?? { windows: [], doors: [], gates: [] };
}

function emptyOpening(type: ProjectOpeningType): ProjectOpeningItem {
  return {
    id: `${type}-${Date.now()}`,
    type,
    widthM: type === "gate" ? 4 : 1.5,
    heightM: type === "gate" ? 4 : 1.5,
    quantity: 1,
    facade: "",
    comment: "",
  };
}

export function OpeningsCard({
  project,
  onProjectChange,
}: {
  project: ProjectInput;
  onProjectChange: (project: ProjectInput) => void;
}) {
  const openings = getOpenings(project);
  const allItems = [...openings.windows, ...openings.doors, ...openings.gates];
  const totalQuantity = allItems.reduce((sum, item) => sum + item.quantity, 0);

  const setOpenings = (nextOpenings: ProjectOpenings) => onProjectChange({ ...project, openings: nextOpenings });
  const addOpening = (type: ProjectOpeningType) => {
    const key = keyByType[type];
    setOpenings({ ...openings, [key]: [...openings[key], emptyOpening(type)] });
  };
  const updateOpening = (item: ProjectOpeningItem, patch: Partial<ProjectOpeningItem>) => {
    const nextItem = { ...item, ...patch };
    const nextOpenings = { ...openings };
    (Object.keys(keyByType) as ProjectOpeningType[]).forEach((type) => {
      const key = keyByType[type];
      nextOpenings[key] = nextOpenings[key].filter((value) => value.id !== item.id);
    });
    nextOpenings[keyByType[nextItem.type]] = [...nextOpenings[keyByType[nextItem.type]], nextItem];
    setOpenings(nextOpenings);
  };
  const removeOpening = (item: ProjectOpeningItem) => {
    const key = keyByType[item.type];
    setOpenings({ ...openings, [key]: openings[key].filter((value) => value.id !== item.id) });
  };

  return (
    <BuildingInputCard
      stepNumber={6}
      title="Окна, двери, ворота"
      status="complete"
      summary={totalQuantity > 0 ? `${totalQuantity} шт.` : "проёмы не заданы"}
    >
      <InlineWarning>Проёмы пока учитываются как данные для будущей спецификации. Точная привязка к фасадам будет добавлена позже.</InlineWarning>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button type="button" className="secondary" onClick={() => addOpening("window")}>Добавить окно</button>
        <button type="button" className="secondary" onClick={() => addOpening("door")}>Добавить дверь</button>
        <button type="button" className="secondary" onClick={() => addOpening("gate")}>Добавить ворота</button>
      </div>
      {allItems.map((item) => (
        <div key={item.id} style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 10, display: "grid", gap: 10 }}>
          <strong>{typeLabels[item.type]}</strong>
          <div style={fieldGridStyle}>
            <SelectField label="Тип" value={item.type} options={typeOptions} onChange={(type) => updateOpening(item, { type })} />
            <NumberField label="Ширина, м" value={item.widthM} onChange={(widthM) => updateOpening(item, { widthM })} />
            <NumberField label="Высота, м" value={item.heightM} onChange={(heightM) => updateOpening(item, { heightM })} />
            <NumberField label="Количество" value={item.quantity} step={1} onChange={(quantity) => updateOpening(item, { quantity })} />
            <TextField label="Фасад / стена" value={item.facade ?? ""} onChange={(facade) => updateOpening(item, { facade })} />
            <TextField label="Комментарий" value={item.comment ?? ""} onChange={(comment) => updateOpening(item, { comment })} />
          </div>
          <button type="button" className="secondary" onClick={() => removeOpening(item)}>
            Удалить
          </button>
        </div>
      ))}
    </BuildingInputCard>
  );
}
