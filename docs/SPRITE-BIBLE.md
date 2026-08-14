# Daunted Sprite Bible

## Purpose

Daunted is being rebuilt sprite-first around two active fighters only: **Ornate Veil** and **Brute Devil**. This document is the production contract for every generated or hand-edited sprite. Its job is to stop scale drift, style drift, anchor drift, crop errors, accidental redesigns, and cross-character inconsistency during heavy sprite generation.

The current master artworks are visual references. Runtime animation frames must be derived from those masters but exported as clean transparent sprite assets.

## Shared production rules

Every sprite for both fighters must obey the same rendering language:

- Crisp high-detail pixel art with nearest-neighbor presentation.
- Same camera angle and fighting-game perspective across both fighters.
- Same pixel density and apparent resolution. Neither fighter may look more HD or more retro than the other.
- Same lighting logic: dark gothic ambient light, controlled metallic highlights, deep shadows, restrained supernatural glow.
- Same outline weight and edge sharpness.
- Transparent background only for runtime body and FX assets.
- Never bake UI, labels, reference backgrounds, floor lines, portraits, or other characters into runtime sheets.
- Never stretch artwork to fit a frame. Preserve aspect ratio and native sprite pixels.
- Animation frames may change pose, overlap, squash of loose cloth, or secondary motion, but must not redesign anatomy, costume, equipment, palette, or silhouette-defining features.
- Each animation uses one stable canvas large enough to contain the largest pose in that animation. Do not auto-crop each frame independently.
- Each animation has a fixed ground baseline. Feet may lift only when the actual move requires it.
- Every frame must preserve consistent character scale. No shrinking or growing between frames unless a deliberate gameplay transformation explicitly requires it.
- Body sprites and detachable FX should be separate assets whenever possible.
- Effects may extend beyond the fighter silhouette but must not alter body scale or anchor.

## Shared scale contract

Use Ornate Veil as the primary scale reference.

- Ornate Veil canonical body height: **190 px** from ground baseline to top of hair in neutral stance.
- Brute Devil canonical body height: **234 px** from ground baseline to top of the skull/horn-root body silhouette in neutral stance.
- Brute Devil target body-height ratio: **1.23x Ornate Veil**.
- Ornate's halo and Brute Devil's horns/axe are silhouette extensions and do not redefine body scale.
- Generated frames should be normalized back to these body-height targets before runtime registration.
- Width is not normalized to the same value. Brute Devil is intentionally much broader.

These values are production targets, not permission to resample every frame arbitrarily. Prefer generation/export at the correct native scale first. If normalization is required, normalize the entire animation consistently and inspect pixel quality afterward.

## Grounding and anchor contract

All gameplay sprites use a bottom-center body anchor tied to the stage baseline.

### Ornate Veil

- Anchor follows the midpoint between planted feet in neutral stance.
- Hair, halo, floating fragments, cloth tails, and magic do not influence the body anchor.
- Long cloth may overlap below/around the body visually but may not move the logical ground point.

### Brute Devil

- Anchor follows the midpoint between his planted feet.
- Axe head, axe shaft, hanging chains, horns, and cloth do not influence the body anchor.
- His wide stance may shift visually during attacks, but the gameplay root should move only when the move definition intentionally moves him.

## Ornate Veil continuity lock

The following traits are immutable across base-form sprite generation:

- Silver bob haircut with the same approximate length and silhouette.
- Black blindfold covering the eyes.
- Pale cracked skin.
- Black gothic plate armor with antique-gold trim.
- Burgundy layered cloth and torn trailing fabric.
- Broken thorn-like golden halo surrounding the head/upper body region.
- Controlled purple/violet energy and floating dark fragments.
- Feminine athletic proportions matching the approved master.
- Pointed armored boots and layered leg armor.
- Elegant, upright, composed posture as her neutral visual language.

Do not randomly add helmets, capes, new weapons, different hairstyles, larger breasts/hips, alternate armor sets, different halo geometry, or unrelated religious symbols during sprite generation.

## Brute Devil continuity lock

The following traits are immutable across base-form sprite generation:

