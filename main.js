(() => {
  "use strict";

  const game = document.getElementById("game");

  const CONFIG = Object.freeze({
    roundSeconds: 60,
    roundsToWin: 2,
    arenaPadding: 22,
    gravity: 2550,
    jumpVelocity: 930,
    walkSpeed: 260,
    backWalkSpeed: 205,
    comboWindowMs: 900,
    cpuThinkMs: 115,
    maxDelta: 1 / 30
  });

  const FIGHTERS = Object.freeze({
    wolfbeast: {
      id: "wolfbeast",
      name: "WOLFBEAST",
      icon: "🐺",
      className: "wolfbeast",
      archetype: "Rushdown Bruiser / Pressure Grappler",
      mechanic: "FERAL METER",
      difficulty: "MEDIUM",
      description:
        "A chained apex predator who turns pain and pressure into momentum. Wolfbeast dominates at close range with lunges, savage strings, command grabs and Feral-enhanced offense.",
      health: 1080,
      moveSpeed: 1.06,
      backSpeed: .92,
      jumpScale: 1.02,
      meterType: "feral",

      attacks: {
        light: {
          name: "Claw Check",
          damage: 58,
          startup: 75,
          active: 80,
          recovery: 125,
          range: 105,
          hitstun: 270,
          blockstun: 165,
          knockback: 45,
          meter: 5
        },

        heavy: {
          name: "Predator Step",
          damage: 102,
          startup: 165,
          active: 95,
          recovery: 250,
          range: 148,
          hitstun: 360,
          blockstun: 215,
          knockback: 86,
          forwardMove: 38,
          meter: 8
        },

        special: {
          name: "Rend Rush",
          damage: 126,
          startup: 190,
          active: 120,
          recovery: 310,
          range: 190,
          hitstun: 410,
          blockstun: 235,
          knockback: 122,
          forwardMove: 72,
          meterCost: 25,
          meter: 10
        },

        crouchHeavy: {
          name: "Moon Rend",
          damage: 88,
          startup: 145,
          active: 105,
          recovery: 245,
          range: 112,
          hitstun: 470,
          blockstun: 190,
          knockback: 58,
          launch: 330,
          meter: 8
        },

        throw: {
          name: "Collar Snap",
          damage: 145,
          startup: 120,
          active: 85,
          recovery: 330,
          range: 74,
          hitstun: 520,
          knockback: 108,
          meter: 13
        }
      }
    },

    knight: {
      id: "knight",
      name: "KNIGHT",
      icon: "♞",
      className: "knight",
      archetype: "Defensive Duelist / Whiff Punisher",
      mechanic: "COMPOSURE",
      difficulty: "HARD",
      description:
        "A disciplined swordmaster who wins at ideal blade range. Knight builds Composure by defending cleanly, controlling space and counter-hitting reckless approaches.",
      health: 940,
      moveSpeed: .97,
      backSpeed: 1.15,
      jumpScale: .98,
      meterType: "composure",

      attacks: {
        light: {
          name: "Royal Cut",
          damage: 52,
          startup: 70,
          active: 70,
          recovery: 115,
          range: 122,
          hitstun: 245,
          blockstun: 155,
          knockback: 54,
          meter: 5
        },

        heavy: {
          name: "Long Thrust",
          damage: 94,
          startup: 150,
          active: 90,
          recovery: 245,
          range: 176,
          hitstun: 330,
          blockstun: 205,
          knockback: 88,
          meter: 8
        },

        special: {
          name: "Luminous Thrust",
          damage: 118,
          startup: 170,
          active: 105,
          recovery: 300,
          range: 222,
          hitstun: 390,
          blockstun: 220,
          knockback: 122,
          forwardMove: 56,
          meterCost: 25,
          meter: 10
        },

        crouchHeavy: {
          name: "Heavenward Edge",
          damage: 82,
          startup: 125,
          active: 100,
          recovery: 220,
          range: 126,
          hitstun: 455,
          blockstun: 185,
          knockback: 66,
          launch: 350,
          meter: 8
        },

        throw: {
          name: "Shoulder Cast",
          damage: 112,
          startup: 115,
          active: 80,
          recovery: 285,
          range: 68,
          hitstun: 460,
          knockback: 132,
          meter: 10
        }
      }
    }
  });

  const app = {
    screen: "title",
    selectedFighter: null,
    opponentId: null,
    match: null,
    raf: 0,
    lastFrame: 0,
    keys: new Set(),
    heldControls: new Set(),
    paused: false
  };

  const clamp = (value, min, max) =>
    Math.max(min, Math.min(max, value));

  const now = () => performance.now();

  function opponentFor(id) {
    return id === "wolfbeast" ? "knight" : "wolfbeast";
  }

  function createFighter(def, side) {
    return {
      def,
      side,
      x: 0,
      y: 0,
      vy: 0,
      facing: side === "left" ? 1 : -1,
      health: def.health,
      maxHealth: def.health,
      meter: 0,
      blocking: false,
      crouching: false,
      attack: null,
      attackStarted: 0,
      attackConnected: false,
      hitstunUntil: 0,
      blockstunUntil: 0,
      comboCount: 0,
      comboExpires: 0,
      roundWins: 0,
      aiNextThink: 0,
      aiIntent: "idle",
      aiUntil: 0,
      dom: null
    };
  }

  function stopLoop() {
    if (app.raf) {
      cancelAnimationFrame(app.raf);
    }

    app.raf = 0;
    app.keys.clear();
    app.heldControls.clear();
  }

  function showTitle() {
    stopLoop();

    app.screen = "title";
    app.match = null;

    game.innerHTML = `
      <section id="title-screen" class="screen">
        <h1>DAUNTED</h1>
        <p>Control fear. Become it.</p>

        <button
          id="start-button"
          class="menu-button primary"
        >
          START
        </button>
      </section>
    `;

    document
      .getElementById("start-button")
      .addEventListener("click", showCharacterSelect);
  }

  function fighterSlot(fighter) {
    return `
      <button
        class="character-slot ${fighter.className}"
        data-fighter="${fighter.id}"
      >
        <span class="retro-portrait">
          ${fighter.icon}
        </span>

        <strong>
          ${fighter.name}
        </strong>
      </button>
    `;
  }

  function lockedSlot() {
    return `
      <div class="character-slot locked">
        <span class="retro-portrait">?</span>
        <strong>LOCKED</strong>
      </div>
    `;
  }

  function showCharacterSelect() {
    stopLoop();

    app.screen = "select";

    game.innerHTML = `
      <section id="character-select" class="screen">

        <div class="select-header">
          <div>
            <small>Arcade roster</small>
            <h2>CHOOSE YOUR FIGHTER</h2>
          </div>

          <small>
            Tap a portrait for full detail
          </small>
        </div>

        <div class="character-grid">
          ${fighterSlot(FIGHTERS.wolfbeast)}
          ${fighterSlot(FIGHTERS.knight)}
          ${lockedSlot()}
          ${lockedSlot()}
          ${lockedSlot()}
          ${lockedSlot()}
          ${lockedSlot()}
          ${lockedSlot()}
        </div>

      </section>
    `;

    document
      .querySelectorAll("[data-fighter]")
      .forEach(button => {
        button.addEventListener("click", () => {
          showFighterPreview(button.dataset.fighter);
        });
      });
  }

  function showFighterPreview(id) {
    const fighter = FIGHTERS[id];

    if (!fighter) {
      showCharacterSelect();
      return;
    }

    game.innerHTML = `
      <section id="fighter-preview" class="screen">

        <button
          id="back-button"
          class="menu-button"
        >
          ← BACK
        </button>

        <div class="fighter-art">
          <div class="full-portrait">
            ${fighter.icon}
          </div>
        </div>

        <div class="fighter-info">

          <small class="eyebrow">
            ${fighter.archetype}
          </small>

          <h2>
            ${fighter.name}
          </h2>

          <p>
            ${fighter.description}
          </p>

          <div class="fighter-stat">
            <span>SIGNATURE</span>
            <strong>${fighter.mechanic}</strong>
          </div>

          <div class="fighter-stat">
            <span>DIFFICULTY</span>
            <strong>${fighter.difficulty}</strong>
          </div>

          <div class="fighter-stat">
            <span>HEALTH</span>
            <strong>${fighter.health}</strong>
          </div>

          <button
            id="select-fighter"
            class="menu-button primary"
          >
            SELECT ${fighter.name}
          </button>

        </div>
      </section>
    `;

    document
      .getElementById("back-button")
      .addEventListener("click", showCharacterSelect);

    document
      .getElementById("select-fighter")
      .addEventListener("click", () => {
        app.selectedFighter = id;
        showVsScreen();
      });
  }

  function showVsScreen() {
    const player = FIGHTERS[app.selectedFighter];

    app.opponentId = opponentFor(player.id);

    const cpu = FIGHTERS[app.opponentId];

    game.innerHTML = `
      <section id="vs-screen" class="screen">

        <div class="vs-fighter">
          <div class="vs-portrait">
            ${player.icon}
          </div>

          <h2>${player.name}</h2>
          <small>PLAYER 1</small>
        </div>

        <div class="vs-logo">
          VS
        </div>

        <div class="vs-fighter">
          <div class="vs-portrait">
            ${cpu.icon}
          </div>

          <h2>${cpu.name}</h2>
          <small>CPU</small>
        </div>

        <button
          id="fight-button"
          class="menu-button primary"
        >
          FIGHT
        </button>

      </section>
    `;

    document
      .getElementById("fight-button")
      .addEventListener("click", startMatch);
  }

  function startMatch() {
    stopLoop();

    const playerDef =
      FIGHTERS[app.selectedFighter];

    const cpuDef =
      FIGHTERS[app.opponentId];

    app.match = {
      player: createFighter(playerDef, "left"),
      cpu: createFighter(cpuDef, "right"),
      round: 1,
      timer: CONFIG.roundSeconds,
      roundActive: false,
      roundEnding: false
    };

    app.screen = "fight";

    renderFight();

    resetRound(true);

    announce("ROUND 1");

    setTimeout(() => {
      announce("FIGHT");
      app.match.roundActive = true;
    }, 850);

    app.lastFrame = now();

    app.raf =
      requestAnimationFrame(gameLoop);
  }

  function renderFight() {
    const player = app.match.player;
    const cpu = app.match.cpu;

    game.innerHTML = `
      <section id="fight-screen" class="screen">

        <div id="fight-hud">

          ${hud(player)}

          <div id="round-timer">
            60
          </div>

          ${hud(cpu)}

        </div>

        <button
          id="pause-button"
          class="menu-button"
        >
          Ⅱ
        </button>

        <div id="arena">

          <div
            id="player-fighter"
            class="fighter ${player.def.className}"
          >
            <div class="fighter-body">
              ${player.def.icon}
            </div>
          </div>

          <div
            id="cpu-fighter"
            class="fighter ${cpu.def.className}"
          >
            <div class="fighter-body">
              ${cpu.def.icon}
            </div>
          </div>

          <div id="combat-message"></div>

          <div id="combo-display"></div>

        </div>

        ${controls()}

      </section>
    `;

    player.dom =
      document.getElementById("player-fighter");

    cpu.dom =
      document.getElementById("cpu-fighter");

    wireControls();

    document
      .getElementById("pause-button")
      .addEventListener("click", togglePause);
  }

  function hud(fighter) {
    return `
      <div class="hud-side ${fighter.side === "right" ? "right" : ""}">

        <div class="hud-line">
          <div class="fighter-name">
            ${fighter.def.name}
          </div>

          <div class="round-pips">
            <span class="round-pip" data-round-pip="${fighter.side}-0"></span>
            <span class="round-pip" data-round-pip="${fighter.side}-1"></span>
          </div>
        </div>

        <div class="health-bar">
          <div
            class="health-fill"
            data-health="${fighter.side}"
          ></div>
        </div>

        <div class="meter-row">
          <div
            class="meter-fill ${fighter.def.meterType}"
            data-meter="${fighter.side}"
          ></div>
        </div>

      </div>
    `;
  }

  function controls() {
    return `
      <div id="mobile-controls">

        <div class="control-pad">
          <button class="control-btn" data-control="left">◀</button>
          <button class="control-btn" data-control="jump">▲</button>
          <button class="control-btn" data-control="right">▶</button>
          <button class="control-btn" data-control="crouch">▼</button>
        </div>

        <div class="action-pad">
          <button class="control-btn" data-action="light">L</button>
          <button class="control-btn" data-action="heavy">H</button>
          <button class="control-btn" data-action="special">SP</button>
          <button class="control-btn" data-control="block">BLK</button>
          <button class="control-btn" data-action="throw">GRAB</button>
          <button class="control-btn" data-action="crouchHeavy">AA</button>
        </div>

      </div>
    `;
  }

  function resetRound(firstRound = false) {
    const width = game.clientWidth;

    const player = app.match.player;
    const cpu = app.match.cpu;

    player.x = width * .22;
    cpu.x = width * .72;

    for (const fighter of [player, cpu]) {
      fighter.y = 0;
      fighter.vy = 0;
      fighter.health = fighter.maxHealth;
      fighter.attack = null;
      fighter.meter = firstRound ? 0 : fighter.meter;
      fighter.blocking = false;
      fighter.crouching = false;
      fighter.hitstunUntil = 0;
      fighter.blockstunUntil = 0;
      fighter.comboCount = 0;
      fighter.comboExpires = 0;
    }

    app.match.timer =
      CONFIG.roundSeconds;

    app.match.roundActive =
      false;

    app.match.roundEnding =
      false;
  }

  function wireControls() {
    document
      .querySelectorAll("[data-control]")
      .forEach(button => {
        const control =
          button.dataset.control;

        button.addEventListener(
          "pointerdown",
          event => {
            event.preventDefault();

            button.classList.add("active");

            if (control === "jump") {
              pressAction("jump");
              return;
            }

            app.heldControls.add(control);
          }
        );

        const release = event => {
          if (event) {
            event.preventDefault();
          }

          app.heldControls.delete(control);
          button.classList.remove("active");
        };

        button.addEventListener(
          "pointerup",
          release
        );

        button.addEventListener(
          "pointercancel",
          release
        );

        button.addEventListener(
          "pointerleave",
          release
        );
      });

    document
      .querySelectorAll("[data-action]")
      .forEach(button => {
        button.addEventListener(
          "pointerdown",
          event => {
            event.preventDefault();

            button.classList.add("active");

            pressAction(
              button.dataset.action
            );
          }
        );

        const release = event => {
          if (event) {
            event.preventDefault();
          }

          button.classList.remove("active");
        };

        button.addEventListener(
          "pointerup",
          release
        );

        button.addEventListener(
          "pointercancel",
          release
        );

        button.addEventListener(
          "pointerleave",
          release
        );
      });
  }

  function held(input) {
    return app.heldControls.has(input);
  }

  function pressAction(action) {
    if (
      !app.match ||
      !app.match.roundActive ||
      app.paused
    ) return;

    const fighter =
      app.match.player;

    const time = now();

    if (
      fighter.attack ||
      time < fighter.hitstunUntil ||
      time < fighter.blockstunUntil
    ) return;

    if (action === "jump") {
      if (fighter.y <= 1) {
        fighter.vy =
          CONFIG.jumpVelocity *
          fighter.def.jumpScale;
      }

      return;
    }

    startAttack(
      fighter,
      action,
      time
    );
  }

  function startAttack(
    fighter,
    key,
    time
  ) {
    const move =
      fighter.def.attacks[key];

    if (!move) return;

    if (
      move.meterCost &&
      fighter.meter < move.meterCost
    ) {
      if (fighter.side === "left") {
        announce("NEED METER");
      }

      return;
    }

    if (move.meterCost) {
      fighter.meter -=
        move.meterCost;
    }

    fighter.attack = {
      key,
      move
    };

    fighter.attackStarted =
      time;

    fighter.attackConnected =
      false;

    fighter.blocking =
      false;

    if (move.forwardMove) {
      fighter.x +=
        fighter.facing *
        move.forwardMove;

      keepInside(fighter);
    }
  }

  function gameLoop(timestamp) {
    if (!app.match) return;

    const dt =
      Math.min(
        CONFIG.maxDelta,
        (timestamp - app.lastFrame) /
          1000 || 0
      );

    app.lastFrame =
      timestamp;

    if (!app.paused) {
      update(dt, timestamp);
    }

    app.raf =
      requestAnimationFrame(
        gameLoop
      );
  }

  function update(dt, time) {
    const match =
      app.match;

    if (
      match.roundActive &&
      !match.roundEnding
    ) {
      match.timer -= dt;

      if (match.timer <= 0) {
        match.timer = 0;
        timeoutRound();
      }
    }

    updatePlayer(dt, time);

    updateCPU(dt, time);

    physics(
      match.player,
      dt
    );

    physics(
      match.cpu,
      dt
    );

    updateAttack(
      match.player,
      match.cpu,
      time
    );

    updateAttack(
      match.cpu,
      match.player,
      time
    );

    separateFighters();

    updateFacing();

    updateFighterDOM(
      match.player
    );

    updateFighterDOM(
      match.cpu
    );

    updateHUD();

    checkKO();
  }

  function updatePlayer(dt, time) {
    const fighter =
      app.match.player;

    if (
      fighter.attack ||
      time < fighter.hitstunUntil ||
      time < fighter.blockstunUntil
    ) {
      fighter.blocking = false;
      fighter.crouching = false;
      return;
    }

    fighter.blocking =
      held("block") &&
      fighter.y <= 1;

    fighter.crouching =
      held("crouch") &&
      fighter.y <= 1 &&
      !fighter.blocking;

    if (
      fighter.blocking ||
      fighter.crouching ||
      fighter.y > 0
    ) return;

    const left =
      held("left");

    const right =
      held("right");

    if (left === right) return;

    const direction =
      left ? -1 : 1;

    const forward =
      direction ===
      fighter.facing;

    const speed =
      forward
        ? CONFIG.walkSpeed *
          fighter.def.moveSpeed
        : CONFIG.backWalkSpeed *
          fighter.def.backSpeed;

    fighter.x +=
      direction *
      speed *
      dt;

    keepInside(fighter);
  }

  function updateCPU(dt, time) {
    const cpu =
      app.match.cpu;

    const player =
      app.match.player;

    if (
      cpu.attack ||
      time < cpu.hitstunUntil ||
      time < cpu.blockstunUntil
    ) {
      cpu.blocking = false;
      return;
    }

    const distance =
      Math.abs(
        player.x -
        cpu.x
      );

    if (
      time >=
      cpu.aiNextThink
    ) {
      cpu.aiNextThink =
        time +
        CONFIG.cpuThinkMs +
        Math.random() * 100;

      const random =
        Math.random();

      if (distance > 190) {
        cpu.aiIntent =
          "advance";
      }

      else if (
        distance < 80 &&
        random < .25
      ) {
        cpu.aiIntent =
          "throw";
      }

      else if (
        random < .45
      ) {
        cpu.aiIntent =
          "light";
      }

      else if (
        random < .7
      ) {
        cpu.aiIntent =
          "heavy";
      }

      else if (
        random < .84
      ) {
        cpu.aiIntent =
          "block";
      }

      else {
        cpu.aiIntent =
          "special";
      }
    }

    cpu.blocking =
      cpu.aiIntent ===
      "block";

    if (
      cpu.aiIntent ===
      "advance"
    ) {
      cpu.x +=
        cpu.facing *
        CONFIG.walkSpeed *
        .7 *
        dt;
    }

    else if (
      ["light",
       "heavy",
       "special",
       "throw"]
       .includes(
         cpu.aiIntent
       )
    ) {
      startAttack(
        cpu,
        cpu.aiIntent,
        time
      );

      cpu.aiIntent =
        "idle";
    }

    keepInside(cpu);
  }

  function physics(
    fighter,
    dt
  ) {
    if (
      fighter.y > 0 ||
      fighter.vy !== 0
    ) {
      fighter.vy -=
        CONFIG.gravity *
        dt;

      fighter.y +=
        fighter.vy *
        dt;

      if (
        fighter.y <= 0
      ) {
        fighter.y = 0;
        fighter.vy = 0;
      }
    }
  }

  function keepInside(
    fighter
  ) {
    fighter.x =
      clamp(
        fighter.x,
        CONFIG.arenaPadding,
        game.clientWidth -
        CONFIG.arenaPadding
      );
  }

  function separateFighters() {
    const player =
      app.match.player;

    const cpu =
      app.match.cpu;

    if (
      player.y > 90 ||
      cpu.y > 90
    ) return;

    const minDistance = 72;

    const delta =
      cpu.x -
      player.x;

    const distance =
      Math.abs(delta);

    if (
      distance === 0 ||
      distance >= minDistance
    ) return;

    const direction =
      Math.sign(delta) || 1;

    const correction =
      (minDistance -
        distance) / 2;

    player.x -=
      correction *
      direction;

    cpu.x +=
      correction *
      direction;

    keepInside(player);
    keepInside(cpu);
  }

  function updateFacing() {
    const player =
      app.match.player;

    const cpu =
      app.match.cpu;

    player.facing =
      player.x <= cpu.x
        ? 1
        : -1;

    cpu.facing =
      cpu.x <= player.x
        ? 1
        : -1;
  }

  function updateAttack(
    attacker,
    defender,
    time
  ) {
    if (!attacker.attack) {
      return;
    }

    const move =
      attacker.attack.move;

    const elapsed =
      time -
      attacker.attackStarted;

    const activeStart =
      move.startup;

    const activeEnd =
      move.startup +
      move.active;

    const finish =
      activeEnd +
      move.recovery;

    if (
      !attacker.attackConnected &&
      elapsed >= activeStart &&
      elapsed <= activeEnd
    ) {
      const deltaX =
        defender.x -
        attacker.x;

      const distance =
        Math.abs(deltaX);

      const defenderIsInFront =
        (Math.sign(deltaX) ||
          attacker.facing) ===
        attacker.facing;

      if (
        defenderIsInFront &&
        distance <=
        move.range
      ) {
        hit(
          attacker,
          defender,
          move,
          time
        );

        attacker.attackConnected =
          true;
      }
    }

    if (
      elapsed >= finish
    ) {
      attacker.attack =
        null;
    }
  }

  function hit(
    attacker,
    defender,
    move,
    time
  ) {
    const isThrow =
      move.name === "Collar Snap" ||
      move.name === "Shoulder Cast";

    const blocked =
      defender.blocking &&
      !isThrow;

    if (blocked) {
      defender.health -=
        Math.max(
          1,
          Math.round(
            move.damage *
            .055
          )
        );

      defender.health =
        Math.max(
          0,
          defender.health
        );

      defender.blockstunUntil =
        time +
        move.blockstun;

      defender.x +=
        attacker.facing *
        Math.min(
          30,
          move.knockback *
          .25
        );

      if (
        defender.def.meterType ===
        "composure"
      ) {
        defender.meter += 8;
      }

      if (
        attacker.def.meterType ===
        "feral"
      ) {
        attacker.meter += 5;
      }

      defender.meter =
        clamp(
          defender.meter,
          0,
          100
        );

      attacker.meter =
        clamp(
          attacker.meter,
          0,
          100
        );

      spawnSpark(
        defender.x,
        defender.y
      );

      keepInside(defender);

      return;
    }

    attacker.comboCount =
      attacker.comboExpires >
      time
        ? attacker.comboCount + 1
        : 1;

    attacker.comboExpires =
      time +
      CONFIG.comboWindowMs;

    const scaling =
      clamp(
        1 -
        (attacker.comboCount - 1) *
        .09,
        .5,
        1
      );

    let damage =
      Math.round(
        move.damage *
        scaling
      );

    if (
      attacker.def.meterType ===
      "feral"
    ) {
      damage =
        Math.round(
          damage *
          (
            1 +
            attacker.meter *
            .0015
          )
        );
    }

    if (
      attacker.def.meterType ===
      "composure" &&
      attacker.meter >= 75
    ) {
      damage =
        Math.round(
          damage * 1.08
        );
    }

    defender.health -=
      damage;

    defender.health =
      Math.max(
        0,
        defender.health
      );

    defender.hitstunUntil =
      time +
      move.hitstun;

    defender.attack =
      null;

    defender.blocking =
      false;

    defender.crouching =
      false;

    defender.x +=
      attacker.facing *
      move.knockback;

    if (move.launch) {
      defender.vy =
        move.launch;
    }

    attacker.meter +=
      move.meter || 5;

    attacker.meter =
      clamp(
        attacker.meter,
        0,
        100
      );

    if (
      defender.def.meterType ===
      "feral"
    ) {
      defender.meter +=
        damage *
        .065;
    }

    else {
      defender.meter -=
        13;
    }

    defender.meter =
      clamp(
        defender.meter,
        0,
        100
      );

    spawnSpark(
      defender.x,
      defender.y
    );

    if (
      attacker.comboCount >=
      2
    ) {
      showCombo(
        attacker.comboCount
      );
    }

    keepInside(defender);
  }

  function spawnSpark(
    x,
    y
  ) {
    const arena =
      document.getElementById(
        "arena"
      );

    if (!arena) return;

    const spark =
      document.createElement(
        "div"
      );

    spark.className =
      "hit-spark";

    spark.style.left =
      `${x}px`;

    spark.style.bottom =
      `calc(20% + ${y + 70}px)`;

    arena.appendChild(
      spark
    );

    setTimeout(
      () => spark.remove(),
      180
    );
  }

  function showCombo(
    count
  ) {
    const display =
      document.getElementById(
        "combo-display"
      );

    if (!display) return;

    display.textContent =
      `${count} HIT`;

    display.classList.add(
      "active"
    );

    clearTimeout(
      showCombo.timer
    );

    showCombo.timer =
      setTimeout(
        () => {
          display.classList.remove(
            "active"
          );
        },
        700
      );
  }

  function checkKO() {
    if (
      !app.match.roundActive ||
      app.match.roundEnding
    ) return;

    const player =
      app.match.player;

    const cpu =
      app.match.cpu;

    if (
      player.health <= 0 ||
      cpu.health <= 0
    ) {
      if (
        player.health <= 0 &&
        cpu.health <= 0
      ) {
        drawRound("DOUBLE KO");
      }

      else if (
        cpu.health <= 0
      ) {
        endRound(player);
      }

      else {
        endRound(cpu);
      }
    }
  }

  function timeoutRound() {
    const player =
      app.match.player;

    const cpu =
      app.match.cpu;

    if (
      player.health >
      cpu.health
    ) {
      endRound(player);
    }

    else if (
      cpu.health >
      player.health
    ) {
      endRound(cpu);
    }

    else {
      drawRound("DRAW");
    }
  }

  function drawRound(message) {
    app.match.roundEnding =
      true;

    app.match.roundActive =
      false;

    announce(message);

    setTimeout(() => {
      app.match.round += 1;

      resetRound();

      announce(
        `ROUND ${app.match.round}`
      );

      setTimeout(() => {
        announce("FIGHT");

        app.match.roundActive =
          true;
      }, 850);
    }, 1200);
  }

  function endRound(winner) {
    app.match.roundEnding =
      true;

    app.match.roundActive =
      false;

    winner.roundWins += 1;

    updateHUD();

    announce("KO");

    setTimeout(() => {
      if (
        winner.roundWins >=
        CONFIG.roundsToWin
      ) {
        showResult(winner);
        return;
      }

      app.match.round += 1;

      resetRound();

      announce(
        `ROUND ${app.match.round}`
      );

      setTimeout(() => {
        announce("FIGHT");

        app.match.roundActive =
          true;
      }, 850);

    }, 1200);
  }

  function showResult(
    winner
  ) {
    const overlay =
      document.createElement(
        "div"
      );

    overlay.id =
      "round-overlay";

    const playerWon =
      winner.side ===
      "left";

    overlay.innerHTML = `
      <div class="overlay-card">

        <small class="eyebrow">
          ${playerWon
            ? "VICTORY"
            : "DEFEAT"}
        </small>

        <h2>
          ${winner.def.name}
          WINS
        </h2>

        <div class="overlay-actions">

          <button
            id="rematch-button"
            class="menu-button primary"
          >
            REMATCH
          </button>

          <button
            id="roster-button"
            class="menu-button"
          >
            CHARACTER SELECT
          </button>

        </div>

      </div>
    `;

    game.appendChild(
      overlay
    );

    document
      .getElementById(
        "rematch-button"
      )
      .addEventListener(
        "click",
        startMatch
      );

    document
      .getElementById(
        "roster-button"
      )
      .addEventListener(
        "click",
        showCharacterSelect
      );
  }

  function announce(
    text
  ) {
    const message =
      document.getElementById(
        "combat-message"
      );

    if (!message) return;

    message.textContent =
      text;

    message.style.opacity =
      "1";

    clearTimeout(
      announce.timer
    );

    announce.timer =
      setTimeout(() => {
        message.style.opacity =
          "0";
      }, 650);
  }

  function updateFighterDOM(
    fighter
  ) {
    if (!fighter.dom) return;

    fighter.dom.style.setProperty(
      "--x",
      `${fighter.x - 55}px`
    );

    fighter.dom.style.setProperty(
      "--y",
      `${fighter.y}px`
    );

    fighter.dom.style.setProperty(
      "--face",
      fighter.facing
    );

    fighter.dom.classList.toggle(
      "blocking",
      fighter.blocking
    );

    fighter.dom.classList.toggle(
      "attacking",
      !!fighter.attack
    );

    fighter.dom.classList.toggle(
      "crouching",
      fighter.crouching
    );
  }

  function updateHUD() {
    if (!app.match) return;

    for (
      const fighter of [
        app.match.player,
        app.match.cpu
      ]
    ) {
      const health =
        document.querySelector(
          `[data-health="${fighter.side}"]`
        );

      const meter =
        document.querySelector(
          `[data-meter="${fighter.side}"]`
        );

      if (health) {
        health.style.width =
          `${
            clamp(
              fighter.health /
              fighter.maxHealth *
              100,
              0,
              100
            )
          }%`;
      }

      if (meter) {
        meter.style.width =
          `${clamp(
            fighter.meter,
            0,
            100
          )}%`;
      }

      for (
        let i = 0;
        i < CONFIG.roundsToWin;
        i++
      ) {
        const pip =
          document.querySelector(
            `[data-round-pip="${fighter.side}-${i}"]`
          );

        if (pip) {
          pip.classList.toggle(
            "won",
            i < fighter.roundWins
          );
        }
      }
    }

    const timer =
      document.getElementById(
        "round-timer"
      );

    if (timer) {
      timer.textContent =
        Math.max(
          0,
          Math.ceil(
            app.match.timer
          )
        );
    }
  }

  function togglePause() {
    app.paused =
      !app.paused;

    app.heldControls.clear();
    app.keys.clear();

    const existing =
      document.getElementById(
        "pause-overlay"
      );

    if (!app.paused) {
      existing?.remove();

      app.lastFrame =
        now();

      return;
    }

    const overlay =
      document.createElement(
        "div"
      );

    overlay.id =
      "pause-overlay";

    overlay.innerHTML = `
      <div class="overlay-card">

        <h2>PAUSED</h2>

        <div class="overlay-actions">

          <button
            id="resume-button"
            class="menu-button primary"
          >
            RESUME
          </button>

          <button
            id="pause-roster-button"
            class="menu-button"
          >
            CHARACTER SELECT
          </button>

        </div>

      </div>
    `;

    game.appendChild(
      overlay
    );

    document
      .getElementById(
        "resume-button"
      )
      .addEventListener(
        "click",
        togglePause
      );

    document
      .getElementById(
        "pause-roster-button"
      )
      .addEventListener(
        "click",
        showCharacterSelect
      );
  }

  window.addEventListener(
    "resize",
    () => {
      if (!app.match) return;

      keepInside(
        app.match.player
      );

      keepInside(
        app.match.cpu
      );

      separateFighters();

      updateFighterDOM(
        app.match.player
      );

      updateFighterDOM(
        app.match.cpu
      );
    }
  );

  function runSelfTests() {
    console.assert(
      FIGHTERS.wolfbeast,
      "Wolfbeast missing"
    );

    console.assert(
      FIGHTERS.knight,
      "Knight missing"
    );

    console.assert(
      CONFIG.roundsToWin === 2,
      "Round system broken"
    );

    console.assert(
      clamp(-10,0,100) === 0,
      "Clamp broken"
    );

    console.assert(
      clamp(200,0,100) === 100,
      "Clamp broken"
    );

    console.assert(
      opponentFor("wolfbeast") ===
      "knight",
      "Wolf opponent broken"
    );

    console.assert(
      opponentFor("knight") ===
      "wolfbeast",
      "Knight opponent broken"
    );

    console.log(
      "DAUNTED SELF TESTS PASSED"
    );
  }

  runSelfTests();

  showTitle();

})();