import React from "react";

/* Schedule banner (.schedbar) — the olive-green summary bar above the step guide
 * ("Gesamtdauer ca. 26 h · Start Fr 14:00 → Fertig Sa 16:00"). Solid olive fill,
 * white text with a subtle shadow, toasted-crust left accent. Children carry the
 * copy; wrap emphasized clock times in <span class="big">. */
export function ScheduleBar({ children, style, ...rest }) {
  return (
    <div
      style={{
        background: "var(--success)", color: "#fff", borderRadius: "var(--radius)",
        borderLeft: "4px solid var(--crust)", padding: "13px 16px",
        fontFamily: "var(--font-body)", fontSize: "13.5px", lineHeight: 1.5,
        textShadow: "0 1px 2px rgba(0,0,0,.35)", ...style,
      }}
      {...rest}
    >{children}</div>
  );
}
