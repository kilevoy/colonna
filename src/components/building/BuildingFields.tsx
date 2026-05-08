import type { ReactNode } from "react";

export const fieldGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 10,
} as const;

export const fieldLabelStyle = {
  display: "grid",
  gap: 5,
  fontSize: 13,
  color: "#334155",
  minWidth: 0,
} as const;

export const fieldControlStyle = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  padding: "8px 9px",
  border: "1px solid #cbd5e1",
  borderRadius: 7,
  background: "white",
} as const;

export function NumberField({
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
    <label style={fieldLabelStyle}>
      {label}
      <input
        type="number"
        step={step}
        value={value}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (Number.isFinite(next)) onChange(next);
        }}
        style={fieldControlStyle}
      />
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label style={fieldLabelStyle}>
      {label}
      <input type="text" value={value} onChange={(event) => onChange(event.target.value)} style={fieldControlStyle} />
    </label>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <label style={fieldLabelStyle}>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value as T)} style={fieldControlStyle}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function CheckField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label style={{ display: "flex", gap: 8, alignItems: "center", color: "#334155", fontSize: 13 }}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

export function InfoPill({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        padding: "5px 9px",
        background: "#fff7ed",
        color: "#9a3412",
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {children}
    </span>
  );
}

export function InlineWarning({ children }: { children: ReactNode }) {
  return (
    <div style={{ padding: 10, border: "1px solid #fed7aa", borderRadius: 8, background: "#fff7ed", color: "#9a3412", fontSize: 13 }}>
      {children}
    </div>
  );
}
