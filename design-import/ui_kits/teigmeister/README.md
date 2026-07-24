# Teigmeister UI Kit

High-fidelity, interactive recreations of the five real Teigmeister PWA screens, composed from the design-system components (`window.TeigmeisterDesignSystem_c6b7bf`). Recreations of [`Birnify/pizza-rechner`](https://github.com/Birnify/pizza-rechner), not new designs.

Open `index.html` — it mounts a live phone frame with the bottom tab bar wired up; tap between the five areas.

Screens:
- **RechnerScreen** — the calculator: photo header, sub-nav, preset tiles, dough settings (segmented method toggle, steppers), the basil result panel (total + ingredient rows + temp boxes), and the sticky summary bar.
- **AnleitungScreen** — the adaptive step-by-step guide: olive schedule banner + numbered step cards with technique chips, time chips and note/warn asides.
- **PartyScreen** — the Pizza Party planner: guest/pizza steppers, per-person dough math, aggregated shopping list.
- **GlossarScreen** — the baking glossary: single-open accordion of dictionary entries.
- **EinstellungenScreen** — settings: segmented unit/theme toggles and feature-flag switches.

`Phone.jsx` is a lightweight dark device frame shared by `index.html`.

---

**Import note (2026-07-24):** this is a snapshot pulled from the Claude Design project
`https://claude.ai/design/p/c6b7bf59-3709-4d13-990e-4807c5058ea2` via the DesignSync MCP,
for translation into the real vanilla-JS Teigmeister app (Birnify/pizza-rechner). These
JSX files are React/Babel demo code for the design-system preview only — they are NOT
meant to be dropped into the app as-is. The real app has no build step and no React; each
screen's layout/component structure/tokens need to be re-implemented in
`pizza-rechner.html` / `pizza-rechner-mobile.html` + `css/styles.css` / `css/mobile.css` +
the existing `js/*` modules, preserving all real calculation logic (`PZ.state`,
`PZ.calc()`, presets, accessibility, i18n) that these mockups only fake with local
`useState`.

Decisions made with the user before implementation (see chat, 2026-07-24):
- Fonts (Bitter + Hanken Grotesk) must be self-hosted locally (WOFF2 in the repo), not
  loaded from Google Fonts — the app must keep working fully offline (file://, no server,
  no internet). See the note in `tokens/fonts.css`.
- The existing light/dark mode toggle (`js/theme.js`) stays. This dark palette
  (`tokens/colors.css`) replaces the current dark theme; the light theme needs an
  analogous adaptation using the same token *names* with light-appropriate values.
- All 5 screens are queued for implementation, one `feature-cycle-orchestrator` cycle per
  screen (Rechner first, matches the priority already established for the earlier
  "Ergebnis priorisieren" backlog item).
- Note: some existing paused backlog items (`Backlog.md`, Punkt 1 "Ergebnis priorisieren"
  and Punkt 2 "Rahmen-Fix Komplexitätsschalter") overlap with what this redesign already
  addresses (SummaryBar primary action, SegmentedControl hairline border/contrast) —
  worth re-checking against the new design before running those separately.

Two of the four photo assets referenced by the mockups (`assets/header-pizza.jpg`,
`assets/pizza-final-newyork.jpg`, `assets/pizza-final-teglia.jpg`) exceeded the DesignSync
`get_file` 256 KiB cap and were NOT pulled (truncated/corrupt, deleted after download).
Only `assets/pizza-final-neapolitanisch.jpg` downloaded complete. Re-fetch the missing
three from the Claude Design project directly (or ask the user) before a screen that
needs them is implemented.
