import React from "react";

/* Toggle switch (.switch) — feature flags in Einstellungen. The OFF track uses
 * --muted (not --line) so it stays visible on a card; ON fills tomato. The visible
 * track is 38×22 but the hit area spans the full control. Controlled via checked. */
export function Switch({ checked = false, onChange, label, id, disabled = false, style, ...rest }) {
  return (
    <span
      style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: "44px", height: "44px", flexShrink: 0, cursor: disabled ? "not-allowed" : "pointer", ...style }}
    >
      <input
        type="checkbox" role="switch" id={id} checked={checked} disabled={disabled}
        aria-label={label} onChange={(e) => onChange && onChange(e.target.checked)}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", margin: 0, opacity: 0, cursor: "inherit" }}
        {...rest}
      />
      <span aria-hidden="true" style={{
        width: "38px", height: "22px", borderRadius: "var(--radius-chip)",
        background: checked ? "var(--tomato)" : "var(--muted)",
        position: "relative", transition: "background .15s", pointerEvents: "none",
        opacity: disabled ? 0.5 : 1,
      }}>
        <span style={{
          content: '""', position: "absolute", top: "2px", left: "2px",
          width: "18px", height: "18px", borderRadius: "50%", background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,.4)", transition: "transform .15s",
          transform: checked ? "translateX(16px)" : "translateX(0)",
        }} />
      </span>
    </span>
  );
}
