import React from "react";
import { Icon } from "../core/Icon.jsx";

/* Select (.selectbox) — native dropdown for flour type, presets, units. Hairline
 * card-surface control with the brand chevron. size="lg" is the emphasized preset
 * selector (heavier, slightly larger). Controlled via value + onChange. */
export function Select({ options = [], value, onChange, ariaLabel, size = "md", disabled = false, style, ...rest }) {
  const lg = size === "lg";
  return (
    <div style={{ position: "relative", width: "100%", ...style }}>
      <select
        value={value} disabled={disabled} aria-label={ariaLabel}
        onChange={(e) => onChange && onChange(e.target.value)}
        style={{
          width: "100%", appearance: "none", WebkitAppearance: "none",
          padding: lg ? "11px 38px 11px 12px" : "9px 38px 9px 10px",
          minHeight: "var(--touch-min)", border: "1px solid var(--line)",
          borderRadius: "var(--radius)", background: "var(--card)", color: "var(--ink)",
          fontFamily: "var(--font-body)", fontSize: lg ? "14.5px" : "14px",
          fontWeight: lg ? "var(--weight-semibold)" : "var(--weight-regular)",
          cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
        }}
        {...rest}
      >
        {options.map((opt) => {
          const val = typeof opt === "object" ? opt.value : opt;
          const label = typeof opt === "object" ? opt.label : opt;
          return <option key={String(val)} value={val}>{label}</option>;
        })}
      </select>
      <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none", display: "flex" }}>
        <Icon name="chevron" size={18} />
      </span>
    </div>
  );
}
