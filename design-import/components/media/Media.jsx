import React from "react";

/* Media (.media) — the ONE image box every picture in Teigmeister goes through.
 *
 * Why a primitive at all: the app is about to gain ~120 pictures across cards, the
 * step guide, the glossary, onboarding and empty states. Without a shared box each
 * surface invents its own crop, radius and loading behaviour, and a missing file
 * leaves a broken icon in the layout. This component fixes the frame; the app-side
 * image registry decides WHICH file (or none) goes into it.
 *
 * Rules encoded here:
 * - The aspect ratio is reserved before the file arrives, so nothing reflows while
 *   scrolling. Ratios match the produced asset set, they are not free-form.
 * - Photography is warm-toned and sits on a warm surface, never on white. While the
 *   file loads the box shows --surface-2, so a dark theme never flashes a bright hole.
 * - No src means render nothing at all. Partial picture coverage is the normal state
 *   of this product, not an error, and an empty frame reads as a bug.
 * - alt defaults to "" (decorative). Most pictures here sit next to a name, a time
 *   and a description that already say the same thing, and a second spoken copy is
 *   noise. Pass alt only when the picture carries information the text does not.
 * - Only the header/hero loads eagerly; everything else is lazy.
 *
 * `scrim` lays the header's dark wash over the picture so white type stays legible.
 * `radius="top"` is for pictures that sit flush at the top edge of a card. */

const RATIOS = {
  "21x9": "21 / 9",   // desktop hero strip
  "4x5": "4 / 5",     // mobile hero
  "16x9": "16 / 9",   // finished-pizza photo, onboarding
  "3x2": "3 / 2",     // recipe cards, glossary articles
  "4x3": "4 / 3",     // guide steps, empty states
  "3x1": "3 / 1",     // glossary category banner
  "1x1": "1 / 1",     // textures
};

export function Media({
  src, alt = "", ratio = "3x2", radius = "all", scrim = false,
  eager = false, width, height, style, imgStyle, ...rest
}) {
  if (!src) return null;

  const r = "var(--radius)";
  const corners =
    radius === "top" ? `${r} ${r} 0 0` :
    radius === "none" ? "0" : r;

  return (
    <span
      style={{
        position: "relative", display: "block", overflow: "hidden",
        aspectRatio: RATIOS[ratio] || RATIOS["3x2"],
        borderRadius: corners, background: "var(--surface-2)",
        ...style,
      }}
      {...rest}
    >
      <img
        src={src} alt={alt} width={width} height={height}
        loading={eager ? "eager" : "lazy"} decoding="async"
        style={{ display: "block", width: "100%", height: "100%", objectFit: "cover", ...imgStyle }}
      />
      {scrim && (
        <span aria-hidden="true" style={{
          position: "absolute", inset: 0, background: "var(--scrim, rgba(18,11,7,.55))",
        }} />
      )}
    </span>
  );
}
