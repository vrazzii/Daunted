# Daunted Two-Fighter Rebuild

## Active roster

The active rebuild contains exactly two fighters:

1. **Ornate Veil** (`ornate-veil`, `ORV`)
2. **Brute Devil** (`brute-devil`, `BRD`)

The previous Knight, Wolf, and Veiled Saint runtime is preserved on the `archive/pre-two-fighter-rebuild` branch and is not authoritative for the rebuild.

## Master asset contract

Canonical master paths:

- `assets/masters/ornate-veil-master.png`
- `assets/masters/brute-devil-master.png`

These files are design masters, not runtime animation frames. Never crop a master into an animation or use a full master image as a fight sprite.

Every runtime animation must be derived intentionally from the corresponding master and must preserve:

- recognizable anatomy and silhouette
- character scale and pixel density
- costume, weapon, face, hair/horns, and signature accessories
- transparent runtime background
- stable ground/foot anchor
- stable body scale between frames
- enough frame padding for the complete body, weapon, cloth, halo, chains, and attack extensions
- nearest-neighbor rendering at runtime

A sprite animation is not production-ready until it passes frame-by-frame visual review for contamination, cropping, resizing, drift, and foreign sprite pieces.

## Ornate Veil master lock

Preserve silver bob, blindfold, cracked pale skin, black gothic armor, antique-gold trim, burgundy layers, purple energy/fragments, and broken thorn-like halo.

## Brute Devil master lock

Preserve the huge forward-heavy silhouette, charcoal stone skin, restrained red-hot cracks, asymmetrical horns, ornate broken gold shackles/chains, burgundy remnants, and massive desecrated ceremonial axe.

## Rebuild order

Master references -> neutral runtime frame -> idle -> forward/back walk -> crouch -> jump -> basic attacks -> defense/damage -> knockdown/wakeup -> specials -> supers -> combat engine integration.

Do not reactivate legacy fighters or legacy animation sheets to fill missing states. Missing animation means pending, not permission to substitute old art.
