// Lightweight dark phone frame shared by the Teigmeister UI kit index.
// Not a design-system primitive — just a stage for the screens.
const { useState } = React;

function Phone({ children, width = 390, height = 780 }) {
  return (
    <div style={{
      width, height, position: "relative", flexShrink: 0,
      background: "var(--bg)", borderRadius: 40, border: "10px solid #0c0a09",
      boxShadow: "0 30px 80px rgba(0,0,0,.55), 0 0 0 2px #2a2622", overflow: "hidden",
    }}>
      {/* status bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 34, zIndex: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 22px", color: "var(--ink)", fontFamily: "var(--font-body)",
        fontSize: 12.5, fontWeight: 600, pointerEvents: "none",
      }}>
        <span className="num">9:41</span>
        <span style={{ display: "flex", gap: 5, alignItems: "center", opacity: .85 }}>
          <span style={{ letterSpacing: -1 }}>●●●</span>
          <span>❋</span>
          <span style={{ width: 20, height: 10, border: "1.4px solid var(--ink)", borderRadius: 3, position: "relative", display: "inline-block" }}>
            <span style={{ position: "absolute", inset: 1.5, right: 4, background: "var(--ink)", borderRadius: 1 }} />
          </span>
        </span>
      </div>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}
window.Phone = Phone;
