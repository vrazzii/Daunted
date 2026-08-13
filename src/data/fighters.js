export const FIGHTERS = Object.freeze([
  Object.freeze({
    id: "knight",
    code: "KNI",
    name: "Knight",
    shortRole: "Fast duelist",
    integrationNote:
      "The speed-focused fighter. Lower damage per opening is compensated by mobility, responsiveness, and shorter recovery windows."
  }),
  Object.freeze({
    id: "wolf",
    code: "WLF",
    name: "Wolf",
    shortRole: "Heavy bruiser",
    integrationNote:
      "The largest and slowest fighter. Larger hurtboxes and longer commitments are compensated by health, impact, damage, and knockback."
  }),
  Object.freeze({
    id: "veiled-saint",
    code: "VST",
    name: "Veiled Saint",
    shortRole: "Unassigned specialist",
    integrationNote:
      "Uses the neutral baseline until her approved move library establishes a specific mechanical identity."
  })
]);

export const FIGHTER_BY_ID = Object.freeze(
  Object.fromEntries(FIGHTERS.map(fighter => [fighter.id, fighter]))
);

export function getFighter(id) {
  return FIGHTER_BY_ID[id] ?? null;
}
