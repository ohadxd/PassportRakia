# Reskin Implementation Plan — Rakia Passport

Execution plan for the color/type reskin specified in `redesign-ui/README.md`.
This file is the working spec: it is self-contained and does not depend on chat history.

Source of truth for **intent** is `README.md` (the designer handoff).
Source of truth for **execution** is this file — where the two disagree, the discrepancies
are listed under "Corrections to the handoff" below and this file wins.

---

## 1. Why this isn't a find-and-replace

The handoff says "replace the color/font values in `assets/styles/main.css` `:root` and in each
component's scoped styles." An audit of the repo shows the token system is effectively unused:

- `:root` declares 10 color tokens, but only **~11 `var()` references exist app-wide**.
- `--navy`, `--navy-2`, and `--paper-deep` are declared and **never referenced once**.
- There are **~215 hardcoded color literals across 27 files**.

Swapping `:root` alone changes almost nothing on screen. So:

**Approach: tokenize first (Phase 1), then swap the palette once (Phase 2).**

Phase 1 is a deliberate no-op — it replaces literals with `var()` references that still resolve to
the *current* gold/navy values. Its success condition is that the app looks **byte-identical**.
Anything that shifts visually in Phase 1 is a literal mapped to the wrong token; fix it before
starting Phase 2. This makes Phase 2 a ~15-line reviewable diff instead of 215 unreviewable ones.

---

## 2. Decisions already made

| Question | Decision | Who |
| --- | --- | --- |
| Tokenize first vs. direct find-replace | **Tokenize first**, then swap | default recommendation |
| Jost/Roboto Slab have no Hebrew glyphs | **Add Hebrew companions**: Heebo (body), Frank Ruhl Libre (headings) | user |
| Font delivery | **Self-host subset woff2**, not Google Fonts CDN | see §6 Phase 3 |
| `--text-muted` final value | **`#8FA2AB`** (provisional) — see §5.4 | measured, pending designer |
| Font files reachable? | Yes — `fonts.googleapis.com` responds from this environment | verified 2026-08-19 |

---

## 3. Token map

Replace the current `:root` block in `assets/styles/main.css` with these semantic tokens.
Phase 1 uses the "Phase 1 value" column; Phase 2 changes only this block to the "Phase 2 value" column.

| Token | Phase 1 value (current) | Phase 2 value (new) | Role |
| --- | --- | --- | --- |
| `--bg` | `#07172f` | `#190C4F` | page background, primary |
| `--bg-2` | `#10284a` | `#1D2566` | page background, secondary |
| `--bg-3` | `#061126` | `#3B055D` | gradient stop / cover radial |
| `--accent` | `#d6b866` | `#00AEEF` | primary action, borders, stamp |
| `--accent-dark` | `#9d7c34` | `#0090c7` | pressed/active state |
| `--highlight` | `#d6b866` | `#D6047F` | selected answer, rank badge, standout CTA |
| `--surface` | `#f5e7c7` | `#FFFFFF21` | cards, passport page, panels |
| `--surface-2` | `#e2cea1` | `#00AEEF5C` | raised/secondary surface |
| `--surface-border` | `rgba(214,184,102,.34)` | `#00AEEF5C` | borders on surfaces |
| `--text` | `#172033` | `#FFFFFF` | primary text on surface |
| `--text-muted` | `#657089` | **see §5.4 — not `#52656D`** | secondary text |
| `--green` | `#0b7d4f` | `#00AEEF` | completion/stamp (reuses accent per handoff) |
| `--red` | `#9b2f2f` | `#9b2f2f` | unchanged |
| `--shadow` | `0 24px 70px rgba(2,8,20,.42)` | unchanged | unchanged |

Delete `--navy`, `--navy-2`, `--gold`, `--gold-dark`, `--paper`, `--paper-deep`, `--ink` after
Phase 1 migrates their ~11 call sites.

### Literal → token mapping rules

Map by **role, not by hex value** — several hex values appear in both roles and must be
disambiguated by context. When in doubt, read the surrounding rule.

