import React from "react";
import { Icon } from "./Icon.jsx";

/* Circular icon button. Grounded in .party-qty-btn / .adjust-btn / .nav-close /
 * .info-btn: a round, hairline-bordered control on a card surface whose border
 * and glyph shift to tomato on hover. Set variant="info" for the small italic-"i"
 * help toggle (aria-expanded flips it to a filled tomato disc). */
export function IconButton({
  icon, label, variant = "default", size = 40, active = false, onClick, style, ...rest
}) {
  const isInfo = variant === "info";
  const dim = isInfo ? 24 : size;
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: dim, height: dim, flexShrink: 0, borderRadius: "50%",
    background: active ? "var(--tomato)" : "var(--card)",
    color: active ? "var(--on-accent)" : (isInfo ? "var(--muted)" : "var(--ink)"),
    border: `1px solid ${active ? "var(--tomato)" : (isInfo ? "var(--muted)" : "var(--line)")}`,
    cursor: "pointer", padding: 0, transition: "background .12s, border-color .12s, color .12s",
    ...(isInfo ? { fontFamily: "Georgia, serif", fontStyle: "italic", fontWeight: 700, fontSize: 13, lineHeight: 1 } : {}),
  };
  return (
    <button
      type="button" aria-label={label} aria-pressed={rest["aria-expanded"] == null ? active : undefined}
      onClick={onClick} style={{ ...base, ...style }}
      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.borderColor = "var(--tomato)"; e.currentTarget.style.color = "var(--tomato-text)"; } }}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.borderColor = isInfo ? "var(--muted)" : "var(--line)"; e.currentTarget.style.color = isInfo ? "var(--muted)" : "var(--ink)"; } }}
      {...rest}
    >
      {isInfo ? "i" : <Icon name={icon} size={Math.round(dim * 0.5)} />}
    </button>
  );
}
