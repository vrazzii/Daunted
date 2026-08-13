import { AnimationPlayer, frameSourceRect, expectedSheetSize } from "../core/animation.js";
import { FixedStepAccumulator } from "../core/fixed-step.js";
import { SpriteSheetCache } from "../core/sprite-loader.js";
import { ANIMATION_LIBRARY, PRODUCTION_ORDER, animationsFor } from "../data/animations.js";
import { FIGHTERS, getFighter } from "../data/fighters.js";
import { BALANCE_BASELINE, FIGHTER_TUNING, tuningDelta } from "../data/balance.js";

const SPEED_OPTIONS = Object.freeze([0.25, 0.5, 0.75, 1, 1.25, 1.5, 2]);

export class AnimationLab {
  constructor(root) {
    this.root = root;
    this.fighterId = FIGHTERS[0].id;
    this.animationId = "idle";
    this.cache = new SpriteSheetCache();
    this.fixedStep = new FixedStepAccumulator({ hz: 60, maxSteps: 5 });
    this.player = null;
    this.sheetResult = null;
    this.mirrored = false;
    this.showGuides = true;
    this.zoom = 1;
    this.loadToken = 0;
    this.lastTimestamp = performance.now();

    this.renderShell();
    this.bindEvents();
    this.populateAnimationSelect();
    this.loadSelection();
    this.startLoop();
  }

  renderShell() {
    this.root.innerHTML = `
      <section class="app-shell">
        <header class="topbar">
          <div>
            <p class="eyebrow">Daunted rebuild M0</p>
            <h1>Animation Lab</h1>
          </div>
          <div class="topbar-status">
            <span class="pulse-dot" aria-hidden="true"></span>
            <span>60 Hz deterministic preview</span>
          </div>
        </header>

        <div class="lab-layout">
          <aside class="control-panel">
            <section class="panel-card">
              <h2>Asset selection</h2>
              <label>
                Fighter
                <select id="fighter-select">
                  ${FIGHTERS.map(fighter => `
                    <option value="${fighter.id}">${fighter.code} — ${fighter.name}</option>
                  `).join("")}
                </select>
              </label>
              <label>
                Animation
                <select id="animation-select"></select>
              </label>
              <div id="asset-status" class="asset-status pending"></div>
            </section>

            <section class="panel-card">
              <h2>Playback</h2>
              <div class="button-row playback-buttons">
                <button id="previous-frame" type="button" aria-label="Previous frame">−1</button>
                <button id="play-toggle" class="primary" type="button">Pause</button>
                <button id="next-frame" type="button" aria-label="Next frame">+1</button>
                <button id="reset-animation" type="button">Reset</button>
              </div>
              <label>
                Playback rate
                <select id="speed-select">
                  ${SPEED_OPTIONS.map(speed => `
                    <option value="${speed}" ${speed === 1 ? "selected" : ""}>${speed}×</option>
                  `).join("")}
                </select>
              </label>
              <label class="range-label">
                Preview zoom
                <input id="zoom-control" type="range" min="0.5" max="2" value="1" step="0.25">
                <output id="zoom-output">100%</output>
              </label>
              <label class="check-row">
                <input id="mirror-control" type="checkbox">
                Mirror for Player 2
              </label>
              <label class="check-row">
                <input id="guide-control" type="checkbox" checked>
                Show cell, baseline, and origin
              </label>
            </section>

            <section class="panel-card tuning-card">
              <div class="card-heading-row">
                <h2>Base tuning</h2>
                <span class="provisional">Provisional</span>
              </div>
              <p id="fighter-role" class="muted-copy"></p>
              <div id="tuning-table" class="tuning-table"></div>
            </section>

            <section class="panel-card production-card">
              <h2>Production order</h2>
              <ol>
                ${PRODUCTION_ORDER.map(item => `
                  <li class="${item.id === "idle" ? "current" : ""}">
                    <span>${item.phase}</span>${item.label}
                  </li>
                `).join("")}
              </ol>
            </section>
          </aside>

          <section class="stage-panel">
            <div class="stage-heading">
              <div>
                <p id="stage-code" class="eyebrow"></p>
                <h2 id="stage-title"></h2>
              </div>
              <div id="frame-readout" class="frame-readout"></div>
            </div>

            <div id="canvas-viewport" class="canvas-viewport">
              <canvas id="sprite-canvas" width="768" height="512"></canvas>
            </div>

            <div class="diagnostic-strip">
              <div><span>Sheet</span><strong id="sheet-size">—</strong></div>
              <div><span>Cell</span><strong id="cell-size">—</strong></div>
              <div><span>Origin</span><strong id="origin-readout">—</strong></div>
              <div><span>Timing</span><strong id="timing-readout">—</strong></div>
            </div>

            <div class="pipeline-note">
              <strong>Integration gate</strong>
              <p>Pending artwork stays out of combat. A sheet becomes usable only after file validation and a clean Animation Lab review.</p>
            </div>
          </section>
        </div>
      </section>
    `;

    this.elements = {
      fighterSelect: this.root.querySelector("#fighter-select"),
      animationSelect: this.root.querySelector("#animation-select"),
      assetStatus: this.root.querySelector("#asset-status"),
      previous: this.root.querySelector("#previous-frame"),
      play: this.root.querySelector("#play-toggle"),
      next: this.root.querySelector("#next-frame"),
      reset: this.root.querySelector("#reset-animation"),
      speed: this.root.querySelector("#speed-select"),
      zoom: this.root.querySelector("#zoom-control"),
      zoomOutput: this.root.querySelector("#zoom-output"),
      mirror: this.root.querySelector("#mirror-control"),
      guides: this.root.querySelector("#guide-control"),
      role: this.root.querySelector("#fighter-role"),
      tuning: this.root.querySelector("#tuning-table"),
      stageCode: this.root.querySelector("#stage-code"),
      stageTitle: this.root.querySelector("#stage-title"),
      frameReadout: this.root.querySelector("#frame-readout"),
      canvasViewport: this.root.querySelector("#canvas-viewport"),
      canvas: this.root.querySelector("#sprite-canvas"),
      sheetSize: this.root.querySelector("#sheet-size"),
      cellSize: this.root.querySelector("#cell-size"),
      origin: this.root.querySelector("#origin-readout"),
      timing: this.root.querySelector("#timing-readout")
    };

    this.context = this.elements.canvas.getContext("2d", { alpha: false });
    this.context.imageSmoothingEnabled = false;
  }