| Literal family | Values seen | Maps to |
| --- | --- | --- |
| Gold fills/borders | `#d6b866` `#c9a45a` `#ecd383` `#c7a04e` `#e7cf83` `#e4c46d` `#f1d98a` `#caa24f` `#e8d39b` `#b89a59` `#e5c670` `#d8bd6a` `rgba(214,184,102,*)` | `--accent` / `--accent-dark` / `--surface-border` |
| Pale gold **text on dark** | `#ead28a` `#f6e7bc` `#f7e8bf` `#f4e5b8` `#f5e5b7` `#f9e9bf` | `--text` (becomes white in Phase 2) |
| Navy backgrounds | `#07172f` `#061126` `#020815` `#10284a` `#0b2345` `#132f55` `#153052` `#071a35` `#071626` `#1d3553` `#030915` `#041022` | `--bg` / `--bg-2` / `--bg-3` |
| Cream surfaces | `#f5e7c7` `#e2cea1` `rgba(255,249,232,.9)` `rgba(255,251,237,.86)` `rgba(255,250,232,*)` `rgba(255,252,241,.62)` `rgba(255,247,226,.74)` `rgba(255,246,220,.74)` | `--surface` |
| Dark **text on cream** | `#172033` `#12243b` `#10233d` `#263a5a` `#061126` `#50617b` | `--text` |
| Brown/olive muted text | `#657089` `#6a5a37` `#674717` `#6e4b23` `#896b2c` `#637087` | `--text-muted` |

**⚠ `#12243b`, `#10233d`, `#263a5a` and `#061126` appear in both the "navy background" and
"dark text" roles.** Check each occurrence individually.

### Do NOT tokenize — product colors, not theme

These are content, not chrome. Leave them exactly as they are:

- `components/missions/JewelryDesignerMission.vue:94` and `:105-115` — jewelry material and
  gemstone colors (gold/silver/titanium, sapphire/amethyst/emerald/ruby/diamond).
- `components/three/JewelryGravityScene.vue` — all 16 literals are Babylon PBR material colors.
- `components/missions/PatchDesignerMission.vue:43,79-143` — canvas drawing colors for the
  **user's saved patch artwork** (uploaded to Firebase as PNG). Changing these changes the
  appearance of a user creation, which is out of scope for a chrome reskin. **Flag for designer
  decision; do not change unilaterally.**

Note that `JewelryDesignerMission.vue:178-234` *is* theme chrome (toolbar, swatch frames) and
should be tokenized. Only the option arrays at the top of the file are product colors.

---

## 4. File inventory

27 files, ordered by literal count. Tick off as Phase 1 proceeds.

| Count | File | Notes |
| --- | --- | --- |
| 41 | `assets/styles/main.css` | do first — defines the tokens |
| 35 | `components/missions/MissionRenderer.vue` | largest component; barely covered by the handoff |
| 21 | `components/missions/JewelryDesignerMission.vue` | **partial** — chrome only, see §3 |
| 16 | `components/three/JewelryGravityScene.vue` | **skip** — product colors |
| 10 | `components/passport/PrimaryPassportButton.vue` | |
| 9 | `components/tv/DreamWall.vue` | not in handoff — see §5.6 |
| 9 | `components/tv/DreamCard.vue` | not in handoff — see §5.6 |
| 8 | `pages/index.vue` | |
| 8 | `components/passport/PageFlip.vue` | page-curl gradients |
| 7 | `components/three/ISSScene.vue` | scene bg — see §5.5 |
| 7 | `components/missions/PatchDesignerMission.vue` | **partial** — line 186 only |
| 6 | `components/three/AsteroidBlinkingScene.vue` | |
| 6 | `components/passport/PassportCover.vue` | |
| 4 | `components/passport/ScoreBar.vue` | |
| 4 | `components/passport/RankBadge.vue` | |
| 3 | `components/three/MicrogravityVelcroScene.vue` | |
| 3 | `components/three/LiquidOpticsScene.vue` | |
| 3 | `components/pdf/PdfStampGrid.vue` | see §7 |
| 3 | `components/passport/SkipButton.vue` | |
| 3 | `components/passport/MissionHeader.vue` | |
| 2 | `pages/passport/[sessionId].vue` | |
| 2 | `pages/export/[sessionId].vue` | |
| 2 | `components/three/EarthWindowScene.vue` | |
| 2 | `components/passport/PassportPage.vue` | |
| 2 | `components/passport/MissionBadge.vue` | |
| 1 | `components/pdf/PassportPdfDocument.vue` | |
| 1 | `components/passport/Stamp.vue` | see §5.3 |

