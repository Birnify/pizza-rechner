import React from "react";

/* Preset recipe card (.preset-card) — a tappable recommendation tile (Schnell /
 * Klassisch / Lang). Left-aligned: bold name, a tomato-text time line, a muted
 * fit-blurb. Hairline border goes tomato on hover; selected pins the tomato border. */
export function PresetCard({ name, time, description, selected = false, onClick, style, ...rest }) {
  return (
    <button
      type="button" onClick={onClick} aria-pressed={selected}
      style={{
        flex: "1 1 140px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "3px",
        textAlign: "left", border: `1px solid ${selected ? "var(--tomato)" : "var(--line)"}`,
        background: "var(--card)", borderRadius: "var(--radius)", padding: "12px 14px",
        minHeight: "44px", cursor: "pointer", font: "inherit", transition: "border-color .12s",
        ...style,
      }}
      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.borderColor = "var(--tomato)"; }}
      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.borderColor = "var(--line)"; }}
      {...rest}
    >
      <span style={{ fontWeight: "var(--weight-bold)", fontSize: "14px", color: "var(--ink)" }}>{name}</span>
      {time && <span style={{ fontSize: "12px", fontWeight: "var(--weight-semibold)", color: "var(--tomato-text)" }}>{time}</span>}
      {description && <span style={{ fontSize: "11.5px", color: "var(--muted)", lineHeight: 1.3 }}>{description}</span>}
    </button>
  );
}
