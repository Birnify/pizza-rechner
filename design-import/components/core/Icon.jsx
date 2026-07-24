import React from "react";

// Teigmeister line-icon set. The app ships hand-drawn inline SVGs (no icon font,
// no external library): 1.6–1.7px stroke, round caps/joins, currentColor. These
// paths are lifted verbatim from the source markup so glyphs match the product.
const PATHS = {
  // Product navigation
  rechner: <><rect x="4" y="11.5" width="16" height="7" rx="2"/><path d="M8 11.5v-2a4 4 0 0 1 8 0v2"/><path d="M10.5 15h3"/></>,
  party: <><path d="M4 6 12 4l8 2-8 15Z"/><circle cx="11" cy="9" r=".6" fill="currentColor" stroke="none"/><circle cx="14" cy="12" r=".6" fill="currentColor" stroke="none"/><circle cx="10.5" cy="13.5" r=".6" fill="currentColor" stroke="none"/></>,
  glossar: <><path d="M12 6.5c-1.6-1.3-3.6-2-6.5-2v12c2.9 0 4.9.7 6.5 2 1.6-1.3 3.6-2 6.5-2v-12c-2.9 0-4.9.7-6.5 2Z"/><path d="M12 6.5v12"/></>,
  settings: <><circle cx="12" cy="12" r="2.8"/><path d="M12 3.5v2M12 18.5v2M20.5 12h-2M5.5 12h-2M18 6l-1.4 1.4M7.4 16.6 6 18M18 18l-1.4-1.4M7.4 7.4 6 6"/></>,
  // Feature glyphs
  presets: <><path d="M6 11c-2 0-3.2-1.6-2.6-3.4C3.9 6 5.3 5 7 5.3 7.4 3.4 9.1 2 11 2s3.6 1.4 4 3.3c1.7-.3 3.1.7 3.6 2.3.6 1.8-.6 3.4-2.6 3.4"/><path d="M6 11v6a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-6"/><path d="M5 20h13"/></>,
  sliders: <><path d="M4 7h9M17 7h3M4 17h3M10 17h10"/><circle cx="15" cy="7" r="2.2"/><circle cx="8" cy="17" r="2.2"/></>,
  clock: <><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></>,
  guide: <><path d="M4 6.5h2M4 12h2M4 17.5h2M9 6.5h11M9 12h11M9 17.5h7"/></>,
  // Generic UI
  plus: <path d="M12 5v14M5 12h14"/>,
  minus: <path d="M5 12h14"/>,
  check: <path d="M5 12.5 10 17.5 19 6.5"/>,
  chevron: <path d="M6 9.5 12 15.5 18 9.5"/>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.5"/></>,
  save: <><path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/></>,
  share: <><circle cx="6" cy="12" r="2.2"/><circle cx="17" cy="6" r="2.2"/><circle cx="17" cy="18" r="2.2"/><path d="M8 11 15 7M8 13l7 4"/></>,
  print: <><path d="M7 9V4h10v5M7 17H5v-6h14v6h-2M7 14h10v6H7z"/></>,
  trash: <><path d="M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13"/></>,
};

export function Icon({ name = "rechner", size = 22, strokeWidth = 1.7, className = "", style, ...rest }) {
  const glyph = PATHS[name] || PATHS.rechner;
  return (
    <svg
      viewBox="0 0 24 24" width={size} height={size} aria-hidden="true"
      fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round"
      className={className} style={{ display: "block", flexShrink: 0, ...style }}
      {...rest}
    >{glyph}</svg>
  );
}
