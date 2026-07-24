import React, { useState } from "react";
import { Icon } from "../core/Icon.jsx";

/* Glossary entry (.glossary-item) — a collapsible dictionary article. Bottom hairline
 * divider, a serif-free bold summary with a rotating chevron, and long-form body copy
 * at relaxed leading. Controlled (open + onToggle) so a parent can enforce single-open
 * accordion behaviour; uncontrolled otherwise. */
export function GlossaryItem({ term, children, open, defaultOpen = false, onToggle, style, ...rest }) {
  const [selfOpen, setSelfOpen] = useState(defaultOpen);
  const isOpen = open != null ? open : selfOpen;
  const toggle = () => { if (open != null) onToggle && onToggle(!open); else setSelfOpen((v) => !v); };

  return (
    <div style={{ borderBottom: "1px solid var(--line)", ...style }} {...rest}>
      <button
        type="button" aria-expanded={isOpen} onClick={toggle}
        style={{
          all: "unset", boxSizing: "border-box", display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: "10px", width: "100%", minHeight: "44px",
          padding: "12px 0", cursor: "pointer",
          fontFamily: "var(--font-body)", fontSize: "14.5px", fontWeight: "var(--weight-semibold)", color: "var(--ink)",
        }}
      >
        <span>{term}</span>
        <Icon name="chevron" size={16} style={{ color: "var(--muted)", flexShrink: 0, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
      </button>
      {isOpen && (
        <div style={{ margin: "0 0 14px", fontSize: "var(--text-body-sm)", lineHeight: "var(--leading-relaxed)", color: "var(--ink)" }}>
          {children}
        </div>
      )}
    </div>
  );
}
