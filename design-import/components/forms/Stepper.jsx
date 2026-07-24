import React from "react";
import { Icon } from "../core/Icon.jsx";

/* Number stepper (.stepper) — the primary numeric control in the calculator
 * (dough count, weight, hydration, salt, oil…). Square 44px −/+ buttons flank a
 * serif tabular value field. Buttons fill tomato on hover; the value is the brand's
 * serif numeral. Optional trailing unit. Controlled via value + onChange. */
export function Stepper({
  value, onChange, min = 0, max = Infinity, step = 1, unit, ariaLabel, disabled = false, style, ...rest
}) {
  const clamp = (n) => Math.min(max, Math.max(min, n));
  const set = (n) => onChange && onChange(clamp(Number(n.toFixed(4))));
  const btn = {
    width: "var(--control-h)", height: "var(--control-h)", flexShrink: 0,
    border: "1px solid var(--line)", background: "var(--card)",
    borderRadius: "var(--radius)", color: "var(--tomato-text)",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
    transition: "background .12s, border-color .12s, color .12s",
  };
  const hoverIn = (e) => { if (!disabled) { e.currentTarget.style.borderColor = "var(--tomato)"; e.currentTarget.style.background = "var(--tomato)"; e.currentTarget.style.color = "var(--on-accent)"; } };
  const hoverOut = (e) => { if (!disabled) { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.background = "var(--card)"; e.currentTarget.style.color = "var(--tomato-text)"; } };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", ...style }} {...rest}>
      <button type="button" style={btn} disabled={disabled} aria-label="−" onClick={() => set(value - step)} onMouseEnter={hoverIn} onMouseLeave={hoverOut}><Icon name="minus" size={20} /></button>
      <input
        type="number" value={value} min={min} max={max} step={step} disabled={disabled}
        aria-label={ariaLabel} onChange={(e) => set(e.target.value === "" ? min : Number(e.target.value))}
        style={{
          flex: 1, minWidth: 0, width: "auto", textAlign: "center",
          padding: "9px 4px", minHeight: "var(--control-h)",
          border: "1px solid var(--line)", borderRadius: "var(--radius)",
          background: "var(--card)", color: "var(--ink)",
          fontFamily: "var(--font-numeric)", fontSize: "20px", fontWeight: "var(--weight-bold)",
          fontVariantNumeric: "tabular-nums", MozAppearance: "textfield",
        }}
      />
      {unit && <span style={{ fontSize: "13px", color: "var(--muted)", flexShrink: 0 }}>{unit}</span>}
      <button type="button" style={btn} disabled={disabled} aria-label="+" onClick={() => set(value + step)} onMouseEnter={hoverIn} onMouseLeave={hoverOut}><Icon name="plus" size={20} /></button>
    </div>
  );
}
