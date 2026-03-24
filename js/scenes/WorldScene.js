const TILE = 32;

class WorldScene extends Phaser.Scene {
  constructor() { super({ key: 'WorldScene' }); }

  create() {
    this.battleCooldown = false;

    // ── Ensure HUDScene is running (e.g. after island travel) ─────────────
    if (!this.scene.isActive('HUDScene') && !this.scene.isSleeping('HUDScene')) {
      this.scene.launch('HUDScene');
    }

    // ── Init GameState extensions ────────────────────────────────────────
    if (window.GameState.hearts      === undefined) window.GameState.hearts      = 3;
    if (window.GameState.maxHearts   === undefined) window.GameState.maxHearts   = 3;
    if (window.GameState.checkpoint  === undefined) window.GameState.checkpoint  = null;
    if (window.GameState.echoGold    === undefined) window.GameState.echoGold    = 0;
    if (window.GameState.echoX       === undefined) window.GameState.echoX       = null;
    if (window.GameState.echoY       === undefined) window.GameState.echoY       = null;
    if (!window.GameState.explored)                 window.GameState.explored    = new Set();
    if (!window.GameState.mapData)                  window.GameState.mapData     = null;
    if (!window.GameState.enemyPositions)           window.GameState.enemyPositions = [];
    if (!window.GameState.questProgress)            window.GameState.questProgress  = window.initQuestState();
    if (window.GameState.totalKills  === undefined) window.GameState.totalKills  = 0;
    if (window.GameState.hardKills   === undefined) window.GameState.hardKills   = 0;
    if (window.GameState.chestsOpened === undefined) window.GameState.chestsOpened = 0;

    // ── Jump state ───────────────────────────────────────────────────────
    this.isJumping      = false;
    this.jumpCooldown   = false;
    this.jumpShadow     = null;

    // ── Interact key state ───────────────────────────────────────────────
    this.fKeyDown       = false;

    // ── Mount state ──────────────────────────────────────────────────────
    this.mountedHorse   = null;

    // ── Echo orb ─────────────────────────────────────────────────────────
    this.echoOrb        = null;

    // ── Dialogue state ────────────────────────────────────────────────────
    this._dialogueActive = false;

    // ── Weather ───────────────────────────────────────────────────────────
    this._weatherParticles = [];
    this._weatherTimer     = 0;
    this._weatherGfx       = this.add.graphics().setDepth(19).setScrollFactor(0);

    // ── Build world ──────────────────────────────────────────────────────
    this.buildProceduralTextures();
    this.buildMap();
    this.buildPlayer();
    this.buildEnemies();
    this.buildCamera();
    this.buildControls();
    this.buildCampfires();
    this.buildChests();
    this.buildHorses();
    this.buildNPCs();
    this.buildPoneglyphs();
    this.buildBoat();
    this.buildAnimals();
    this.buildBlacksmith();

    // ── Field of View overlay ────────────────────────────────────────────
    this._initFoV();

    // ── Boss proximity warning (shown once per boss per session) ──────────
    this._bossWarned = new Set();

    // ── Island arrival banner (first time on this island) ────────────────
    this._showIslandArrival();

    // Restore echo orb if the player died before recovering gold
    if (window.GameState.echoGold > 0 &&
        window.GameState.echoX !== null &&
        window.GameState.echoY !== null) {
      this._spawnEchoOrb(window.GameState.echoX, window.GameState.echoY);
    }

    // ── Periodic updates shared with HUDScene ────────────────────────────
    this.time.addEvent({
      delay: 200,
      loop: true,
      callback: () => {
        window.GameState.enemyPositions = this.enemyGroup.getChildren().map(e => ({
          x: e.x, y: e.y
        }));
      }
    });

    // ── Scene events ─────────────────────────────────────────────────────
    this.events.on('menuClosed', () => { this.physics.resume(); });

    this.events.on('battleWon', (reward) => {
      window.GameState.playerMoney += reward.money;
      if (reward.card) {
        window.GameState.playerCollection.push(reward.card);
      }
      if (window.GameState.defeatedEnemy) {
        window.GameState.defeatedEnemy.destroy();
        window.GameState.defeatedEnemy = null;
      }

      // ── XP and Level-up ──────────────────────────────────────────────
      if (reward.enemyDef) {
        const isBossXP = reward.enemyDef.isBoss || reward.enemyDef.difficulty === 'boss';
        const xpGain = isBossXP ? 80 : (reward.enemyDef.difficulty === 'hard' ? 20 : 10);
        window.GameState.playerXP    = (window.GameState.playerXP    || 0) + xpGain;
        window.GameState.playerLevel = (window.GameState.playerLevel || 1);
        const xpNeeded = window.GameState.playerLevel * 50;
        if (window.GameState.playerXP >= xpNeeded) {
          window.GameState.playerXP -= xpNeeded;
          window.GameState.playerLevel++;
          const lv = window.GameState.playerLevel;
          // Every 5 levels: +1 max heart (cap 6)
          if (lv % 5 === 0 && window.GameState.maxHearts < 6) {
            window.GameState.maxHearts++;
            window.GameState.hearts = Math.min(window.GameState.hearts + 1, window.GameState.maxHearts);
            this.time.delayedCall(1200, () => this._showLevelUpEffect(lv, true));
          } else {
            this.time.delayedCall(1200, () => this._showLevelUpEffect(lv, false));
          }
          this.scene.get('HUDScene').updateHUD();
        }
      }

      // ── Quest progress tracking ───────────────────────────────────────
      if (reward.enemyDef) {
        const isBoss = reward.enemyDef.isBoss || reward.enemyDef.difficulty === 'boss';
        window.GameState.totalKills++;
        if (reward.enemyDef.difficulty === 'hard' || isBoss) window.GameState.hardKills++;
        if (isBoss) window.GameState.bossesDefeated.push(reward.enemyDef.id);

        const questEvent = {
          type: 'kill',
          difficulty: reward.enemyDef.difficulty,
          isBoss,
          bossId: reward.bossId || null,
        };
        const changed = window.advanceQuests(questEvent);
        if (changed.length) this._buildQuestHUD();
        changed.forEach(qid => {
          const q = window.QUEST_MAP[qid];
          if (q && !qid.endsWith('_unlocked')) {
            this.time.delayedCall(800, () => {
              this.showMessage('QUEST COMPLETE: ' + q.name + '!', '#ffd700');
              this.scene.get('HUDScene').updateHUD();
              this._buildQuestHUD();
            });
          } else if (qid.endsWith('_unlocked')) {
            const realId = qid.replace('_unlocked', '');
            const q2 = window.QUEST_MAP[realId];
            if (q2) {
              this.time.delayedCall(1600, () => {
                this.showMessage('NEW QUEST: ' + q2.name, '#44ff88');
                this._buildQuestHUD();
              });
            }
          }
        });
      }

      // ── Kill streak ───────────────────────────────────────────────────
      if (reward.enemyDef) {
        this._killStreak = (this._killStreak || 0) + 1;
        const streakBonuses = { 3: 10, 5: 25, 10: 50 };
        const streakBonus = streakBonuses[this._killStreak];
        if (streakBonus) {
          window.GameState.playerMoney += streakBonus;
          this.time.delayedCall(2200, () =>
            this.showMessage(this._killStreak + '-KILL STREAK!  +' + streakBonus + 'G', '#ffdd00')
          );
        }
      }

      this.battleCooldown = false;
      this.physics.resume();
      const hud = this.scene.get('HUDScene');
      hud.updateHUD();
      hud.showReward(reward.money, reward.card);

      // Auto-save after every battle win
      window.saveGame();

      // God Card check — trigger ending if the player just obtained it
      if (reward.card === 'god_card' ||
          window.GameState.playerCollection.includes('god_card')) {
        this.time.delayedCall(2800, () => this._triggerGodCardEnding());
      }
    });

    this.events.on('battleLost', (data) => {
      const hl = data?.heartsLost ?? 2;
      this._killStreak = 0;
      window.GameState.hearts = Math.max(0, (window.GameState.hearts ?? 3) - hl);
      this.battleCooldown = false;
      this.physics.resume();

      if (window.GameState.hearts <= 0) {
        this._triggerDeath();
      } else {
        const cp = window.GameState.checkpoint;
        const rx = cp ? cp.x : window.GameState.spawnX;
        const ry = cp ? cp.y : window.GameState.spawnY;
        this.player.setPosition(rx, ry);
        // Restore elevation from map data at respawn position
        const rr = Math.floor(ry / TILE), rc = Math.floor(rx / TILE);
        this.playerElevation = this.elevMap?.[rr]?.[rc] ?? 0;
        this.player.setDepth(10 + this.playerElevation * 5);
        this.scene.get('HUDScene').updateHUD();
        this.showMessage('Lost ' + hl + ' heart' + (hl !== 1 ? 's' : '') + '! ♥ x' + window.GameState.hearts, '#ff4444');
      }
    });
  }

  // ─────────────────── PROCEDURAL TEXTURES ────────────────────────────────

