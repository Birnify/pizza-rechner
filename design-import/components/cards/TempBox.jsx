import React from "react";

/* Temperature box (.temp-box) — a stat tile for the water-temperature output.
 * A big serif tomato figure over an uppercase label. highlight makes it the primary
 * tile: warm highlight fill, toasted-crust border, and it grows wider (flex 1.4).
 * Lay two or three side by side in a flex row with a 10px gap. */
export function TempBox({ value, label, highlight = false, style, ...rest }) {
  return (
    <div
      style={{
        flex: highlight ? "1.4" : "1", textAlign: "center", borderRadius: "var(--radius)",
        padding: "12px 8px",
        background: highlight ? "var(--info-bg)" : "var(--surface-2)",
        border: highlight ? "1px solid var(--crust)" : "1px solid transparent",
        ...style,
      }}
      {...rest}
    >
      <div className="num" style={{ fontSize: "var(--text-stat)", fontWeight: "var(--weight-heavy)", color: "var(--tomato-text)" }}>{value}</div>
      <div style={{ fontSize: "var(--text-micro)", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px" }}>{label}</div>
    </div>
  );
}