---

## 5. Corrections to the handoff

The handoff misses several things that will break if followed literally.

### 5.1 Asset path is wrong

The handoff points at `rakia_design_assets/generated_assets/`. **The build references
`assets/passport-design/generated_assets/`.** The two directories are byte-identical duplicates
(verified with `diff -rq`). Recolor the one under `assets/`. The `rakia_design_assets/` copy is
unreferenced by code — propose deleting it, but do not delete without sign-off.

### 5.2 `--text: #FFFFFF` inverts text but not every surface

Three surfaces stay light and would render white-on-white. Each needs an explicit dark treatment
in Phase 5:

- `.field` (`main.css`, `background: rgba(255,249,232,.9)`) — **every text input**, including the
  name field on onboarding and the dream textarea. Not mentioned in the handoff.
- `.choice-button` (`main.css`, `background: rgba(255,251,237,.86)`) — **every quiz answer**.
  Handoff covers this one.
- `.canvas-panel` (`main.css`, `background: rgba(255,252,241,.62)`) — patch designer frame.
  Not mentioned in the handoff.

### 5.3 Stamp blend mode

`components/passport/Stamp.vue` uses `mix-blend-mode: multiply`, tuned for a green stamp on cream
paper. A cyan stamp multiplied onto a dark translucent panel goes nearly black. Change to
`normal` and re-check `opacity: .9`.

### 5.4 `--text-muted: #52656D` fails contrast

Measured against the new backgrounds:

| Pair | Ratio | Verdict |
| --- | --- | --- |
| `#52656D` on `#190C4F` | **2.85:1** | ❌ fails AA (4.5:1) |
| `#52656D` on `#1D2566` | **2.28:1** | ❌ fails AA |
| `#FFFFFF` on `#190C4F` | 17.4:1 | ✅ |
| `#FFFFFF` on `#3B055D` | 15.38:1 | ✅ |
| `#190C4F` on `#00AEEF` (primary button) | 6.88:1 | ✅ |
| `#00AEEF` on `#190C4F` | 6.88:1 | ✅ |
| `#FFFFFF` on `#D6047F` | 5.02:1 | ✅ |
| `#D6047F` on `#190C4F` | 3.47:1 | ⚠ large text / borders only |

This is a phone app used under exhibition lighting. Use `#52656D` for `--surface-border` and
dividers (3:1 threshold applies to non-text UI), and a lighter value for `--text-muted`.

**Resolved (provisional): `--text-muted: #8FA2AB`** — 6.57:1 on `#190C4F`, 5.25:1 on `#1D2566`,
both clearing AA while still reading as muted rather than near-white. Candidates measured:

