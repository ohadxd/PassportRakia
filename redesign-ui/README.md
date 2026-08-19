# Handoff: Rakia Passport — Color/Type Reskin

## Overview
A visual reskin of the existing Rakia Passport app (repo: `ohadxd/PassportRakia`, Nuxt/Vue). Swaps the current navy/gold/cream "premium leather passport" theme for a new palette and typography, while keeping the same passport metaphor, layout structure, and components.

## About the Design Files
The bundled HTML file (`reference/Rakia-Passport-App-Redesign.dc.html`) is a **design reference**, not production code. It was built outside the app to show the intended look (cover/onboarding, mission/quiz page, completion stamp, buttons, score/rank bar) using inline styles and Google Fonts. **Do not copy the HTML directly into the Vue app.** Instead, re-theme the existing Vue components in the repo (listed below) using the tokens in this doc — same templates/structure, new CSS values.

## Fidelity
**High-fidelity for color and typography only.** Exact hex values and font families are final. Layout/spacing/shapes in the reference mock are illustrative — keep the current app's real layout, spacing, border-radius, and responsive rules (`assets/styles/main.css`, each component's `<style scoped>`) untouched; only change color and font declarations.

## Design Tokens

Replace the color/font values in `assets/styles/main.css` `:root` and in each component's scoped styles:

| Token | Old value | New value |
| --- | --- | --- |
| Background (primary) | `#07172f` (`--navy`) | `#190C4F` |
| Background (secondary) | `#10284a` (`--navy-2`) | `#1D2566` |
| Background (tertiary / gradient stop) | — | `#3B055D` |
| Accent / gold replacement | `#d6b866` (`--gold`) | `#00AEEF` |
| Accent dark / pressed | `#9d7c34` (`--gold-dark`) | `#0090c7` *(≈10% darker than accent — derive, don't invent)* |
| Highlight / emphasis | — | `#D6047F` |
| Paper / card surface | `#f5e7c7` (`--paper`) | `#FFFFFF21` (translucent white on dark bg — cards no longer go cream) |
| Paper deep | `#e2cea1` (`--paper-deep`) | `#00AEEF5C` (translucent accent) |
| Ink / text on paper | `#172033` (`--ink`) | `#FFFFFF` (text now sits on dark surfaces, not cream) |
| Muted text | `#657089` (`--muted`) | `#52656D` |
| Success / stamp green | `#0b7d4f` (`--green`) | keep `#00AEEF` (stamp reuses accent instead of green) |
| Danger | `#9b2f2f` (`--red`) | keep as-is (no replacement specified) |

Typography:

| Role | Old | New |
| --- | --- | --- |
| Headings (h1, cover title, mission titles) | system UI serif-less | **Roboto Slab**, weight 600 for large titles / 500 for section headings, line-height 1.1 |
| Body / UI text, buttons, labels | `"Segoe UI", Arial, "Noto Sans Hebrew"` | **Jost**, weight 400 body / 500 for buttons and emphasis, line-height 1.5 |

Load both via Google Fonts in `nuxt.config.ts` or `app.vue` head config: `Roboto+Slab:wght@400;500;600` and `Jost:wght@400;500`.

Keep `direction: rtl` on `body` — unchanged.

## Screens / Views (map to existing files)

### 1. Cover / onboarding
- **File**: `pages/index.vue` + `components/passport/PassportCover.vue`
- **Change**: `.cover` background → replace `passport-cover-texture` (navy leather image) with `radial-gradient(circle at 50% 15%, #3B055D 0%, #190C4F 65%)`. Border color `rgba(214,184,102,.74)` → `#00AEEF5C`. Title/kicker text color `#ead28a` → `#FFFFFF` (kicker `#00AEEF`). `h1` font-family → Roboto Slab 600.
- **Photo box** (`pages/index.vue` `.photo-box`): border `rgba(214,184,102,.72)` → `#00AEEF5C`; background stays translucent white.
- **Buttons**: see Buttons section below.

### 2. Mission / quiz page
- **File**: `components/passport/PassportPage.vue`, `MissionBadge.vue`, `ScoreBar.vue`, `RankBadge.vue`, mission content rendered via `components/missions/*` + `data/missions.ts`
- **Change**: `.passport-page` — drop the cream `passport-security` paper texture; background → `#FFFFFF21` on the app's dark gradient body, border → `#00AEEF5C`, 2px.
- `MissionBadge` circle: gold ribbon SVG → solid circle, `background: #00AEEF`, number in `#190C4F`, Roboto Slab 600.
- `.choice-button` (in `main.css`): default border `rgba(15,43,77,.18)` → `#FFFFFF21`, text `#FFFFFF`; `.selected` → border `#D6047F`, background `#D6047F30` (was gold tint); `.correct`/`.wrong` unchanged (green/red already distinct from the new palette).
- `ScoreBar.vue` / `RankBadge.vue`: card border `rgba(214,184,102,.28)` → `#00AEEF5C`, background `rgba(4,14,31,.58)` → `#FFFFFF21`, text `#f6e7bc` → `#FFFFFF`. Rank badge accent border/bg → `#D6047F` / `#D6047F30`.

### 3. Completion stamp
- **File**: `components/passport/Stamp.vue`
- **Change**: swap `green_completion_stamp.svg` (gold/green) for a version using `#00AEEF` ring + `#00AEEF` "הושלם" label, OR restyle as a CSS circle (border `6px solid #00AEEF`, `box-shadow: 0 0 30px #00AEEF5C`) if keeping it code-drawn instead of an image asset — designer's call, both shown as valid in the reference mock.

### Buttons
- **File**: `components/passport/PrimaryPassportButton.vue`, `SkipButton.vue`, and `.primary-button`/`.secondary-button`/`.danger-button` in `main.css`
- **Primary**: background gradient `#ecd383 → #c7a04e` (gold) → flat `#00AEEF`, text `#190C4F` (was `#061126`), same border-radius/shape.
- **Secondary**: navy/gold bordered → `background: transparent`, `border: 2px solid #FFFFFF21`, text `#FFFFFF`.
- **Emphasis/highlight variant** (new, not in old app): solid `#D6047F`, text `#FFFFFF` — use for score/rank or standout CTAs if introduced.
- **Skip button**: dashed border `rgba(104,73,28,.35)` → `#52656D`, text `#FFFFFF` at reduced opacity, background transparent instead of cream.
- Font on all buttons: Jost 500 (was system UI bold).

## Interactions & Behavior
No behavior changes — camera capture, quiz logic, scoring, PDF export, Firebase session flow all stay exactly as implemented. This is a colors/typography pass only.

## Assets
- Existing SVGs in `rakia_design_assets/generated_assets/` (emblem, stamp, badge, button frame, security pattern) are gold/navy-tinted. Either recolor these SVGs to the new palette (swap gold fill/stroke hex values for `#00AEEF` / `#D6047F`) or replace with flat CSS shapes as shown in the reference mock — recommend recoloring the SVGs to preserve the premium/official feel the original design brief called for.
- Textures (`cover_texture_dark_navy.webp`, `paper_texture_cream.webp`) should be dropped — the new theme uses flat/gradient backgrounds with translucent panels, not photographic textures.

## Files
- `reference/Rakia-Passport-App-Redesign.dc.html` — visual reference mock (cover, mission/quiz page, completion stamp, button/badge swatches) in the new palette.
