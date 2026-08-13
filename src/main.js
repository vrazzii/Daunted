import { validateAnimationDefinition } from "./core/animation.js";
import { ANIMATION_LIBRARY } from "./data/animations.js";
import { validateBalanceTuning } from "./data/balance.js";
import { AnimationLab } from "./lab/animation-lab.js";

function validateFoundation() {
  const errors = validateBalanceTuning();

  for (const animations of Object.values(ANIMATION_LIBRARY)) {
    for (const animation of Object.values(animations)) {
      errors.push(
        ...validateAnimationDefinition(animation).map(
          error => `${animation.fighterId}/${animation.id}: ${error}`
        )
      );
    }
  }

  return errors;
}

const root = document.getElementById("app");
const errors = validateFoundation();

if (errors.length) {
  root.innerHTML = `
    <section class="fatal-error">
      <p class="eyebrow">Daunted validation failed</p>
      <h1>Foundation error</h1>
      <ul>${errors.map(error => `<li>${error}</li>`).join("")}</ul>
    </section>
  `;
  console.error("DAUNTED FOUNDATION ERRORS", errors);
} else {
  new AnimationLab(root);
  console.info("DAUNTED REBUILD M0 READY");
}
