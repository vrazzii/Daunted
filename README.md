# Daunted

Daunted is being rebuilt as a data-driven, mobile-first 2D fighting game. The repository currently contains the production animation foundation and Animation Lab used to validate artwork before combat integration.

## Current milestone

**Rebuild M1.3 — Repository & Sprite Pipeline Stabilization**

- Three-fighter registry: Knight (`KNI`), Wolf (`WLF`), and Veiled Saint (`VST`)
- 56 registered production animations/effects across the recovered base-form sprite library: **55 verified ready, 1 quarantined pending replacement**
- Wolf `walk-forward` is quarantined because its imported PNG contains a malformed IDAT chunk; it must not be promoted back to `ready` until a clean approved source replaces it
- One authoritative animation library shared by runtime, tests, and validation tools
- Deterministic 60 Hz animation clock with variable per-frame timing
- Stable presentation geometry that prevents correction offsets from clipping sprite pixels
- Integer source-cell partitioning for sheets whose dimensions do not divide evenly by their grid
- Native source pixels are rendered 1:1 instead of being rescaled between frames
- Animation Lab with playback, frame stepping, mirroring, speed controls, and origin/baseline overlays
- Character-specific provisional movement, weight, health, and damage tuning
- PNG dimension/format validation plus pixel-level alpha auditing
- Automated unit tests and GitHub Actions CI
- Pause screen and in-game universal/fighter command reference

The art is produced and approved separately. The runtime should only consume approved transparent sprite sheets. Suspicious cells surfaced by the alpha audit still require visual review before combat integration.

## Run locally

The app uses native JavaScript modules, so serve the repository with a static server instead of opening `index.html` directly.

```bash
npx serve .
```

Then open the local URL displayed by the server.

Opening the generated HTML inside an iOS Files/Quick Look preview is **not** considered a supported runtime. Quick Look may render HTML/CSS without executing the JavaScript needed by the playtest. Use a real browser/server environment for interactive testing.

## Checks

```bash
npm test
npm run validate:sprites
npm run audit:sprites
npm run check
```

- `validate:sprites` verifies every `ready` animation definition and its PNG dimensions/format and reports pending/quarantined assets with their reason.
- `audit:sprites` decodes the actual RGBA pixels, fails empty mapped fighter cells, allows intentionally sparse transparent FX timing cells, and warns about suspicious near-opaque or boundary-heavy cells that may indicate baked backgrounds, bad crops, or neighboring-sprite contamination.
- `npm run check` runs the full automated contract.

## Embedded sprite playtest builds

The builder reads the same authoritative animation library as the runtime, so it cannot silently drift into a second hand-maintained manifest. Pending/quarantined animations are excluded.

```bash
# Compact smoke build: all three idles
npm run build:playtest

# Full embedded verified-ready sprite library (large file)
npm run build:playtest:full

# Target one fighter or animation directly
node tools/build-offline-playtest.mjs --fighter=veiled-saint --animation=standing-light
```

Generated files are written to `dist/` and are not committed.

## Art handoff

See [docs/ART-HANDOFF.md](docs/ART-HANDOFF.md). Before an animation is promoted into combat:

1. Import the approved transparent runtime PNG.
2. Register it in the authoritative animation library.
3. Run `npm run check`.
4. Inspect any alpha-audit warnings visually at 1× and mirrored presentation.
5. Verify scale, grounding, crop, timing, and continuity in the Animation Lab.
6. Only then integrate it into gameplay state/hitbox logic.

## Development order

1. Sprite geometry and asset sanitation
2. Walking
3. Basic attacks
4. Movement and jumps
5. Damage and knockdown
6. Specials
7. Supers
8. Full combat rebuild and matchup balance

The durable roadmap/checkpoint lives in [docs/ROADMAP.md](docs/ROADMAP.md). `main` should remain runnable and CI-clean after every accepted change.
