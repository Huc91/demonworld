const TILE = 32;

class WorldScene extends Phaser.Scene {
  constructor() { super({ key: 'WorldScene' }); }

  create() {
    this.battleCooldown = false;

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
        if (window.GameState.playerDeck.length < 40) {
          window.GameState.playerDeck.push(reward.card);
        }
      }
      if (window.GameState.defeatedEnemy) {
        window.GameState.defeatedEnemy.destroy();
        window.GameState.defeatedEnemy = null;
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
        changed.forEach(qid => {
          const q = window.QUEST_MAP[qid];
          if (q && !qid.endsWith('_unlocked')) {
            this.time.delayedCall(800, () => {
              this.showMessage('QUEST COMPLETE: ' + q.name + '!', '#ffd700');
              this.scene.get('HUDScene').updateHUD();
            });
          } else if (qid.endsWith('_unlocked')) {
            const realId = qid.replace('_unlocked', '');
            const q2 = window.QUEST_MAP[realId];
            if (q2) {
              this.time.delayedCall(1600, () => {
                this.showMessage('NEW QUEST: ' + q2.name, '#44ff88');
              });
            }
          }
        });
      }

      this.battleCooldown = false;
      this.physics.resume();
      const hud = this.scene.get('HUDScene');
      hud.updateHUD();
      hud.showReward(reward.money, reward.card);

