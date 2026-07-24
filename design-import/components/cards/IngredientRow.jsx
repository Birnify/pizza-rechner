import React from "react";

/* Ingredient row (.ing) — one line of a recipe result: name (with an optional
 * colour dot) on the left, a bold serif tabular amount with a small unit on the
 * right, a bottom hairline between rows. */
export function IngredientRow({ name, amount, unit, dotColor, last = false, style, ...rest }) {
  return (
    <div
      style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 0", borderBottom: last ? "none" : "1px solid var(--line)",
        fontSize: "var(--text-body)", ...style,
      }}
      {...rest}
    >
      <span style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--ink)" }}>
        {dotColor && <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: dotColor, flexShrink: 0 }} />}
        {name}
      </span>
      <span className="num" style={{ fontWeight: "var(--weight-bold)", color: "var(--ink)" }}>
        {amount}{unit && <small style={{ fontWeight: 500, color: "var(--muted)", fontSize: "11px", marginLeft: "3px", fontFamily: "var(--font-body)" }}>{unit}</small>}
      </span>
    </div>
  );
}