- Massive charcoal/stone-like demonic body.
- Red-hot cracks restrained across the skin rather than covering the whole body in glow.
- Asymmetrical horn configuration and the same horn direction/profile as the approved master.
- Broad, heavy, forward-threatening proportions.
- Ornate broken gold/brass shackles, chains, and religious restraint hardware.
- Burgundy torn ceremonial cloth around the waist.
- Large desecrated ceremonial axe with consistent head shape, shaft length, ornamentation, and scale.
- Heavy bare feet/clawed feet consistent with the master.
- Gold/brass ornamentation must remain aged and gothic rather than bright modern yellow.

Do not randomly add wings, conventional plate armor, a helmet, extra horns, a tail unless later explicitly approved, alternate axes, skull overload, fire covering the entire body, or bodybuilder pose changes that alter his canonical anatomy.

## Weapon scale lock: Brute Devil axe

The axe must survive sprite-generation spam without changing size every sheet.

- The axe is intentionally oversized and should read as a heavy two-handed relic even when held in one hand during neutral poses.
- Shaft length and axe-head proportions must remain visually consistent against Brute Devil's forearm and torso dimensions.
- Do not shorten the weapon merely to fit a frame. Increase transparent canvas padding instead.
- Do not crop the axe head during startup, active, recovery, knockdown, or movement frames.
- If a move throws, drops, or separates the axe, that must be an explicit move-specific asset/state, not accidental inconsistency.

## Ornate halo scale lock

- Halo radius must remain consistent relative to Ornate's head and shoulders across all frames.
- Halo pieces may rotate, open, contract slightly for authored attacks, or separate as FX only when the move calls for it.
- The halo must never become larger/smaller simply because a new sprite sheet was generated.
- The body anchor must never be calculated from the halo bounds.

## Canvas and export rules

Each animation should be exported separately, for example:

- `ornate-veil_idle.png`
- `ornate-veil_walk-forward.png`
- `ornate-veil_walk-backward.png`
- `ornate-veil_standing-light.png`
- `brute-devil_idle.png`
- `brute-devil_walk-forward.png`
- `brute-devil_heavy.png`

Rules:

- One fighter per body sheet.
- One animation family per sheet.
- Fixed grid declared in the manifest.
- Stable cell dimensions within that sheet.
- Transparent RGBA PNG.
- No text.
- No palette strip.
- No portraits.
- No background.
- No other animation family sharing unused cells unless deliberately specified in the manifest.
- No body+FX combination unless the effect is inseparable from the silhouette and has been visually approved.

## Sprite-generation prompt contract

Every generation request should explicitly include the following intent:

> Preserve the approved master character exactly. Maintain canonical body proportions, costume, equipment, palette, outline density, pixel density, lighting, camera angle, and silhouette. Change only the pose required by this animation. Keep the character at the established Daunted in-game scale. Use a transparent background and enough fixed canvas padding to prevent cropping. Do not redesign any anatomy, clothing, armor, halo, horns, chains, or weapon. Do not include labels, UI, reference panels, extra characters, or unrelated effects.

Then append animation-specific instructions.

## Production order

For each fighter, generate and approve in this order:

1. Neutral master runtime sprite
2. Idle
3. Walk forward
4. Walk backward
5. Crouch / crouch idle
6. Jump / fall / land
7. Standing light
8. Standing heavy
9. Crouching attacks
10. Jumping attacks
11. Guard / parry
12. Hit reactions
13. Knockdown
14. Get-up
15. Grab / throw
16. Specials
17. Super
18. Character-specific transformation or low-health states only after base-form stability

Do not bulk-generate the full moveset and assume continuity. Every completed animation must pass visual review before the next high-risk batch is promoted.

## Acceptance checklist

Before any generated animation becomes `ready` in the runtime manifest, verify:

- Character body height matches the canonical scale target.
- Pixel density matches the other fighter.
- Feet/ground anchor is stable.
- No frame-to-frame shrinking or growth.
- No unintended horizontal/vertical drift.
- No foreign sprite pieces or neighboring-cell contamination.
- No baked background.
- No cropped body, halo, horns, axe, cloth, chains, or intended effect.
- Canonical colors and lighting are preserved.
- Face, hair, horns, armor, halo, chains, and weapon remain consistent.
- Mirrored presentation still looks correct.
- Full animation loops without a visual pop at the loop boundary when looping is intended.

## Runtime rule

The game engine must adapt its canvas to the approved sprite geometry. Approved sprites must not be distorted to satisfy arbitrary UI boxes.

If a generated asset violates this document, the asset is rejected or corrected. Do not compensate for bad source art by adding per-frame scale hacks in gameplay code.
