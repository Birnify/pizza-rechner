import React from "react";
import { Icon } from "./Icon.jsx";

/* Button — the Teigmeister button.
 *
 * ONE shape system: all buttons use the 14px soft-rect radius, so actions share a
 * shape with inputs and cards ("act on / type into" = soft-rect), leaving the pill
 * exclusively to selection controls (chips, segmented, switch). One accent CTA per
 * view stays filled tomato; a TONAL tier gives a medium-emphasis option without a
 * loud tomato wash.
 *
 *   primary   — filled tomato, white label, soft shadow (the one key action)
 *   tonal     — soft tomato tint fill + tomato text (medium emphasis)
 *   secondary — surface fill + hairline border (supporting actions)
 *   ghost     — transparent, text-only (tertiary / inline) */
export function Button({
  children, variant = "secondary", size = "md", icon, iconRight,
  disabled = false, fullWidth = false, onClick, type = "button", style, ...rest
}) {
  const pad = size === "lg" ? "15px 24px" : size === "sm" ? "8px 14px" : "12px 18px";
  const minH = size === "lg" ? "52px" : size === "sm" ? "36px" : "44px";
  const font = size === "sm" ? "13px" : size === "lg" ? "15px" : "14px";

  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px",
    width: fullWidth ? "100%" : "auto", minHeight: minH, padding: pad,
    borderRadius: "var(--radius)", fontFamily: "var(--font-body)", fontSize: font,
    fontWeight: "var(--weight-semibold)", lineHeight: 1, cursor: disabled ? "not-allowed" : "pointer",
    transition: "background .12s, border-color .12s, color .12s", border: "1px solid transparent",
    boxSizing: "border-box",
  };
  const variants = {
    primary: {
      background: disabled ? "var(--tomato-disabled)" : "var(--tomato)",
      color: disabled ? "var(--muted-soft)" : "var(--on-accent)",
      borderColor: disabled ? "var(--tomato-disabled)" : "var(--tomato)",
      boxShadow: disabled ? "none" : "var(--shadow-cta)",
    },
    tonal: {
      background: disabled ? "var(--surface-2)" : "var(--tomato-soft-bg)",
      color: disabled ? "var(--muted-soft)" : "var(--tomato-text)",
      borderColor: "transparent",
    },
    secondary: {
      background: "var(--surface-2)", color: disabled ? "var(--muted-soft)" : "var(--ink)",
      borderColor: "var(--line)",
    },
    ghost: {
      background: "transparent", color: disabled ? "var(--muted-soft)" : "var(--ink)",
      fontWeight: "var(--weight-medium)",
    },
  };

  const enter = (e) => {
    if (disabled) return;
    if (variant === "primary") { e.currentTarget.style.background = "var(--tomato-dark)"; e.currentTarget.style.borderColor = "var(--tomato-dark)"; }
    else if (variant === "tonal") { e.currentTarget.style.background = "var(--tomato-soft-hover)"; }
    else if (variant === "ghost") { e.currentTarget.style.background = "var(--surface-2)"; }
    else { e.currentTarget.style.borderColor = "var(--tomato)"; e.currentTarget.style.color = "var(--tomato-text)"; }
  };
  const leave = (e) => {
    if (disabled) return;
    const v = variants[variant];
    e.currentTarget.style.background = v.background;
    e.currentTarget.style.borderColor = v.borderColor;
    e.currentTarget.style.color = v.color;
  };

  return (
    <button type={type} disabled={disabled} onClick={onClick}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={enter} onMouseLeave={leave} {...rest}>
      {icon && <Icon name={icon} size={18} />}
      {children}
      {iconRight && <Icon name={iconRight} size={18} />}
    </button>
  );
}
