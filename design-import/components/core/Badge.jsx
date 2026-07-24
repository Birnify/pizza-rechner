import React from "react";

/* Badge — informational chips are borderless TONAL tints (matching the tonal button
 * tier); status / day markers stay SOLID fills. */
const TONES = {
  warm:    { background: "var(--info-bg)", color: "var(--info-text)", border: "1px solid transparent" },
  neutral: { background: "var(--surface-2)", color: "var(--muted)", border: "1px solid transparent" },
  accent:  { background: "var(--tomato-soft-bg)", color: "var(--tomato-text)", border: "1px solid transparent" },
  success: { background: "var(--success)", color: "var(--on-accent)", border: "1px solid var(--success)" },
  warning: { background: "var(--warning)", color: "#3a2405", border: "1px solid var(--warning)" },
  tomato:  { background: "var(--tomato)", color: "var(--on-accent)", border: "1px solid var(--tomato)" },
  biga:    { background: "#8d6814", color: "var(--on-accent)", border: "1px solid #8d6814" },
};

export function Badge({ children, tone = "warm", uppercase = false, mono = false, style, ...rest }) {
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: "5px",
        padding: "3px 11px", borderRadius: "var(--radius-chip)",
        fontFamily: mono ? "var(--font-numeric)" : "var(--font-body)",
        fontSize: uppercase ? "var(--text-micro)" : "var(--text-caption)",
        fontWeight: "var(--weight-bold)", lineHeight: "var(--leading-snug)",
        letterSpacing: uppercase ? "var(--tracking-eyebrow)" : ".3px",
        textTransform: uppercase ? "uppercase" : "none",
        fontVariantNumeric: mono ? "tabular-nums" : "normal",
        ...TONES[tone], ...style,
      }}
      {...rest}
    >{children}</span>
  );
}