  bindEvents() {
    this.elements.fighterSelect.addEventListener("change", event => {
      this.fighterId = event.target.value;
      this.populateAnimationSelect();
      this.loadSelection();
    });

    this.elements.animationSelect.addEventListener("change", event => {
      this.animationId = event.target.value;
      this.loadSelection();
    });

    this.elements.play.addEventListener("click", () => {
      this.player?.toggle();
      this.updatePlayButton();
    });

    this.elements.previous.addEventListener("click", () => {
      this.player?.step(-1);
      this.updatePlayButton();
      this.draw();
    });

    this.elements.next.addEventListener("click", () => {
      this.player?.step(1);
      this.updatePlayButton();
      this.draw();
    });

    this.elements.reset.addEventListener("click", () => {
      this.player?.seek(0);
      this.draw();
    });

    this.elements.speed.addEventListener("change", event => {
      this.player?.setPlaybackRate(Number(event.target.value));
      this.draw();
    });

    this.elements.zoom.addEventListener("input", event => {
      this.zoom = Number(event.target.value);
      this.elements.zoomOutput.value = `${Math.round(this.zoom * 100)}%`;
      this.applyCanvasZoom();
    });

    this.elements.mirror.addEventListener("change", event => {
      this.mirrored = event.target.checked;
      this.draw();
    });

    this.elements.guides.addEventListener("change", event => {
      this.showGuides = event.target.checked;
      this.draw();
    });

    document.addEventListener("visibilitychange", () => {
      this.lastTimestamp = performance.now();
      this.fixedStep.reset();
    });
  }

  populateAnimationSelect() {
    const entries = Object.values(animationsFor(this.fighterId));
    this.elements.animationSelect.innerHTML = entries
      .map(animation => `<option value="${animation.id}">${animation.label}</option>`)
      .join("");
    this.animationId = entries[0]?.id ?? "idle";
  }

  async loadSelection() {
    const animation = ANIMATION_LIBRARY[this.fighterId]?.[this.animationId];
    if (!animation) return;

    const token = ++this.loadToken;
    this.player = new AnimationPlayer(animation);
    this.player.setPlaybackRate(Number(this.elements.speed.value));
    this.configureCanvas(animation);
    this.renderFighterTuning();
    this.sheetResult = { status: "loading", image: null, errors: [] };
    this.updateText();
    this.draw();

    const result = await this.cache.load(animation);
    if (token !== this.loadToken) return;
    this.sheetResult = result;
    this.updateText();
    this.draw();
  }

  configureCanvas(animation) {
    this.elements.canvas.width = animation.frameWidth;
    this.elements.canvas.height = animation.frameHeight;
    this.context = this.elements.canvas.getContext("2d", { alpha: false });
    this.context.imageSmoothingEnabled = false;
    this.applyCanvasZoom();
  }

  applyCanvasZoom() {
    const animation = this.player?.animation;
    if (!animation) return;
    this.elements.canvas.style.width = `${animation.frameWidth * this.zoom}px`;
    this.elements.canvas.style.height = `${animation.frameHeight * this.zoom}px`;
  }

