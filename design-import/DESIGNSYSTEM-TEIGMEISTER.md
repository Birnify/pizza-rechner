---
version: alpha
name: teigmeister-design-system
description: The design system for Teigmeister, a mobile PWA that calculates precise pizza & bread dough recipes (baker's percentages, DDT water-temperature, fermentation schedules) for home bakers. A true two-mode system: a warm-anthracite DARK theme (default) and a warm-cream LIGHT theme, each built on the same token roles — never pure black or pure white — with card surfaces raised for elevation, warm text, and tomato red as the single primary accent. Olive green marks success, ochre-orange marks warnings, and a cool-toned ring marks focus, all kept clearly distinct from the accent in both modes. Type pairs Bitter (a slab serif) for headlines and every measured number with Hanken Grotesk (a humanist grotesque) for all body and UI — a proposed concept replacing the live app's system-font stack. Line icons are hand-drawn, no emoji beyond the 🍕 in the wordmark.

colors:
  bg: "#151312"
  card: "#201d1b"
  surface-2: "#2a2622"
  surface-inset: "#1b1917"
  line: "#3a332e"
  ink: "#ede9e6"
  ink-strong: "#f5f1ee"
  muted: "#a8a19c"
  muted-soft: "#7d766f"
  tomato: "#d1533c"
  tomato-dark: "#b8442d"
  tomato-text: "#ef7a5c"
  tomato-disabled: "#5a3a32"
  success: "#5f9d5a"
  success-text: "#8bc283"
  warning: "#d99a3c"
  warning-text: "#e8b25a"
  biga-text: "#d9ab3f"
  crust: "#c9a86a"
  focus: "#8ab4c8"
  on-accent: "#ffffff"
  tomato-soft-bg: "#38221c"   # tonal accent fill
  # Notice tints — 3 semantic categories only (neutral / success / warning).
  info-bg: "#302b25"
  info-text: "#cabca6"
  success-bg: "#1e2a1b"
  warn-bg: "#3b2c0e"

typography:
  # PROPOSED type concept (see tokens/fonts.css) — replaces the live app's system
  # stack. Bitter (slab) for display + numerals; Hanken Grotesk for body & UI.
  # SIZE SCALE: base 16px, ratio 1.25 (major third) — 5 steps: 13 / 16 / 20 / 25 / 31.
  # Weight + case + colour carry the secondary hierarchy within a step.
  display:            # step 4 — hero wordmark + big result number (Bitter)
    fontFamily: "'Bitter', Georgia, serif"
    fontSize: 31px
    fontWeight: 700
    fontVariantNumeric: tabular-nums
  stat-number:        # step 3 — stat tile numbers, e.g. temperature (Bitter)
    fontFamily: "'Bitter', Georgia, serif"
    fontSize: 25px
    fontWeight: 800
    fontVariantNumeric: tabular-nums
  title:              # step 2 — section / step titles (Hanken 700) + inline stat values (Bitter)
    fontFamily: "'Hanken Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 20px
    fontWeight: 700
  body:               # step 1 — body copy, ingredient rows, step body (Hanken)
    fontFamily: "'Hanken Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 16px
    fontWeight: 400
  meta:               # step 0 — labels, captions, chips, tab labels, hints, fine print (Hanken)
    fontFamily: "'Hanken Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 13px
    fontWeight: 600   # 600 uppercase for labels/tabs · 700 for chips/captions · 400 for hints
    textTransform: uppercase  # labels & tab items only; body-meta stays sentence case

rounded:
  xs: 8px
  sm: 10px
  md: 14px
  chip: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 10px
  md: 14px
  lg: 18px
  xl: 20px
  xxl: 24px
  huge: 32px

components:
  button-primary:
    backgroundColor: "{colors.tomato}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.chip}"
    padding: 12px 18px
    minHeight: 44px
  button-secondary:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    border: "1px solid {colors.line}"
    rounded: "{rounded.md}"
  segmented-control:
    trackBackground: "{colors.surface-2}"
    activeBackground: "{colors.tomato}"
    activeText: "{colors.on-accent}"
    rounded: "{rounded.md}"
  stepper-button:
    backgroundColor: "{colors.card}"
    textColor: "{colors.tomato-text}"
    size: 44px
    rounded: "{rounded.md}"
  switch:
    offTrack: "{colors.muted}"
    onTrack: "{colors.tomato}"
  card:
    backgroundColor: "{colors.card}"
    border: "1px solid {colors.line}"
    borderLeft: "3px solid {colors.tomato}"
    rounded: "{rounded.md}"
    padding: 20px
    shadow: "0 2px 14px rgba(0,0,0,.4)"
  card-result:
    borderLeft: "3px solid {colors.success}"
  step-card:
    backgroundColor: "{colors.card}"
    numberDisc: "#2b2420"
    rounded: "{rounded.md}"
    padding: 16px 18px
  note:
    backgroundColor: "{colors.info-bg}"
    textColor: "{colors.info-text}"
    border: "1px solid {colors.crust}"
    rounded: "{rounded.md}"
  schedule-bar:
    backgroundColor: "{colors.success}"
    textColor: "#ffffff"
    borderLeft: "4px solid {colors.crust}"
    rounded: "{rounded.md}"
  bottom-tab-bar:
    backgroundColor: "{colors.card}"
    borderTop: "1px solid {colors.line}"
    activeText: "{colors.tomato-text}"
    height: 58px
  summary-bar:
    backgroundColor: "{colors.tomato-dark}"
    textColor: "#ffffff"
    borderTop: "2px solid {colors.crust}"
    saveButton: "{colors.tomato} + 2px #fff border, pill"
  badge:
    backgroundColor: "{colors.info-bg}"
    textColor: "{colors.info-text}"
    border: "1px solid {colors.crust}"
    rounded: "{rounded.chip}"
  focus-ring:
    outline: "2px solid {colors.focus}"
    outlineOffset: 2px
---

## Overview

**Teigmeister** (German for "dough master") is a mobile-first Progressive Web App that calculates precise pizza and bread dough recipes for home bakers. Enter dough-ball count, weight, hydration, flour and fermentation method and it computes exact amounts using **baker's percentages**, plus the **DDT (Desired Dough Temperature)** mixing-water temperature and ice amount. It then generates an **adaptive step-by-step guide** with per-step fermentation **timers**, a backward/forward **schedule** (start time ↔ finish time), a built-in **glossary** of baking terms, a **Pizza Party planner** with an aggregated shopping list, and **multi-recipe/preset management** — all offline, no server, no account.

The product is **mobile-first** (bottom tab bar, sticky summary bar, thumb-zone actions) and ships in **two color themes** — a warm-anthracite **dark** theme (the default) and a warm-cream **light** theme, switched via `data-theme` on `<html>`. It ships bilingual (DE/EN); the source and this system default to German copy.

This system is derived from the real product code, not a redesign. It re-expresses the app's actual CSS, class names and DOM as reusable React components and design tokens.

### Source material
- **GitHub repo (ground truth):** [`Birnify/pizza-rechner`](https://github.com/Birnify/pizza-rechner) — the full PWA. Colors, class names, DOM structure and copy here are lifted from its `css/styles.css`, `css/mobile.css`, `pizza-rechner-mobile.html`, `js/glossary.js` and `js/i18n-dict.js`. Explore it further to build higher-fidelity Teigmeister designs — especially `pizza-rechner-KONTEXT.md` (domain logic and rationale) and the `js/` modules for exact calculation and interaction behaviour.
- **Uploaded reference:** `uploads/Subtle-Gradient-Design-System.md` — used only for this document's *structure* (frontmatter + prose sections), not its visual content.

The system adapts the repo's dark-mode palette to a refined philosophy: a warmer anthracite ground (`#151312` vs. the repo's `#1c1815`), card surfaces one tone lighter for stronger standalone-component contrast, a slightly desaturated tomato accent, and a cool-toned focus ring distinct from the accent. It then adds a **parallel light theme** (warm cream, not pure white) that mirrors the same token roles with values individually re-tuned for AA contrast on light surfaces. The focus ring (`--focus #8ab4c8`) is deliberately separate from the accent and semantic colors.

## Content Fundamentals

How Teigmeister writes:

- **Language & person:** German first (EN mirror). Address the baker informally with **"du"** — *"Wähle ein erprobtes Rezept"*, *"So findest du dich schnell zurecht"*. Never formal "Sie".
- **Tone:** warm, expert, encouraging — a knowledgeable friend at the counter, not a manual. It explains the *why*: *"Salz nie direkt auf die Hefe – es bremst sie."* / *"Straff geformte Kugeln = runde Pizzen mit gleichmäßigem Rand."*
- **Casing:** sentence case for body and labels; UPPERCASE only for the small tracked card-title labels (*"TEIG-EINSTELLUNGEN"*) and stat captions (*"SCHÜTTWASSER"*).
- **Numbers are the message.** Every measured value is bolded in copy (*"**18 g Salz**"*, *"**62 % Hydration**"*, *"**~24 h**"*) and rendered in serif tabular figures. Precision is the brand promise — down to `0.1 g` yeast and `°C` water.
- **Domain vocabulary, plainly glossed.** Real terms (Autolyse, Poolish, Biga, Stockgare, Cornicione, W-Wert, DDT) are used confidently, each linkable to a glossary article. Never dumbed down, always explained.
- **Emoji:** essentially none — a real **app-icon logo** now carries the brand mark (see below); a sparing few functional markers appear in copy (⏱️ schedule, 🔔 timer done, 🛒 shopping list, 📅 calendar). Decorative emoji are not used; icons are the hand-drawn line set.
- **Units adapt:** metric default, imperial optional; temperatures in °C (°F mirror).

Example microcopy: buttons *"Speichern" · "Anleitung drucken" · "Als PDF speichern" · "Link kopieren" · "Los geht's"*; a warning *"Gärzeit zu lang für Caputo (W300): ~30 h geplant, max. 24 h empfohlen. Das Gluten baut ab."*

## Visual Foundations

- **Color vibe (two modes):** warm and low-key in both. **Dark** (default) sits on a **warm anthracite** floor (`--bg #151312`) that reads as toasted, never cold or pure-black; **Light** sits on a **warm cream** floor (`--bg #f2ece2`), never pure white. In both, cards are raised a step from the page floor (`--card` lighter in dark, near-white-warm in light), and that surface contrast — not shadow — is the primary depth cue. Every token role exists in both themes, scoped by `data-theme` (see "Color themes" below); components are mode-agnostic and adapt purely via the tokens. Surface contrast is tuned strong enough that a standalone control (e.g. a floating segmented toggle on `--surface-2`) never disappears against the page.
- **Accent discipline:** **tomato red** (`--tomato #d1533c`) is the *single* primary accent — CTAs, active tab/segment/pill states, the sticky summary bar. It is never used as a large background wash. As body text it lightens to `--tomato-text #ef7a5c` for AA contrast. Semantics stay clearly separate: **olive green** (`--success`) for success/schedule, **ochre-orange** (`--warning`) for cautions, **gold** (`--biga-text`) for pre-ferment stages.
- **Type (proposed concept — see below):** a two-family pairing, **Bitter** (slab serif) for headlines, the wordmark and **every measured number** (weights, temps, percentages, timers) as tabular figures, and **Hanken Grotesk** (humanist grotesque) for all body, labels and controls. Slab-for-numbers is the signature detail. *The live app uses only system fonts; this is an enhancement.*
### Typography concept (proposed)

> **Status:** a *proposed enhancement*. The live `Birnify/pizza-rechner` app ships **no webfonts** — system Georgia + platform sans only. This concept replaces that stack; the tokens above implement it, with system fallbacks so nothing blocks first paint.

**Design driver: a mobile PWA read on a phone in a kitchen** — quick glances, glare, flour-dusted or wet hands, values updating live. Every choice is made for legibility at 11–32px on a small screen, not for a desktop specimen.

**Display, wordmark & numerals — [Bitter](https://fonts.google.com/specimen/Bitter) (slab serif, SIL OFL).** Bitter was drawn by Huerta Tipográfica specifically for comfortable on-screen reading at small sizes: large x-height, low stroke contrast, sturdy even slabs. That structure survives a phone's effective resolution and kitchen glare where a high-contrast display serif (Playfair, Fraunces) would fragment and shimmer at 22–26px. Its character is warm, hearty and *crafted* — a hearth/bakery voice that suits "Teig**meister**": expert and confident, never decorative or cartoonish.

**Body & UI — [Hanken Grotesk](https://fonts.google.com/specimen/Hanken+Grotesk) (humanist grotesque, SIL OFL).** A tall x-height and **open apertures** (a/e/c/s stay open, not closed loops) are exactly what a sidelong, floury-handed glance needs. It reads as the brand's "knowledgeable friend" — friendly and professional, deliberately *not* the over-used Inter/Roboto default and not corporate-cold Helvetica. It carries labels and hints down to 11px cleanly.

**Why numbers are slab, not sans (the real case).** The "serifs aid reading" finding is about long-form running text at print DPI — it does **not** transfer to isolated numeric data at small sizes on screen. What actually drives numeral legibility there is *distinct, sturdy glyphs + tabular spacing*. A slab serif delivers both: even stroke weight like a sans (no fragile hairlines to vanish at small sizes) **plus** slab terminals that anchor each digit and cut 3/8 and 6/8 confusion. Bitter ships **true tabular figures**, so live-updating grams, percentages and timers never jitter — non-negotiable for a calculator. So prominent measured values (`--font-numeric`: hero, display, stat) use Bitter with `tabular-nums`; numbers *embedded in a sentence* inherit the body grotesque (also tabular) so they read as part of the prose.

**Why webfonts over the system stack.** The distinctive numeral is a core brand asset and the product's precision promise — leaving big values to whatever serif the device happens to have (Georgia on Apple, Times elsewhere, inconsistent numerals) undercuts it. Both families are **SIL OFL** (zero licensing) and self-hostable. For the PWA, **self-host WOFF2 subsets** (Latin + the digit / `°` / `%` glyphs) with `font-display:swap` — roughly 15–30 KB per family subset — rather than the Google Fonts `@import` used here for the design system. Fallback stacks (`Georgia`/serif behind Bitter, the platform sans behind Hanken Grotesk) keep the app fully readable before and if the webfonts load.

**Size scale — 1.25 modular, 5 steps.** Sizes follow a major-third (×1.25) scale off a 16px mobile base: **13 / 16 / 20 / 25 / 31**. Gaps widen as sizes grow (3 / 4 / 5 / 6px), so adjacent roles are always distinguishable at a glance — no two ever look nearly identical (the number roles sit at 20 / 25 / 31, comfortably apart). This replaces the previous ad-hoc 10-step scale (11 / 11.5 / 12.5 / 13.5 / 14 / 14.5 / 15 / 15.5 / 22 / 26 / 32), which stepped too tightly to read cleanly. **Weight, case and colour** do the secondary hierarchy *within* a step — e.g. everything at the 13px meta step is separated by weight (600/700/400), uppercasing and colour rather than by size. Old token names (`--text-hero`, `--text-caption`, `--text-micro`, …) are kept as aliases onto the 5 steps, so components are untouched.

- **Backgrounds & imagery:** one full-bleed image only — the **photo header**: a warm close-up pizza/dough photo under a ~0.62-alpha dark scrim (guarantees ≥4.5:1 for the white serif title), closed by a 3px toasted-crust rule. Imagery is always warm-toned. Elsewhere: flat warm surfaces, no gradients as decoration (the header's terracotta fallback gradient is the one exception, hidden behind the photo).
- **Corners (four documented tokens, no exceptions):** `--radius` 14px is the signature radius for **cards, notes, and every input/value container** (stepper display + buttons, select field, text inputs). Segmented control: `--radius` 14px track with a `--radius-sm` 10px active pill; sub-nav: `--radius` 14px track with `--radius-xs` 8px items. **Quick-select pills and the switch** are pills — `--radius-chip` 999px (same family as badges and the primary CTA). Every control traces back to one of `--radius-xs` / `--radius-sm` / `--radius` / `--radius-chip`.
- **Control fill & border (one rule):** every control shows a **hairline `--line` border + fill at rest** — standalone controls fill `--card`, recessed *track* controls (segmented, sub-nav) fill `--surface-2`/`--surface-inset` so the moving selection reads as elevated. The **active/selected** choice fills **tomato** (white text, tomato border); hover shifts an inactive control's border + text to tomato. No mixing of outlined-vs-flat within the section.
- **Borders & elevation:** 1px hairline (`--line`) plus a **3px left accent bar** that marks card type — tomato for inputs, olive for result/output panels. Shadows are used sparingly (`0 2px 14px rgba(0,0,0,.4)`); depth is mostly surface-contrast.
- **Notice tints (exactly 3 categories):** every tinted surface is one of three clearly separated families — **neutral/informational** (`--info-bg`, one low-chroma warm tone: info notes, technique chips, badges, highlighted temp tile), **success** (the single olive family — `--success` solid fill on the schedule bar, its `--success-bg` dark tint + `--success-text` on tip boxes; tip and schedule share one hue), and **warning** (`--warn-bg` + `--warning`/`--warning-text`, ochre only — never tomato-red, so it can't be confused with the accent or a neutral note).
- **Motion & states:** quick, restrained (`.12–.18s` on background/border/color). Hover darkens the primary fill and shifts secondary borders/text to tomato; press scales controls slightly (`scale .94–.97`). No bounces, no long fades, no parallax.
- **Focus:** a distinct **cool-toned 2px ring** (`--focus #8ab4c8`, offset 2px) — deliberately not the accent, so focus is unmistakable against warm surfaces.
- **Touch:** 44px minimum targets throughout; safe-area insets respected; content stays single-column with fixed bottom chrome (tab bar + summary bar).

### Color themes

The system ships **two themes** with identical token roles, so components are mode-agnostic and adapt purely through the tokens (no per-mode component code). Themes are scoped by a `data-theme` attribute in `tokens/colors.css`:

- **Dark** (default) — the bare `:root` **and** `:root[data-theme="dark"]`. Warm anthracite floor `#151312`, card `#201d1b`.
- **Light** — `:root[data-theme="light"]`. Warm **cream** floor `#f2ece2` (never pure white), card `#fdfaf5` raised above it.

Switch by setting the attribute on `<html>` (or any wrapper): `<html data-theme="light">`. Because dark is also the bare `:root`, anything with no attribute renders dark.

The light palette is **not a naive invert** — accent, semantic, tint and text values are each re-tuned for AA contrast on light surfaces: the tomato fill deepens to `#c4472e` (so white labels clear AA-large) and tomato-as-text darkens to `#af3f29` (~5.2:1 on card); olive/ochre deepen likewise (`--success-text #3c7337`, `--warning-text #8f6111`); the focus ring becomes a darker cool teal `#2f7a99`; shadows become soft warm-neutral. Notice tints keep the same three semantic categories (neutral tan / olive / ochre), lightened. Every brand pillar holds in both modes: warm base, tomato the single accent, olive/ochre distinct from tomato. See the **"Two modes — surfaces & text"** (Colors) and **"Shape & fill system — Dark / Light"** (Brand) cards.

## Iconography

- **A hand-drawn line-icon set**, no icon font and no third-party library. Icons are inline SVG at a **1.6–1.7px stroke** with round caps/joins, drawn on a 24×24 viewBox, colored by `currentColor`. The `Icon` component ships the product's real glyphs verbatim: `rechner` (dough mixer), `party` (pizza slice), `glossar` (open book), `settings` (gear), `presets` (chef's hat), `sliders`, `clock`, `guide`, plus generic UI (`plus`, `minus`, `check`, `chevron`, `info`, `warn`, `save`, `share`, `print`, `trash`) -- `warn` (triangle + exclamation mark) added in the app's "Anleitungs-Schrittbilder" cycle (v4.35.0) for the step-guide's collapsible-notes toggle.
- **Accent icon badges:** card titles are prefixed by a **filled circular badge** (34px, tomato — or olive on result cards) holding a white line icon.
- **Brand logo:** an **app-icon mark** — a cream pizza-slice line drawing (matching the icon set's stroke style) on the terracotta gradient squircle (`#8f3d29 → #ea9a6f`, 118px corner radius). Lives at `assets/logo.svg` (+ `logo.png`). Pair it left of the Bitter wordmark for the horizontal lockup; reverse to white over the photo header. See the "Logo & wordmark" (Brand) card.
- **Emoji is not iconography** here — see Content Fundamentals. The mark is the app-icon logo; only a few functional emoji glyphs appear in running copy.
- If you need a glyph the set lacks, add it to `components/core/Icon.jsx` in the same stroke style rather than importing another library.

## Index

Root manifest:
- `styles.css` — the single entry point consumers link (import-only).
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`, `base.css` (element defaults, link colors, focus ring).
- `assets/` — the brand logo (`logo.svg`, `logo.png` — cream pizza-slice mark on the terracotta squircle) and real product imagery: `header-pizza.jpg` (photo header) and finished-pizza photos `pizza-final-neapolitanisch.jpg`, `pizza-final-newyork.jpg`, `pizza-final-teglia.jpg`.
- `guidelines/` — foundation specimen cards (Colors, Type, Spacing, Brand groups).
- `thumbnail.html` — project tile.
- `SKILL.md` — Agent-Skills-compatible entry.

### Components
Grouped React primitives (each `Name.jsx` + `Name.d.ts` + `Name.prompt.md`, with one `@dsCard` HTML per directory). Import from `window.TeigmeisterDesignSystem_c6b7bf`.

- **core/** — `Button`, `IconButton`, `Badge`, `Icon`
- **forms/** — `SegmentedControl`, `Stepper`, `Switch`, `Pills`, `Select`
- **navigation/** — `BottomTabBar`, `SubNav`
- **feedback/** — `Note`, `ScheduleBar`
- **cards/** — `Card`, `StepCard`, `GlossaryItem`, `IngredientRow`, `TotalSummary`, `TempBox`, `PresetCard`
- **layout/** — `SummaryBar`

### Intentional additions
- **`Icon`** — the source has no formal Icon component (it inlines SVGs). Wrapping the product's real glyphs in one component gives consumers a single, on-brand icon API. Paths are copied verbatim from the source markup.

### UI kit
`ui_kits/teigmeister/` — an interactive, five-screen recreation of the PWA in a phone frame (`index.html`): **Rechner** (calculator, with Zeitplan sub-view = the step guide), **Pizza Party** (planner + shopping list), **Glossar** (accordion), **Einstellungen** (unit/theme toggles + feature switches). Screens are composed from the design-system components; `Phone.jsx` is the device stage.

## Design language: shape & fill system

**One shape system, two families.** Every surface you *act on or type into* (buttons, inputs, cards) uses the **14px soft-rect** radius; everything you *select* (segmented control, quick pills, chips, switch) uses the **999px pill**. This keeps actions and selections visually separable and reads as a calm, modern "expert tool." The core brand pillars hold throughout — warm anthracite base, tomato as the single accent, dark-mode only.

1. **Buttons.** Four variants, all on 14px: `primary` (one filled-tomato CTA per view, soft shadow), **`tonal`** (soft tomato-tint fill `--tomato-soft-bg` + tomato text, medium emphasis), `secondary` (surface-2 fill + hairline), `ghost` (transparent). Sizes 36/44/52px.

2. **Summary bar.** A **card surface** (same family as the tab bar) with a 3px tomato left-accent, the live total as the big serif number, a muted count beneath, and a single soft-rect primary Speichern button — **tomato appears only on the action**, honouring "tomato is never a large background fill."

3. **Tonal accent token.** `--tomato-soft-bg #38221c` (+ `--tomato-soft-hover`): a low-chroma tomato tint that lets accent appear on a fill calmly.

4. **Badges.** Informational chips are **borderless tonal tints** (matching the tonal button tier): `warm` (info tint), `neutral` (quiet), `accent` (tomato tint). Status/day markers (`success`, `warning`, `tomato`, `biga`) stay solid fills.

## Known Gaps

- **Typography is a proposed concept, not shipped.** The live app uses only system fonts (Georgia + platform sans). This system introduces **Bitter + Hanken Grotesk** (both SIL OFL) — see "Typography concept (proposed)". Loaded via Google Fonts here; **self-host WOFF2 subsets in production**. Fallback stacks keep everything readable if the webfonts don't load.
- **Changed from the live app.** A few primitives intentionally depart from the `Birnify/pizza-rechner` implementation: buttons moved from a filled 999px pill CTA to the 14px soft-rect family; the summary bar moved from a full tomato-dark textured slab to a card surface with tomato only on the action; badges moved from a crust-bordered chip to borderless tonal tints. The spec above is the target; consult the repo only if pixel-matching the shipped app.
- **Slider** (`input[type=range]`) exists in the source's "new recipe" mini-form but was intentionally **not** built as a component — the app replaced sliders with `Stepper` everywhere else. Add it only if a consumer needs the mini-form.
- **Onboarding modal, share/PDF flows, and the timer countdown mechanics** are documented in copy but not built as components — they are app behaviours, out of scope for the primitive set.
- **Themes:** two modes ship (dark default + light), both AA-tuned. **Do not** treat either as an afterthought — every new token must be defined in both `:root[data-theme="dark"]` and `:root[data-theme="light"]`.
- The **hex values here are a refined adaptation**, intentionally warmer than the repo's own dark mode; if pixel-matching the live app, use the repo's `:root[data-theme="dark"]` values instead.
