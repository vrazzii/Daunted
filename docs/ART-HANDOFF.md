# Daunted Art Handoff Contract

This document defines the exact boundary between sprite production and game integration.

## Required package contents

For each fighter and animation, provide:

- One clean runtime spritesheet PNG
- One labeled preview containing the same frames
- Any notes about intended frame order or special holds

The labeled preview is never loaded by the game.

## Runtime sheet requirements

- PNG with genuine transparency
- RGBA color type
- No title, labels, grid, checkerboard, or background
- Uniform cells
- Frames ordered left-to-right, then top-to-bottom
- Player 1 faces screen-right
- Fixed bottom-center origin and ground baseline
- Mark the same planted-foot anchor in every logical frame; any exceptional frame offset must be recorded in `frameAnchors`
- No automatic resizing, cropping, or background removal during integration

## Locked initial grid

| Property | Value |
| --- | ---: |
| Cell width | 768 px |
| Cell height | 512 px |
| Columns | 4 |
| Rows | 4 |
| Frames | 16 |
| Sheet width | 3072 px |
| Sheet height | 2048 px |
| Origin X | 384 px |
| Ground/origin Y | 464 px |

If approved artwork uses a different grid, the manifest must be deliberately updated. The integration code never guesses cell boundaries.

## Naming

```text
assets/sprites/knight/idle.png
assets/sprites/wolf/idle.png
assets/sprites/veiled-saint/idle.png

assets/previews/knight/idle-preview.png
assets/previews/wolf/idle-preview.png
assets/previews/veiled-saint/idle-preview.png
```

Future animation names use lowercase kebab-case, such as `walk-forward.png`, `standing-heavy.png`, and `knockdown.png`.

## Import gate

An animation is not integrated until all of these pass:

1. The PNG exists at the manifest path.
2. Dimensions exactly match the declared grid.
3. PNG color type contains alpha.
4. Frame count and order match the labeled preview.
5. The Animation Lab shows no crop, scale shift, ground drift, or unexpected direction change.
6. Looping animations return to their first frame cleanly.
7. Player 2 mirroring works without a separate sheet.
8. Every frame resolves to the locked origin after its per-frame anchor correction.

## Timing rule

Artwork count does not control gameplay speed. Animation presentation and combat simulation are separate:

- Art frames define what is drawn.
- Animation ticks define when images advance.
- Move data defines startup, active, recovery, hitstun, damage, and cancel timing.

Two fighters may both have 16 images while playing at completely different speeds.
