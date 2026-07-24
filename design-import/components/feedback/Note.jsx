import React from "react";

/* Notice boxes.
 * note — amber info box, full crust border (.note): background hints, ice notes
 * tip  — olive left-accent box (.step .body .tip): best-practice asides
 * warn — tomato left-accent box (.step .body .warn): cautions ("never salt on yeast")
 * Grounded in .note / .step .body .tip / .step .body .warn. */
const V = {
  note: { background: "var(--info-bg)", color: "var(--info-text)", border: "1px solid var(--crust)", borderRadius: "var(--radius)", padding: "11px 13px" },
  tip:  { background: "var(--success-bg)", color: "var(--success-text)", borderLeft: "3px solid var(--success)", borderRadius: "2px", padding: "7px 10px" },
  warn: { background: "var(--warn-bg)", color: "var(--warning-text)", borderLeft: "3px solid var(--warning)", borderRadius: "2px", padding: "7px 10px" },
};

export function Note({ children, variant = "note", style, ...rest }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-body)",
        fontSize: variant === "note" ? "var(--text-caption)" : "12.5px",
        lineHeight: 1.45, ...V[variant], ...style,
      }}
      {...rest}
    >{children}</div>
  );
}
