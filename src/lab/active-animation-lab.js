import { AnimationLab } from "./animation-lab.js";
import { FIGHTERS, getFighter } from "../data/fighters.js";
import { BALANCE_BASELINE } from "../data/balance.js";
import { INPUT_LEGEND, UNIVERSAL_MOVES } from "../data/move-list.js";

const MASTER_PREVIEW_ID = "master-preview";

export class ActiveAnimationLab extends AnimationLab {
  renderShell() {
    super.renderShell();
    const statusText = this.root.querySelector(".topbar-status span:last-child");
    if (statusText) statusText.textContent = "2 active masters · runtime animation sheets staged next";

    const note = this.root.querySelector(".pipeline-note p");
    if (note) {
      note.textContent = "The active rebuild is isolated to Ornate Veil and Brute Devil. Legacy Knight, Wolf, and Veiled Saint animation data remains archived in code but is hidden from this lab while new approved runtime sheets are produced.";
    }
  }

  renderMoveList(fighterId = this.fighterId) {
    const fighter = getFighter(fighterId) ?? FIGHTERS[0];
    this.elements.moveFighterSelect.value = fighter.id;
    this.elements.universalMoves.innerHTML = UNIVERSAL_MOVES.map(entry => this.moveCard(entry)).join("");
    this.elements.fighterMovesHeading.textContent = `${fighter.name} commands`;
    this.elements.moveListIdentity.innerHTML = `<strong>${fighter.shortRole}</strong><span>New move inventory pending animation approval.</span>`;
    this.elements.fighterMoves.innerHTML = `
      <article class="move-card essential">
        <div class="move-card-top"><h4>Moveset staging</h4><kbd>PENDING</kbd></div>
        <p>Character-specific commands will be defined after the new base animation set is approved in the lab.</p>
        <dl><dt>Source</dt><dd>${fighter.name} master design</dd></dl>
      </article>
    `;
    this.elements.inputLegend.innerHTML = INPUT_LEGEND.map(item => `<div><kbd>${item.token}</kbd><span>${item.label}</span></div>`).join("");
  }

  populateAnimationSelect() {
    this.elements.animationSelect.innerHTML = `<option value="${MASTER_PREVIEW_ID}">Master Preview · runtime sprites pending</option>`;
    this.animationId = MASTER_PREVIEW_ID;
  }

  async loadSelection() {
    const fighter = getFighter(this.fighterId) ?? FIGHTERS[0];
    const token = ++this.loadToken;

    this.player = null;
    this.sheetResult = { status: "loading", image: null, errors: [] };
    this.masterPreview = { fighter, image: null, status: "loading", error: "" };

    this.elements.canvas.width = 768;
    this.elements.canvas.height = 512;
    this.context = this.elements.canvas.getContext("2d", { alpha: false });
    this.context.imageSmoothingEnabled = true;
    this.elements.canvas.style.width = `${768 * this.zoom}px`;
    this.elements.canvas.style.height = `${512 * this.zoom}px`;

    this.renderFighterTuning();
    this.updateMasterText();
    this.draw();

    const image = new Image();
    image.onload = () => {
      if (token !== this.loadToken) return;
      this.masterPreview = { fighter, image, status: "ready", error: "" };
      this.sheetResult = { status: "ready", image, errors: [] };
      this.updateMasterText();
      this.draw();
    };
    image.onerror = () => {
      if (token !== this.loadToken) return;
      const error = `Unable to load ${fighter.masterAsset}`;
      this.masterPreview = { fighter, image: null, status: "error", error };
      this.sheetResult = { status: "error", image: null, errors: [error] };
      this.updateMasterText();
      this.draw();
    };
    image.src = fighter.masterAsset;
  }

  renderFighterTuning() {
    const fighter = getFighter(this.fighterId) ?? FIGHTERS[0];
    this.elements.role.textContent = `${fighter.shortRole}. ${fighter.integrationNote}`;

    const fields = [
      ["Health", "maxHealth", value => Math.round(value)],
      ["Forward", "walkForward", value => `${Math.round(value)} px/s`],
      ["Back", "walkBackward", value => `${Math.round(value)} px/s`],
      ["Dash", "dashSpeed", value => `${Math.round(value)} px/s`],
      ["Weight", "weight", value => value.toFixed(2)],
      ["Damage", "damageScale", value => `${value.toFixed(2)}×`],
      ["Hurtbox", "hurtboxScale", value => `${value.toFixed(2)}×`]
    ];

    this.elements.tuning.innerHTML = fields.map(([label, field, format]) => `
      <div>
        <span>${label}</span>
        <strong>${format(BALANCE_BASELINE[field])}</strong>
        <small class="neutral">pending</small>
      </div>
    `).join("");
  }

  updateMasterText() {
    const preview = this.masterPreview;
    if (!preview) return;
    const { fighter, image, status, error } = preview;

    this.elements.stageCode.textContent = `${fighter.code} / MASTER`;
    this.elements.stageTitle.textContent = `${fighter.name} — Master Preview`;
    this.elements.sheetSize.textContent = image ? `${image.naturalWidth} × ${image.naturalHeight}` : "loading";
    this.elements.cellSize.textContent = "single concept frame";
    this.elements.origin.textContent = "not assigned";
    this.elements.timing.textContent = "runtime animation pending";
    this.elements.frameReadout.innerHTML = `<strong>MASTER</strong><span> / CONCEPT</span><small>Approved visual reference</small>`;
    this.elements.assetStatus.className = `asset-status ${status}`;
    this.elements.assetStatus.innerHTML = `
      <strong>${status === "ready" ? "MASTER APPROVED" : status.toUpperCase()}</strong>
      <span>${error || fighter.masterAsset}</span>
    `;
    this.elements.play.textContent = "Awaiting Sprites";
  }

  draw() {
    if (!this.masterPreview) {
      super.draw();
      return;
    }

    const { fighter, image, status } = this.masterPreview;
    const ctx = this.context;
    const width = this.elements.canvas.width;
    const height = this.elements.canvas.height;
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#151220");
    gradient.addColorStop(1, "#090811");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    this.drawBackgroundGrid(ctx, width, height);

    if (status === "ready" && image) {
      const maxWidth = width * 0.82;
      const maxHeight = height * 0.84;
      const scale = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
      const drawWidth = image.naturalWidth * scale;
      const drawHeight = image.naturalHeight * scale;
      const x = (width - drawWidth) / 2;
      const y = height - drawHeight - 28;
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      if (this.mirrored) {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(image, x, y, drawWidth, drawHeight);
      ctx.restore();
    } else {
      ctx.save();
      ctx.textAlign = "center";
      ctx.fillStyle = "#c5b8e8";
      ctx.font = "700 22px system-ui, sans-serif";
      ctx.fillText(status === "error" ? "MASTER PREVIEW UNAVAILABLE" : "LOADING MASTER PREVIEW", width / 2, height / 2 - 10);
      ctx.fillStyle = "#7f7891";
      ctx.font = "14px ui-monospace, monospace";
      ctx.fillText(fighter.masterAsset, width / 2, height / 2 + 20);
      ctx.restore();
    }

    if (this.showGuides) {
      ctx.save();
      ctx.strokeStyle = "rgba(140,104,255,.85)";
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, width - 2, height - 2);
      ctx.restore();
    }
  }

  updatePlayButton() {
    if (this.masterPreview) {
      this.elements.play.textContent = "Awaiting Sprites";
      return;
    }
    super.updatePlayButton();
  }

  updateFrameReadout() {
    if (this.masterPreview) return;
    super.updateFrameReadout();
  }
}
