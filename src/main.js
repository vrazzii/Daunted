import { validateAnimationDefinition } from "./core/animation.js";
import { ANIMATION_LIBRARY } from "./data/animation-library.js";
import { validateBalanceTuning } from "./data/balance.js";
import { validateMoveLists } from "./data/move-list.js";
import { ActiveAnimationLab } from "./lab/active-animation-lab.js";

function validateFoundation() {
  const errors = [...validateBalanceTuning(), ...validateMoveLists()];

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
  new ActiveAnimationLab(root);
  console.info("DAUNTED ACTIVE REBUILD LAB READY");
}
