# Daunted Roadmap

## Current checkpoint

Rebuild M1 — Idle Integration is the newest verified production foundation on `main`. Approved Idle v01 sheets are integrated for Knight, Wolf, and Veiled Saint, with deterministic playback, pause/move-list UI, automated tests, and sprite dimension/RGBA validation.

## Immediate stability priorities

1. Lock sprite rendering geometry so every logical frame uses stable scale, grounding, and anchor behavior.
2. Strengthen the asset gate against baked backgrounds, contaminated cells, bad crops, and inconsistent frame bounds before adding more combat animation categories.
3. Integrate walk-forward and walk-backward only from approved runtime sheets, then validate backward movement behavior before combat logic depends on it.
4. Preserve deterministic timing, pause behavior, move-list data, and existing approved idle assets while the animation foundation is hardened.

## Reported issues to retain until verified fixed

- Veiled character idle presentation must use only the approved transparent runtime sheet and remain centered, grounded, consistently scaled, and correctly timed.
- Fighters must not shrink, drift, jump between frames, phase through stage lines, or display fragments from neighboring sprite cells.
- Attack animations must never crop or omit intended frames once attack sheets enter production.
- Mobile movement must support backward movement, jump, crouch, and diagonals; backward movement should become defensive blocking when combat rules permit.
- Character selection must support mobile landscape and reliable touch input before it is considered production-ready.

## Production gates

Idle -> Walking -> Basic attacks -> Movement / jumps -> Damage / knockdown -> Specials -> Supers -> Full combat rebuild and balance.

Second forms and alternate movesets remain gated until all three base forms are stable.