      // Auto-save after every battle win
      window.saveGame();
    });

    this.events.on('battleLost', () => {
      window.GameState.hearts = Math.max(0, window.GameState.hearts - 1);
      this.battleCooldown = false;
      this.physics.resume();

      if (window.GameState.hearts <= 0) {
        this._triggerDeath();
      } else {
        const cp = window.GameState.checkpoint;
        if (cp) {
          this.player.setPosition(cp.x, cp.y);
        } else {
          this.player.setPosition(window.GameState.spawnX, window.GameState.spawnY);
        }
        this.scene.get('HUDScene').updateHUD();
        this.showMessage('Lost a heart! ♥ x' + window.GameState.hearts, '#ff4444');
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

    // ── Chest (32×32) ─────────────────────────────────────────────────────
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
    const W = 320, H = 200;
    this.mapWidth  = W;
    this.mapHeight = H;

    const GRASS = 0, DIRT = 1, WATER = 2, WALL = 3, FLOOR = 4,
          TREE = 5, MOUNTAIN = 6, SAND = 7, GRAVE_GRASS = 8;

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

    // ── Render tiles ─────────────────────────────────────────────────────
    const tileKeys = [
      'tile_grass', 'tile_dirt', 'tile_water', 'tile_wall', 'tile_floor',
      'tile_tree', 'tile_mountain', 'tile_sand', 'tile_grave_grass'
    ];
    const blocking = [false, false, true, true, false, true, true, false, false];

    this.wallGroup  = this.physics.add.staticGroup();
    this.waterTiles = [];

    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        const t = map[r][c];
        const x = c * TILE + TILE/2, y = r * TILE + TILE/2;
        const img = this.add.image(x, y, tileKeys[t]).setDepth(0);
        if (blocking[t]) {
          this.physics.add.existing(img, true);
          img.body.setSize(TILE, TILE);
          img.body.reset(x, y);
          this.wallGroup.add(img);
        }
        if (t === WATER) {
          this.waterTiles.push(img);
        }
      }
    }

    this.mapData = map;
    window.GameState.mapData = map;
    this.physics.world.setBounds(0, 0, W * TILE, H * TILE);
  }

  // ─────────────────── PLAYER ─────────────────────────────────────────────

  buildPlayer() {
    const spawnX = 121 * TILE + TILE/2;
    const spawnY = 76  * TILE + TILE/2;
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

    // Jump shadow (hidden by default)
    this.jumpShadow = this.add.ellipse(0, 0, 22, 10, 0x000000, 0.45).setDepth(9).setVisible(false);

    this.playerLabel = this.add.text(0, 0, 'YOU', {
      fontSize: '10px', fontFamily: 'monospace',
      color: '#ffffff', stroke: '#000', strokeThickness: 2
    }).setDepth(11).setOrigin(0.5);
  }

  // ─────────────────── ENEMIES ────────────────────────────────────────────

  buildEnemies() {
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

    this.physics.add.overlap(this.player, this.enemyGroup, (player, enemy) => {
      if (this.battleCooldown) return;
      this.battleCooldown = true;
      window.GameState.playerX = player.x;
      window.GameState.playerY = player.y;
      window.GameState.defeatedEnemy = enemy;
      window.GameState.currentEnemySpawnId = enemy.spawnId || null;

      this.physics.pause();
      this.cameras.main.flash(250, 200, 0, 0);
      // Screen shake on battle start
      this.cameras.main.shake(300, 0.008);
      this.time.delayedCall(300, () => {
        this.scene.launch('BattleScene', { enemy: enemy.enemyData });
        this.scene.pause();
      });
    });
  }

  // ─────────────────── CAMERA ─────────────────────────────────────────────

  buildCamera() {
    this.cameras.main.setBounds(0, 0, this.mapWidth * TILE, this.mapHeight * TILE);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.2);
    this.cameras.main.setBackgroundColor('#0a0a12');
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
    this.campfires = [];

    // Positions: near villages, key waypoints, dungeon entrances
    const positions = [
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

    const RARE_CARDS = ['demon_019','demon_020','demon_021','demon_022','demon_023',
                        'demon_030','demon_025','demon_036','demon_046','demon_066'];

    // Chests scattered across the world including new areas
    const positions = [
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

    // Deduplicate NPCs by pixel position (some quests share an NPC)
    const placed = new Map();

    window.QUESTS.forEach(quest => {
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
            return s && (s.status === 'active' || s.status === 'complete');
          });
          n.marker.setVisible(hasActive);
        });
      },
    });
  }

  // ─────────────────── PONEGLYPHS ─────────────────────────────────────────

  buildPoneglyphs() {
    this.poneglyphs = [];

    // 5 poneglyph stones, each with a fragment of the hidden lore
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
    // The boat sits in the Eastern Harbor — a teaser for island travel
    const bx = 296 * TILE + TILE/2;
    const by = 110 * TILE + TILE/2;

    this.boatSprite = this.add.sprite(bx, by, 'boat').setDepth(9).setScale(1.4);

    // Gentle bob
    this.tweens.add({
      targets: this.boatSprite,
      y: by + 5,
      duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // Harbor master NPC next to boat
    const npcSprite = this.add.sprite(bx - 40, by - 10, 'npc').setDepth(10).setScale(1.0);
    this.tweens.add({ targets: npcSprite, y: by - 16, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.add.text(bx - 40, by - 36, 'Harbor Master', {
      fontSize: '9px', fontFamily: 'monospace', color: '#88ccff',
      stroke: '#000', strokeThickness: 2,
      backgroundColor: '#00000066', padding: { x: 3, y: 1 },
    }).setDepth(11).setOrigin(0.5);

    // Store for interaction
    this.harborMasterPos = { x: bx - 40, y: by - 10 };
  }

  // ─────────────────── ANIMALS ────────────────────────────────────────────

  buildAnimals() {
    if (!window.ANIMAL_KEYS || window.ANIMAL_KEYS.length === 0) return;
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

  // ─────────────────── JUMP ───────────────────────────────────────────────

  _doJump() {
    if (this.isJumping || this.jumpCooldown) return;
    this.isJumping   = true;
    this.jumpCooldown = true;

    // Show shadow at current ground position
    this.jumpShadow.setPosition(this.player.x, this.player.y + 10).setVisible(true);

    // Remove water colliders temporarily
    this.wallCollider.active = false;

    const baseY = this.player.y;
    this.tweens.add({
      targets: this.player,
      y: baseY - 22,
      duration: 200,
      ease: 'Sine.easeOut',
      yoyo: true,
      onComplete: () => {
        this.player.setY(baseY);
        this.isJumping        = false;
        this.wallCollider.active = true;
        this.jumpShadow.setVisible(false);
        this.time.delayedCall(600, () => { this.jumpCooldown = false; });
      }
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

    const cx = this.cameras.main.scrollX + 480;
    const cy = this.cameras.main.scrollY + 500;
    const W = 680, H = 95;
    const bg = this.add.graphics().setDepth(300);
    bg.fillStyle(0x001020, 0.95); bg.fillRoundedRect(cx - W/2, cy - H/2, W, H, 8);
    bg.lineStyle(2, 0x3388cc); bg.strokeRoundedRect(cx - W/2, cy - H/2, W, H, 8);

    const nameT = this.add.text(cx - W/2 + 14, cy - H/2 + 8, 'Harbor Master Kael', {
      fontSize: '13px', fontFamily: 'monospace', fontStyle: 'bold', color: '#55aaff',
    }).setDepth(301);

    const msg = '"The sea beyond this harbor leads to islands no one has mapped in twenty years.\nRoger sailed them all. Said each island had its own kind of cards — born from the land itself.\nI\'m refitting the ship. Come back when you\'re stronger. This route is not for the faint of heart."';
    const bodyT = this.add.text(cx - W/2 + 14, cy - H/2 + 28, msg, {
      fontSize: '10px', fontFamily: 'monospace', color: '#aaccee',
      wordWrap: { width: W - 28 }, fontStyle: 'italic',
    }).setDepth(301);

    const hint = this.add.text(cx + W/2 - 10, cy + H/2 - 8, '[F] close', {
      fontSize: '9px', fontFamily: 'monospace', color: '#334455',
    }).setDepth(301).setOrigin(1, 1);

    const close = () => {
      [bg, nameT, bodyT, hint].forEach(o => o.destroy());
      this._dialogueActive = false;
    };
    this.input.keyboard.once('keydown-F', close);
    this.time.delayedCall(7000, () => { if (this._dialogueActive) close(); });
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
    if (!activeQuest) {
      // Fall back to first quest
      activeQuest = window.QUEST_MAP[npcObj.questIds[0]];
    }

    const text = activeQuest?.dialogue?.[dialogueKey] ?? 'Greetings, traveller.';
    const npcName = npcObj.questIds[0] ? (window.QUEST_MAP[npcObj.questIds[0]]?.npc ?? 'NPC') : 'NPC';

    // Show dialogue box
    const cx = this.cameras.main.scrollX + 480;
    const cy = this.cameras.main.scrollY + 500;
    const W = 700, H = 90;

    const bg   = this.add.graphics().setDepth(300);
    bg.fillStyle(0x0a0018, 0.94); bg.fillRoundedRect(cx - W/2, cy - H/2, W, H, 8);
    bg.lineStyle(2, 0x8844cc);    bg.strokeRoundedRect(cx - W/2, cy - H/2, W, H, 8);

    const nameT = this.add.text(cx - W/2 + 14, cy - H/2 + 8, npcName, {
      fontSize: '13px', fontFamily: 'monospace', fontStyle: 'bold', color: '#cc88ff',
      stroke: '#000', strokeThickness: 2,
    }).setDepth(301);

    const bodyT = this.add.text(cx - W/2 + 14, cy - H/2 + 28, text, {
      fontSize: '12px', fontFamily: 'monospace', color: '#ddddee',
      wordWrap: { width: W - 28 },
    }).setDepth(301);

    const hint = this.add.text(cx + W/2 - 10, cy + H/2 - 8, '[F] close', {
      fontSize: '9px', fontFamily: 'monospace', color: '#555566',
    }).setDepth(301).setOrigin(1, 1);

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
      if (window.GameState.playerDeck.length < 40) window.GameState.playerDeck.push(card);
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

  // ─────────────────── UPDATE ─────────────────────────────────────────────

  update(time, delta) {
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
        this.player.play(vy < 0 ? 'player_walk_up' : 'player_walk_down', true);
      } else {
        this.player.play(vx < 0 ? 'player_walk_left' : 'player_walk_right', true);
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

    // ── Enemy wander AI ───────────────────────────────────────────────────
    this.enemyGroup.getChildren().forEach(enemy => {
      enemy.wanderTimer -= delta;
      if (enemy.wanderTimer <= 0) {
        const isBoss = enemy.enemyData.isBoss;
        const spd    = enemy.enemyData.moveSpeed * (isBoss ? 0.7 : 1);

        if (isBoss && Math.random() < 0.35) {
          const dx   = this.player.x - enemy.x;
          const dy   = this.player.y - enemy.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 1600) {
            enemy.setVelocity((dx / dist) * spd * 1.5, (dy / dist) * spd * 1.5);
            enemy.wanderTimer = 1500;
            return;
          }
        }
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
