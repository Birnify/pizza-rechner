import React, { useState } from "react";
import { Icon } from "../core/Icon.jsx";

/* Card (.card) — the primary content container. Card surface, 14px radius, hairline
 * border plus a 3px LEFT accent (tomato by default, basil/olive for result panels).
 * The title row is an uppercase tracked label preceded by a filled circular icon
 * badge. Set collapsible for the accordion behaviour (details.card) used on mobile;
 * pass open + onToggle to coordinate single-open accordions from a parent. */
export function Card({
  title, icon, accent = "tomato", collapsible = false, open, defaultOpen = true,
  onToggle, headerRight, children, style, ...rest
}) {
  const [selfOpen, setSelfOpen] = useState(defaultOpen);
  const isOpen = open != null ? open : selfOpen;
  const accentColor = accent === "basil" ? "var(--success)" : "var(--tomato)";

  const toggle = () => { if (open != null) onToggle && onToggle(!open); else setSelfOpen((v) => !v); };

  const header = (
    <div style={{
      display: "flex", alignItems: "center", gap: "10px",
      paddingBottom: (isOpen || !collapsible) ? "10px" : 0,
      marginBottom: (isOpen || !collapsible) ? "16px" : 0,
      borderBottom: (isOpen || !collapsible) ? "1px solid var(--line)" : "none",
    }}>
      {icon && (
        <span aria-hidden="true" style={{
          width: "var(--icon-badge)", height: "var(--icon-badge)", flexShrink: 0, borderRadius: "50%",
          background: accentColor, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
        }}><Icon name={icon} size={20} strokeWidth={1.6} /></span>
      )}
      <h2 style={{
        margin: 0, flex: 1, fontFamily: "var(--font-body)", fontSize: "var(--text-label)",
        textTransform: "uppercase", letterSpacing: "var(--tracking-label)", color: "var(--ink)",
        fontWeight: "var(--weight-bold)",
      }}>{title}</h2>
      {headerRight}
      {collapsible && <Icon name="chevron" size={18} style={{ color: "var(--muted)", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .18s" }} />}
    </div>
  );

  return (
    <section
      style={{
        background: "var(--card)", borderRadius: "var(--radius)", padding: "20px",
        border: "1px solid var(--line)", borderLeft: `3px solid ${accentColor}`,
        boxShadow: "var(--shadow)", minWidth: 0, ...style,
      }}
      {...rest}
    >
      {title && (collapsible
        ? <button type="button" onClick={toggle} aria-expanded={isOpen} style={{ all: "unset", display: "block", width: "100%", cursor: "pointer", boxSizing: "border-box" }}>{header}</button>
        : header)}
      {(isOpen || !collapsible) && <div>{children}</div>}
    </section>
  );
}
