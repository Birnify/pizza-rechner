import React from "react";
import { Badge } from "../core/Badge.jsx";

/* Step card (.step) — one instruction in the step-by-step guide. A serif numbered
 * disc on a fixed dark disc, then a title row (with an optional technique chip and a
 * right-aligned time chip) and body copy. Nest <Note> children for tip/warn asides
 * and a timer row below. Grounded in .step / .step .num / .step .body. */
export function StepCard({ number, title, chip, time, children, style, ...rest }) {
  return (
    <div
      style={{
        display: "flex", gap: "14px", background: "var(--card)",
        border: "1px solid var(--line)", borderLeft: "3px solid var(--line)",
        borderRadius: "var(--radius)", padding: "16px 18px", ...style,
      }}
      {...rest}
    >
      <span aria-hidden="true" style={{
        flexShrink: 0, width: "28px", height: "28px", borderRadius: "50%",
        background: "#2b2420", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-numeric)", fontWeight: "var(--weight-bold)", fontSize: "13px",
      }}>{number}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{
          margin: "2px 0 5px", display: "flex", alignItems: "center", gap: "9px", flexWrap: "wrap",
          fontFamily: "var(--font-body)", fontSize: "var(--text-title)", fontWeight: "var(--weight-bold)", color: "var(--ink)",
        }}>
          {title}
          {chip && <Badge tone="warm">{chip}</Badge>}
          {time && <span className="num" style={{
            marginLeft: "auto", fontSize: "12px", fontWeight: "var(--weight-heavy)",
            background: "#2b2420", color: "#fff", padding: "3px 11px", borderRadius: "var(--radius-chip)",
            letterSpacing: ".3px",
          }}>{time}</span>}
        </h4>
        <div style={{ fontSize: "var(--text-body-sm)", color: "var(--step-text)", lineHeight: 1.5, display: "flex", flexDirection: "column", gap: "7px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
