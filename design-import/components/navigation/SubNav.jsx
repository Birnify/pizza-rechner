import React from "react";

/* Secondary segmented nav (.calc-subnav) — the in-view switcher for the three
 * calculator sub-areas (Rechner / Rezepte / Zeitplan). A horizontal segmented
 * control on an inset track; the active item fills tomato. Controlled. */
export function SubNav({ items = [], value, onChange, ariaLabel, style, ...rest }) {
  return (
    <div role="navigation" aria-label={ariaLabel}
      style={{
        display: "flex", gap: "6px", padding: "4px",
        background: "var(--surface-inset)", border: "1px solid var(--line)",
        borderRadius: "var(--radius)", ...style,
      }}
      {...rest}
    >
      {items.map((it) => {
        const id = typeof it === "object" ? it.id : it;
        const label = typeof it === "object" ? it.label : it;
        const active = id === value;
        return (
          <button
            key={id} type="button" aria-current={active ? "page" : undefined}
            onClick={() => onChange && onChange(id)}
            style={{
              flex: 1, minHeight: "var(--touch-min)", border: "none",
              background: active ? "var(--tomato)" : "none",
              color: active ? "var(--on-accent)" : "var(--ink)",
              padding: "9px 6px", borderRadius: "var(--radius-xs)",
              fontFamily: "var(--font-body)", fontSize: "13px",
              fontWeight: "var(--weight-semibold)", cursor: "pointer", transition: "background .15s, color .15s",
            }}
          >{label}</button>
        );
      })}
    </div>
  );
}
