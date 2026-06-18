# Rakia Passport Design Assets

This folder contains a starter asset pack extracted/generated from the UI concept images.

## Important

Do not use full-page mockup screenshots as the actual app UI background.
All real Hebrew text, buttons, questions, mission content and user data must be implemented as responsive RTL HTML/CSS.

Use these assets in a hybrid design system:
- Real images/textures for premium visual depth.
- SVG/CSS for layout, borders, stamps, badges, security patterns and reusable UI.
- Three.js/canvas for interactive mission scenes.

## Folder structure

### /generated_assets
Ready-to-use SVG assets:
- `rakia_emblem_placeholder.svg` — official-style Rakia mission emblem placeholder.
- `green_completion_stamp.svg` — green circular completed mission stamp.
- `mission_badge.svg` — mission-number ribbon/badge.
- `passport_page_border.svg` — reusable inner-page passport border.
- `guilloche_security_pattern.svg` — subtle passport security pattern.
- `orbit_constellation_decor.svg` — orbit/constellation decorative overlay.
- `primary_passport_button_frame.svg` — dark navy/gold button frame.

### /textures
- `paper_texture_cream.webp` — subtle cream paper texture.
- `cover_texture_dark_navy.webp` — dark navy leather-like cover texture.

### /reference_crops_from_mockups
Crops and reference images from the concept mockups.
Use them to match the visual target, not as direct final UI layers.

## Codex instruction to add

Use `/src/assets/passport-design/` for these assets.

Create a real reusable design system around these assets:
- PassportCover
- PassportPage
- MissionBadge
- Stamp
- PrimaryPassportButton
- PassportFrame/PageShell
- decorative SVG overlays

Do not make the app look like a generic Tailwind quiz app.
The UI must resemble an official premium Rakia mission passport:
dark navy cover, gold emboss, cream inner pages, green stamp, museum-grade, adult-friendly.