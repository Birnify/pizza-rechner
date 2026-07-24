import React from "react";

/* Total summary (.result .total) — the headline figure of the result panel, e.g.
 * total dough weight. A centred block framed top+bottom by a 2px rule, a big serif
 * number, an uppercase label, and an optional italic footnote (waste surcharge). */
export function TotalSummary({ value, label, note, style, ...rest }) {
  return (
    <div
      style={{
        textAlign: "center", padding: "16px 14px", background: "var(--surface-2)",
        borderTop: "2px solid var(--ink)", borderBottom: "2px solid var(--ink)", ...style,
      }}
      {...rest}
    >
      <div className="num" style={{ fontSize: "var(--text-display)", fontWeight: "var(--weight-bold)", color: "var(--ink)", lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: "var(--text-hint)", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "var(--tracking-label)", marginTop: "2px" }}>{label}</div>
      {note && <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px", fontStyle: "italic" }}>{note}</div>}
    </div>
  );
}