| Candidate | on `#190C4F` | on `#1D2566` |
| --- | --- | --- |
| `#52656D` (as spec'd) | 2.85:1 ❌ | 2.28:1 ❌ |
| `#7C8F98` | 5.17:1 ✅ | 4.14:1 ❌ |
| **`#8FA2AB`** | **6.57:1 ✅** | **5.25:1 ✅** |
| `#A9B6BD` | 8.38:1 ✅ | 6.70:1 ✅ |

Ship `#8FA2AB` and flag it to the designer as a substitution, with the numbers above as the reason.

### 5.5 3D scene backgrounds are not in the handoff

Four scenes hardcode the old navy as their WebGL clear color and will visibly clash with `#190C4F`:

- `components/three/ISSScene.vue:45` — `0x07172f`
- `components/three/LiquidOpticsScene.vue:23` — `0x07172f`
- `components/three/EarthWindowScene.vue:30` — `0x061126`
- `components/three/MicrogravityVelcroScene.vue:29` — `0x11213a`

These are JS number literals, not CSS, so they can't use `var()`. Define them as a shared exported
constant so they track the palette.

### 5.6 TV dream wall is not in the handoff

`components/tv/DreamWall.vue` and `DreamCard.vue` (18 literals) render `/tv/dreams`, the public
exhibition screen. They share `main.css` classes, so they will look half-reskinned if skipped.
Include them.

---

## 6. Phases

### Phase 1 — Tokenize (no visual change)
1. Rewrite `:root` in `main.css` with the Phase 1 values from §3.
2. Work the file inventory in §4 top-down, replacing literals per the mapping rules.
3. Honor the "do not tokenize" list.
4. **Verify: the app must look identical.** Compare onboarding, a quiz station, a 3D station, the
   summary page, and `/tv/dreams` before and after.

### Phase 2 — Palette swap
Change only the `:root` block to the Phase 2 values. Nothing else in this phase.

### Phase 3 — Typography
1. Download subset `woff2` files into `assets/fonts/`:
   - Latin subset: Jost 400/500, Roboto Slab 400/500/600
   - Hebrew subset: Heebo 400/500, Frank Ruhl Libre 500/600
2. `@font-face` declarations in `main.css`. **No `fonts.googleapis.com` link** — this is a PWA for
   an exhibition and must work when the venue network doesn't. `nuxt.config.ts` workbox
   `globPatterns` already includes `woff2`, so self-hosted files precache automatically.
3. Add tokens and apply:
   ```css
   --font-body: 'Jost', 'Heebo', 'Noto Sans Hebrew', sans-serif;  /* 400 body, 500 buttons */
   --font-head: 'Roboto Slab', 'Frank Ruhl Libre', serif;         /* 600 titles, 500 sections */
   ```
   CSS font fallback is per-glyph, so Hebrew resolves to Heebo / Frank Ruhl Libre and Latin and
   digits to Jost / Roboto Slab within the same string.
4. `body` gets `--font-body` line-height 1.5; `h1`/`h2`/mission titles get `--font-head`
   line-height 1.1. Keep `direction: rtl`.

### Phase 4 — Assets
1. Recolor the 7 SVGs in `assets/passport-design/generated_assets/` (441–2119 bytes each):
   `#c9a45a` → `#00AEEF`, `#e8d39b` → `#00AEEF`, `#b89a59` → `#00AEEF`, `#0f6b3f` → `#00AEEF`,
   `#071626` / `#1d3553` → `#190C4F`.
2. Delete `assets/passport-design/textures/cover_texture_dark_navy.webp` and
   `paper_texture_cream.webp`.
3. Rewrite `.passport-security` and `.passport-cover-texture` in `main.css` as flat/gradient
   backgrounds. Cover gets `radial-gradient(circle at 50% 15%, #3B055D 0%, #190C4F 65%)`.

### Phase 5 — Surface inversion
The judgment-heavy pass. Apply §5.2, §5.3, §5.4, §5.5. Re-check every screen for
white-on-white and invisible borders.

---

## 7. Out of scope (raise, don't do)

- **PDF export palette.** `composables/usePdfExport.ts` draws cream/navy pages
  (`setFillColor(245,231,199)`), and `components/pdf/*` follow. The handoff says "no behavior
  changes," but the exported passport will no longer match the app. Needs a decision.
  (Unrelated but worth noting while in there: the PDF uses jsPDF core `helvetica`, which cannot
  render Hebrew at all — the exported Hebrew is already broken today.)
- **Patch designer canvas colors** — see §3.
- **Deleting `rakia_design_assets/`** — see §5.1.

---

## 8. Verification checklist

No automated tests exist in this repo. Verify by hand on a phone-sized viewport (the target device):

- [ ] Onboarding: name field text visible, camera box border visible, both buttons legible
- [ ] Quiz station: answer buttons legible; selected / correct / wrong states all distinguishable
- [ ] Completion: stamp visible against the dark page (not black, not washed out)
- [ ] 3D station: WebGL background matches the page background
- [ ] Score bar and rank badge legible
- [ ] Summary page + `/export/{id}`
- [ ] `/tv/dreams` on a large screen
- [ ] Offline: DevTools → Network → Offline, hard reload — fonts still render
- [ ] Hebrew and digits in one string (e.g. "משימה 3 מתוך 10") — both faces applied, no fallback
