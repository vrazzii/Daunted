export const FIGHTERS = Object.freeze([
  Object.freeze({
    id: "ornate-veil",
    code: "ORV",
    name: "Ornate Veil",
    shortRole: "Anointed control fighter",
    masterAsset: "assets/masters/ornate-veil-master.png",
    integrationStatus: "master-approved",
    integrationNote:
      "Character 1 for the two-fighter rebuild. Preserve the approved master silhouette, silver bob, blindfold, black-and-antique-gold armor, burgundy layers, cracked pale skin, purple energy, and broken halo. Runtime animation assets must be derived from and visually validated against this master before activation."
  }),
  Object.freeze({
    id: "brute-devil",
    code: "BRD",
    name: "Brute Devil",
    shortRole: "Axe-wielding pressure brute",
    masterAsset: "assets/masters/brute-devil-master.png",
    integrationStatus: "master-approved",
    integrationNote:
      "Character 2 for the two-fighter rebuild. Preserve the approved master silhouette, charcoal stone skin, restrained red-hot cracks, asymmetrical horns, broken ornate-gold shackles and chains, burgundy remnants, and massive desecrated ceremonial axe. Runtime animation assets must be derived from and visually validated against this master before activation."
  })
]);

export const FIGHTER_BY_ID = Object.freeze(
  Object.fromEntries(FIGHTERS.map(fighter => [fighter.id, fighter]))
);

export function getFighter(id) {
  return FIGHTER_BY_ID[id] ?? null;
}