  startLoop() {
    const tick = timestamp => {
      const delta = timestamp - this.lastTimestamp;
      this.lastTimestamp = timestamp;
      let changed = false;

      this.fixedStep.push(delta, () => {
        changed = this.player?.updateTicks(1) || changed;
      });

      if (changed) this.draw();
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  draw() {
    const animation = this.player?.animation;
    if (!animation) return;

    const ctx = this.context;
    const width = animation.frameWidth;
    const height = animation.frameHeight;
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#151220");
    gradient.addColorStop(1, "#090811");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    this.drawBackgroundGrid(ctx, width, height);

    if (this.sheetResult?.status === "ready" && this.sheetResult.image) {
      const source = frameSourceRect(animation, this.player.frameIndex);
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      if (this.mirrored) {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(
        this.sheetResult.image,
        source.x,
        source.y,
        source.width,
        source.height,
        0,
        0,
        width,
        height
      );
      ctx.restore();
    } else {
      this.drawPendingState(ctx, animation, width, height);
    }

    if (this.showGuides) this.drawGuides(ctx, animation, width, height);
    this.updateFrameReadout();
  }

  drawBackgroundGrid(ctx, width, height) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,.035)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(width, y + 0.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawPendingState(ctx, animation, width, height) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.fillStyle = "#c5b8e8";
    ctx.font = "700 22px system-ui, sans-serif";
    ctx.fillText("AWAITING APPROVED RUNTIME SHEET", width / 2, height / 2 - 14);
    ctx.fillStyle = "#7f7891";
    ctx.font = "14px ui-monospace, monospace";
    ctx.fillText(animation.sheet, width / 2, height / 2 + 18);
    ctx.restore();
  }

  drawGuides(ctx, animation, width, height) {
    const originX = this.mirrored ? width - animation.origin.x : animation.origin.x;
    const originY = animation.origin.y;
    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(140,104,255,.85)";
    ctx.strokeRect(1, 1, width - 2, height - 2);
    ctx.strokeStyle = "rgba(255,197,87,.85)";
    ctx.beginPath();
    ctx.moveTo(0, originY + 0.5);
    ctx.lineTo(width, originY + 0.5);
    ctx.stroke();
    ctx.strokeStyle = "rgba(111,225,255,.95)";
    ctx.beginPath();
    ctx.moveTo(originX - 14, originY);
    ctx.lineTo(originX + 14, originY);
    ctx.moveTo(originX, originY - 14);
    ctx.lineTo(originX, originY + 14);
    ctx.stroke();
    ctx.restore();
  }

  renderFighterTuning() {
    const fighter = getFighter(this.fighterId);
    const tuning = FIGHTER_TUNING[this.fighterId];
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

    this.elements.tuning.innerHTML = fields.map(([label, field, format]) => {
      const delta = tuningDelta(this.fighterId, field);
      const direction = delta === 0 ? "neutral" : delta > 0 ? "up" : "down";
      const deltaText = delta === 0 ? "base" : `${delta > 0 ? "+" : ""}${Math.round(delta * 100)}%`;
      return `
        <div>
          <span>${label}</span>
          <strong>${format(tuning[field] ?? BALANCE_BASELINE[field])}</strong>
          <small class="${direction}">${deltaText}</small>
        </div>
      `;
    }).join("");
  }

  updateText() {
    const fighter = getFighter(this.fighterId);
    const animation = this.player.animation;
    const expected = expectedSheetSize(animation);
    const status = this.sheetResult?.status ?? "loading";
    const errors = this.sheetResult?.errors ?? [];

    this.elements.stageCode.textContent = `${fighter.code} / ${animation.category}`;
    this.elements.stageTitle.textContent = `${fighter.name} — ${animation.label}`;
    this.elements.sheetSize.textContent = `${expected.width} × ${expected.height}`;
    this.elements.cellSize.textContent = `${animation.frameWidth} × ${animation.frameHeight}`;
    this.elements.origin.textContent = `${animation.origin.x}, ${animation.origin.y}`;
    this.elements.timing.textContent = `${animation.ticksPerFrame} ticks/frame`;
    this.elements.assetStatus.className = `asset-status ${status}`;
    this.elements.assetStatus.innerHTML = `
      <strong>${status.toUpperCase()}</strong>
      <span>${errors[0] ?? animation.sheet}</span>
    `;
    this.updatePlayButton();
    this.updateFrameReadout();
  }

  updatePlayButton() {
    if (!this.player) return;
    this.elements.play.textContent = this.player.playing ? "Pause" : "Play";
  }

  updateFrameReadout() {
    if (!this.player) return;
    const snapshot = this.player.snapshot();
    this.elements.frameReadout.innerHTML = `
      <strong>${String(snapshot.frameIndex + 1).padStart(2, "0")}</strong>
      <span>/ ${String(this.player.animation.frameCount).padStart(2, "0")}</span>
      <small>sheet cell ${snapshot.sheetFrame}</small>
    `;
  }
}
