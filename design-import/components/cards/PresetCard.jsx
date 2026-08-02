import React from "react";
import { Media } from "../media/Media.jsx";

/* Preset recipe card (.preset-card) — a tappable recipe tile in the recipe picker.
 * Left-aligned: bold name, a tomato-text time line, a muted fit-blurb. Hairline
 * border goes tomato on hover; selected pins the tomato border.
 *
 * Two variants, one component:
 * - text only (image omitted) — the original three-recommendation strip.
 * - with picture — a 3:2 photo flush at the top edge, for the full recipe grid.
 *
 * The picture is DECORATIVE on purpose: name, time and fit-blurb below it already
 * state what the photo shows, so a described photo would make a screen reader say
 * the same recipe twice. The tile stays one button with one accessible name, and
 * the photo never becomes a second tab stop.
 *
 * A recipe whose picture is not finished yet simply renders without one. A grid
 * mixing pictured and unpictured tiles is the expected state while the image set
 * is still being produced, not a defect. */
export function PresetCard({
  name, time, description, image, selected = false, onClick, style, ...rest
}) {
  return (
    <button
      type="button" onClick={onClick} aria-pressed={selected}
      style={{
        flex: "1 1 140px", display: "flex", flexDirection: "column", alignItems: "stretch",
        textAlign: "left", border: `1px solid ${selected ? "var(--tomato)" : "var(--line)"}`,
        background: "var(--card)", borderRadius: "var(--radius)", overflow: "hidden",
        minHeight: "44px", cursor: "pointer", font: "inherit", padding: 0,
        transition: "border-color .12s",
        ...style,
      }}
      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.borderColor = "var(--tomato)"; }}
      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.borderColor = "var(--line)"; }}
      {...rest}
    >
      {image && <Media src={image} ratio="3x2" radius="none" alt="" />}
      <span style={{
        display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "3px",
        padding: "12px 14px",
      }}>
        <span style={{ fontWeight: "var(--weight-bold)", fontSize: "14px", color: "var(--ink)" }}>{name}</span>
        {time && <span style={{ fontSize: "12px", fontWeight: "var(--weight-semibold)", color: "var(--tomato-text)" }}>{time}</span>}
        {description && <span style={{ fontSize: "11.5px", color: "var(--muted)", lineHeight: 1.3 }}>{description}</span>}
      </span>
    </button>
  );
}
