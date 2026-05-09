import { useState, type ReactNode } from "react";

export type BuildingInputCardStatus = "complete" | "incomplete" | "warning" | "error";

const statusLabels: Record<BuildingInputCardStatus, string> = {
  complete: "Заполнено",
  incomplete: "Не заполнено",
  warning: "Требует проверки",
  error: "Ошибка",
};

const statusColors: Record<BuildingInputCardStatus, { background: string; color: string; border: string }> = {
  complete: { background: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
  incomplete: { background: "#f8fafc", color: "#475569", border: "#cbd5e1" },
  warning: { background: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  error: { background: "#fef2f2", color: "#b91c1c", border: "#fecaca" },
};

export function BuildingInputCard({
  stepNumber,
  title,
  status,
  defaultOpen = false,
  summary,
  helpText,
  children,
}: {
  stepNumber: number;
  title: string;
  status: BuildingInputCardStatus;
  defaultOpen?: boolean;
  summary?: ReactNode;
  helpText?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const colors = statusColors[status];

  return (
    <section
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        background: "#ffffff",
        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        style={{
          width: "100%",
          border: "none",
          background: "linear-gradient(180deg, #fffaf5 0%, #ffffff 82%)",
          padding: 14,
          display: "grid",
          gridTemplateColumns: "auto minmax(0, 1fr) auto auto",
          gap: 12,
          alignItems: "center",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f97316",
            color: "white",
            fontWeight: 700,
            flex: "0 0 auto",
          }}
        >
          {stepNumber}
        </span>
        <span style={{ display: "grid", gap: 3, minWidth: 0 }}>
          <strong style={{ color: "#0f172a", fontSize: 17 }}>{title}</strong>
          {summary && <span style={{ color: "#64748b", fontSize: 13, lineHeight: 1.35 }}>{summary}</span>}
        </span>
        <span
          style={{
            border: `1px solid ${colors.border}`,
            background: colors.background,
            color: colors.color,
            borderRadius: 999,
            padding: "5px 9px",
            fontSize: 12,
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          {statusLabels[status]}
        </span>
        <span style={{ color: "#f97316", fontSize: 18, lineHeight: 1 }}>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div style={{ borderTop: "1px solid #f1f5f9", padding: 14, display: "grid", gap: 12 }}>
          {helpText && (
            <div style={{ borderLeft: "3px solid #fb923c", paddingLeft: 10, color: "#64748b", fontSize: 13 }}>
              {helpText}
            </div>
          )}
          {children}
        </div>
      )}
    </section>
  );
}
