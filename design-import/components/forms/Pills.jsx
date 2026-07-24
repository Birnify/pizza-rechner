import React from "react";

/* Quick-select chips (.pills) — a wrapping row of shortcut values beneath a field
 * (yeast amounts, preset percentages). Hairline chips on the card; the selected one
 * fills tomato. Controlled via value + onChange over a list of options. */
export function Pills({ options = [], value, onChange, ariaLabel, style, ...rest }) {
  return (
    <div role="group" aria-label={ariaLabel}
      style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "2px", ...style }} {...rest}>
      {options.map((opt) => {
        const val = typeof opt === "object" ? opt.value : opt;
        const label = typeof opt === "object" ? opt.label : opt;
        const active = val === value;
        return (
          <button
            key={String(val)} type="button" aria-pressed={active}
            onClick={() => onChange && onChange(val)}
            style={{
              border: `1px solid ${active ? "var(--tomato)" : "var(--line)"}`,
              background: active ? "var(--tomato)" : "var(--card)",
              color: active ? "var(--on-accent)" : "var(--ink)",
              borderRadius: "var(--radius-chip)", padding: "8px 16px", minHeight: "36px", minWidth: "44px", textAlign: "center",
              fontFamily: "var(--font-body)", fontSize: "12px",
              fontWeight: active ? "var(--weight-semibold)" : "var(--weight-regular)",
              cursor: "pointer", transition: "background .12s, border-color .12s, color .12s",
            }}
            onMouseEnter={(e) => { if (!active) { e.currentTarget.style.borderColor = "var(--tomato)"; e.currentTarget.style.color = "var(--tomato-text)"; } }}
            onMouseLeave={(e) => { if (!active) { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--ink)"; } }}
          >{label}</button>
        );
      })}
    </div>
  );
}
