# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Hebrew, RTL, mobile-first PWA ("דרכון משימת רקיע") for the Rakia space-mission exhibition. A visitor creates a passport (name + selfie), walks 25 numbered stations, and each station awards score + a stamp. Nuxt 3 + Vue 3 SPA-style app with Firebase (anonymous auth, Firestore, Storage) as the only backend. All user-facing strings are Hebrew literals written inline in components — there is no i18n layer.

`rakia_passport_codex_prompt.md` (1847 lines, Hebrew) is the authoritative product spec. Section 11 has per-station requirements; consult it before changing station behavior, scoring, or copy.

## Commands

```bash
npm run dev        # nuxt dev --host 0.0.0.0 (host binding matters: exhibition testing is on phones over LAN)
npm run build      # nuxt build
npm run preview    # nuxt preview --host 0.0.0.0
npm run generate   # static build

firebase deploy --only firestore:rules,firestore:indexes,storage   # rules live in this repo
```

There is no linter, formatter, or test suite. Verification means running the app in a browser (a phone or mobile emulation — desktop layouts are not the target).

Requires a `.env` with `NUXT_PUBLIC_FIREBASE_*` (see `.env.example`). Without a valid config the app renders but every write fails: `useFirebase().requireServices()` throws, and the UI surfaces Hebrew "check anonymous auth / Firestore rules" errors. `.env` also carries `NUXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_KEY`, which is **not** wired into `nuxt.config.ts` runtimeConfig and is unused.

## Architecture

### Mission pipeline

`data/missions.ts` is the single source of truth for the whole experience: 25 `MissionConfig` objects (`types/mission.ts`), ordered by `order`, carrying title, `baseScore`, `allowSkip`, quiz questions, sort/classification items, video storage path, and `wallContentSummary` (the exhibition wall text shown above each station).

Flow: `pages/passport/[sessionId].vue` picks the mission at `session.currentPageIndex` → renders `MissionRenderer.vue` → renderer emits `start` / `complete({attempts, answers})` / `skip` → page calls `usePassportSession` → `useFirebase` writes Firestore → on complete it plays the stamp sound and advances `currentPageIndex`.

`components/missions/MissionRenderer.vue` (~670 lines) is one big `v-if` chain over `mission.type` and holds nearly all station logic (quiz stepping, sort, classification, AR confirm, dream input, summary). The dedicated `components/missions/*Mission.vue` files are mostly vestigial — only `PatchDesignerMission` and `JewelryDesignerMission` are actually mounted by the renderer.

Adding or changing a station usually touches four places: `MissionType` in `types/mission.ts`, the entry in `data/missions.ts`, a branch in `MissionRenderer.vue`, and — for 3D stations — the **mission-id-keyed dispatch** inside the `three-info-quiz` / `three-game` branches, which selects the scene component by `mission.id`. Other id-specific special cases live in the renderer too (`rakia-mission` and `rakia-numbers` slice their question list; `countdown-ar` gates its button on a countdown).

### Scoring

`composables/useScore.ts` owns all of it. `score = baseScore + speedBonus`, where the bonus decays with elapsed time against `estimatedSeconds` and with retry count. `baseScore > 0` is the definition of "stampable" — it determines which stations count toward `completedCount`, the stamp grid, and the PDF. Ranks are the `RANKS` table. `summarizeProgress()` recomputes totals from the progress map on every save and those totals are mirrored onto the session doc.

### Persistence (`composables/useFirebase.ts`)

Client-only by construction: every function early-returns or throws unless `import.meta.client`, and the Firebase SDK is loaded through dynamic `import()` inside a memoized `servicesPromise` (keeps Firebase out of the initial bundle and off the server). Anonymous sign-in happens once during service init.

Firestore is the source of truth. `localStorage` (prefix `rakia-passport:`, plus `rakia-passport-session-id` for resume-on-return) is a write-through **mirror**, not a read fallback — with one exception, `getLocalCreations()`, which the export page relies on. Consequence: opening `/export/{id}` on a different device loses the patch/jewelry images.

Undefined fields are stripped via `withoutUndefined()` before every write, because Firestore rejects `undefined`.

### Firebase rules

`firestore.rules` / `storage.rules` enforce ownership through `sessions/{id}.ownerUid == request.auth.uid` and validate field shapes (status enum, score ≥ 0, name/dream length caps, creation type in `['patch','jewelry']`). Any new field, collection, or storage path needs a matching rule change or writes silently fail in production. `dreams` are world-readable **only** when `approved == true`; client-side `useProfanityFilter` (word list in `data/forbiddenWords.ts`) sets that flag — rejected dreams are still written with `approved: false`. `/tv/dreams` is the public wall, driven by a realtime `onSnapshot` query needing the composite index in `firestore.indexes.json`.

### Video

Videos are never bundled or precached. Each mission's `video.storagePath` is resolved to a Storage download URL at runtime by `getStorageUrl()`. `nuxt.config.ts` workbox `globIgnores` excludes `mission-videos/**` and all video extensions, and a `NetworkOnly` runtime-caching rule covers the Firebase Storage video URLs. Keep it that way — the source mapping lives in `data/videoSources.ts`.

### 3D — two engines on purpose

- **three.js** (`components/three/*Scene.vue`, except the jewelry one): small hand-built imperative scenes created in `onMounted`. Each emits `ready`, which is what unlocks the station's quiz (`:disabled="!sceneReady"`).
- **Babylon.js + Havok** (`components/three/JewelryGravityScene.vue`, ~780 lines): the only physics station. Babylon and Havok are dynamically imported; the Havok `.wasm` URL is resolved from `node_modules` via `import.meta.url`; `nuxt.config.ts` forces all `@babylonjs` code into a `babylon-jewelry` manual chunk with its own `StaleWhileRevalidate` caches, and excludes that chunk and the wasm from precaching (they're too large / mobile-fragile). Init is guarded by an `initVersion` counter so remounts and rapid prop changes can't leave two engines running, and `disposeScene()` must stay symmetric with `initScene()` — mobile startup has already been fixed once here (commit `c4f4767`).

### Components, routing, styling

Components are auto-imported with `pathPrefix: false`, so names are flat and must be globally unique across `components/**`. Routes: `/` (onboarding + camera capture), `/passport/[sessionId]`, `/export/[sessionId]`, `/tv/dreams`.

`assets/styles/main.css` holds the CSS custom-property palette (`--navy`, `--gold`, `--paper`, …) and the global classes components rely on: `.app-screen`, `.primary-button`, `.secondary-button`, `.field`, `.control-row`, `.error-note`. Everything else is scoped. `PassportShell` → `ScoreBar` + `PageFlip` (pointer-drag page-curl) is the frame for every station page. Design references and generated SVG assets are in `assets/passport-design/`.

## Gotchas

- `MissionRenderer.vue` defines `QuizBlock` in a second `<script lang="ts">` block as an options-API component with a **string `template`**, which needs Vue's runtime compiler; `vue.runtimeCompiler` is not enabled in `nuxt.config.ts`. Verify quizzes actually render in a browser after touching that area.
- `composables/usePdfExport.ts` builds the PDF with jsPDF core fonts (`helvetica`), which cannot render Hebrew — the exported passport's Hebrew text is broken. Fixing it means embedding a Hebrew TTF (and handling RTL shaping), not tweaking layout.
- `experimental.appManifest: false` and the `apple-touch-icon` route redirects in `nuxt.config.ts` are deliberate PWA/iOS workarounds.
