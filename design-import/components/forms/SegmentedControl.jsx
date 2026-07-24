import React from "react";

/* Segmented toggle (.seg) — Einfach/Profi, Direkt/Biga/Poolish, Hand/Maschine.
 * The track uses --surface-2 (lighter than both page and card) plus a hairline so
 * the control stays visible even standing alone on the page background — addressing
 * the known issue where a bg-colored track vanished against the page. Active segment
 * fills tomato with white text. Controlled: pass value + options + onChange. */
export function SegmentedControl({ options = [], value, onChange, ariaLabel, size = "md", style, ...rest }) {
  const pad = size === "sm" ? "7px 6px" : "9px 8px";
  return (
    <div
      role="group" aria-label={ariaLabel}
      style={{
        display: "flex", gap: "6px", padding: "4px",
        background: "var(--surface-2)", border: "1px solid var(--line)",
        borderRadius: "var(--radius)", ...style,
      }}
      {...rest}
    >
      {options.map((opt) => {
        const val = typeof opt === "string" ? opt : opt.value;
        const label = typeof opt === "string" ? opt : opt.label;
        const active = val === value;
        return (
          <button
            key={val} type="button" aria-pressed={active}
            onClick={() => onChange && onChange(val)}
            style={{
              flex: 1, minHeight: "var(--touch-min)", border: "none",
              background: active ? "var(--tomato)" : "transparent",
              color: active ? "var(--on-accent)" : "var(--muted)",
              padding: pad, borderRadius: "var(--radius-sm)",
              fontFamily: "var(--font-body)", fontSize: "13.5px",
              fontWeight: "var(--weight-semibold)", cursor: "pointer",
              transition: "background .15s, color .15s",
            }}
            onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = "var(--ink)"; }}
            onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = "var(--muted)"; }}
          >{label}</button>
        );
      })}
    </div>
  );
}
