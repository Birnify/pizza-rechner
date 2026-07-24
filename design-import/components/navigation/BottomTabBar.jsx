import React from "react";
import { Icon } from "../core/Icon.jsx";

/* Bottom tab bar (.bottom-tabs) — the app's persistent mobile navigation:
 * Rechner · Pizza Party · Glossar · Einstellungen. Fixed to the bottom on a card
 * surface with a top hairline + upward shadow. Each tab stacks a line icon over an
 * 11px label; the active tab tints tomato with a subtle backing. Controlled via
 * value + onChange. Pass position="static" to embed inside a phone-frame mock. */
export function BottomTabBar({ items = [], value, onChange, position = "fixed", style, ...rest }) {
  return (
    <nav
      aria-label="Bereiche"
      style={{
        position, left: 0, right: 0, bottom: 0, zIndex: 30,
        display: "flex", background: "var(--card)",
        borderTop: "1px solid var(--line)", boxShadow: "0 -4px 12px rgba(0,0,0,.35)",
        padding: "6px 4px", ...style,
      }}
      {...rest}
    >
      {items.map((it) => {
        const active = it.id === value;
        return (
          <button
            key={it.id} type="button" aria-current={active ? "page" : undefined}
            onClick={() => onChange && onChange(it.id)}
            style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: "2px", minHeight: "var(--touch-min)",
              padding: "4px 2px", border: "none", borderRadius: "10px",
              background: active ? "var(--surface-2)" : "none",
              color: active ? "var(--tomato-text)" : "var(--muted)",
              fontFamily: "var(--font-body)", fontSize: "var(--text-micro)",
              fontWeight: "var(--weight-semibold)", cursor: "pointer", transition: "color .12s, background .12s",
            }}
          >
            <Icon name={it.icon} size={22} />
            <span>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
