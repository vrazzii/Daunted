# Daunted Roadmap

## Current checkpoint

**Rebuild M1.3 — Repository & Sprite Pipeline Stabilization** is the newest production checkpoint on `main`.

The production runtime, tests, and validation tools now share one authoritative 56-animation/effect library. The old idle-only duplicate registry was removed from the validation path, so automated checks now cover the entire recovered base-form library. Stable presentation geometry preserves native source-pixel dimensions, partitions non-divisible sheets on integer pixel boundaries, and reserves enough canvas space for per-frame grounding corrections without clipping.

The repository also has a pixel-level sprite alpha audit. It fails completely empty mapped cells and reports suspicious near-opaque or boundary-heavy cells for human visual inspection. These warnings are evidence to review, not automatic proof that an animation is invalid.

## Verified stabilization work

- One authoritative animation manifest for runtime, tests, and tooling.
- 56 ready animation/effect entries validated for definition contract, PNG dimensions, 8-bit RGBA format, and source-cell mapping.
- Non-divisible source sheets use integer pixel partitions instead of fractional crop geometry.
- Destination frames preserve native source dimensions instead of rescaling between frames.
- Stable presentation canvases reserve the full frame-offset envelope so attacks/body extensions are not clipped by alignment correction.
- Generated playtest output is ignored by Git and no longer uploaded as a ~70 MB artifact on every CI run.
- CI runs on Node 24, cancels stale same-branch runs when a newer commit arrives, and executes the full repository check plus a compact embedded smoke build.
- The embedded playtest builder derives its data from the production animation library instead of maintaining another hardcoded sprite manifest.

## Immediate stability priorities

1. Review all `audit:sprites` warnings against the actual art, prioritizing Veiled Saint, attack poses, and cells with significant boundary occupancy.
2. Create explicit per-animation anchor/offset data for non-idle animations where visual review shows vertical or horizontal drift; do not guess corrections from file dimensions alone.
3. Verify every fighter animation visually at 1× and mirrored Player 2 presentation before marking it gameplay-ready.
4. Add a fight-stage renderer that consumes the same `frameSourceRect`, `frameDestinationRect`, and timing functions as the Animation Lab so gameplay cannot diverge from validated presentation geometry.
5. Build the mobile input/state layer around facing-relative movement: forward/backward, jump, crouch, diagonals, and defensive back-to-block behavior.
6. Add the mobile-landscape character-select shell only after touch targets and orientation recovery have regression coverage.

## Reported issues retained until visually verified fixed

- Veiled Saint idle must remain centered, grounded, consistently scaled, and composed only from the approved transparent runtime art.
- Fighters must not shrink, drift, jump between frames, phase through stage lines, or display fragments from neighboring sprite cells.
- Attack animations must never crop intended body/effect pixels or omit intended frames.
- Cells flagged by the alpha audit for heavy edge contact must be visually inspected for crop/neighbor contamination before combat use.
- Mobile movement must support backward movement, jump, crouch, and diagonals; backward movement should become defensive blocking when combat rules permit.
- Character selection must support mobile landscape and reliable touch input before it is production-ready.

## Verified regression contract

- Every registered animation must pass the manifest validator.
- Every ready sheet must match its declared PNG dimensions and 8-bit RGBA format.
- Every unique mapped source cell must contain visible pixels.
- Logical frames must resolve to valid integer source rectangles.
- Source pixels must not be rescaled by presentation geometry.
- Variable frame timing and deterministic fixed-step playback must remain intact.
- Every per-frame destination rectangle must remain fully inside its animation's stable presentation canvas.
- Mirroring must not alter source mapping, timing, scale, or canvas size.
- Runtime, tests, validators, and playtest tooling must consume the same animation library.

## Production gates

Sprite geometry / asset sanitation -> Walking -> Basic attacks -> Movement / jumps -> Damage / knockdown -> Specials -> Supers -> Full combat rebuild and balance.

Second forms and alternate movesets remain gated until all three base forms are stable.
