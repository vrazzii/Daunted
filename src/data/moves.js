// Move choreography and frame data will be added only after approved attack
// sprites exist. Keeping these registries explicit prevents placeholder attacks
// from silently becoming permanent character design.
export const MOVE_LIBRARY = Object.freeze({
  knight: Object.freeze({}),
  wolf: Object.freeze({}),
  "veiled-saint": Object.freeze({})
});
