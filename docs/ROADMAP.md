# Daunted Roadmap

## Current checkpoint

Rebuild M1.2 — Stable Presentation Geometry is the newest production checkpoint on `main`. The recovered base-form sprite library remains integrated, and the animation renderer now sizes one stable presentation canvas from the full per-animation offset envelope. Frame grounding corrections no longer push valid sprite pixels outside the canvas, which directly addresses clipped attacks/body extensions while preserving deterministic timing, source cells, scale, and animation-specific offsets.

## Immediate stability priorities

1. Audit all recovered animation manifests for contaminated cells, baked backgrounds, neighboring-sprite fragments, bad crops, and inconsistent source bounds.
2. Verify every fighter animation visually at 1× and mirrored Player 2 presentation, with special attention to Veiled Saint idle continuity and large attack poses.
3. Move the same stable anchor/presentation geometry into the eventual fight-stage renderer so gameplay sprites and the animation lab cannot disagree about scale or grounding.
4. Build the mobile fight-input layer around facing-relative movement: forward/backward, jump, crouch, diagonals, and defensive back-to-block behavior.
5. Add the mobile-landscape character-select shell only after its touch targets and orientation recovery can be regression-tested.

## Reported issues to retain until verified fixed

- Veiled character idle presentation must use only the approved transparent runtime sheet and remain centered, grounded, consistently scaled, and correctly timed.
- Fighters must not shrink, drift, jump between frames, phase through stage lines, or display fragments from neighboring sprite cells.
- Attack animations must never crop or omit intended frames. Stable presentation geometry now prevents clipping caused by frame-offset correction; source-art contamination/crop errors still require visual verification.
- Mobile movement must support backward movement, jump, crouch, and diagonals; backward movement should become defensive blocking when combat rules permit.
- Character selection must support mobile landscape and reliable touch input before it is considered production-ready.

## Verified regression contract

- Every registered animation must pass the manifest validator.
- Logical frames must resolve to valid source cells.
- Variable frame timing and deterministic fixed-step playback must remain intact.
- Every per-frame destination rectangle must remain fully inside its animation's stable presentation canvas.
- Mirroring must not alter source mapping, timing, scale, or canvas size.

## Production gates

Sprite geometry / asset sanitation -> Walking -> Basic attacks -> Movement / jumps -> Damage / knockdown -> Specials -> Supers -> Full combat rebuild and balance.

Second forms and alternate movesets remain gated until all three base forms are stable.
