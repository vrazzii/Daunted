# Daunted

Daunted is being rebuilt as a data-driven, mobile-first 2D fighting game. The repository currently contains the production foundation and Animation Lab used to validate artwork before combat integration.

## Current milestone

**Rebuild M1 — Idle Integration**

- Three-fighter registry: Knight (`KNI`), Wolf (`WLF`), and Veiled Saint (`VST`)
- Deterministic 60 Hz animation clock
- Animation Lab with playback, frame stepping, mirroring, speed controls, and origin/baseline overlays
- Character-specific provisional movement, weight, health, and damage tuning
- Runtime sprite contract and PNG validation tool
- Automated unit tests and GitHub Actions CI
- Approved Idle v01 runtime sheets and exact manifest timing for all three fighters
- Pause screen with deterministic clock suspension and keyboard shortcuts
- In-game universal and fighter-specific arcade command reference

The art is produced and approved separately. This repository only receives approved clean runtime spritesheets and uses them in the game.

## Run locally

Because the app uses native JavaScript modules, serve the repository with any static server instead of opening `index.html` directly.

```bash
npx serve .
```

Then open the local URL displayed by the server.

## Checks

```bash
npm test
npm run validate:sprites
npm run check
```

`validate:sprites` skips animation entries marked `pending`. Once a sheet is imported, its manifest status changes to `ready`, and validation becomes mandatory.

## Art handoff

See [docs/ART-HANDOFF.md](docs/ART-HANDOFF.md). The short version:

1. Upload the ZIP from the art workflow.
2. Validate the clean runtime PNG and labeled preview.
3. Place the runtime sheet under `assets/sprites/<fighter>/`.
4. Place the preview under `assets/previews/<fighter>/`.
5. Mark the manifest entry `ready`.
6. Run the Animation Lab and automated checks.

## Long-term roadmap

Future systems and unapproved roster concepts are tracked in [docs/ROADMAP.md](docs/ROADMAP.md). Roadmap entries do not enter production until their stated approval and stability gates are met.

## Development order

1. Idle
2. Walking
3. Basic attacks
4. Movement and jumps
5. Damage and knockdown
6. Specials
7. Supers
8. Full combat rebuild and matchup balance

`main` is kept runnable. Every accepted animation category receives its own focused commit after validation.
