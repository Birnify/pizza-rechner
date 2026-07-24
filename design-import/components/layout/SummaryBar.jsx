import React from "react";
import { Icon } from "../core/Icon.jsx";

/* SummaryBar — the sticky bottom summary bar.
 *
 * A CARD SURFACE (same family as the tab bar and cards) with a 3px tomato left-accent
 * to mark it, the live total as the big serif number on the left, and a single
 * soft-rect PRIMARY button on the right — so tomato appears only on the one action,
 * honouring the rule "tomato is never a large background fill". Set position="static"
 * inside a phone-frame mock. */
export function SummaryBar({
  total, count, saveLabel = "Speichern", onSave, onJump, position = "fixed", style, ...rest
}) {
  return (
    <div
      style={{
        position, left: 0, right: 0, zIndex: 20,
        display: "flex", alignItems: "center", gap: "12px",
        padding: "10px 14px", background: "var(--card)",
        borderTop: "1px solid var(--line)", borderLeft: "3px solid var(--tomato)",
        boxShadow: "var(--shadow-bar)",
        ...(position === "fixed" ? { bottom: "var(--tabbar-h)" } : {}),
        ...style,
      }}
      {...rest}
    >
      <button
        type="button" onClick={onJump}
        style={{
          all: "unset", boxSizing: "border-box", flex: 1, display: "flex",
          flexDirection: "column", justifyContent: "center", minHeight: "44px",
          cursor: "pointer",
        }}
      >
        <span className="num" style={{
          fontFamily: "var(--font-numeric)", fontSize: "var(--text-title)",
          fontWeight: "var(--weight-bold)", color: "var(--ink)", lineHeight: 1.1,
        }}>{total}</span>
        {count != null && (
          <span style={{ fontSize: "var(--text-meta)", color: "var(--muted)", marginTop: "1px" }}>{count}</span>
        )}
      </button>
      {onSave && (
        <button
          type="button" onClick={onSave}
          style={{
            flexShrink: 0, display: "inline-flex", alignItems: "center", gap: "7px",
            minHeight: "44px", padding: "0 20px", border: "1px solid var(--tomato)",
            borderRadius: "var(--radius)", background: "var(--tomato)", color: "var(--on-accent)",
            cursor: "pointer", fontFamily: "var(--font-body)", fontSize: "14px",
            fontWeight: "var(--weight-semibold)", boxShadow: "var(--shadow-cta)",
            transition: "background .12s, border-color .12s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--tomato-dark)"; e.currentTarget.style.borderColor = "var(--tomato-dark)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--tomato)"; e.currentTarget.style.borderColor = "var(--tomato)"; }}
        >
          <Icon name="save" size={16} />{saveLabel}
        </button>
      )}
    </div>
  );
}