  buildProceduralTextures() {
    // ── Campfire (32×32) ──────────────────────────────────────────────────
    if (!this.textures.exists('campfire')) {
      const cf = this.textures.createCanvas('campfire', 32, 32);
      const ctx = cf.getContext();
      // Log base
      ctx.fillStyle = '#5c3317';
      ctx.fillRect(8, 22, 16, 5);
      ctx.fillRect(10, 20, 12, 4);
      // Flame layers (yellow core, orange mid, red outer)
      const grad = ctx.createRadialGradient(16, 18, 1, 16, 20, 10);
      grad.addColorStop(0,   '#ffffaa');
      grad.addColorStop(0.3, '#ffaa00');
      grad.addColorStop(0.7, '#ff4400');
      grad.addColorStop(1,   'rgba(200,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(16, 18, 9, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      // Sparks
      ctx.fillStyle = '#fff';
      [[14,10],[18,8],[16,6],[12,13],[20,12]].forEach(([sx,sy]) => {
        ctx.fillRect(sx, sy, 1, 1);
      });
      cf.refresh();
    }

    // ── Chest — use Mystic Woods asset if available ───────────────────────
    if (this.textures.exists('mw_chest') && !this.textures.exists('chest')) {
      // Copy from mw_chest (pixel art chest sprite) into 'chest' canvas
      const mwc = this.textures.get('mw_chest').getSourceImage();
      const ch  = this.textures.createCanvas('chest', 32, 32);
      const ctx = ch.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(mwc, 0, 0, mwc.width, mwc.height, 0, 0, 32, 32);
      ch.refresh();
    }
    // ── Chest (32×32) procedural fallback ─────────────────────────────────
    if (!this.textures.exists('chest')) {
      const ch = this.textures.createCanvas('chest', 32, 32);
      const ctx = ch.getContext();
      // Body
      ctx.fillStyle = '#7a4a1e';
      ctx.fillRect(4, 14, 24, 14);
      // Lid
      ctx.fillStyle = '#9b6230';
      ctx.fillRect(4, 9, 24, 8);
      ctx.beginPath();
      ctx.ellipse(16, 9, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      // Hinges
      ctx.fillStyle = '#c8a000';
      ctx.fillRect(7, 13, 3, 5);
      ctx.fillRect(22, 13, 3, 5);
      // Lock
      ctx.fillStyle = '#c8a000';
      ctx.fillRect(13, 20, 6, 5);
      ctx.beginPath();
      ctx.arc(16, 20, 3, Math.PI, 0);
      ctx.fill();
      // Wood grain
      ctx.strokeStyle = '#5c3317';
      ctx.lineWidth = 0.5;
      [16, 22].forEach(y => {
        ctx.beginPath(); ctx.moveTo(4, y); ctx.lineTo(28, y); ctx.stroke();
      });
      ch.refresh();
    }

    // ── Horse (32×32 top-down) ────────────────────────────────────────────
    if (!this.textures.exists('horse')) {
      const ho = this.textures.createCanvas('horse', 32, 32);
      const ctx = ho.getContext();
      // Body (oval)
      ctx.fillStyle = '#8b4513';
      ctx.beginPath();
      ctx.ellipse(16, 18, 10, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      // Head
      ctx.fillStyle = '#7a3a10';
      ctx.beginPath();
      ctx.ellipse(16, 8, 5, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      // Mane
      ctx.fillStyle = '#3a1a00';
      ctx.fillRect(13, 4, 6, 10);
      // Legs
      ctx.fillStyle = '#7a3a10';
      [[8,22],[12,24],[20,24],[24,22]].forEach(([lx,ly]) => {
        ctx.fillRect(lx-2, ly, 4, 5);
      });
      // Eyes
      ctx.fillStyle = '#111';
      ctx.fillRect(13, 6, 2, 2);
      ctx.fillRect(17, 6, 2, 2);
      // Tail
      ctx.fillStyle = '#3a1a00';
      ctx.beginPath();
      ctx.ellipse(16, 26, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ho.refresh();
    }

    // ── Poneglyph stone (48×64) ──────────────────────────────────────────
    if (!this.textures.exists('poneglyph')) {
      const pg = this.textures.createCanvas('poneglyph', 48, 64);
      const ctx = pg.getContext();
      // Stone body
      ctx.fillStyle = '#3a2a6a';
      ctx.fillRect(4, 8, 40, 54);
      ctx.fillStyle = '#2a1a5a';
      ctx.fillRect(0, 12, 4, 44);
      ctx.fillRect(44, 12, 4, 44);
      ctx.fillRect(4, 8, 40, 4);
      // Top rounded
      ctx.beginPath();
      ctx.arc(24, 12, 20, Math.PI, 0);
      ctx.fillStyle = '#3a2a6a';
      ctx.fill();
      // Glow lines (inscription marks)
      ctx.fillStyle = '#8866ff';
      [[12,20,24,4],[12,28,24,4],[12,36,24,4],[12,44,24,4],
       [12,52,10,4],[24,52,10,4],
       [18,16,8,2],[24,16,8,2]].forEach(([x,y,w,h]) => {
        ctx.fillRect(x, y, w, h);
      });
      // Small symbols
      ctx.fillStyle = '#aaaaff';
      ctx.fillRect(16, 18, 4, 4);
      ctx.fillRect(28, 26, 4, 4);
      ctx.fillRect(20, 34, 4, 4);
      pg.refresh();
    }

    // ── Boat sprite (64×48) ──────────────────────────────────────────────
    if (!this.textures.exists('boat')) {
      const bt = this.textures.createCanvas('boat', 64, 48);
      const ctx = bt.getContext();
      // Hull
      ctx.fillStyle = '#5a3010';
      ctx.fillRect(4, 28, 56, 16);
      ctx.fillStyle = '#7a4a20';
      ctx.fillRect(4, 24, 56, 8);
      // Bow/stern curves
      ctx.fillStyle = '#5a3010';
      ctx.beginPath();
      ctx.ellipse(8, 36, 6, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(56, 36, 6, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      // Mast
      ctx.fillStyle = '#4a2808';
      ctx.fillRect(30, 4, 4, 24);
      // Sail
      ctx.fillStyle = '#eeeecc';
      ctx.beginPath();
      ctx.moveTo(34, 6);
      ctx.lineTo(48, 14);
      ctx.lineTo(34, 22);
      ctx.fill();
      // Rope lines
      ctx.strokeStyle = '#6b4010';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(32, 6); ctx.lineTo(10, 24); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(32, 6); ctx.lineTo(54, 24); ctx.stroke();
      bt.refresh();
    }

    // ── NPC sprite (32×32) ───────────────────────────────────────────────
    if (!this.textures.exists('npc')) {
      const npc = this.textures.createCanvas('npc', 32, 32);
      const ctx = npc.getContext();
      // Robe body
      ctx.fillStyle = '#6633aa';
      ctx.beginPath();
      ctx.ellipse(16, 22, 9, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      // Head
      ctx.fillStyle = '#e8c090';
      ctx.beginPath();
      ctx.arc(16, 11, 7, 0, Math.PI * 2);
      ctx.fill();
      // Hood/hat
      ctx.fillStyle = '#440088';
      ctx.beginPath();
      ctx.moveTo(9, 11);
      ctx.lineTo(16, 0);
      ctx.lineTo(23, 11);
      ctx.fill();
      ctx.fillRect(8, 11, 16, 3);
      // Eyes
      ctx.fillStyle = '#ffdd88';
      ctx.fillRect(12, 9, 3, 3);
      ctx.fillRect(17, 9, 3, 3);
      // Staff (right side)
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(26, 8, 2, 20);
      ctx.fillStyle = '#aa66ff';
      ctx.beginPath();
      ctx.arc(27, 7, 3, 0, Math.PI * 2);
      ctx.fill();
      npc.refresh();
    }

    // ── Echo Orb (24×24) ─────────────────────────────────────────────────
    if (!this.textures.exists('echo_orb')) {
      const eo = this.textures.createCanvas('echo_orb', 24, 24);
      const ctx = eo.getContext();
      const g = ctx.createRadialGradient(12, 12, 1, 12, 12, 10);
      g.addColorStop(0,   '#ffffff');
      g.addColorStop(0.3, '#ffd700');
      g.addColorStop(0.7, '#ffaa00');
      g.addColorStop(1,   'rgba(255,170,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(12, 12, 10, 0, Math.PI * 2);
      ctx.fill();
      eo.refresh();
    }
  }

  // ─────────────────── MAP ────────────────────────────────────────────────

  buildMap() {
    const island = window.GameState.currentIsland || 0;
    if (island === 1) { this.buildMap_inferno(); return; }
    if (island === 2) { this.buildMap_frost();   return; }
    if (island === 3) { this.buildMap_thunder(); return; }
    this.buildMap_home();
  }

  buildMap_home() {
    const W = 320, H = 200;
    this.mapWidth  = W;
    this.mapHeight = H;
    // Spawn at the top of the two-step starter descent (Z=2)
    this._islandSpawnTile = { x: 121, y: 57 };

    const GRASS = 0, DIRT = 1, WATER = 2, WALL = 3, FLOOR = 4,
          TREE = 5, MOUNTAIN = 6, SAND = 7, GRAVE_GRASS = 8,
          CLIFF = 9, LEDGE = 10;

    const map = [];
    for (let r = 0; r < H; r++) {
      map[r] = new Array(W).fill(GRASS);
    }

    const set = (r, c, t) => {
      if (r >= 0 && r < H && c >= 0 && c < W) map[r][c] = t;
    };
    const rect = (r0, c0, r1, c1, t) => {
      for (let r = r0; r <= r1; r++)
        for (let c = c0; c <= c1; c++)
          set(r, c, t);
    };

    // ── Forest border ────────────────────────────────────────────────────
    for (let r = 0; r < H; r++)
      for (let c = 0; c < W; c++)
        if (r < 6 || r >= H - 6 || c < 6 || c >= W - 6) map[r][c] = TREE;

    // ── Random trees — north wilderness ──────────────────────────────────
    for (let r = 7; r < 85; r++)
      for (let c = 7; c < 130; c++)
        if (Math.random() < 0.035) map[r][c] = TREE;

    // ── Random trees — south-west ─────────────────────────────────────────
    for (let r = 110; r < 175; r++)
      for (let c = 7; c < 65; c++)
        if (Math.random() < 0.04) map[r][c] = TREE;

    // ── Mountain range — top (with two narrow passes) ────────────────────
    for (let c = 7; c < 130; c++) {
      set(18, c, MOUNTAIN); set(19, c, MOUNTAIN); set(20, c, MOUNTAIN);
    }
    for (let c = 130; c < W - 6; c++) {
      set(18, c, MOUNTAIN); set(19, c, MOUNTAIN);
    }
    // Pass 1 at c=130-136
    for (let c = 130; c <= 136; c++) {
      set(18, c, DIRT); set(19, c, DIRT); set(20, c, DIRT);
    }
    // Pass 2 at c=65-72
    for (let c = 65; c <= 72; c++) {
      set(18, c, DIRT); set(19, c, DIRT); set(20, c, DIRT);
    }
    // Second jagged row
    for (let c = 7; c < 60; c  += 4) set(21, c, MOUNTAIN);
    for (let c = 80; c < 130; c += 4) set(21, c, MOUNTAIN);

    // ── Far north mountain range (beyond pass) ────────────────────────────
    for (let c = 7; c < 60; c++) {
      set(8, c, MOUNTAIN); set(9, c, MOUNTAIN);
    }
    for (let c = 75; c < 125; c++) {
      set(8, c, MOUNTAIN); set(9, c, MOUNTAIN);
    }

    // ── River 1 — vertical, west-center ──────────────────────────────────
    for (let r = 22; r < 178; r++) {
      set(r, 64, WATER); set(r, 65, WATER); set(r, 66, WATER);
    }
    // Bridge A (near main town)
    for (let r = 84; r < 98; r++) {
      set(r, 64, DIRT); set(r, 65, DIRT); set(r, 66, DIRT);
    }
    // Bridge B (north, near mountain pass)
    for (let r = 36; r < 44; r++) {
      set(r, 64, DIRT); set(r, 65, DIRT); set(r, 66, DIRT);
    }
    // Bridge C (south swamp crossing)
    for (let r = 148; r < 158; r++) {
      set(r, 64, DIRT); set(r, 65, DIRT); set(r, 66, DIRT);
    }

    // ── River 2 — horizontal, bisecting south half ────────────────────────
    for (let c = 70; c < 240; c++) {
      set(148, c, WATER); set(149, c, WATER);
    }
    // Bridge D (east road crossing)
    for (let c = 166; c < 174; c++) {
      set(148, c, DIRT); set(149, c, DIRT);
    }

    // ── MAIN TOWN (center-left) ───────────────────────────────────────────
    const TY1 = 80, TY2 = 138, TX1 = 80, TX2 = 162;
    rect(TY1, TX1, TY2, TX2, FLOOR);
    for (let r = TY1; r <= TY2; r++) { set(r, TX1, WALL); set(r, TX2, WALL); }
    for (let c = TX1; c <= TX2; c++) { set(TY1, c, WALL); set(TY2, c, WALL); }
    // Gates
    for (let c = 116; c <= 124; c++) { set(TY1, c, FLOOR); set(TY2, c, FLOOR); }
    set(TY1 - 1, 120, DIRT); set(TY1 - 2, 120, DIRT);
    set(TY2 + 1, 120, DIRT); set(TY2 + 2, 120, DIRT);
    set(106, TX1, FLOOR); set(107, TX1, FLOOR);
    set(106, TX2, FLOOR); set(107, TX2, FLOOR);

    // Town buildings (6 blocks)
    rect(86,  84,  100, 108, WALL); set(100, 96,  FLOOR);
    rect(86,  130, 100, 158, WALL); set(100, 144, FLOOR);
    rect(106, 84,  120, 108, WALL); set(106, 96,  FLOOR);
    rect(106, 130, 120, 158, WALL); set(106, 144, FLOOR);
    rect(124, 84,  136, 108, WALL); set(124, 96,  FLOOR);
    rect(124, 130, 136, 158, WALL); set(124, 144, FLOOR);

    // Town plaza
    rect(100, 108, 120, 130, FLOOR);

    // ── Paths ─────────────────────────────────────────────────────────────
    // West approach
    for (let c = 6; c < TX1; c++) { set(106, c, DIRT); set(107, c, DIRT); }
    // East road
    for (let c = TX2 + 1; c < W - 6; c++) { set(106, c, DIRT); set(107, c, DIRT); }
    // North road (town to mountain pass)
    for (let r = 22; r < TY1; r++) { set(r, 120, DIRT); set(r, 121, DIRT); }
    // South road
    for (let r = TY2; r < 178; r++) { set(r, 120, DIRT); set(r, 121, DIRT); }
    // Cross-road through town N-S
    for (let r = TY1; r <= TY2; r++) { set(r, 120, FLOOR); set(r, 121, FLOOR); }

    // ── DUNGEON 1 — north-east ────────────────────────────────────────────
    rect(7, 188, 42, 230, FLOOR);
    for (let r = 7;  r <= 42; r++)  { set(r, 188, WALL); set(r, 230, WALL); }
    for (let c = 188; c <= 230; c++) { set(7, c, WALL); set(42, c, WALL); }
    set(42, 208, FLOOR); set(42, 209, FLOOR);
    // Dungeon rooms
    rect(12, 192, 24, 212, WALL); set(24, 202, FLOOR); set(24, 203, FLOOR);
    rect(12, 216, 24, 228, WALL); set(24, 222, FLOOR);
    rect(28, 192, 38, 210, WALL); set(28, 200, FLOOR);
    rect(28, 214, 38, 228, WALL); set(28, 221, FLOOR);
    // Path to dungeon 1
    for (let c = 136; c < 188; c++) { set(28, c, DIRT); set(29, c, DIRT); }
    for (let r = 29; r < 42; r++) set(r, 188, DIRT);

    // ── DUNGEON 2 — deep north-west (behind mountains) ────────────────────
    rect(7, 12, 16, 50, FLOOR);
    for (let r = 7;  r <= 16; r++)  { set(r, 12, WALL); set(r, 50, WALL); }
    for (let c = 12; c <= 50; c++) { set(7, c, WALL); set(16, c, WALL); }
    set(16, 30, FLOOR); set(16, 31, FLOOR);
    rect(9, 16, 14, 28, WALL); set(14, 22, FLOOR);
    rect(9, 32, 14, 46, WALL); set(14, 39, FLOOR);
    // Path to dungeon 2 (through mountain pass 2)
    for (let r = 17; r < 22; r++) { set(r, 30, DIRT); set(r, 31, DIRT); }

    // ── SWAMP — south-west ────────────────────────────────────────────────
    for (let r = 144; r < 178; r++)
      for (let c = 7; c < 62; c++)
        if (Math.random() < 0.42) set(r, c, WATER);
    // Swamp raised path
    for (let r = 144; r < 178; r++) { set(r, 32, DIRT); set(r, 33, DIRT); }
    for (let c = 33; c < 64; c++) { set(160, c, DIRT); set(161, c, DIRT); }

    // ── DESERT — east half ────────────────────────────────────────────────
    rect(55, 196, 178, 312, SAND);
    // Desert ruins cluster 1
    rect(80,  208, 110, 240, WALL); rect(81,  209, 109, 239, SAND);
    set(80, 222, SAND); set(80, 223, SAND);
    set(110, 222, SAND); set(110, 223, SAND);
    set(94, 208, SAND); set(95, 208, SAND);
    set(94, 240, SAND); set(95, 240, SAND);
    // Desert ruins cluster 2
    rect(120, 248, 148, 278, WALL); rect(121, 249, 147, 277, SAND);
    set(120, 262, SAND); set(120, 263, SAND);
    set(148, 262, SAND); set(148, 263, SAND);
    // Desert oasis (small water pool)
    rect(92, 268, 100, 280, WATER);
    rect(93, 269, 99,  279, SAND);

    // ── GRAVEYARD — south-east ────────────────────────────────────────────
    rect(152, 144, 188, 196, GRAVE_GRASS);
    for (let r = 152; r <= 188; r++) { set(r, 144, WALL); set(r, 196, WALL); }
    for (let c = 144; c <= 196; c++) { set(152, c, WALL); set(188, c, WALL); }
    set(188, 168, GRAVE_GRASS); set(188, 169, GRAVE_GRASS);
    // Mausoleum
    rect(160, 162, 178, 182, WALL);
    rect(161, 163, 177, 181, FLOOR);
    set(160, 170, FLOOR); set(160, 171, FLOOR);
    // Large crypt
    rect(154, 148, 166, 162, WALL);
    rect(155, 149, 165, 161, FLOOR);
    set(154, 154, FLOOR); set(154, 155, FLOOR);
    // Path to graveyard
    for (let r = TY2; r < 152; r++) { set(r, 170, DIRT); set(r, 171, DIRT); }
    for (let c = 152; c < 168; c++) { set(152, c, DIRT); }

    // ── VILLAGE 2 — north of desert ──────────────────────────────────────
    const V2Y1 = 54, V2Y2 = 90, V2X1 = 178, V2X2 = 222;
    rect(V2Y1, V2X1, V2Y2, V2X2, FLOOR);
    for (let r = V2Y1; r <= V2Y2; r++) { set(r, V2X1, WALL); set(r, V2X2, WALL); }
    for (let c = V2X1; c <= V2X2; c++) { set(V2Y1, c, WALL); set(V2Y2, c, WALL); }
    set(V2Y1, 196, FLOOR); set(V2Y1, 197, FLOOR);
    set(V2Y2, 196, FLOOR); set(V2Y2, 197, FLOOR);
    set(V2Y1 + 16, V2X1, FLOOR); set(V2Y1 + 17, V2X1, FLOOR);
    set(V2Y1 + 16, V2X2, FLOOR); set(V2Y1 + 17, V2X2, FLOOR);
    // Village 2 buildings
    rect(58,  182, 70,  200, WALL); set(70, 191, FLOOR);
    rect(58,  204, 70,  220, WALL); set(70, 212, FLOOR);
    rect(74,  182, 86,  200, WALL); set(74, 191, FLOOR);
    rect(74,  204, 86,  220, WALL); set(74, 212, FLOOR);
    // Plaza
    rect(68, 198, 78, 208, FLOOR);

    // ── VILLAGE 3 — south wilderness ─────────────────────────────────────
    const V3Y1 = 158, V3Y2 = 184, V3X1 = 82, V3X2 = 122;
    rect(V3Y1, V3X1, V3Y2, V3X2, FLOOR);
    for (let r = V3Y1; r <= V3Y2; r++) { set(r, V3X1, WALL); set(r, V3X2, WALL); }
    for (let c = V3X1; c <= V3X2; c++) { set(V3Y1, c, WALL); set(V3Y2, c, WALL); }
    set(V3Y1, 100, FLOOR); set(V3Y1, 101, FLOOR);
    set(V3Y2, 100, FLOOR); set(V3Y2, 101, FLOOR);
    // Village 3 buildings
    rect(162, 86, 174, 100, WALL); set(174, 93,  FLOOR);
    rect(162, 104,174, 118, WALL); set(174, 111, FLOOR);
    rect(176, 86, 182, 100, WALL); set(176, 93,  FLOOR);
    // Path connecting V3 to main town
    for (let r = TY2; r < V3Y1; r++) { set(r, 101, DIRT); }

    // ── Path: east road to village 2 ─────────────────────────────────────
    for (let c = TX2; c < V2X1; c++) { set(106, c, DIRT); set(107, c, DIRT); }
    for (let r = V2Y2; r < 107; r++) { set(r, 197, DIRT); }

    // ── Path: to desert via east road ────────────────────────────────────
    for (let r = 100; r < 120; r++) { set(r, 196, DIRT); }

    // ── Path: graveyard to east road ─────────────────────────────────────
    for (let c = 170; c < 197; c++) { set(152, c, DIRT); }

    // ════════════════════════════════════════════════════════════════════
    // WORLD EXPANSION — new areas
    // ════════════════════════════════════════════════════════════════════

    // ── CRYSTAL CAVERN — far south-east ──────────────────────────────────
    // A large underground cave system hidden beneath the desert sands.
    // Interior is FLOOR; walls seal it. Entrance from the east desert road.
    const CY1 = 156, CY2 = 193, CX1 = 228, CX2 = 308;
    rect(CY1, CX1, CY2, CX2, FLOOR);
    for (let r = CY1; r <= CY2; r++) { set(r, CX1, WALL); set(r, CX2, WALL); }
    for (let c = CX1; c <= CX2; c++) { set(CY1, c, WALL); set(CY2, c, WALL); }
    // Entrance from north (from desert)
    set(CY1, 265, FLOOR); set(CY1, 266, FLOOR); set(CY1, 267, FLOOR);
    for (let r = 148; r < CY1; r++) { set(r, 265, DIRT); set(r, 266, DIRT); }
    // Internal crystal pillars (blocking columns for visual interest)
    [[162,240],[162,255],[162,275],[162,290],
     [168,248],[168,268],[168,285],
     [174,242],[174,260],[174,278],[174,295],
     [180,250],[180,270],[180,288],
     [186,245],[186,265],[186,283],[186,300],
    ].forEach(([r,c]) => {
      set(r, c, WALL); set(r, c+1, WALL);
      set(r+1, c, WALL); set(r+1, c+1, WALL);
    });
    // Crystal cavern chambers (open rooms)
    rect(162, 232, 168, 238, FLOOR);
    rect(176, 295, 190, 308, FLOOR); set(176, 295, WALL); set(190, 295, WALL);
    // Boss chamber (deep inside)
    rect(180, 290, 193, 308, FLOOR);

    // ── EASTERN HARBOR — far east ─────────────────────────────────────────
    // A harbor cut into the eastern forest border. A boat waits here.
    // Represents the future island-hopping mechanic (One Piece style).
    const HY1 = 92, HY2 = 130, HX1 = 285, HX2 = 314;
    rect(HY1, HX1, HY2, HX2, FLOOR);
    for (let r = HY1; r <= HY2; r++) { set(r, HX1, WALL); }
    for (let c = HX1; c <= HX2; c++) { set(HY1, c, WALL); set(HY2, c, WALL); }
    // Dock area (dirt path into floor)
    rect(100, HX1, 122, HX1 + 6, DIRT);
    // Open east wall (faces the "sea")
    for (let r = HY1 + 1; r < HY2; r++) set(r, HX2, FLOOR);
    // Harbor path from east desert road
    for (let c = 196; c < HX1; c++) { set(106, c, DIRT); set(107, c, DIRT); }
    // Harbor town buildings (small dock village)
    rect(HY1+2, HX1+2, HY1+14, HX1+18, WALL); set(HY1+14, HX1+10, FLOOR);
    rect(HY1+2, HX1+22, HY1+14, HX1+36, WALL); set(HY1+14, HX1+30, FLOOR);
    rect(HY2-16, HX1+2, HY2-4, HX1+18, WALL); set(HY2-16, HX1+10, FLOOR);
    // Harbor campfire
    // (handled in buildCampfires — coordinates added there)

    // ── VOLCANO ISLAND PEAK — far north-east wilderness ───────────────────
    // A mountain peak with ancient ruins and lore stones.
    rect(7, 240, 30, 290, MOUNTAIN);
    // Volcanic crater (walk-into area at peak)
    rect(12, 255, 22, 278, FLOOR);
    for (let r = 12; r <= 22; r++) { set(r, 255, WALL); set(r, 278, WALL); }
    for (let c = 255; c <= 278; c++) { set(12, c, WALL); set(22, c, WALL); }
    // Entrance from south
    set(22, 264, FLOOR); set(22, 265, FLOOR);
    for (let r = 28; r < 32; r++) { set(r, 264, DIRT); set(r, 265, DIRT); }
    // Path from dungeon 1
    for (let r = 30; r < 43; r++) { set(r, 250, DIRT); }
    for (let c = 230; c < 252; c++) { set(43, c, DIRT); }

    // ── NEW VILLAGE — deep south (beyond river) ───────────────────────────
    // Port town of the south. Connected via long south road.
    const V4Y1 = 165, V4Y2 = 193, V4X1 = 200, V4X2 = 228;
    rect(V4Y1, V4X1, V4Y2, V4X2, FLOOR);
    for (let r = V4Y1; r <= V4Y2; r++) { set(r, V4X1, WALL); set(r, V4X2, WALL); }
    for (let c = V4X1; c <= V4X2; c++) { set(V4Y1, c, WALL); set(V4Y2, c, WALL); }
    set(V4Y1, 213, FLOOR); set(V4Y1, 214, FLOOR);
    // Village 4 buildings
    rect(168, 203, 178, 213, WALL); set(178, 208, FLOOR);
    rect(168, 217, 178, 227, WALL); set(178, 222, FLOOR);
    rect(181, 203, 191, 213, WALL); set(181, 208, FLOOR);
    // Path to village 4 from graveyard area
    for (let r = 152; r < V4Y1; r++) { set(r, 213, DIRT); set(r, 214, DIRT); }

    // ══════════════════════════════════════════════════════════════════════
    // ELEVATION SYSTEM — Zelda Minish Cap / Link's Awakening style
    // ══════════════════════════════════════════════════════════════════════

    // ── STARTER DESCENT — player spawns at Z=2, steps down to Z=1, then Z=0
    // Z=2 platform surface (rows 53–62, cols 113–129) — grass
    for (let r = 53; r <= 62; r++)
      for (let c = 113; c <= 129; c++) map[r][c] = GRASS;
    // Row 63 = cliff face (BOTTOM ROW of Z=2 platform — the brown south wall)
    for (let c = 113; c <= 129; c++) set(63, c, CLIFF);
    // Ledge steps cut into the cliff so player can descend
    set(63, 119, LEDGE); set(63, 120, LEDGE); set(63, 121, LEDGE); set(63, 122, LEDGE);

    // Z=1 platform surface (rows 64–71, cols 109–133) — grass
    for (let r = 64; r <= 71; r++)
      for (let c = 109; c <= 133; c++) map[r][c] = GRASS;
    // Row 72 = cliff face (BOTTOM ROW of Z=1 platform — the brown south wall)
    for (let c = 109; c <= 133; c++) set(72, c, CLIFF);
    // Ledge steps so player can descend to Z=0
    set(72, 119, LEDGE); set(72, 120, LEDGE); set(72, 121, LEDGE); set(72, 122, LEDGE);

    // Z=0 approach (rows 73–79 cleared to dirt path to town gate)
    for (let r = 73; r <= 79; r++)
      for (let c = 117; c <= 125; c++) map[r][c] = DIRT;

    // ── Z=3 PEAK HILL — small 3×3 to the right of spawn (cols 131–133, rows 54–56) ──
    // Clear any trees
    for (let r = 54; r <= 56; r++)
      for (let c = 131; c <= 133; c++) map[r][c] = GRASS;
    // Row 56 = cliff face (bottom row of Z=3 block)
    for (let c = 131; c <= 133; c++) set(56, c, CLIFF);
    set(56, 132, LEDGE);  // center ledge for descending

    // ── Area A: Hilltop shrine (north wilderness, elevation 1) ────────────
    // Rows 30–44 = grass surface; row 45 = cliff (bottom row of platform)
    for (let r = 30; r <= 44; r++)
      for (let c = 140; c <= 165; c++)
        if (map[r][c] === TREE) map[r][c] = GRASS;
    for (let c = 140; c <= 165; c++) set(45, c, CLIFF);
    for (let c = 150; c <= 153; c++) set(45, c, LEDGE);

    // ── Area B: Two-tier rocky plateau (north-east, elev 1 then 2) ────────
    // Z=1 surface rows 25–34; row 35 = cliff (bottom row of Z=1)
    for (let r = 25; r <= 34; r++)
      for (let c = 240; c <= 270; c++)
        if (map[r][c] !== WALL && map[r][c] !== FLOOR) map[r][c] = GRASS;
    for (let c = 240; c <= 270; c++) set(35, c, CLIFF);
    set(35, 253, LEDGE); set(35, 254, LEDGE); set(35, 255, LEDGE);
    // Z=2 surface rows 25–29; row 30 = cliff (bottom row of Z=2)
    for (let r = 25; r <= 29; r++)
      for (let c = 252; c <= 262; c++)
        if (map[r][c] !== WALL && map[r][c] !== FLOOR) map[r][c] = GRASS;
    for (let c = 252; c <= 262; c++) set(30, c, CLIFF);
    set(30, 256, LEDGE); set(30, 257, LEDGE);

    // ── Area C: Forest elevated clearing (west, elevation 1) ─────────────
    // Rows 60–74 = grass surface; row 75 = cliff (bottom row of platform)
    for (let r = 60; r <= 74; r++)
      for (let c = 30; c <= 48; c++)
        if (map[r][c] !== WALL && map[r][c] !== WATER) map[r][c] = GRASS;
    for (let c = 30; c <= 48; c++) set(75, c, CLIFF);
    set(75, 38, LEDGE); set(75, 39, LEDGE);

    // ── Build elevMap ─────────────────────────────────────────────────────
    const elevMap = [];
    for (let r = 0; r < H; r++) elevMap[r] = new Array(W).fill(0);

    // Starter descent: Z=2 platform including its cliff bottom row 63
    for (let r = 53; r <= 63; r++)
      for (let c = 113; c <= 129; c++)
        elevMap[r][c] = 2;
    // Starter descent: Z=1 platform including its cliff bottom row 72
    for (let r = 64; r <= 72; r++)
      for (let c = 109; c <= 133; c++)
        if (elevMap[r][c] < 2) elevMap[r][c] = 1;

    // Z=3 peak hill (rows 54–56, cols 131–133)
    for (let r = 54; r <= 56; r++)
      for (let c = 131; c <= 133; c++)
        elevMap[r][c] = 3;

    // Area A elevation 1 (surface + cliff bottom row 45)
    for (let r = 30; r <= 45; r++)
      for (let c = 140; c <= 165; c++)
        elevMap[r][c] = 1;

    // Area B elevation 1 (surface + cliff bottom row 35)
    for (let r = 25; r <= 35; r++)
      for (let c = 240; c <= 270; c++)
        elevMap[r][c] = 1;
    // Area B elevation 2 (surface + cliff bottom row 30)
    for (let r = 25; r <= 30; r++)
      for (let c = 252; c <= 262; c++)
        elevMap[r][c] = 2;

    // Area C elevation 1 (surface + cliff bottom row 75)
    for (let r = 60; r <= 75; r++)
      for (let c = 30; c <= 48; c++)
        elevMap[r][c] = 1;

    // Mountain tiles get elevation 2 (already impassable; visual coherence)
    for (let r = 0; r < H; r++)
      for (let c = 0; c < W; c++)
        if (map[r][c] === MOUNTAIN) elevMap[r][c] = 2;

    this.elevMap = elevMap;
    window.GameState.elevMap = elevMap;

    // ── Render tiles ─────────────────────────────────────────────────────
    const tileKeys = [
      'tile_grass', 'tile_dirt', 'tile_water', 'tile_wall', 'tile_floor',
      'tile_tree', 'tile_mountain', 'tile_sand', 'tile_grave_grass',
      'tile_cliff', 'tile_ledge'  // indexes 9 and 10
    ];
    this.wallGroup          = this.physics.add.staticGroup();
    this.jumpableGroup      = this.physics.add.staticGroup();
    this.ledgeGroup         = this.physics.add.staticGroup();
    this.elevEnemyGroup     = this.physics.add.staticGroup(); // always-on for enemy blocking
    this.waterTiles         = [];
    this.elevatedTileImages = [];
    this.playerElevation    = 0;

    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        const t = map[r][c];
        const x = c * TILE + TILE/2, y = r * TILE + TILE/2;
        const elev = elevMap[r][c];
        const baseDepth = elev * 2;
        const img = this.add.image(x, y, tileKeys[t]).setDepth(baseDepth);
        // Tint elevated walkable tiles slightly brighter/warmer to show height
        if (elev === 1 && t !== CLIFF && t !== LEDGE && t !== WALL && t !== MOUNTAIN)
          img.setTint(0xd8f0c0);  // Z=1: slightly lighter green
        if (elev === 2 && t !== CLIFF && t !== LEDGE && t !== WALL && t !== MOUNTAIN)
          img.setTint(0xf0f8d0);  // Z=2: even lighter, yellowy-green (higher = brighter)
        if (elev === 3 && t !== CLIFF && t !== LEDGE && t !== WALL && t !== MOUNTAIN)
          img.setTint(0xffffd0);  // Z=3: near-white yellow (peak)

        if (t === CLIFF) {
          // Cliff face — always impassable regardless of player elevation
          img.setDepth(Math.max(baseDepth, 1));
          this.physics.add.existing(img, true);
          img.body.setSize(TILE, TILE); img.body.reset(x, y);
          this.wallGroup.add(img);
          img.elevRow = r; img.elevCol = c;
          this.elevatedTileImages.push(img);
        } else if (t === LEDGE) {
          // Ledge step — allows jump-up to elevated area
          img.setDepth(Math.max(baseDepth, 1));
          this.physics.add.existing(img, true);
          img.body.setSize(TILE, TILE); img.body.reset(x, y);
          this.ledgeGroup.add(img);
          img.elevRow = r; img.elevCol = c;
          this.elevatedTileImages.push(img);
        } else if (t === WALL || t === MOUNTAIN) {
          this.physics.add.existing(img, true);
          img.body.setSize(TILE, TILE); img.body.reset(x, y);
          this.wallGroup.add(img);
          if (elev > 0) {
            img.elevRow = r; img.elevCol = c;
            this.elevatedTileImages.push(img);
          }
        } else if (t === TREE || t === WATER) {
          this.physics.add.existing(img, true);
          img.body.setSize(TILE, TILE); img.body.reset(x, y);
          this.jumpableGroup.add(img);
        } else if (elev > 0) {
          // Elevated walkable tile — player body toggled per elevation; enemies blocked always
          this.physics.add.existing(img, true);
          img.body.setSize(TILE, TILE); img.body.reset(x, y);
          this.wallGroup.add(img);
          img.elevRow = r; img.elevCol = c;
          this.elevatedTileImages.push(img);
          // Invisible zone in elevEnemyGroup — always solid so enemies can't enter hills
          const ez = this.add.zone(x, y, TILE, TILE);
          this.physics.add.existing(ez, true);
          ez.body.setSize(TILE, TILE); ez.body.reset(x, y);
          this.elevEnemyGroup.add(ez);
        }

        if (t === WATER) this.waterTiles.push(img);
      }
    }

    this.mapData = map;
    window.GameState.mapData = map;
    this.physics.world.setBounds(0, 0, W * TILE, H * TILE);
  }

  // ── INFERNO ISLAND MAP ────────────────────────────────────────────────────

  buildMap_inferno() {
    const W = 160, H = 120;
    this.mapWidth  = W;
    this.mapHeight = H;
    this._islandSpawnTile = { x: 20, y: 60 };

    // Tile constants — reuse existing palette + LAVA = SAND (7) tinted orange via overrides
    const GRASS = 0, DIRT = 1, WATER = 2, WALL = 3, FLOOR = 4,
          TREE = 5, MOUNTAIN = 6, SAND = 7, GRAVE_GRASS = 8;

    const map = [];
    for (let r = 0; r < H; r++) map[r] = new Array(W).fill(SAND);

    const set = (r, c, t) => { if (r>=0&&r<H&&c>=0&&c<W) map[r][c]=t; };
    const rect = (r0,c0,r1,c1,t) => { for(let r=r0;r<=r1;r++) for(let c=c0;c<=c1;c++) set(r,c,t); };

    // Volcanic mountain peaks — border
    for (let r=0; r<H; r++)
      for (let c=0; c<W; c++)
        if (r<4||r>=H-4||c<4||c>=W-4) map[r][c]=MOUNTAIN;

    // Central lava lake (WATER tile = lava in this context)
    rect(45, 60, 75, 100, WATER);
    rect(50, 68, 70,  92, DIRT);  // inner lava shore

    // Volcano caldera — north-east
    rect(10, 110, 35, 150, MOUNTAIN);
    rect(14, 114, 30, 146, FLOOR);
    for(let r=14;r<=30;r++){set(r,114,WALL);set(r,146,WALL);}
    for(let c=114;c<=146;c++){set(14,c,WALL);set(30,c,WALL);}
    set(30,128,FLOOR);set(30,129,FLOOR);
    for(let r=31;r<38;r++){set(r,128,DIRT);set(r,129,DIRT);}

    // Ruined fortress — west
    rect(40, 10, 80, 50, FLOOR);
    for(let r=40;r<=80;r++){set(r,10,WALL);set(r,50,WALL);}
    for(let c=10;c<=50;c++){set(40,c,WALL);set(80,c,WALL);}
    set(80,28,FLOOR);set(80,29,FLOOR);
    // Fortress rooms
    rect(44,14,58,30,WALL); set(58,22,FLOOR);
    rect(44,34,58,48,WALL); set(58,41,FLOOR);
    rect(64,14,78,48,WALL); set(64,31,FLOOR);

    // Ash plains (GRAVE_GRASS used as ash ground)
    for(let r=85;r<H-4;r++)
      for(let c=4;c<W-4;c++)
        if(Math.random()<0.6) map[r][c]=GRAVE_GRASS;

    // Village of survivors — south-west
    const VY1=88,VY2=110,VX1=10,VX2=45;
    rect(VY1,VX1,VY2,VX2,FLOOR);
    for(let r=VY1;r<=VY2;r++){set(r,VX1,WALL);set(r,VX2,WALL);}
    for(let c=VX1;c<=VX2;c++){set(VY1,c,WALL);set(VY2,c,WALL);}
    set(VY1,26,FLOOR);set(VY1,27,FLOOR);
    // Survivor huts
    rect(91,13,101,23,WALL);set(101,18,FLOOR);
    rect(91,27,101,37,WALL);set(101,32,FLOOR);
    rect(104,13,112,37,WALL);set(104,25,FLOOR);

    // Dock (harbor to return home)
    rect(55,3,70,10,FLOOR);
    for(let c=3;c<=10;c++){set(55,c,WALL);set(70,c,WALL);}
    for(let r=55;r<=70;r++){set(r,3,WALL);}
    set(62,10,FLOOR);set(63,10,FLOOR);

    // Dirt paths
    for(let c=4;c<VX1;c++){set(99,c,DIRT);set(100,c,DIRT);}  // path to dock
    for(let r=51;r<90;r++){set(r,50,DIRT);set(r,51,DIRT);}   // fortress to south
    for(let r=38;r<45;r++){set(r,30,DIRT);set(r,31,DIRT);}   // caldera path

    // Lava cracks (DIRT stripes through SAND)
    for(let r=20;r<45;r+=5)
      for(let c=55;c<110;c++)
        if(Math.random()<0.3) map[r][c]=DIRT;

    // Scattered rocks (MOUNTAIN single tiles)
    for(let r=5;r<H-5;r++)
      for(let c=5;c<W-5;c++)
        if(Math.random()<0.015) map[r][c]=MOUNTAIN;

    // Render
    const tileKeys = ['tile_grass','tile_dirt','tile_water','tile_wall','tile_floor',
                      'tile_tree','tile_mountain','tile_sand','tile_grave_grass'];
    this.wallGroup     = this.physics.add.staticGroup();
    this.jumpableGroup = this.physics.add.staticGroup();
    this.waterTiles    = [];
    for(let r=0;r<H;r++) for(let c=0;c<W;c++) {
      const t = map[r][c];
      const x = c*TILE+TILE/2, y = r*TILE+TILE/2;
      const img = this.add.image(x,y,tileKeys[t]).setDepth(0);
      if(t===SAND)        img.setTint(0xff6622);
      if(t===WATER)       img.setTint(0xff2200);
      if(t===GRAVE_GRASS) img.setTint(0x554433);
      if(t===WALL||t===MOUNTAIN){
        this.physics.add.existing(img,true);
        img.body.setSize(TILE,TILE); img.body.reset(x,y);
        this.wallGroup.add(img);
      } else if(t===TREE||t===WATER){
        this.physics.add.existing(img,true);
        img.body.setSize(TILE,TILE); img.body.reset(x,y);
        this.jumpableGroup.add(img);
      }
      if(t===WATER) this.waterTiles.push(img);
    }
    this.mapData = map;
    window.GameState.mapData = map;
    this.physics.world.setBounds(0,0,W*TILE,H*TILE);
  }

  // ── FROST WASTES MAP ──────────────────────────────────────────────────────

  buildMap_frost() {
    const W = 160, H = 120;
    this.mapWidth  = W;
    this.mapHeight = H;
    this._islandSpawnTile = { x: 140, y: 60 };

    const GRASS = 0, DIRT = 1, WATER = 2, WALL = 3, FLOOR = 4,
          TREE = 5, MOUNTAIN = 6, SAND = 7, GRAVE_GRASS = 8;

    const map = [];
    for(let r=0;r<H;r++) map[r] = new Array(W).fill(GRASS);

    const set = (r,c,t) => {if(r>=0&&r<H&&c>=0&&c<W) map[r][c]=t;};
    const rect = (r0,c0,r1,c1,t) => {for(let r=r0;r<=r1;r++) for(let c=c0;c<=c1;c++) set(r,c,t);};

    // Ice/snow border
    for(let r=0;r<H;r++)
      for(let c=0;c<W;c++)
        if(r<4||r>=H-4||c<4||c>=W-4) map[r][c]=MOUNTAIN;

    // Frozen tundra base — GRAVE_GRASS as snow
    for(let r=4;r<H-4;r++)
      for(let c=4;c<W-4;c++)
        if(Math.random()<0.7) map[r][c]=GRAVE_GRASS;

    // Frozen lake — center (WATER = ice, tinted blue-white)
    rect(40,40,80,120,WATER);
    // Ice cracks (DIRT)
    for(let r=42;r<79;r+=6)
      for(let c=42;c<119;c++)
        if(Math.random()<0.2) map[r][c]=DIRT;

    // Glacial ruins — north-west
    rect(8,8,35,55,FLOOR);
    for(let r=8;r<=35;r++){set(r,8,WALL);set(r,55,WALL);}
    for(let c=8;c<=55;c++){set(8,c,WALL);set(35,c,WALL);}
    set(35,30,FLOOR);set(35,31,FLOOR);
    // Ruin chambers
    rect(10,10,22,28,WALL);set(22,19,FLOOR);
    rect(10,32,22,53,WALL);set(22,42,FLOOR);
    rect(26,10,33,53,WALL);set(26,31,FLOOR);

    // Ice fortress — south (boss lair)
    rect(82,55,112,140,FLOOR);
    for(let r=82;r<=112;r++){set(r,55,WALL);set(r,140,WALL);}
    for(let c=55;c<=140;c++){set(82,c,WALL);set(112,c,WALL);}
    set(82,96,FLOOR);set(82,97,FLOOR);
    // Fortress inner walls
    rect(86,58,100,82,WALL);set(100,70,FLOOR);
    rect(86,90,100,112,WALL);set(100,101,FLOOR);
    rect(103,58,110,112,WALL);set(103,85,FLOOR);

    // Survivor village — east coast
    const VY1=30,VY2=65,VX1=130,VX2=155;
    rect(VY1,VX1,VY2,VX2,FLOOR);
    for(let r=VY1;r<=VY2;r++){set(r,VX1,WALL);set(r,VX2,WALL);}
    for(let c=VX1;c<=VX2;c++){set(VY1,c,WALL);set(VY2,c,WALL);}
    set(VY1,141,FLOOR);set(VY1,142,FLOOR);
    // Huts
    rect(33,133,44,143,WALL);set(44,138,FLOOR);
    rect(48,133,60,143,WALL);set(48,138,FLOOR);
    rect(33,147,44,153,WALL);set(44,150,FLOOR);

    // Dock — east coast (harbor home)
    rect(68,150,80,158,FLOOR);
    for(let c=150;c<=158;c++){set(68,c,WALL);set(80,c,WALL);}
    for(let r=68;r<=80;r++){set(r,158,WALL);}
    set(74,150,FLOOR);set(75,150,FLOOR);

    // Paths
    for(let c=131;c<150;c++){set(48,c,DIRT);set(49,c,DIRT);}  // village to dock
    for(let r=36;r<82;r++){set(r,97,DIRT);set(r,98,DIRT);}    // ruins to fortress
    for(let r=66;r<82;r++){set(r,68,DIRT);set(r,69,DIRT);}    // lake approach

    // Snow trees — sparse
    for(let r=5;r<H-5;r++)
      for(let c=5;c<W-5;c++)
        if(Math.random()<0.025) map[r][c]=TREE;

    // Scattered rocks
    for(let r=5;r<H-5;r++)
      for(let c=5;c<W-5;c++)
        if(Math.random()<0.018) map[r][c]=MOUNTAIN;

    // Render
    const tileKeys = ['tile_grass','tile_dirt','tile_water','tile_wall','tile_floor',
                      'tile_tree','tile_mountain','tile_sand','tile_grave_grass'];
    this.wallGroup     = this.physics.add.staticGroup();
    this.jumpableGroup = this.physics.add.staticGroup();
    this.waterTiles    = [];
    for(let r=0;r<H;r++) for(let c=0;c<W;c++) {
      const t = map[r][c];
      const x = c*TILE+TILE/2, y = r*TILE+TILE/2;
      const img = this.add.image(x,y,tileKeys[t]).setDepth(0);
      if(t===GRASS)       img.setTint(0xddeeff);
      if(t===GRAVE_GRASS) img.setTint(0xeef5ff);
      if(t===WATER)       img.setTint(0x88aadd);
      if(t===DIRT)        img.setTint(0xaabbcc);
      if(t===TREE)        img.setTint(0x99bbcc);
      if(t===WALL||t===MOUNTAIN){
        this.physics.add.existing(img,true);
        img.body.setSize(TILE,TILE); img.body.reset(x,y);
        this.wallGroup.add(img);
      } else if(t===TREE||t===WATER){
        this.physics.add.existing(img,true);
        img.body.setSize(TILE,TILE); img.body.reset(x,y);
        this.jumpableGroup.add(img);
      }
      if(t===WATER) this.waterTiles.push(img);
    }
    this.mapData = map;
    window.GameState.mapData = map;
    this.physics.world.setBounds(0,0,W*TILE,H*TILE);
  }

  // ── THUNDER PEAK MAP ──────────────────────────────────────────────────────

  buildMap_thunder() {
    const W = 160, H = 120;
    this.mapWidth  = W;
    this.mapHeight = H;
    this._islandSpawnTile = { x: 80, y: 110 };

    const GRASS = 0, DIRT = 1, WATER = 2, WALL = 3, FLOOR = 4,
          TREE = 5, MOUNTAIN = 6, SAND = 7, GRAVE_GRASS = 8;

    const map = [];
    for (let r = 0; r < H; r++) map[r] = new Array(W).fill(GRAVE_GRASS);

    const set = (r, c, t) => { if (r>=0&&r<H&&c>=0&&c<W) map[r][c]=t; };
    const rect = (r0,c0,r1,c1,t) => { for(let r=r0;r<=r1;r++) for(let c=c0;c<=c1;c++) set(r,c,t); };

    // Mountain border
    for (let r=0; r<H; r++)
      for (let c=0; c<W; c++)
        if (r<4||r>=H-4||c<4||c>=W-4) map[r][c]=MOUNTAIN;

    // Central thunder plateau — flat stone area
    rect(40, 40, 80, 120, FLOOR);
    for(let r=40;r<=80;r++){set(r,40,WALL);set(r,120,WALL);}
    for(let c=40;c<=120;c++){set(40,c,WALL);set(80,c,WALL);}
    set(80,78,FLOOR);set(80,79,FLOOR);set(80,80,FLOOR); // south entrance
    set(40,78,FLOOR);set(40,79,FLOOR);set(40,80,FLOOR); // north exit to peak

    // Thunder Peak — northern citadel
    rect(10, 55, 38, 105, MOUNTAIN);
    rect(14, 59, 34, 101, WALL);
    rect(16, 61, 32, 99, FLOOR);
    set(38,79,FLOOR);set(38,80,FLOOR); // entrance

    // Inner sanctum — boss chamber
    rect(18, 67, 30, 93, WALL);
    rect(20, 69, 28, 91, FLOOR);
    set(30,79,FLOOR);set(30,80,FLOOR);

    // Storm ruins — west side
    rect(55, 10, 85, 38, WALL);
    rect(57, 12, 83, 36, FLOOR);
    set(55,22,FLOOR);set(55,23,FLOOR);
    // Ruin rooms
    rect(60,14,72,24,WALL);set(72,19,FLOOR);
    rect(60,26,72,34,WALL);set(72,30,FLOOR);
    rect(74,14,83,34,WALL);set(74,24,FLOOR);

    // Storm exile village — south
    const VY1=90,VY2=112,VX1=65,VX2=95;
    rect(VY1,VX1,VY2,VX2,FLOOR);
    for(let r=VY1;r<=VY2;r++){set(r,VX1,WALL);set(r,VX2,WALL);}
    for(let c=VX1;c<=VX2;c++){set(VY1,c,WALL);set(VY2,c,WALL);}
    set(VY1,79,FLOOR);set(VY1,80,FLOOR);
    // Huts
    rect(93,68,103,78,WALL);set(103,73,FLOOR);
    rect(93,82,103,92,WALL);set(103,87,FLOOR);
    rect(105,68,113,92,WALL);set(105,80,FLOOR);

    // Dock — south coast
    rect(113,70,115,90,FLOOR);
    for(let c=70;c<=90;c++){set(113,c,WALL);set(115,c,WALL);}
    set(114,70,WALL);
    rect(115,78,H-4,82,DIRT);

    // Storm lakes — crackling lightning water
    rect(30,130,60,155,WATER);
    rect(35,133,55,152,MOUNTAIN);
    rect(90,10,110,35,WATER);
    rect(93,13,107,32,FLOOR);

    // Dirt paths
    for(let r=81;r<90;r++){set(r,79,DIRT);set(r,80,DIRT);}
    for(let r=83;r<90;r++){set(r,65,DIRT);set(r,66,DIRT);}
    for(let c=90;c<130;c++){set(60,c,DIRT);set(61,c,DIRT);}

    // Scattered mountain boulders
    for(let r=5;r<H-5;r++)
      for(let c=5;c<W-5;c++)
        if(Math.random()<0.018) map[r][c]=MOUNTAIN;

    // Storm craters (WATER tiles)
    [[25,25],[70,145],[100,70],[45,15]].forEach(([r,c]) => {
      for(let dr=-3;dr<=3;dr++) for(let dc=-3;dc<=3;dc++)
        if(dr*dr+dc*dc<=9) set(r+dr,c+dc,WATER);
    });

    // Render
    const tileKeys = ['tile_grass','tile_dirt','tile_water','tile_wall','tile_floor',
                      'tile_tree','tile_mountain','tile_sand','tile_grave_grass'];
    this.wallGroup     = this.physics.add.staticGroup();
    this.jumpableGroup = this.physics.add.staticGroup();
    this.waterTiles    = [];
    for(let r=0;r<H;r++) for(let c=0;c<W;c++) {
      const t = map[r][c];
      const x = c*TILE+TILE/2, y = r*TILE+TILE/2;
      const img = this.add.image(x,y,tileKeys[t]).setDepth(0);
      if(t===GRAVE_GRASS) img.setTint(0x667788);
      if(t===WATER)       img.setTint(0x334466);
      if(t===DIRT)        img.setTint(0x556677);
      if(t===FLOOR)       img.setTint(0x778899);
      if(t===WALL||t===MOUNTAIN){
        this.physics.add.existing(img,true);
        img.body.setSize(TILE,TILE); img.body.reset(x,y);
        this.wallGroup.add(img);
      } else if(t===TREE||t===WATER){
        this.physics.add.existing(img,true);
        img.body.setSize(TILE,TILE); img.body.reset(x,y);
        this.jumpableGroup.add(img);
      }
      if(t===WATER) this.waterTiles.push(img);
    }
    this.mapData = map;
    window.GameState.mapData = map;
    this.physics.world.setBounds(0,0,W*TILE,H*TILE);
  }

  // ─────────────────── PLAYER ─────────────────────────────────────────────

  buildPlayer() {
    // Spawn position depends on island
    const st = this._islandSpawnTile || { x: 121, y: 76 };
    const spawnX = st.x * TILE + TILE/2;
    const spawnY = st.y * TILE + TILE/2;
    window.GameState.spawnX = spawnX;
    window.GameState.spawnY = spawnY;

    if (!window.GameState.checkpoint) {
      window.GameState.checkpoint = { x: spawnX, y: spawnY };
    }

    const playerKey = window.GBA_PLAYER || 'player';
    this.player = this.physics.add.sprite(
      window.GameState.playerX || spawnX,
      window.GameState.playerY || spawnY,
      playerKey
    ).setDepth(10).setCollideWorldBounds(true);
    this.player.setScale(1.5);
    this.player.body.setSize(22, 22);
    if (window.GBA_PLAYER) this.player.play('player_idle');

    this.wallCollider = this.physics.add.collider(this.player, this.wallGroup);
    // jumpableCollider uses a process callback so disabling mid-jump is instant and reliable
    this.jumpableCollider = this.jumpableGroup
      ? this.physics.add.collider(
          this.player, this.jumpableGroup,
          null,                          // onCollide
          () => !this.isJumping          // processCallback: return false = skip collision while jumping
        )
      : null;

    // ledgeCollider — blocks ledge tiles unless the player is jumping up from below
    this.ledgeCollider = this.ledgeGroup
      ? this.physics.add.collider(
          this.player, this.ledgeGroup,
          null,
          (player, tile) => {
            // Allow pass-through when jumping AND attempting to climb elevation
            if (this.isJumping && this._climbingLedge) return false;
            // Allow pass-through when already at same elevation as the ledge's target
            const tileElev = this.elevMap?.[tile.elevRow]?.[tile.elevCol] ?? 0;
            if ((this.playerElevation || 0) >= tileElev) return false;
            return true;
          }
        )
      : null;

    // Jump shadow (hidden by default)
    this.jumpShadow = this.add.ellipse(0, 0, 22, 10, 0x000000, 0.45).setDepth(9).setVisible(false);

    this.playerLabel = this.add.text(0, 0, 'YOU', {
      fontSize: '10px', fontFamily: 'monospace',
      color: '#ffffff', stroke: '#000', strokeThickness: 2
    }).setDepth(11).setOrigin(0.5);

    // Set initial elevation from the spawn tile's elevMap value
    const sr = Math.floor((window.GameState.playerY || spawnY) / TILE);
    const sc = Math.floor((window.GameState.playerX || spawnX) / TILE);
    this.playerElevation = this.elevMap?.[sr]?.[sc] ?? 0;
    this._rebuildElevationColliders();
    // Sync depth immediately
    this.player.setDepth(10 + this.playerElevation * 5);
  }

  // ─────────────────── ELEVATION ──────────────────────────────────────────

  _rebuildElevationColliders() {
    if (!this.elevatedTileImages || !this.elevMap) return;
    const pe = this.playerElevation || 0;
    this.elevatedTileImages.forEach(img => {
      if (!img.body) return;
      const tileElev = this.elevMap[img.elevRow]?.[img.elevCol] ?? 0;
      const t = this.mapData?.[img.elevRow]?.[img.elevCol];
      if (t === 9 /* CLIFF */ || t === 10 /* LEDGE */) {
        img.body.enable = (pe < tileElev);
      } else {
        // Elevated grass: block only when player is below that elevation
        img.body.enable = (tileElev > pe);
      }
      // Also update the enemy-only shadow body if it exists
      if (img._enemyShadowBody) img._enemyShadowBody.enable = true; // always on for enemies
    });
  }

  // ─────────────────── ENEMIES ────────────────────────────────────────────

  buildEnemies() {
    const island = window.GameState.currentIsland || 0;
    if (island === 1) { this.buildEnemies_inferno(); return; }
    if (island === 2) { this.buildEnemies_frost();   return; }
    if (island === 3) { this.buildEnemies_thunder(); return; }
    this.buildEnemies_home();
  }

  buildEnemies_home() {
    this.enemyGroup = this.physics.add.group();

    const TINT = { weak: 0x44ff88, normal: 0x4488ff, hard: 0xff3322 };
    const E = window.ENEMIES;

    const spawns = [
      // Weak — near start, north wilderness
      { x:  28*TILE, y:  28*TILE, ei: 0 }, { x:  44*TILE, y:  14*TILE, ei: 0 },
      { x:  16*TILE, y:  14*TILE, ei: 0 }, { x:  50*TILE, y:  28*TILE, ei: 1 },
      { x:  24*TILE, y:  40*TILE, ei: 1 }, { x:  36*TILE, y:  36*TILE, ei: 0 },
      { x:  16*TILE, y:  56*TILE, ei: 2 }, { x:  40*TILE, y:  50*TILE, ei: 2 },
      { x:  55*TILE, y:  44*TILE, ei: 0 }, { x:  70*TILE, y:  36*TILE, ei: 1 },

      // Normal — mid-map
      { x:  56*TILE, y:  76*TILE, ei: 3 }, { x:  52*TILE, y:  90*TILE, ei: 3 },
      { x:  56*TILE, y: 110*TILE, ei: 4 }, { x:  54*TILE, y: 130*TILE, ei: 4 },
      { x: 180*TILE, y: 110*TILE, ei: 3 }, { x: 190*TILE, y: 116*TILE, ei: 4 },
      { x: 200*TILE, y: 104*TILE, ei: 5 }, { x: 172*TILE, y:  58*TILE, ei: 4 },
      { x: 186*TILE, y:  50*TILE, ei: 5 }, { x: 140*TILE, y:  72*TILE, ei: 3 },
      { x: 158*TILE, y:  80*TILE, ei: 4 }, { x: 148*TILE, y: 118*TILE, ei: 5 },

      // Hard — dungeon, swamp, far desert, graveyard
      { x: 200*TILE, y:  14*TILE, ei: 6 }, { x: 216*TILE, y:  28*TILE, ei: 6 },
      { x: 224*TILE, y:  16*TILE, ei: 7 }, { x: 210*TILE, y:  36*TILE, ei: 7 },
      { x:  22*TILE, y: 156*TILE, ei: 6 }, { x:  30*TILE, y: 164*TILE, ei: 7 },
      { x:  40*TILE, y: 152*TILE, ei: 8 }, { x:  16*TILE, y: 170*TILE, ei: 8 },
      { x: 230*TILE, y:  80*TILE, ei: 7 }, { x: 240*TILE, y:  90*TILE, ei: 8 },
      { x: 260*TILE, y: 110*TILE, ei: 6 }, { x: 250*TILE, y: 130*TILE, ei: 8 },
      { x: 165*TILE, y: 160*TILE, ei: 8 }, { x: 175*TILE, y: 170*TILE, ei: 7 },
      { x: 168*TILE, y: 180*TILE, ei: 6 }, { x: 185*TILE, y: 160*TILE, ei: 7 },
      // Dungeon 2
      { x:  22*TILE, y:  10*TILE, ei: 6 }, { x:  38*TILE, y:   9*TILE, ei: 7 },

      // Crystal Cavern — hard enemies + final boss
      { x: 240*TILE, y: 165*TILE, ei: 6 }, { x: 258*TILE, y: 170*TILE, ei: 7 },
      { x: 270*TILE, y: 162*TILE, ei: 8 }, { x: 282*TILE, y: 168*TILE, ei: 6 },
      { x: 248*TILE, y: 180*TILE, ei: 7 }, { x: 265*TILE, y: 185*TILE, ei: 8 },
      { x: 280*TILE, y: 178*TILE, ei: 7 }, { x: 295*TILE, y: 184*TILE, ei: 8 },

      // Eastern Harbor — normal to hard
      { x: 290*TILE, y:  96*TILE, ei: 4 }, { x: 298*TILE, y: 110*TILE, ei: 5 },
      { x: 290*TILE, y: 120*TILE, ei: 6 },

      // Volcano Peak — hard to boss
      { x: 263*TILE, y:  15*TILE, ei: 7 }, { x: 272*TILE, y:  16*TILE, ei: 8 },
      { x: 260*TILE, y:  24*TILE, ei: 8 },

      // Village 4 surroundings — normal
      { x: 213*TILE, y: 160*TILE, ei: 4 }, { x: 220*TILE, y: 158*TILE, ei: 5 },

      // Bosses
      { x: 220*TILE, y:  25*TILE, ei: 9,  spawnId: 'boss_dungeon1'  },
      { x:  30*TILE, y:  11*TILE, ei: 10, spawnId: 'boss_dungeon2'  },
      { x: 290*TILE, y: 120*TILE, ei: 11, spawnId: 'boss_desert'    },
      { x: 170*TILE, y: 174*TILE, ei:  9, spawnId: 'boss_graveyard' },
      { x:  24*TILE, y: 168*TILE, ei: 10, spawnId: 'boss_swamp'     },
      // Crystal Cavern final boss
      { x: 298*TILE, y: 188*TILE, ei: 11, spawnId: 'boss_cavern'    },
      // Volcano Peak boss
      { x: 265*TILE, y:  17*TILE, ei:  9, spawnId: 'boss_volcano'   },
    ];

    spawns.forEach(sp => {
      if (sp.x >= this.mapWidth * TILE || sp.y >= this.mapHeight * TILE) return;
      const enemyDef = E[sp.ei];
      if (!enemyDef) return;
      const sprite = this.physics.add.sprite(sp.x, sp.y, enemyDef.sprite)
        .setDepth(9).setCollideWorldBounds(true);
      sprite.enemyData    = enemyDef;
      sprite.spawnId      = sp.spawnId || null;
      sprite.wanderTimer  = Phaser.Math.Between(500, 2500);
      sprite.setScale(1.2);
      sprite.body.setSize(22, 22);

      const diff = enemyDef.difficulty;
      if (diff === 'boss') {
        this.tweens.add({
          targets: sprite, tint: { from: 0x220033, to: 0xaa00ff },
          duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });
      } else {
        if (TINT[diff]) sprite.setTint(TINT[diff]);
      }
      if (enemyDef.sprite && enemyDef.sprite.startsWith('char_')) {
        const walkKey = enemyDef.sprite + '_walk';
        if (this.anims.exists(walkKey)) sprite.play(walkKey);
      }
      this.enemyGroup.add(sprite);
    });

    this.physics.add.collider(this.enemyGroup, this.wallGroup);
    this.physics.add.collider(this.enemyGroup, this.enemyGroup);
    if (this.elevEnemyGroup) this.physics.add.collider(this.enemyGroup, this.elevEnemyGroup);

    this.physics.add.overlap(this.player, this.enemyGroup, (player, enemy) => {
      if (this.battleCooldown || this._dialogueActive) return;
      const deck = window.GameState.playerDeck || [];
      if (deck.length !== 30) {
        this.showMessage('Your deck must have exactly 30 cards! (currently: ' + deck.length + '/30)', '#ff4444');
        return;
      }
      this.battleCooldown = true;
      window.GameState.playerX = player.x;
      window.GameState.playerY = player.y;
      window.GameState.defeatedEnemy = enemy;
      window.GameState.currentEnemySpawnId = enemy.spawnId || null;

      this.physics.pause();
      this.cameras.main.flash(250, 200, 0, 0);
      this.cameras.main.shake(300, 0.008);
      this.time.delayedCall(300, () => {
        this.scene.launch('BattleScene', { enemy: this._scaleEnemy(enemy.enemyData) });
        this.scene.pause();
      });
    });
  }

  // Scale enemy HP based on player level (non-bosses only, slight increase)
  _scaleEnemy(enemyDef) {
    const lv = window.GameState?.playerLevel || 1;
    if (lv <= 2 || enemyDef.isBoss) return enemyDef;
    // +5% HP per level above 2, capped at +60% for lv 14+
    const mult = Math.min(1 + (lv - 2) * 0.05, 1.60);
    return { ...enemyDef, life: Math.round(enemyDef.life * mult) };
  }

  // ── INFERNO ISLAND ENEMIES ───────────────────────────────────────────────

  buildEnemies_inferno() {
    this.enemyGroup = this.physics.add.group();
    const TINT = { weak: 0xff8844, normal: 0xff4422, hard: 0xff1100 };
    const E = window.ENEMIES;
    // Enemy indices: inf1=12, inf2=13, inf3=14, inf4=15, inf5=16, inf6=17, inf7(boss)=18
    const inf = (n) => E[11 + n] || E[8];

    const spawns = [
      // Weak — starting area near dock
      { x: 22*TILE, y: 50*TILE, ei_fn: () => inf(1) },
      { x: 28*TILE, y: 45*TILE, ei_fn: () => inf(1) },
      { x: 16*TILE, y: 42*TILE, ei_fn: () => inf(2) },
      { x: 30*TILE, y: 55*TILE, ei_fn: () => inf(2) },
      // Normal — lava plains
      { x: 55*TILE, y: 30*TILE, ei_fn: () => inf(3) },
      { x: 60*TILE, y: 40*TILE, ei_fn: () => inf(3) },
      { x: 75*TILE, y: 25*TILE, ei_fn: () => inf(4) },
      { x: 80*TILE, y: 38*TILE, ei_fn: () => inf(4) },
      { x: 42*TILE, y: 28*TILE, ei_fn: () => inf(3) },
      // Hard — caldera approaches
      { x: 100*TILE, y: 40*TILE, ei_fn: () => inf(5) },
      { x: 115*TILE, y: 50*TILE, ei_fn: () => inf(5) },
      { x: 108*TILE, y: 30*TILE, ei_fn: () => inf(6) },
      { x: 122*TILE, y: 36*TILE, ei_fn: () => inf(6) },
      { x: 130*TILE, y: 28*TILE, ei_fn: () => inf(5) },
      // Boss — inside caldera
      { x: 130*TILE, y: 22*TILE, ei_fn: () => inf(7), spawnId: 'boss_inferno' },
    ];

    this._spawnEnemyList(spawns, TINT);
  }

  // ── FROST WASTES ENEMIES ──────────────────────────────────────────────────

  buildEnemies_frost() {
    this.enemyGroup = this.physics.add.group();
    const TINT = { weak: 0x88ccff, normal: 0x4488ff, hard: 0x2244cc };
    const E = window.ENEMIES;
    // fr1=19, fr2=20, fr3=21, fr4=22, fr5=23, fr6=24, fr7(boss)=25
    const fr = (n) => E[18 + n] || E[8];

    const spawns = [
      // Weak — east coast near dock
      { x: 138*TILE, y: 55*TILE, ei_fn: () => fr(1) },
      { x: 144*TILE, y: 48*TILE, ei_fn: () => fr(1) },
      { x: 148*TILE, y: 62*TILE, ei_fn: () => fr(2) },
      { x: 135*TILE, y: 40*TILE, ei_fn: () => fr(2) },
      // Normal — frozen tundra
      { x: 90*TILE, y: 30*TILE, ei_fn: () => fr(3) },
      { x: 80*TILE, y: 25*TILE, ei_fn: () => fr(3) },
      { x: 75*TILE, y: 38*TILE, ei_fn: () => fr(4) },
      { x: 100*TILE, y: 22*TILE, ei_fn: () => fr(4) },
      { x: 60*TILE, y: 30*TILE, ei_fn: () => fr(3) },
      // Hard — ruins and lake edge
      { x: 35*TILE, y: 20*TILE, ei_fn: () => fr(5) },
      { x: 45*TILE, y: 30*TILE, ei_fn: () => fr(5) },
      { x: 22*TILE, y: 25*TILE, ei_fn: () => fr(6) },
      { x: 30*TILE, y: 15*TILE, ei_fn: () => fr(6) },
      { x: 58*TILE, y: 20*TILE, ei_fn: () => fr(5) },
      // Boss — ice fortress throne room
      { x: 97*TILE, y: 97*TILE, ei_fn: () => fr(7), spawnId: 'boss_frost' },
    ];

    this._spawnEnemyList(spawns, TINT);
  }

  // ── THUNDER PEAK ENEMIES ──────────────────────────────────────────────────

  buildEnemies_thunder() {
    this.enemyGroup = this.physics.add.group();
    const TINT = { weak: 0xffee44, normal: 0xaadd00, hard: 0x66aaff };
    const E = window.ENEMIES;
    // th1=26, th2=27, th3=28, th4=29, th5=30, th6=31, th7(boss)=32
    const th = (n) => E[25 + n] || E[9];

    const spawns = [
      // Weak — south village / plateau entrance
      { x:  72*TILE, y: 105*TILE, ei_fn: () => th(1) },
      { x:  88*TILE, y: 100*TILE, ei_fn: () => th(1) },
      { x:  75*TILE, y:  95*TILE, ei_fn: () => th(2) },
      { x:  85*TILE, y:  90*TILE, ei_fn: () => th(2) },
      // Normal — central plateau
      { x:  60*TILE, y:  60*TILE, ei_fn: () => th(3) },
      { x:  80*TILE, y:  55*TILE, ei_fn: () => th(3) },
      { x: 100*TILE, y:  60*TILE, ei_fn: () => th(4) },
      { x:  90*TILE, y:  70*TILE, ei_fn: () => th(3) },
      // Normal — storm ruins (west)
      { x:  25*TILE, y:  65*TILE, ei_fn: () => th(3) },
      { x:  30*TILE, y:  75*TILE, ei_fn: () => th(4) },
      // Hard — citadel approach
      { x:  70*TILE, y:  45*TILE, ei_fn: () => th(5) },
      { x:  90*TILE, y:  42*TILE, ei_fn: () => th(5) },
      { x:  80*TILE, y:  35*TILE, ei_fn: () => th(6) },
      { x:  75*TILE, y:  30*TILE, ei_fn: () => th(6) },
      // Boss — inner sanctum
      { x:  80*TILE, y:  24*TILE, ei_fn: () => th(7), spawnId: 'boss_thunder' },
    ];

    this._spawnEnemyList(spawns, TINT);
  }

  // ── Shared enemy spawn helper ─────────────────────────────────────────────

  _spawnEnemyList(spawns, TINT) {
    spawns.forEach(sp => {
      const enemyDef = sp.ei_fn ? sp.ei_fn() : window.ENEMIES[sp.ei];
      if (!enemyDef) return;
      if (sp.x >= this.mapWidth * TILE || sp.y >= this.mapHeight * TILE) return;
      // Don't spawn on blocking tiles (wall=3, tree=5, mountain=6, water=2)
      const tr = Math.floor(sp.y / TILE), tc = Math.floor(sp.x / TILE);
      const tt = this.mapData?.[tr]?.[tc] ?? 0;
      if (tt === 2 || tt === 3 || tt === 5 || tt === 6) return;
      const sprite = this.physics.add.sprite(sp.x, sp.y, enemyDef.sprite)
        .setDepth(9).setCollideWorldBounds(true);
      sprite.enemyData   = enemyDef;
      sprite.spawnId     = sp.spawnId || null;
      sprite.wanderTimer = Phaser.Math.Between(500, 2500);
      sprite.setScale(1.2);
      sprite.body.setSize(22, 22);

      const diff = enemyDef.difficulty;
      if (diff === 'boss') {
        this.tweens.add({
          targets: sprite, alpha: 0.7, scaleX: 1.35, scaleY: 1.35,
          duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });
        sprite.setTint(0xff0000);
      } else {
        const tint = TINT[diff];
        if (tint) sprite.setTint(tint);
      }

      this.enemyGroup.add(sprite);
    });

    // Shared colliders
    this.physics.add.collider(this.enemyGroup, this.wallGroup);
    if (this.jumpableGroup) this.physics.add.collider(this.enemyGroup, this.jumpableGroup);
    if (this.elevEnemyGroup) this.physics.add.collider(this.enemyGroup, this.elevEnemyGroup);
    this.physics.add.collider(this.enemyGroup, this.enemyGroup);
    this.physics.add.overlap(this.player, this.enemyGroup, (player, enemy) => {
      if (this.battleCooldown || this._dialogueActive) return;
      const deck = window.GameState.playerDeck || [];
      if (deck.length !== 30) {
        this.showMessage('Your deck must have exactly 30 cards! (currently: ' + deck.length + '/30)', '#ff4444');
        return;
      }
      this.battleCooldown = true;
      window.GameState.playerX = player.x;
      window.GameState.playerY = player.y;
      window.GameState.defeatedEnemy = enemy;
      window.GameState.currentEnemy  = enemy.enemyData;
      window.GameState.currentEnemySpawnId = enemy.spawnId || null;
      this.physics.pause();
      this.cameras.main.flash(250, 200, 0, 0);
      this.cameras.main.shake(300, 0.008);
      this.time.delayedCall(300, () => {
        this.scene.launch('BattleScene', { enemy: this._scaleEnemy(enemy.enemyData) });
        this.scene.pause();
      });
    });
  }

  // ─────────────────── CAMERA ─────────────────────────────────────────────

  buildCamera() {
    this.cameras.main.setBounds(0, 0, this.mapWidth * TILE, this.mapHeight * TILE);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.2);
    const island = window.GameState.currentIsland || 0;
    const bgColors = ['#0a0a12', '#1a0800', '#050a14'];
    this.cameras.main.setBackgroundColor(bgColors[island] || '#0a0a12');
  }

  // ─────────────────── CONTROLS ───────────────────────────────────────────

  buildControls() {
    this.cursors = this.input.keyboard.addKeys({
      up:     Phaser.Input.Keyboard.KeyCodes.W,
      down:   Phaser.Input.Keyboard.KeyCodes.S,
      left:   Phaser.Input.Keyboard.KeyCodes.A,
      right:  Phaser.Input.Keyboard.KeyCodes.D,
      up2:    Phaser.Input.Keyboard.KeyCodes.UP,
      down2:  Phaser.Input.Keyboard.KeyCodes.DOWN,
      left2:  Phaser.Input.Keyboard.KeyCodes.LEFT,
      right2: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      space:  Phaser.Input.Keyboard.KeyCodes.SPACE,
      fKey:   Phaser.Input.Keyboard.KeyCodes.F,
    });
    this.input.keyboard.on('keydown-M',   () => this.openMenu());
    this.input.keyboard.on('keydown-ESC', () => this.openMenu());
  }

  openMenu() {
    if (this.battleCooldown) return;
    window.GameState.playerX = this.player.x;
    window.GameState.playerY = this.player.y;
    this.physics.pause();
    this.scene.launch('MenuScene');
    this.scene.pause();
  }

  // ─────────────────── CAMPFIRES ──────────────────────────────────────────

  buildCampfires() {
    const island = window.GameState.currentIsland || 0;
    this.campfires = [];

    let positions;
    if (island === 1) {
      positions = [
        { x: 20*32+16, y: 62*32+16 },   // dock village
        { x: 42*32+16, y: 60*32+16 },   // fortress approach
        { x: 98*32+16, y: 60*32+16 },   // caldera approach
        { x: 128*32+16, y: 40*32+16 },  // caldera camp
      ];
    } else if (island === 2) {
      positions = [
        { x: 140*32+16, y: 48*32+16 },  // east village
        { x: 80*32+16,  y: 24*32+16 },  // frozen plains
        { x: 50*32+16,  y: 22*32+16 },  // ruins approach
        { x: 96*32+16,  y: 85*32+16 },  // ice fortress approach
      ];
    } else {
      positions = [
      { x: 121*32+16, y: 76*32+16  },  // just north of main town (spawn area)
      { x: 100*32+16, y: 109*32+16 },  // inside main town west
      { x: 140*32+16, y: 109*32+16 },  // inside main town east
      { x: 197*32+16, y: 72*32+16  },  // village 2 entrance
      { x: 100*32+16, y: 171*32+16 },  // village 3 south
      { x: 120*32+16, y: 170*32+16 },  // village 3 east
      { x: 188*32+16, y: 46*32+16  },  // dungeon 1 approach
      { x:  30*32+16, y: 17*32+16  },  // dungeon 2 approach (after pass)
      { x:  33*32+16, y: 158*32+16 },  // swamp path midpoint
      { x: 196*32+16, y: 105*32+16 },  // desert edge
      { x: 169*32+16, y: 153*32+16 },  // graveyard path
      { x: 250*32+16, y:  92*32+16 },  // deep desert outpost
      { x:  67*32+16, y:  91*32+16 },  // west river bridge north
      { x:  67*32+16, y: 150*32+16 },  // west river bridge south
      // NEW AREAS
      { x: 265*32+16, y: 160*32+16 },  // Crystal Cavern entrance
      { x: 265*32+16, y: 175*32+16 },  // Crystal Cavern mid
      { x: 290*32+16, y: 106*32+16 },  // Eastern Harbor
      { x: 263*32+16, y:  18*32+16 },  // Volcano Peak interior
      { x: 214*32+16, y: 172*32+16 },  // Village 4 plaza
      ];
    }

    positions.forEach(pos => {
      const sprite = this.add.sprite(pos.x, pos.y, 'campfire')
        .setDepth(8).setScale(1.0);

      // Gentle flicker tween
      this.tweens.add({
        targets: sprite, scaleX: 1.05, scaleY: 0.95,
        duration: 180, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });

      this.campfires.push(sprite);
    });
  }

  // ─────────────────── CHESTS ─────────────────────────────────────────────

  buildChests() {
    this.chests = [];
    this._openedChests = new Set();
    const island = window.GameState.currentIsland || 0;

    // Island-specific rare card pools
    const RARE_CARDS_HOME   = ['demon_019','demon_020','demon_021','demon_022','demon_023',
                                'demon_030','demon_025','demon_031','demon_032','demon_033'];
    const RARE_CARDS_INFERNO = ['demon_108','demon_109','demon_110','demon_111','spell_059',
                                 'demon_019','demon_020','demon_030','demon_025','demon_021'];
    const RARE_CARDS_FROST   = ['demon_114','demon_115','demon_116','demon_117','spell_060',
                                 'spell_061','demon_019','demon_020','demon_030','demon_025'];
    const RARE_CARDS = island===1 ? RARE_CARDS_INFERNO : island===2 ? RARE_CARDS_FROST : RARE_CARDS_HOME;

    let positions;
    if (island === 1) {
      positions = [
        { x: 12*32+16, y: 43*32+16 }, { x: 48*32+16, y: 42*32+16 },
        { x: 14*32+16, y: 77*32+16 }, { x: 48*32+16, y: 78*32+16 },
        { x: 115*32+16, y: 15*32+16 }, { x: 144*32+16, y: 16*32+16 },
        { x: 130*32+16, y: 28*32+16 },
      ];
    } else if (island === 2) {
      positions = [
        { x: 10*32+16, y: 12*32+16 }, { x: 52*32+16, y: 10*32+16 },
        { x: 10*32+16, y: 32*32+16 }, { x: 52*32+16, y: 32*32+16 },
        { x: 58*32+16, y: 108*32+16 }, { x: 138*32+16, y: 108*32+16 },
        { x: 96*32+16, y: 110*32+16 },
      ];
    } else {
    // Home island chests
    positions = [
      // Z=3 peak hill (right of spawn)
      { x: 132*32+16, y: 55*32+16 },
      // Dungeon 1 corners
      { x: 192*32+16, y:  10*32+16 }, { x: 228*32+16, y:  10*32+16 },
      { x: 192*32+16, y:  40*32+16 }, { x: 228*32+16, y:  40*32+16 },
      // Dungeon 2 corners
      { x:  14*32+16, y:   9*32+16 }, { x:  48*32+16, y:   9*32+16 },
      // Deep desert ruins
      { x: 212*32+16, y:  90*32+16 }, { x: 236*32+16, y:  90*32+16 },
      { x: 252*32+16, y: 130*32+16 }, { x: 274*32+16, y: 148*32+16 },
      // Graveyard crypts
      { x: 156*32+16, y: 155*32+16 }, { x: 162*32+16, y: 186*32+16 },
      { x: 192*32+16, y: 155*32+16 }, { x: 178*32+16, y: 176*32+16 },
      // Swamp hidden corners
      { x:  10*32+16, y: 176*32+16 }, { x:  48*32+16, y: 174*32+16 },
      // Far north behind mountains
      { x:  15*32+16, y:   9*32+16 }, { x:  44*32+16, y:   9*32+16 },
      // Desert oasis
      { x: 270*32+16, y:  94*32+16 },
      // Remote north-east wilderness
      { x: 280*32+16, y:  48*32+16 },
      // NEW: Crystal Cavern
      { x: 235*32+16, y: 160*32+16 }, { x: 280*32+16, y: 165*32+16 },
      { x: 260*32+16, y: 182*32+16 }, { x: 298*32+16, y: 175*32+16 },
      { x: 300*32+16, y: 185*32+16 },
      // NEW: Eastern Harbor
      { x: 288*32+16, y:  94*32+16 }, { x: 295*32+16, y: 125*32+16 },
      // NEW: Volcano Peak
      { x: 257*32+16, y:  14*32+16 }, { x: 270*32+16, y:  14*32+16 },
      // NEW: Village 4 area
      { x: 204*32+16, y: 170*32+16 }, { x: 225*32+16, y: 190*32+16 },
    ];
    } // end island === 0

    positions.forEach((pos, idx) => {
      const sprite = this.add.sprite(pos.x, pos.y, 'chest')
        .setDepth(8).setScale(0.9);
      sprite.chestIndex = idx;
      sprite.rareCards  = RARE_CARDS;
      this.chests.push(sprite);
    });
  }

  // ─────────────────── HORSES ─────────────────────────────────────────────

  buildHorses() {
    this.horses       = [];
    this.mountedHorse = null;
    // No horses on remote islands
    if ((window.GameState.currentIsland || 0) !== 0) return;

    const positions = [
      { x:  90*32+16, y:  60*32+16 },  // west field
      { x:  40*32+16, y:  70*32+16 },  // north-west pasture
      { x: 150*32+16, y:  55*32+16 },  // north-east meadow
      { x: 100*32+16, y: 145*32+16 },  // south of main town
      { x:  70*32+16, y: 145*32+16 },  // south-west clearing
      { x: 140*32+16, y: 144*32+16 },  // south-east clearing
    ];

    positions.forEach(pos => {
      const sprite = this.add.sprite(pos.x, pos.y, 'horse')
        .setDepth(8).setScale(1.1);
      sprite.isMounted    = false;
      sprite.wanderTimer  = Phaser.Math.Between(3000, 7000);
      sprite.baseX        = pos.x;
      sprite.baseY        = pos.y;
      this.horses.push(sprite);
    });
  }

  // ─────────────────── NPCS ───────────────────────────────────────────────

  buildNPCs() {
    this.npcs = [];
    if (!window.QUESTS) return;
    const currentIsland = window.GameState.currentIsland || 0;

    // Deduplicate NPCs by pixel position (some quests share an NPC)
    const placed = new Map();

    // Only spawn NPCs belonging to this island
    window.QUESTS.filter(q => (q.island ?? 0) === currentIsland).forEach(quest => {
      const key = quest.npcTileX + ',' + quest.npcTileY;
      if (placed.has(key)) {
        // Add this quest to the existing NPC
        placed.get(key).questIds.push(quest.id);
        return;
      }
      const px = quest.npcTileX * TILE + TILE/2;
      const py = quest.npcTileY * TILE + TILE/2;

      const sprite = this.add.sprite(px, py, 'npc').setDepth(10).setScale(1.1);

      // Gentle bob animation
      this.tweens.add({
        targets: sprite, y: py - 4,
        duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });

      // Name label
      const label = this.add.text(px, py - 26, quest.npc, {
        fontSize: '9px', fontFamily: 'monospace',
        color: '#cc99ff', stroke: '#000', strokeThickness: 2,
        backgroundColor: '#00000066', padding: { x: 3, y: 1 },
      }).setDepth(11).setOrigin(0.5);

      // Exclamation mark for active quests
      const marker = this.add.text(px + 12, py - 22, '!', {
        fontSize: '16px', fontFamily: 'monospace', fontStyle: 'bold',
        color: '#ffdd00', stroke: '#000', strokeThickness: 3,
      }).setDepth(12).setOrigin(0.5).setVisible(false);
      this.tweens.add({
        targets: marker, y: py - 28, alpha: 0.6,
        duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });

      const npcObj = { sprite, label, marker, questIds: [quest.id], px, py };
      this.npcs.push(npcObj);
      placed.set(key, npcObj);
    });

    // Periodic marker refresh
    this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => {
        this.npcs.forEach(n => {
          const hasActive = n.questIds.some(qid => {
            const s = window.GameState.questProgress?.[qid];
            if (!s) return false;
            if (s.status === 'active' || s.status === 'complete') return true;
            // Show ! for locked quests where prereq is now met (ready to unlock)
            if (s.status === 'locked') {
              const q = window.QUEST_MAP[qid];
              return !q?.prereq ||
                window.GameState.questProgress?.[q.prereq]?.status === 'claimed';
            }
            return false;
          });
          n.marker.setVisible(hasActive);
        });
      },
    });

    // ── Quest HUD tracker (top-right, fixed to camera) ───────────────────
    this._buildQuestHUD();
  }

  _buildQuestHUD() {
    // Destroy old HUD if rebuilding
    if (this._questHUDObjs) this._questHUDObjs.forEach(o => o.destroy());
    this._questHUDObjs = [];

    const currentIsland = window.GameState.currentIsland || 0;
    const qs = window.GameState.questProgress || {};

    // Find first active quest on this island (complete > active priority)
    let trackedQuest = null;
    for (const q of (window.QUESTS || [])) {
      if ((q.island ?? 0) !== currentIsland) continue;
      const s = qs[q.id];
      if (!s) continue;
      if (s.status === 'complete') { trackedQuest = q; break; }
      if (s.status === 'active' && !trackedQuest) trackedQuest = q;
    }
    if (!trackedQuest) return;

    const state = qs[trackedQuest.id];
    const obj = trackedQuest.objective;
    const needed = obj.count || 1;
    const prog = Math.min(state.progress, needed);
    const isComplete = state.status === 'complete';

    // Fixed HUD elements (scrollFactor 0)
    const HX = 760, HY = 14, HW = 188, HH = 42;
    const hudBg = this.add.graphics().setScrollFactor(0).setDepth(98);
    hudBg.fillStyle(0x0a0010, 0.85); hudBg.fillRoundedRect(HX, HY, HW, HH, 5);
    hudBg.lineStyle(1, isComplete ? 0xffd700 : 0x443366); hudBg.strokeRoundedRect(HX, HY, HW, HH, 5);

    const titleT = this.add.text(HX + 6, HY + 5, (isComplete ? '★ ' : '⚔ ') + trackedQuest.name, {
      fontSize: '9px', fontFamily: 'monospace', fontStyle: 'bold',
      color: isComplete ? '#ffd700' : '#ccaaff',
    }).setScrollFactor(0).setDepth(99);

    const progStr = obj.type.startsWith('kill_boss') ?
      (prog >= 1 ? '1/1' : '0/1') : prog + '/' + needed;
    const statusStr = isComplete ? 'Return to ' + trackedQuest.npc : progStr;
    const subT = this.add.text(HX + 6, HY + 18, statusStr, {
      fontSize: '8px', fontFamily: 'monospace', color: isComplete ? '#ffa844' : '#8877aa',
    }).setScrollFactor(0).setDepth(99);

    // Mini progress bar
    const barGfx = this.add.graphics().setScrollFactor(0).setDepth(99);
    const barW = HW - 12, barFill = isComplete ? barW : Math.round(barW * prog / needed);
    barGfx.fillStyle(0x221133); barGfx.fillRect(HX + 6, HY + 32, barW, 4);
    barGfx.fillStyle(isComplete ? 0xffd700 : 0x8844ff); barGfx.fillRect(HX + 6, HY + 32, barFill, 4);

    this._questHUDObjs = [hudBg, titleT, subT, barGfx];
  }

  // ─────────────────── BLACKSMITH ─────────────────────────────────────────

  buildBlacksmith() {
    // Only on home island
    if ((window.GameState.currentIsland || 0) !== 0) return;

    const bx = 124 * TILE + TILE/2;
    const by = 107 * TILE + TILE/2;

    const sprite = this.add.sprite(bx, by, 'npc').setDepth(10).setScale(1.1).setTint(0xff8822);
    this.tweens.add({ targets: sprite, y: by - 4, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.add.text(bx, by - 26, 'Blacksmith', {
      fontSize: '9px', fontFamily: 'monospace',
      color: '#ff8822', stroke: '#000', strokeThickness: 2,
      backgroundColor: '#00000066', padding: { x: 3, y: 1 },
    }).setDepth(11).setOrigin(0.5);

    this.add.text(bx, by - 38, '[F]', {
      fontSize: '8px', fontFamily: 'monospace',
      color: '#888888', stroke: '#000', strokeThickness: 2,
    }).setDepth(11).setOrigin(0.5);

    this.blacksmithPos = { x: bx, y: by };
  }

  _showBlacksmithUI() {
    if (this._dialogueActive) return;
    this._dialogueActive = true;

    const cx = this.cameras.main.scrollX + 480;
    const cy = this.cameras.main.scrollY + 320;
    const W = 820, H = 480;
    const objs = [];
    const add = o => { objs.push(o); return o; };

    add(this.add.graphics().setDepth(290))
      .fillStyle(0x0d0810, 0.97).fillRoundedRect(cx - W/2, cy - H/2, W, H, 10)
      .lineStyle(2, 0xff6600).strokeRoundedRect(cx - W/2, cy - H/2, W, H, 10);

    add(this.add.text(cx, cy - H/2 + 16, 'BLACKSMITH — CARD FORGE', {
      fontSize: '18px', fontFamily: 'monospace', fontStyle: 'bold',
      color: '#ff8822', stroke: '#000', strokeThickness: 4
    }).setDepth(291).setOrigin(0.5, 0));

    add(this.add.text(cx, cy - H/2 + 42, '"I can upgrade any card in your deck. 60G per forge."', {
      fontSize: '11px', fontFamily: 'monospace', fontStyle: 'italic', color: '#aa6633'
    }).setDepth(291).setOrigin(0.5, 0));

    // Show deck cards (upgradeable)
    const deckCards = window.GameState.playerDeck || [];
    const unique = [...new Set(deckCards)].map(id => window.CARD_MAP[id]).filter(Boolean);
    unique.sort((a, b) => a.cost - b.cost);

    const COLS = 5, CW = 140, CH = 50, GAP = 8;
    const gridStartX = cx - W/2 + 20;
    const gridStartY = cy - H/2 + 70;
    const UPGRADE_COST = 60;

    const canAfford = window.GameState.playerMoney >= UPGRADE_COST;
    const maxShow = 20; // show up to 20 unique cards (4 rows of 5)
    if (unique.length > maxShow) {
      add(this.add.text(cx, cy - H/2 + 56, '(Showing ' + maxShow + ' of ' + unique.length + ' unique cards — sort by cost)', {
        fontSize: '9px', fontFamily: 'monospace', color: '#555544', fontStyle: 'italic'
      }).setDepth(291).setOrigin(0.5, 0));
    }

    unique.slice(0, maxShow).forEach((card, i) => {
      const col = i % COLS, row = Math.floor(i / COLS);
      const rx = gridStartX + col * (CW + GAP);
      const ry = gridStartY + row * (CH + GAP);

      // Check if already upgraded (track in GameState.upgradedCards)
      const upgCount = (window.GameState.upgradedCards || {})[card.id] || 0;
      const maxUpgrades = 3;
      const canUpgrade = canAfford && upgCount < maxUpgrades;

      const bg = add(this.add.graphics().setDepth(292));
      bg.fillStyle(canUpgrade ? 0x221100 : 0x111111);
      bg.fillRoundedRect(rx, ry, CW, CH, 4);
      bg.lineStyle(1, canUpgrade ? 0xff6600 : 0x333333);
      bg.strokeRoundedRect(rx, ry, CW, CH, 4);

      const statStr = card.type === 'demon'
        ? ('Atk:' + (card.atk + upgCount) + ' Hp:' + card.hp)
        : ('Val:+' + (upgCount > 0 ? upgCount : '0') + ' bonus');
      add(this.add.text(rx + 6, ry + 6, card.name, {
        fontSize: '9px', fontFamily: 'monospace', color: canUpgrade ? '#ffcc88' : '#666666',
        wordWrap: { width: CW - 12 }
      }).setDepth(292));
      add(this.add.text(rx + 6, ry + 26, statStr + (upgCount > 0 ? ' (+' + upgCount + ')' : ''), {
        fontSize: '8px', fontFamily: 'monospace', color: '#886644'
      }).setDepth(292));

      if (canUpgrade) {
        const btn = add(this.add.text(rx + CW - 6, ry + CH/2, '[+60G]', {
          fontSize: '9px', fontFamily: 'monospace', color: '#ff8822',
          backgroundColor: '#331100', padding: { x: 3, y: 2 }
        }).setOrigin(1, 0.5).setDepth(292).setInteractive({ useHandCursor: true }));
        btn.on('pointerdown', () => {
          if (window.GameState.playerMoney < UPGRADE_COST) return;
          window.GameState.playerMoney -= UPGRADE_COST;
          if (!window.GameState.upgradedCards) window.GameState.upgradedCards = {};
          window.GameState.upgradedCards[card.id] = (window.GameState.upgradedCards[card.id] || 0) + 1;
          // Apply upgrade to CARD_MAP (permanent in session)
          if (card.type === 'demon') { card.atk++; card.currentAtk = card.atk; }
          else if (card.value !== undefined) { card.value++; }
          window.saveGame();
          objs.forEach(o => { try { o.destroy(); } catch(e){} });
          this._dialogueActive = false;
          this._showBlacksmithUI();
        });
        btn.on('pointerover', () => btn.setStyle({ color: '#ffcc44' }));
        btn.on('pointerout',  () => btn.setStyle({ color: '#ff8822' }));
      } else if (upgCount >= maxUpgrades) {
        add(this.add.text(rx + CW - 6, ry + CH/2, 'MAX', {
          fontSize: '8px', fontFamily: 'monospace', color: '#886600'
        }).setOrigin(1, 0.5).setDepth(292));
      }
    });

    if (!canAfford) {
      add(this.add.text(cx, cy + H/2 - 30, 'Need 60G to forge. Come back with more gold!', {
        fontSize: '11px', fontFamily: 'monospace', color: '#884422', fontStyle: 'italic'
      }).setDepth(292).setOrigin(0.5, 1));
    }

    const close = () => {
      objs.forEach(o => { try { o.destroy(); } catch(e){} });
      this._dialogueActive = false;
    };
    const closeBtn = add(this.add.text(cx + W/2 - 12, cy - H/2 + 12, '[F] Close', {
      fontSize: '10px', fontFamily: 'monospace', color: '#666666'
    }).setDepth(292).setOrigin(1, 0).setInteractive({ useHandCursor: true }));
    closeBtn.on('pointerdown', close);
    this.input.keyboard.once('keydown-F', close);
    this.time.delayedCall(30000, () => { if (this._dialogueActive) close(); });
  }

  // ─────────────────── PONEGLYPHS ─────────────────────────────────────────

  buildPoneglyphs() {
    this.poneglyphs = [];
    const island = window.GameState.currentIsland || 0;

    // Island-specific lore stones
    if (island === 1) {
      const infraLore = [
        { x: 128*32+16, y: 17*32+16, text: '"This island was the first to burn.\nNot from the volcano. From the war.\nThe Last Council held their final vote here.\nThey chose humanity. They chose the end.\nThey chose everything." — Inferno Stone I' },
        { x: 48*32+16,  y: 44*32+16, text: '"The fire demons did not lose. They became.\nEvery human born on this island carries lava in their blood.\nThey just forgot the word for it." — Inferno Stone II' },
      ];
      infraLore.forEach(pg => {
        const sprite = this.add.sprite(pg.x, pg.y, 'poneglyph').setDepth(8).setScale(0.8).setTint(0xff6622);
        this.tweens.add({ targets: sprite, alpha: { from: 0.7, to: 1.0 }, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.poneglyphs.push({ sprite, px: pg.x, py: pg.y, lore: pg.text, read: false });
      });
      return;
    }
    if (island === 2) {
      const frostLore = [
        { x: 50*32+16, y: 12*32+16, text: '"The ice remembers what the fire forgot.\nThe Sealing happened in winter. The god did not scream.\nIt whispered. One word. We still do not know what it meant." — Frost Stone I' },
        { x: 96*32+16, y: 90*32+16, text: '"Seven humans sat in a circle.\nSeven cards face down.\nWhen they turned them over, the world changed.\nOne card was missing. Roger found it." — Frost Stone II' },
      ];
      frostLore.forEach(pg => {
        const sprite = this.add.sprite(pg.x, pg.y, 'poneglyph').setDepth(8).setScale(0.8).setTint(0x88aadd);
        this.tweens.add({ targets: sprite, alpha: { from: 0.7, to: 1.0 }, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.poneglyphs.push({ sprite, px: pg.x, py: pg.y, lore: pg.text, read: false });
      });
      return;
    }

    // Home island — 5 poneglyph stones, each with a fragment of the hidden lore
    const stones = [
      {
        tx: 120, ty: 80,    // Just north of main town gate
        lore: '"Before the First Sealing, there was only one kind of being.\nThey called themselves the First Children.\nThey did not know they were already what they feared becoming."',
      },
      {
        tx: 14, ty: 10,   // Dungeon 2
        lore: '"The war lasted nine hundred years.\nAt the end, the Council held five cards.\nThe last inscription read: God is not dead. God is contained."',
      },
      {
        tx: 217, ty: 10,  // Dungeon 1 interior
        lore: '"R.D. Roger visited this stone three times.\nThe third time, he left a message carved beneath ours:\n\'The card knows who deserves it. I am not that person. Yet.\'"',
      },
      {
        tx: 265, ty: 18,  // Volcano Peak
        lore: '"Here the First Council cast the final vote.\nThe vote was: shall we complete what we are?\nThe answer was: yes.\nFrom that day on, they called themselves humans."',
      },
      {
        tx: 265, ty: 186, // Crystal Cavern deep
        lore: '"The God Card does not grant power.\nIt grants truth.\nEvery Card King who found it chose the same thing in the end:\nsilence.\nThen they hid it again.\nFor you."',
      },
    ];

    stones.forEach((stone, idx) => {
      const px = stone.tx * TILE + TILE/2;
      const py = stone.ty * TILE + TILE/2;

      const sprite = this.add.sprite(px, py, 'poneglyph').setDepth(9).setScale(0.9);

      // Pulsing glow tween (blue)
      this.tweens.add({
        targets: sprite, alpha: { from: 0.7, to: 1.0 },
        duration: 2000 + idx * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });

      this.poneglyphs.push({ sprite, px, py, lore: stone.lore, read: false });
    });
  }

  // ─────────────────── BOAT ────────────────────────────────────────────────

  buildBoat() {
    const island = window.GameState.currentIsland || 0;

    // Home island: harbor at Eastern Harbor
    if (island === 0) {
      const bx = 296 * TILE + TILE/2;
      const by = 110 * TILE + TILE/2;
      this.boatSprite = this.add.sprite(bx, by, 'boat').setDepth(9).setScale(1.4);
      this.tweens.add({ targets: this.boatSprite, y: by+5, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const npcSprite = this.add.sprite(bx-40, by-10, 'npc').setDepth(10).setScale(1.0);
      this.tweens.add({ targets: npcSprite, y: by-16, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.add.text(bx-40, by-36, 'Harbor Master', {
        fontSize: '9px', fontFamily: 'monospace', color: '#88ccff',
        stroke: '#000', strokeThickness: 2,
        backgroundColor: '#00000066', padding: { x: 3, y: 1 },
      }).setDepth(11).setOrigin(0.5);
      this.harborMasterPos = { x: bx-40, y: by-10, isHomeHarbor: true };
    }
    // Inferno Island: dock on west coast
    else if (island === 1) {
      const bx = 6 * TILE + TILE/2;
      const by = 63 * TILE + TILE/2;
      this.boatSprite = this.add.sprite(bx, by, 'boat').setDepth(9).setScale(1.4);
      this.tweens.add({ targets: this.boatSprite, y: by+5, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const npcSprite = this.add.sprite(bx+40, by-10, 'npc').setDepth(10).setScale(1.0);
      this.tweens.add({ targets: npcSprite, y: by-16, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.add.text(bx+40, by-36, 'Harbor Master', {
        fontSize: '9px', fontFamily: 'monospace', color: '#ff9966',
        stroke: '#000', strokeThickness: 2,
        backgroundColor: '#00000066', padding: { x: 3, y: 1 },
      }).setDepth(11).setOrigin(0.5);
      this.harborMasterPos = { x: bx+40, y: by-10, isHomeHarbor: false };
    }
    // Frost Wastes: dock on east coast
    else if (island === 2) {
      const bx = 156 * TILE + TILE/2;
      const by = 74 * TILE + TILE/2;
      this.boatSprite = this.add.sprite(bx, by, 'boat').setDepth(9).setScale(1.4);
      this.tweens.add({ targets: this.boatSprite, y: by+5, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const npcSprite = this.add.sprite(bx-40, by-10, 'npc').setDepth(10).setScale(1.0);
      this.tweens.add({ targets: npcSprite, y: by-16, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.add.text(bx-40, by-36, 'Harbor Master', {
        fontSize: '9px', fontFamily: 'monospace', color: '#88ccff',
        stroke: '#000', strokeThickness: 2,
        backgroundColor: '#00000066', padding: { x: 3, y: 1 },
      }).setDepth(11).setOrigin(0.5);
      this.harborMasterPos = { x: bx-40, y: by-10, isHomeHarbor: false };
    }
    // Thunder Peak: dock on south coast
    else if (island === 3) {
      const bx = 80 * TILE + TILE/2;
      const by = 114 * TILE + TILE/2;
      this.boatSprite = this.add.sprite(bx, by, 'boat').setDepth(9).setScale(1.4);
      this.tweens.add({ targets: this.boatSprite, y: by+5, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const npcSprite = this.add.sprite(bx, by-30, 'npc').setDepth(10).setScale(1.0);
      this.tweens.add({ targets: npcSprite, y: by-36, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.add.text(bx, by-54, 'Harbor Master', {
        fontSize: '9px', fontFamily: 'monospace', color: '#ffee44',
        stroke: '#000', strokeThickness: 2,
        backgroundColor: '#00000066', padding: { x: 3, y: 1 },
      }).setDepth(11).setOrigin(0.5);
      this.harborMasterPos = { x: bx, y: by-30, isHomeHarbor: false };
    }
  }

  // ─────────────────── ANIMALS ────────────────────────────────────────────

  buildAnimals() {
    if (!window.ANIMAL_KEYS || window.ANIMAL_KEYS.length === 0) return;
    if ((window.GameState.currentIsland || 0) !== 0) return;
    const zones = [
      { r0:  7, r1:  80, c0:  7, c1:  60  },
      { r0:  7, r1:  80, c0: 68, c1: 120  },
      { r0: 110, r1: 140, c0:  7, c1:  60  },
      { r0:  55, r1: 178, c0: 196, c1: 312 },
    ];
    for (let k = 0; k < 80; k++) {
      const zone = zones[Math.floor(Math.random() * zones.length)];
      const r    = Phaser.Math.Between(zone.r0, zone.r1);
      const c    = Phaser.Math.Between(zone.c0, zone.c1);
      const tileType = this.mapData?.[r]?.[c];
      if (tileType !== 0 && tileType !== 7) continue;
      const key = window.ANIMAL_KEYS[Math.floor(Math.random() * window.ANIMAL_KEYS.length)];
      const a   = this.add.sprite(c * TILE + TILE/2, r * TILE + TILE/2, key).setDepth(8).setScale(0.5);
      if (this.anims.exists(key + '_idle')) a.play(key + '_idle');
      this.time.addEvent({
        delay: Phaser.Math.Between(3000, 9000),
        loop: true,
        callback: () => {
          if (!a.scene) return;
          const tx = Phaser.Math.Clamp(a.x + Phaser.Math.Between(-64, 64), 0, this.mapWidth  * TILE);
          const ty = Phaser.Math.Clamp(a.y + Phaser.Math.Between(-64, 64), 0, this.mapHeight * TILE);
          this.tweens.add({ targets: a, x: tx, y: ty, duration: 900, ease: 'Sine.easeInOut' });
        },
      });
    }
  }

  // ─────────────────── ISLAND ARRIVAL ─────────────────────────────────────

  _showIslandArrival() {
    const island = window.GameState.currentIsland || 0;
    if (island === 0) return; // No banner on home island

    const ARRIVAL = [
      null,
      { name: 'INFERNO ISLAND',  sub: '"The fire remembers. Do you?"  |  Ship back: WEST coast (press F)', color: '#ff6622', border: 0xff4400 },
      { name: 'FROST WASTES',    sub: '"The cold shows you what you are."  |  Ship back: EAST coast (press F)', color: '#88ccff', border: 0x4488ff },
      { name: 'THUNDER PEAK',    sub: '"The storm forged you. Prove it."  |  Ship back: SOUTH coast (press F)', color: '#ffee44', border: 0xaacc00 },
    ];
    const info = ARRIVAL[island];
    if (!info) return;

    this.time.delayedCall(600, () => {
      const cx = this.cameras.main.scrollX + 480;
      const cy = this.cameras.main.scrollY + 320;
      const bg = this.add.graphics().setDepth(250);
      bg.fillStyle(0x000000, 0.75); bg.fillRect(cx - 400, cy - 50, 800, 100);
      bg.lineStyle(2, info.border, 0.8); bg.strokeRect(cx - 400, cy - 50, 800, 100);

      const t1 = this.add.text(cx, cy - 14, info.name, {
        fontSize: '38px', fontFamily: 'monospace', fontStyle: 'bold',
        color: info.color, stroke: '#000', strokeThickness: 5,
      }).setOrigin(0.5).setDepth(251).setAlpha(0);

      const t2 = this.add.text(cx, cy + 24, info.sub, {
        fontSize: '12px', fontFamily: 'monospace', fontStyle: 'italic',
        color: '#aaaaaa', stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(251).setAlpha(0);

      this.tweens.add({ targets: [bg, t1, t2], alpha: 1, duration: 400, ease: 'Power2' });
      this.time.delayedCall(2400, () => {
        this.tweens.add({
          targets: [bg, t1, t2], alpha: 0, duration: 600,
          onComplete: () => { bg.destroy(); t1.destroy(); t2.destroy(); }
        });
      });
    });
  }

  _showBossWarning(bossSprite) {
    const spawnId = bossSprite.spawnId || 'boss';
    if (this._bossWarned.has(spawnId)) return;
    this._bossWarned.add(spawnId);

    const bossName = bossSprite.enemyData?.name || 'BOSS';
    const cx = this.cameras.main.scrollX + 480;
    const cy = this.cameras.main.scrollY + 110;

    const bg = this.add.rectangle(cx, cy, 520, 44, 0x000000, 0.82).setDepth(50);
    const t1 = this.add.text(cx, cy - 8, '⚠  BOSS APPROACHING', {
      fontSize: '11px', fontFamily: 'monospace', color: '#ff6666',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(51).setAlpha(0);
    const t2 = this.add.text(cx, cy + 8, bossName.toUpperCase(), {
      fontSize: '18px', fontFamily: 'monospace', fontStyle: 'bold',
      color: '#ff2222', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(51).setAlpha(0);

    this.tweens.add({ targets: [bg, t1, t2], alpha: 1, duration: 250 });
    this.time.delayedCall(2200, () => {
      this.tweens.add({
        targets: [bg, t1, t2], alpha: 0, duration: 500,
        onComplete: () => { bg.destroy(); t1.destroy(); t2.destroy(); }
      });
    });

    // Brief screen flash (red tint)
    const flash = this.add.rectangle(
      this.cameras.main.scrollX + 480,
      this.cameras.main.scrollY + 320,
      960, 640, 0x440000, 0.35
    ).setDepth(49);
    this.time.delayedCall(300, () => flash.destroy());
  }

  // ─────────────────── DEATH / ECHO ───────────────────────────────────────

  _triggerDeath() {
    window.GameState.hearts    = window.GameState.maxHearts;
    window.GameState.echoGold  = window.GameState.playerMoney;
    window.GameState.echoX     = this.player.x;
    window.GameState.echoY     = this.player.y;
    window.GameState.playerMoney = 0;

    const cp = window.GameState.checkpoint;
    const rx  = cp ? cp.x : window.GameState.spawnX;
    const ry  = cp ? cp.y : window.GameState.spawnY;

    if (window.GameState.echoGold > 0) {
      this._spawnEchoOrb(window.GameState.echoX, window.GameState.echoY);
    }

    this.player.setPosition(rx, ry);
    this.scene.get('HUDScene').updateHUD();
    this._showDeathOverlay();
  }

  _spawnEchoOrb(x, y) {
    if (this.echoOrb) this.echoOrb.destroy();
    this.echoOrb = this.add.sprite(x, y, 'echo_orb').setDepth(9).setScale(1.2);
    this.tweens.add({
      targets: this.echoOrb, scaleX: 1.5, scaleY: 1.5, alpha: 0.6,
      duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  _showDeathOverlay() {
    const cx = this.cameras.main.scrollX + 480;
    const cy = this.cameras.main.scrollY + 320;
    const bg  = this.add.rectangle(cx, cy, 500, 120, 0x000000, 0.8).setDepth(200).setOrigin(0.5);
    const t1  = this.add.text(cx, cy - 20, 'YOU DIED', {
      fontSize: '40px', fontFamily: 'monospace', fontStyle: 'bold',
      color: '#ff0000', stroke: '#000', strokeThickness: 6
    }).setDepth(201).setOrigin(0.5);
    const t2  = this.add.text(cx, cy + 24, 'Gold lost — find your echo to recover it', {
      fontSize: '14px', fontFamily: 'monospace',
      color: '#ffaaaa', stroke: '#000', strokeThickness: 3
    }).setDepth(201).setOrigin(0.5);

    this.time.delayedCall(3000, () => {
      [bg, t1, t2].forEach(o => {
        this.tweens.add({ targets: o, alpha: 0, duration: 600, onComplete: () => o.destroy() });
      });
    });
  }

  // ─────────────────── GOD CARD ENDING ────────────────────────────────────

  _triggerGodCardEnding() {
    if (this._godCardShown) return;
    this._godCardShown = true;

    this.physics.pause();
    this._dialogueActive = true;

    const W = 960, H = 640;
    const objs = [];

    // Full-screen dark fade
    const veil = this.add.rectangle(
      this.cameras.main.scrollX + W/2,
      this.cameras.main.scrollY + H/2,
      W, H, 0x000000, 0
    ).setDepth(300).setOrigin(0.5);
    objs.push(veil);

    this.tweens.add({
      targets: veil, alpha: 0.92,
      duration: 1800, ease: 'Power2',
      onComplete: () => this._showGodCardText(objs),
    });
  }

  _showGodCardText(objs) {
    const W = 960, H = 640;
    const ox = this.cameras.main.scrollX;
    const oy = this.cameras.main.scrollY;

    // Gold star burst effect (simple radiating lines)
    const burst = this.add.graphics().setDepth(301);
    const cx = ox + W/2, cy = oy + H/2;
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      burst.lineStyle(1, 0xffd700, 0.6);
      burst.beginPath();
      burst.moveTo(cx + Math.cos(a) * 60, cy + Math.sin(a) * 60);
      burst.lineTo(cx + Math.cos(a) * 260, cy + Math.sin(a) * 260);
      burst.strokePath();
    }
    this.tweens.add({
      targets: burst, alpha: 0,
      duration: 3000, ease: 'Power2',
      onComplete: () => burst.destroy(),
    });
    objs.push(burst);

    const lines = [
      { text: 'YOU FOUND IT.',          delay: 200,  color: '#ffffff', size: '38px', y: oy + 120 },
      { text: 'R O G E R\'S   C A R D', delay: 900,  color: '#ffd700', size: '52px', y: oy + 188 },
      { text: '— THE GOD CARD —',       delay: 1800, color: '#cc8800', size: '20px', y: oy + 252 },
      { text: '',                        delay: 0,    color: '#000',    size: '1px',  y: 0 },
      { text: '"It is not a card. It is a question."', delay: 2600, color: '#aaaaaa', size: '14px', y: oy + 308 },
      { text: '"Are you ready for the answer?"',       delay: 3200, color: '#aaaaaa', size: '14px', y: oy + 332 },
      { text: '',                        delay: 0,    color: '#000',    size: '1px',  y: 0 },
      { text: 'YOU ARE NOW   C A R D   K I N G', delay: 4200, color: '#ff4444', size: '24px', y: oy + 390 },
    ];

    lines.filter(l => l.text).forEach(l => {
      this.time.delayedCall(l.delay, () => {
        const t = this.add.text(ox + W/2, l.y, l.text, {
          fontSize: l.size, fontFamily: 'monospace', fontStyle: 'bold',
          color: l.color, stroke: '#000000', strokeThickness: 4,
          align: 'center',
        }).setOrigin(0.5, 0).setDepth(302).setAlpha(0);
        this.tweens.add({ targets: t, alpha: 1, duration: 700, ease: 'Power2' });
        objs.push(t);
      });
    });

    // Choice buttons after 5.5s
    this.time.delayedCall(5500, () => this._showGodCardChoice(objs));
  }

  _showGodCardChoice(objs) {
    const W = 960, H = 640;
    const ox = this.cameras.main.scrollX;
    const oy = this.cameras.main.scrollY;

    const subText = this.add.text(ox + W/2, oy + 454,
      'Creation trembles. All demons. All cards. Everything — waits for your word.', {
        fontSize: '12px', fontFamily: 'monospace', fontStyle: 'italic',
        color: '#886644', stroke: '#000', strokeThickness: 2, align: 'center',
      }).setOrigin(0.5, 0).setDepth(302).setAlpha(0);
    this.tweens.add({ targets: subText, alpha: 1, duration: 600 });
    objs.push(subText);

    // REBUILD button
    const btnRebuild = this.add.text(ox + W/2 - 130, oy + 520, '✦  REBUILD THE WORLD', {
      fontSize: '18px', fontFamily: 'monospace', fontStyle: 'bold',
      backgroundColor: '#001a00', color: '#44ff88',
      stroke: '#000', strokeThickness: 3,
      padding: { x: 18, y: 10 },
    }).setOrigin(0.5, 0).setDepth(302).setAlpha(0).setInteractive({ useHandCursor: true });
    this.tweens.add({ targets: btnRebuild, alpha: 1, duration: 600, delay: 200 });
    btnRebuild.on('pointerover', () => btnRebuild.setStyle({ backgroundColor: '#003300', color: '#88ffaa' }));
    btnRebuild.on('pointerout',  () => btnRebuild.setStyle({ backgroundColor: '#001a00', color: '#44ff88' }));
    btnRebuild.on('pointerdown', () => this._godCardOutcome('rebuild', objs));
    objs.push(btnRebuild);

    // UNMAKE button
    const btnUnmake = this.add.text(ox + W/2 + 130, oy + 520, '☠  UNMAKE IT ALL', {
      fontSize: '18px', fontFamily: 'monospace', fontStyle: 'bold',
      backgroundColor: '#1a0000', color: '#ff4444',
      stroke: '#000', strokeThickness: 3,
      padding: { x: 18, y: 10 },
    }).setOrigin(0.5, 0).setDepth(302).setAlpha(0).setInteractive({ useHandCursor: true });
    this.tweens.add({ targets: btnUnmake, alpha: 1, duration: 600, delay: 200 });
    btnUnmake.on('pointerover', () => btnUnmake.setStyle({ backgroundColor: '#330000', color: '#ff8888' }));
    btnUnmake.on('pointerout',  () => btnUnmake.setStyle({ backgroundColor: '#1a0000', color: '#ff4444' }));
    btnUnmake.on('pointerdown', () => this._godCardOutcome('unmake', objs));
    objs.push(btnUnmake);
  }

  _godCardOutcome(choice, objs) {
    objs.forEach(o => { if (o && o.destroy) o.destroy(); });
    const W = 960, H = 640;
    const ox = this.cameras.main.scrollX;
    const oy = this.cameras.main.scrollY;

    const isRebuild = choice === 'rebuild';
    const bg = this.add.rectangle(ox + W/2, oy + H/2, W, H,
      isRebuild ? 0x002200 : 0x110000, 0.97).setDepth(310).setOrigin(0.5);

    const msg1 = isRebuild
      ? 'You close your eyes.'
      : 'You smile. Just like Roger.';
    const msg2 = isRebuild
      ? 'Light floods every shadow. Every demon card stirs — released. The world rebuilds itself, quietly, like a held breath finally exhaled.'
      : 'The card pulses once. Then silence. The world folds inward, gently, like a book being shut.\nEverything returns to before the first word was spoken.';
    const msg3 = isRebuild
      ? '"He who fights may lose. He who does not fight, has already lost."\n— R.D. Roger\n\n...You chose something else.'
      : '"The answer was always where you started."\n— R.D. Roger\n\n...You understood.';
    const title = isRebuild ? 'THE WORLD LIVES AGAIN.' : 'THE WORLD REMEMBERS SILENCE.';

    const textObjs = [];
    [[W/2, 170, msg1,  '22px', '#cccccc'],
     [W/2, 240, msg2,  '13px', '#aaaaaa'],
     [W/2, 400, msg3,  '12px', isRebuild ? '#66cc66' : '#cc6666'],
     [W/2, 530, title, '28px', isRebuild ? '#44ff88' : '#ff4444'],
    ].forEach(([tx, ty, txt, sz, col], i) => {
      const t = this.add.text(ox + tx, oy + ty, txt, {
        fontSize: sz, fontFamily: 'monospace',
        color: col, stroke: '#000', strokeThickness: 3,
        align: 'center', wordWrap: { width: 700 },
      }).setOrigin(0.5, 0).setDepth(311).setAlpha(0);
      this.time.delayedCall(i * 1200, () => {
        this.tweens.add({ targets: t, alpha: 1, duration: 800, ease: 'Power2' });
      });
      textObjs.push(t);
    });

    // Return to title after reading
    this.time.delayedCall(9000, () => {
      this.cameras.main.fadeOut(2000, 0, 0, 0);
      this.time.delayedCall(2100, () => {
        localStorage.removeItem('blooddungeon_save');
        this.scene.start('TitleScene');
      });
    });
  }

  // ─────────────────── JUMP ───────────────────────────────────────────────

  _doJump() {
    if (this.isJumping || this.jumpCooldown) return;
    if (!this.jumpableGroup && !this.ledgeGroup) return;

    // ── Check for ledge tile ahead (elevation climb) ──────────────────────
    let climbingLedge = false;
    if (this.elevMap && this.mapData) {
      const pe  = this.playerElevation || 0;
      const ppx = this.player.x, ppy = this.player.y;
      const body = this.player.body;
      const dirs = [];
      if (body.velocity.x > 10)  dirs.push([ 1,  0]);
      if (body.velocity.x < -10) dirs.push([-1,  0]);
      if (body.velocity.y > 10)  dirs.push([ 0,  1]);
      if (body.velocity.y < -10) dirs.push([ 0, -1]);
      // If standing still, check all four directions
      if (dirs.length === 0) {
        dirs.push([1,0],[-1,0],[0,1],[0,-1]);
      }
      const checkDist = 48;
      for (const [dx, dy] of dirs) {
        const tr = Math.floor((ppy + dy * checkDist) / TILE);
        const tc = Math.floor((ppx + dx * checkDist) / TILE);
        const tileType = this.mapData[tr]?.[tc];
        const tileElev = this.elevMap[tr]?.[tc] ?? 0;
        // LEDGE tile (10) at elevation pe+1 — or any tile at pe+1
        if ((tileType === 10 || tileElev === pe + 1) && tileElev === pe + 1) {
          climbingLedge = true;
          break;
        }
      }
    }

    this.isJumping      = true;
    this.jumpCooldown   = true;
    this._climbingLedge = climbingLedge;

    this.jumpShadow.setVisible(true);
    this.jumpShadow.setPosition(this.player.x, this.player.y + 8);

    const sc = this.player.scaleX; // always 1.5

    // Visual: snappy stretch-up then land — independent of collision window
    this.tweens.add({
      targets: this.player,
      scaleY: sc * 1.4,
      duration: 150,
      yoyo: true,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.player.setScale(sc, sc);
        this.jumpShadow.setVisible(false);
      }
    });

    if (climbingLedge) {
      // Mid-jump: elevate the player so collision with upper-level tiles opens up
      this.time.delayedCall(300, () => {
        this.playerElevation = Math.min(3, (this.playerElevation || 0) + 1);
        this._rebuildElevationColliders();
        this.player.setDepth(10 + this.playerElevation * 5);
        this.scene.get('HUDScene')?.updateHUD();
      });
    }

    // Collision stays disabled for 600ms — enough to clear 3 tiles at 200 px/s
    this.time.delayedCall(600, () => {
      this.isJumping      = false;
      this._climbingLedge = false;
      this.time.delayedCall(250, () => { this.jumpCooldown = false; });
    });
  }

  // ─────────────────── INTERACT (F) ───────────────────────────────────────

  _handleInteract() {
    const px = this.player.x, py = this.player.y;
    const dist = (a, b) => Math.sqrt((a.x - px) ** 2 + (a.y - py) ** 2);

    // Priority 0a: Poneglyph lore stones
    const nearPG = (this.poneglyphs || []).find(pg => Math.sqrt((pg.px - px)**2 + (pg.py - py)**2) < 52);
    if (nearPG) { this._readPoneglyph(nearPG); return; }

    // Priority 0b: Harbor master
    if (this.harborMasterPos) {
      const hm = this.harborMasterPos;
      if (Math.sqrt((hm.x - px)**2 + (hm.y - py)**2) < 50) {
        this._showHarborDialogue(); return;
      }
    }

    // Priority 0b2: Blacksmith
    if (this.blacksmithPos) {
      const bs = this.blacksmithPos;
      if (Math.sqrt((bs.x - px)**2 + (bs.y - py)**2) < 50) {
        this._showBlacksmithUI(); return;
      }
    }

    // Priority 0c: NPC dialogue
    const nearNPC = (this.npcs || []).find(n => Math.sqrt((n.px - px)**2 + (n.py - py)**2) < 50);
    if (nearNPC) { this._talkToNPC(nearNPC); return; }

    // Priority 1: Horse (mount / dismount)
    if (this.mountedHorse) {
      this._dismountHorse();
      return;
    }
    const nearHorse = this.horses.find(h => !h.isMounted && dist(h) < 44);
    if (nearHorse) { this._mountHorse(nearHorse); return; }

    // Priority 2: Echo orb
    if (this.echoOrb && dist(this.echoOrb) < 44) {
      this._recoverEcho();
      return;
    }

    // Priority 3: Chests
    const nearChest = this.chests.find(ch => ch.active && dist(ch) < 44);
    if (nearChest) { this._openChest(nearChest); return; }

    // Priority 4: Campfire
    const nearFire = this.campfires.find(cf => dist(cf) < 44);
    if (nearFire) { this._restAtCampfire(nearFire); return; }
  }

  // ── Poneglyph reading ────────────────────────────────────────────────────

  _readPoneglyph(pg) {
    if (this._dialogueActive) return;
    this._dialogueActive = true;

    // Mark as read (glows white briefly)
    if (!pg.read) {
      pg.read = true;
      this.tweens.add({ targets: pg.sprite, tint: { from: 0x8866ff, to: 0xffffff }, duration: 500, yoyo: true });
    }

    const cx = this.cameras.main.scrollX + 480;
    const cy = this.cameras.main.scrollY + 500;
    const W = 740, H = 110;

    const bg = this.add.graphics().setDepth(300);
    bg.fillStyle(0x0a001a, 0.96); bg.fillRoundedRect(cx - W/2, cy - H/2, W, H, 8);
    bg.lineStyle(2, 0x6633ff);    bg.strokeRoundedRect(cx - W/2, cy - H/2, W, H, 8);

    const nameT = this.add.text(cx - W/2 + 14, cy - H/2 + 8, '◈  PONEGLYPH — ANCIENT INSCRIPTION  ◈', {
      fontSize: '11px', fontFamily: 'monospace', fontStyle: 'bold', color: '#8866ff',
      stroke: '#000', strokeThickness: 2,
    }).setDepth(301);

    const bodyT = this.add.text(cx - W/2 + 14, cy - H/2 + 26, pg.lore, {
      fontSize: '11px', fontFamily: 'monospace', color: '#ccccee', fontStyle: 'italic',
      wordWrap: { width: W - 28 },
    }).setDepth(301);

    const hint = this.add.text(cx + W/2 - 10, cy + H/2 - 8, '[F] close', {
      fontSize: '9px', fontFamily: 'monospace', color: '#555566',
    }).setDepth(301).setOrigin(1, 1);

    const close = () => {
      [bg, nameT, bodyT, hint].forEach(o => o.destroy());
      this._dialogueActive = false;
    };

    this.input.keyboard.once('keydown-F', close);
    this.time.delayedCall(8000, () => { if (this._dialogueActive) close(); });
  }

  // ── Harbor Master dialogue ────────────────────────────────────────────────

  _showHarborDialogue() {
    if (this._dialogueActive) return;
    this._dialogueActive = true;

    const currentIsland = window.GameState.currentIsland || 0;
    const cx = this.cameras.main.scrollX + 480;
    const cy = this.cameras.main.scrollY + 320;
    const W = 680, H = 220;

    const bg = this.add.graphics().setDepth(300);
    bg.fillStyle(0x001020, 0.97); bg.fillRoundedRect(cx - W/2, cy - H/2, W, H, 8);
    bg.lineStyle(2, 0x3388cc);   bg.strokeRoundedRect(cx - W/2, cy - H/2, W, H, 8);

    const nameT = this.add.text(cx - W/2 + 14, cy - H/2 + 10, 'Harbor Master Kael', {
      fontSize: '13px', fontFamily: 'monospace', fontStyle: 'bold', color: '#55aaff',
    }).setDepth(301);

    const allObjs = [bg, nameT];

    if (currentIsland === 0) {
      // On home island — offer travel
      const introT = this.add.text(cx - W/2 + 14, cy - H/2 + 32,
        '"The ship is ready. Roger sailed every one of these waters.\nEach island has its own demons. Its own truth. Where do you go?"', {
          fontSize: '11px', fontFamily: 'monospace', fontStyle: 'italic', color: '#aaccee',
          wordWrap: { width: W - 28 },
        }).setDepth(301);
      allObjs.push(introT);

      const islands = [
        { id: 1, label: '⚔  INFERNO ISLAND', sub: 'Volcanic. Fire demons. Dangerous.', color: '#ff8844', hov: '#ffaa66' },
        { id: 2, label: '❄  FROST WASTES',  sub: 'Frozen tundra. Ice beasts. Ancient ruins.', color: '#88ccff', hov: '#aaddff' },
      ];

      islands.forEach((isl, k) => {
        const btnY = cy - H/2 + 100 + k * 52;
        const btn = this.add.text(cx, btnY, isl.label, {
          fontSize: '18px', fontFamily: 'monospace', fontStyle: 'bold',
          color: isl.color, stroke: '#000', strokeThickness: 3,
          backgroundColor: '#001122', padding: { x: 20, y: 8 },
        }).setOrigin(0.5).setDepth(302).setInteractive({ useHandCursor: true });
        const subT = this.add.text(cx, btnY + 28, isl.sub, {
          fontSize: '10px', fontFamily: 'monospace', color: '#667788', fontStyle: 'italic',
        }).setOrigin(0.5).setDepth(302);
        btn.on('pointerover', () => btn.setStyle({ color: isl.hov, backgroundColor: '#002244' }));
        btn.on('pointerout',  () => btn.setStyle({ color: isl.color, backgroundColor: '#001122' }));
        btn.on('pointerdown', () => {
          allObjs.forEach(o => o.destroy()); btn.destroy(); subT.destroy();
          this._dialogueActive = false;
          this._travelToIsland(isl.id);
        });
        allObjs.push(btn, subT);
      });

      const cancelT = this.add.text(cx + W/2 - 14, cy + H/2 - 10, '[F] stay', {
        fontSize: '10px', fontFamily: 'monospace', color: '#334455',
      }).setOrigin(1, 1).setDepth(301);
      allObjs.push(cancelT);

    } else {
      // On another island — offer return home
      const introT = this.add.text(cx - W/2 + 14, cy - H/2 + 32,
        '"Ready to head back to the home island?\nYour loot and cards travel with you."', {
          fontSize: '12px', fontFamily: 'monospace', color: '#aaccee',
          wordWrap: { width: W - 28 },
        }).setDepth(301);
      allObjs.push(introT);

      const btnHome = this.add.text(cx, cy, '⛵  SAIL HOME', {
        fontSize: '22px', fontFamily: 'monospace', fontStyle: 'bold',
        color: '#ffd700', stroke: '#000', strokeThickness: 3,
        backgroundColor: '#001122', padding: { x: 24, y: 10 },
      }).setOrigin(0.5).setDepth(302).setInteractive({ useHandCursor: true });
      btnHome.on('pointerover', () => btnHome.setStyle({ color: '#ffee88', backgroundColor: '#002244' }));
      btnHome.on('pointerout',  () => btnHome.setStyle({ color: '#ffd700', backgroundColor: '#001122' }));
      btnHome.on('pointerdown', () => {
        allObjs.forEach(o => o.destroy()); btnHome.destroy();
        this._dialogueActive = false;
        this._travelToIsland(0);
      });
      allObjs.push(btnHome);

      const cancelT = this.add.text(cx + W/2 - 14, cy + H/2 - 10, '[F] stay', {
        fontSize: '10px', fontFamily: 'monospace', color: '#334455',
      }).setOrigin(1, 1).setDepth(301);
      allObjs.push(cancelT);
    }

    const close = () => {
      allObjs.forEach(o => { if (o && o.destroy) o.destroy(); });
      this._dialogueActive = false;
    };
    this.input.keyboard.once('keydown-F', close);
  }

  _travelToIsland(dest) {
    if (!window.GameState.visitedIslands) window.GameState.visitedIslands = [0];
    if (!window.GameState.visitedIslands.includes(dest)) {
      window.GameState.visitedIslands.push(dest);
    }
    this.physics.pause();
    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.time.delayedCall(850, () => {
      this.scene.stop('HUDScene');
      this.scene.start('SeaScene', { destination: dest });
    });
  }

  // ── NPC dialogue ──────────────────────────────────────────────────────────

  _talkToNPC(npcObj) {
    if (this._dialogueActive) return;
    this._dialogueActive = true;

    // Find the most relevant quest for this NPC
    let activeQuest = null;
    let dialogueKey = 'locked';

    for (const qid of npcObj.questIds) {
      const quest = window.QUEST_MAP[qid];
      const state = window.GameState.questProgress?.[qid];
      if (!state || !quest) continue;
      if (state.status === 'complete') { activeQuest = quest; dialogueKey = 'complete'; break; }
      if (state.status === 'active')   { activeQuest = quest; dialogueKey = 'active';   break; }
      if (state.status === 'claimed')  { activeQuest = quest; dialogueKey = 'claimed';  }
    }

    // If no active/complete quest found, try to unlock a locked quest whose prereq is met
    if (!activeQuest || dialogueKey === 'locked') {
      for (const qid of npcObj.questIds) {
        const quest = window.QUEST_MAP[qid];
        const state = window.GameState.questProgress?.[qid];
        if (!state || !quest || state.status !== 'locked') continue;
        const prereqMet = !quest.prereq ||
          window.GameState.questProgress?.[quest.prereq]?.status === 'claimed';
        if (prereqMet) {
          state.status = 'active';
          activeQuest  = quest;
          dialogueKey  = 'active';
          window.saveGame?.();
          this.showMessage('NEW QUEST: ' + quest.name, '#44ff88');
          this._buildQuestHUD();
          break;
        }
      }
    }

    if (!activeQuest) {
      // Fall back to first quest
      activeQuest = window.QUEST_MAP[npcObj.questIds[0]];
    }

    // ── Reward claiming: when quest is 'complete', give reward on dialogue open ──
    if (dialogueKey === 'complete' && activeQuest) {
      window.GameState.playerMoney = (window.GameState.playerMoney || 0) + (activeQuest.reward?.gold || 0);
      if (activeQuest.reward?.card) {
        window.GameState.playerCollection = window.GameState.playerCollection || [];
        window.GameState.playerCollection.push(activeQuest.reward.card);
      }
      window.GameState.questProgress[activeQuest.id].status = 'claimed';
      window.saveGame?.();
      this._buildQuestHUD?.();
      this.scene.get('HUDScene')?.updateHUD();
      // Unlock any quests whose prereq is now satisfied (player must still talk to that NPC)
      (window.QUESTS || []).forEach(q => {
        if (q.prereq === activeQuest.id) {
          const s = window.GameState.questProgress?.[q.id];
          if (s && s.status === 'locked') {
            // Refresh markers only — player must walk to that NPC to activate
            this._buildQuestHUD?.();
          }
        }
      });
    }

    let text = activeQuest?.dialogue?.[dialogueKey] ?? 'Greetings, traveller.';
    // When claiming, append reward info to dialogue
    if (dialogueKey === 'complete' && activeQuest?.reward) {
      const rewardParts = [];
      if (activeQuest.reward.gold) rewardParts.push('+' + activeQuest.reward.gold + 'G');
      if (activeQuest.reward.card && window.CARD_MAP?.[activeQuest.reward.card])
        rewardParts.push('+' + window.CARD_MAP[activeQuest.reward.card].name);
      if (rewardParts.length) text += '\n[Reward received: ' + rewardParts.join(', ') + ']';
    }
    const npcName = activeQuest?.npc ?? (npcObj.questIds[0] ? (window.QUEST_MAP[npcObj.questIds[0]]?.npc ?? 'NPC') : 'NPC');

    // Dialogue box fixed to camera (screen space)
    const W = 700, H = 100;
    const SX = 480, SY = 510; // screen center-x, near-bottom
    const borderCol = dialogueKey === 'complete' ? 0xffd700 : 0x8844cc;

    const bg = this.add.graphics().setScrollFactor(0).setDepth(300);
    bg.fillStyle(0x0a0018, 0.94); bg.fillRoundedRect(SX - W/2, SY - H/2, W, H, 8);
    bg.lineStyle(2, borderCol);   bg.strokeRoundedRect(SX - W/2, SY - H/2, W, H, 8);

    const nameT = this.add.text(SX - W/2 + 14, SY - H/2 + 8, npcName, {
      fontSize: '13px', fontFamily: 'monospace', fontStyle: 'bold', color: '#cc88ff',
      stroke: '#000', strokeThickness: 2,
    }).setScrollFactor(0).setDepth(301);

    const bodyT = this.add.text(SX - W/2 + 14, SY - H/2 + 28, text, {
      fontSize: '11px', fontFamily: 'monospace', color: '#ddddee',
      wordWrap: { width: W - 28 },
    }).setScrollFactor(0).setDepth(301);

    const hint = this.add.text(SX + W/2 - 10, SY + H/2 - 8, '[F] close', {
      fontSize: '9px', fontFamily: 'monospace', color: '#555566',
    }).setScrollFactor(0).setDepth(301).setOrigin(1, 1);

    const close = () => {
      [bg, nameT, bodyT, hint].forEach(o => o.destroy());
      this._dialogueActive = false;
    };

    // Close on F key or after timeout
    const closeKey = this.input.keyboard.once('keydown-F', close);
    this.time.delayedCall(6000, () => {
      if (this._dialogueActive) close();
    });
  }

  // ── Campfire ─────────────────────────────────────────────────────────────

  _restAtCampfire(fire) {
    window.GameState.checkpoint    = { x: fire.x, y: fire.y };
    window.GameState.hearts        = window.GameState.maxHearts;
    this.scene.get('HUDScene').updateHUD();
    this.showMessage('Checkpoint set!  ♥ healed', '#ff7700');

    // Brief glow
    this.tweens.add({
      targets: fire, scaleX: 1.6, scaleY: 1.6,
      duration: 300, yoyo: true, ease: 'Sine.easeOut',
    });
  }

  // ── Chest ────────────────────────────────────────────────────────────────

  _openChest(chest) {
    chest.setActive(false).setVisible(false);

    const roll = Math.random();
    let msg;
    if (roll < 0.55) {
      const gold = Phaser.Math.Between(50, 300);
      window.GameState.playerMoney += gold;
      msg = 'TREASURE!  +' + gold + 'G';
    } else {
      const card = chest.rareCards[Math.floor(Math.random() * chest.rareCards.length)];
      window.GameState.playerCollection.push(card);
      const cardName = (window.CARD_MAP && window.CARD_MAP[card]) ? window.CARD_MAP[card].name : card;
      msg = 'TREASURE!  Found: ' + cardName + '!';
    }

    // ── Quest progress tracking for chest opens ───────────────────────
    window.GameState.chestsOpened = (window.GameState.chestsOpened || 0) + 1;
    const questEvent = { type: 'chest' };
    const changed = window.advanceQuests(questEvent);
    changed.forEach(qid => {
      const q = window.QUEST_MAP[qid];
      if (q && !qid.endsWith('_unlocked')) {
        this.time.delayedCall(600, () => {
          this.showMessage('QUEST COMPLETE: ' + q.name + '!', '#ffd700');
          this.scene.get('HUDScene').updateHUD();
        });
      }
    });

    this.scene.get('HUDScene').updateHUD();
    this._showTreasureOverlay(msg);
    window.saveGame();
  }

  _showTreasureOverlay(msg) {
    const cx = this.cameras.main.scrollX + 480;
    const cy = this.cameras.main.scrollY + 320;
    const bg = this.add.rectangle(cx, cy, 460, 80, 0x442200, 0.9).setDepth(200).setOrigin(0.5);
    const t  = this.add.text(cx, cy, msg, {
      fontSize: '22px', fontFamily: 'monospace', fontStyle: 'bold',
      color: '#ffd700', stroke: '#000', strokeThickness: 4
    }).setDepth(201).setOrigin(0.5);
    this.tweens.add({
      targets: [bg, t], y: '-=60', alpha: 0,
      duration: 2200, ease: 'Power2',
      onComplete: () => { bg.destroy(); t.destroy(); }
    });
  }

  // ── Echo recovery ────────────────────────────────────────────────────────

  _recoverEcho() {
    window.GameState.playerMoney += window.GameState.echoGold;
    const recovered = window.GameState.echoGold;
    window.GameState.echoGold = 0;
    window.GameState.echoX    = null;
    window.GameState.echoY    = null;

    this.tweens.killTweensOf(this.echoOrb);
    this.tweens.add({
      targets: this.echoOrb, scaleX: 2.5, scaleY: 2.5, alpha: 0,
      duration: 500, onComplete: () => { this.echoOrb.destroy(); this.echoOrb = null; }
    });

    this.scene.get('HUDScene').updateHUD();
    this.showMessage('Echo recovered!  +' + recovered + 'G', '#ffd700');
  }

  // ── Horse ────────────────────────────────────────────────────────────────

  _mountHorse(horse) {
    this.mountedHorse = horse;
    horse.isMounted   = true;
    this.player.setTint(0xc07828);
    this.playerLabel.setText('YOU \uD83D\uDC0E');
    this.showMessage('Mounted!  Speed x3  |  F to dismount', '#c07828');
  }

  _dismountHorse() {
    if (!this.mountedHorse) return;
    this.mountedHorse.setPosition(this.player.x + 40, this.player.y);
    this.mountedHorse.isMounted = false;
    this.mountedHorse           = null;
    this.player.clearTint();
    this.playerLabel.setText('YOU');
    this.showMessage('Dismounted', '#aaaaaa');
  }

  // ─────────────────── FIELD OF VIEW ──────────────────────────────────────

  _initFoV() {
    // FoV disabled — was causing visual artifacts on open terrain
    this._fovCanvas = null;
    this._fovImage  = null;
    this._fovTimer  = 0;
  }

  _castRayDist(angle, maxDist) {
    const dx = Math.cos(angle), dy = Math.sin(angle);
    const px = this.player.x, py = this.player.y;
    for (let d = 10; d < maxDist; d += 10) {
      const tr = Math.floor((py + dy * d) / 32);
      const tc = Math.floor((px + dx * d) / 32);
      const t  = this.mapData?.[tr]?.[tc] ?? 0;
      if (t === 3 || t === 5 || t === 6) return d; // wall, tree, mountain block sight
    }
    return maxDist;
  }

  _updateFoV() { /* FoV disabled */ }

  // ─────────────────── WEATHER ────────────────────────────────────────────

  _updateWeather(delta) {
    if (!this._weatherGfx || !this.player) return;
    this._weatherTimer  += delta;
    this._weatherTotalMs = (this._weatherTotalMs || 0) + delta;
    if (this._weatherTimer < 80) return;  // ~12 fps for weather
    this._weatherTimer = 0;
    const time = this._weatherTotalMs;

    const island = window.GameState.currentIsland || 0;
    const pr = Math.floor(this.player.y / TILE);
    const pc = Math.floor(this.player.x / TILE);

    // Determine weather type from biome
    let weatherType = 'none';
    if (island === 2) {
      weatherType = 'snow';        // always snowing on frost island
    } else if (island === 1) {
      weatherType = 'ash';         // ash particles on inferno island
    } else if (pr > 140 && pc < 65) {
      weatherType = 'rain';        // swamp biome
    } else if (pc > 190 && pr < 140) {
      weatherType = 'sand';        // desert biome
    }

    if (weatherType === 'none') {
      this._weatherGfx.clear();
      return;
    }

    const gfx = this._weatherGfx;
    gfx.clear();

    // GBA-style pixel weather — simple 1-2px dots
    const W = 960, H = 640;
    const COUNT = weatherType === 'rain' ? 40 : 25;

    const spd = weatherType === 'rain' ? 0.28 : weatherType === 'snow' ? 0.10 : 0.06;
    for (let k = 0; k < COUNT; k++) {
      const seed = k * 137.5 + 1;
      const bx = ((seed * 0.7) % 1.0) * W;
      const by = (time * spd + k * (H / COUNT)) % H;

      switch (weatherType) {
        case 'rain':
          gfx.fillStyle(0x4488aa, 0.8);
          gfx.fillRect(Math.floor(bx), Math.floor(by), 1, 4);   // vertical streak
          break;
        case 'snow':
          gfx.fillStyle(0xeef5ff, 0.9);
          gfx.fillRect(Math.floor(bx + Math.sin(time * 0.002 + k * 2.1) * 6), Math.floor(by), 2, 2);
          break;
        case 'ash':
          gfx.fillStyle(0x886655, 0.7);
          gfx.fillRect(Math.floor(bx + Math.sin(time * 0.0015 + k * 1.8) * 8), Math.floor(by), 2, 2);
          break;
        case 'sand':
          gfx.fillStyle(0xcc9944, 0.5);
          gfx.fillRect(Math.floor(bx), Math.floor(by), 1, 1);  // tiny grain
          break;
      }
    }
  }

  // ─────────────────── UPDATE ─────────────────────────────────────────────

  update(time, delta) {
    this._updateWeather(delta);
    this._updateFoV();
    const baseSpeed   = 200;
    const mountSpeed  = 600;
    const speed       = this.mountedHorse ? mountSpeed : baseSpeed;

    const { up, down, left, right, up2, down2, left2, right2, space, fKey } = this.cursors;

    // ── Movement ─────────────────────────────────────────────────────────
    let vx = 0, vy = 0;
    if (left.isDown  || left2.isDown)  vx = -speed;
    if (right.isDown || right2.isDown) vx =  speed;
    if (up.isDown    || up2.isDown)    vy = -speed;
    if (down.isDown  || down2.isDown)  vy =  speed;
    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }
    this.player.setVelocity(vx, vy);

    // Sync mounted horse to player position
    if (this.mountedHorse) {
      this.mountedHorse.setPosition(this.player.x, this.player.y + 8);
    }

    // ── Player animation / flip ───────────────────────────────────────────
    if (window.GBA_PLAYER) {
      if (vx === 0 && vy === 0) {
        const cur = this.player.anims.currentAnim?.key;
        if (cur !== 'player_idle') this.player.play('player_idle');
      } else if (Math.abs(vy) >= Math.abs(vx)) {
        this.player.setFlipX(false);
        this.player.play(vy < 0 ? 'player_walk_up' : 'player_walk_down', true);
      } else {
        if (vx < 0) { this.player.setFlipX(true);  this.player.play('player_walk_left',  true); }
        else         { this.player.setFlipX(false); this.player.play('player_walk_right', true); }
      }
    } else {
      if (vx < 0) this.player.setFlipX(true);
      else if (vx > 0) this.player.setFlipX(false);
    }

    this.playerLabel.setPosition(this.player.x, this.player.y - 28);

    // ── Jump (spacebar) ───────────────────────────────────────────────────
    if (Phaser.Input.Keyboard.JustDown(space)) {
      this._doJump();
    }
    if (this.isJumping && this.jumpShadow.visible) {
      this.jumpShadow.setX(this.player.x);
    }

    // ── F key (interact) ─────────────────────────────────────────────────
    if (Phaser.Input.Keyboard.JustDown(fKey) && !this._dialogueActive) {
      this._handleInteract();
    }

    // ── Enemy wander / chase AI ───────────────────────────────────────────
    this.enemyGroup.getChildren().forEach(enemy => {
      const dx   = this.player.x - enemy.x;
      const dy   = this.player.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const isBoss   = enemy.enemyData.isBoss;
      const spd      = enemy.enemyData.moveSpeed * (isBoss ? 0.7 : 1);
      const chaseRange = isBoss ? 1600 : 280; // normal: ~8 tiles, boss: ~50 tiles

      // Immediate chase if in range — no timer gate for bosses, smooth for normals
      if (dist < chaseRange && !this.battleCooldown) {
        const chaseChance = isBoss ? 0.6 : 0.5;
        if (Math.random() < chaseChance || (isBoss && dist < 400)) {
          const nx = dx / dist, ny = dy / dist;
          const mult = isBoss ? 1.5 : 1.1;
          enemy.setVelocity(nx * spd * mult, ny * spd * mult);
          enemy.wanderTimer = isBoss ? 1500 : 800;
          return;
        }
      }

      enemy.wanderTimer -= delta;
      if (enemy.wanderTimer <= 0) {
        if (Math.random() < 0.18) {
          enemy.setVelocity(0, 0);
          enemy.wanderTimer = Phaser.Math.Between(800, 2000);
        } else {
          const angle = Math.random() * Math.PI * 2;
          enemy.setVelocity(Math.cos(angle) * spd, Math.sin(angle) * spd);
          enemy.wanderTimer = Phaser.Math.Between(1000, 3000);
        }
      }
    });

    // ── Horse wander AI ───────────────────────────────────────────────────
    this.horses.forEach(horse => {
      if (horse.isMounted) return;
      horse.wanderTimer -= delta;
      if (horse.wanderTimer <= 0) {
        const tx = Phaser.Math.Clamp(
          horse.baseX + Phaser.Math.Between(-96, 96), 0, this.mapWidth * TILE);
        const ty = Phaser.Math.Clamp(
          horse.baseY + Phaser.Math.Between(-96, 96), 0, this.mapHeight * TILE);
        this.tweens.add({ targets: horse, x: tx, y: ty, duration: 1800, ease: 'Sine.easeInOut' });
        horse.wanderTimer = Phaser.Math.Between(4000, 9000);
      }
    });

    // ── Boss proximity warning ─────────────────────────────────────────────
    if (this.enemyGroup && !this.battleCooldown && !this._dialogueActive) {
      this.enemyGroup.getChildren().forEach(e => {
        if (!e.enemyData?.isBoss) return;
        const dx = e.x - this.player.x, dy = e.y - this.player.y;
        if (dx * dx + dy * dy < 180 * 180) {
          this._showBossWarning(e);
        }
      });
    }

    // ── Player depth by elevation ─────────────────────────────────────────
    this.player.setDepth(10 + (this.playerElevation || 0) * 5);

    // ── Auto-drop when walking off elevated edge ──────────────────────────
    if ((this.playerElevation || 0) > 0 && !this.isJumping) {
      const pr2 = Math.floor(this.player.y / TILE);
      const pc2 = Math.floor(this.player.x / TILE);
      const curElev = this.elevMap?.[pr2]?.[pc2] ?? 0;
      if (curElev < (this.playerElevation || 0)) {
        this.playerElevation = curElev;
        this._rebuildElevationColliders();
        this.scene.get('HUDScene')?.updateHUD();
        // Squash landing visual
        const sc = this.player.scaleX;
        this.tweens.add({
          targets: this.player,
          scaleY: sc * 0.7,
          duration: 100, yoyo: true, ease: 'Bounce.easeOut',
        });
      }
    }

    // ── Explored tiles update ─────────────────────────────────────────────
    const pr = Math.floor(this.player.y / TILE);
    const pc = Math.floor(this.player.x / TILE);
    const radius = 5;
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        if (dr * dr + dc * dc <= radius * radius) {
          window.GameState.explored.add((pr + dr) + ',' + (pc + dc));
        }
      }
    }
  }

  // ─────────────────── UTILS ──────────────────────────────────────────────

  _showLevelUpEffect(lv, heartGained) {
  const cx = this.cameras.main.scrollX + 480;
  const cy = this.cameras.main.scrollY + 320;

  // Gold screen flash
  const flash = this.add.rectangle(cx, cy, 960, 640,
    heartGained ? 0xff66aa : 0xffd700, 0.45).setDepth(105).setScrollFactor(0);
  this.tweens.add({ targets: flash, alpha: 0, duration: 600, ease: 'Power2', onComplete: () => flash.destroy() });

  // Big LEVEL UP text
  const col  = heartGained ? '#ff99cc' : '#ffd700';
  const msg  = heartGained ? 'LEVEL ' + lv + '!\n+1 MAX HEART ♥' : 'LEVEL UP!\nLv.' + lv + '  (+HP)';
  const t = this.add.text(cx, cy - 40, msg, {
    fontSize: '34px', fontFamily: 'monospace', fontStyle: 'bold',
    color: col, stroke: '#000', strokeThickness: 5, align: 'center'
  }).setOrigin(0.5).setDepth(106).setScrollFactor(0).setAlpha(0).setScale(0.5);
  this.tweens.add({
    targets: t, alpha: 1, scaleX: 1, scaleY: 1,
    duration: 280, ease: 'Back.easeOut',
    onComplete: () => {
      this.time.delayedCall(1200, () => {
        this.tweens.add({ targets: t, y: t.y - 60, alpha: 0, duration: 800, ease: 'Power2', onComplete: () => t.destroy() });
      });
    }
  });

  // Pixel burst around player
  const burstCol = heartGained ? 0xff66aa : 0xffd700;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const dist = 50 + Math.floor(Math.random() * 40);
    const g = this.add.graphics().setDepth(105).setScrollFactor(0);
    g.fillStyle(burstCol, 1);
    g.fillRect(-3, -3, 6, 6);
    g.x = cx; g.y = cy;
    this.tweens.add({
      targets: g,
      x: cx + Math.cos(a) * dist,
      y: cy + Math.sin(a) * dist,
      alpha: 0,
      duration: 500, ease: 'Power2',
      onComplete: () => g.destroy()
    });
  }

  this.cameras.main.shake(200, 0.003);
}

  showMessage(text, color = '#ffffff') {
    const t = this.add.text(
      this.cameras.main.scrollX + 480,
      this.cameras.main.scrollY + 320,
      text, {
        fontSize: '22px', fontFamily: 'monospace', fontStyle: 'bold',
        color, stroke: '#000', strokeThickness: 4
      }
    ).setOrigin(0.5).setDepth(100);
    this.tweens.add({
      targets: t, y: t.y - 80, alpha: 0,
      duration: 2000, ease: 'Power2',
      onComplete: () => t.destroy()
    });
  }
}
