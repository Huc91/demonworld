class WorldScene extends Phaser.Scene {
  constructor() { super({ key: 'WorldScene' }); }

  create() {
    this.battleCooldown = false;
    this.buildMap();
    this.buildPlayer();
    this.buildEnemies();
    this.buildCamera();
    this.buildControls();
    this.buildMinimap();

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
      this.battleCooldown = false;
      this.physics.resume();
      const hud = this.scene.get('HUDScene');
      hud.updateHUD();
      hud.showReward(reward.money, reward.card);
    });

    this.events.on('battleLost', () => {
      window.GameState.playerMoney = Math.max(0, window.GameState.playerMoney - 10);
      this.player.setPosition(window.GameState.spawnX, window.GameState.spawnY);
      this.battleCooldown = false;
      this.physics.resume();
      this.scene.get('HUDScene').updateHUD();
      this.showMessage('Defeated! (-10G)', '#ff4444');
    });
  }

  // ─────────────────── MAP ─────────────────────────────────────────────

  buildMap() {
    const W = 160, H = 100;
    this.mapWidth = W;
    this.mapHeight = H;

    const GRASS = 0, DIRT = 1, WATER = 2, WALL = 3, FLOOR = 4, TREE = 5,
          MOUNTAIN = 6, SAND = 7, GRAVE_GRASS = 8;

    const map = [];
    for (let r = 0; r < H; r++) {
      map[r] = [];
      for (let c = 0; c < W; c++) map[r][c] = GRASS;
    }

    const set = (r, c, t) => { if (r >= 0 && r < H && c >= 0 && c < W) map[r][c] = t; };
    const rect = (r0, c0, r1, c1, t) => {
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) set(r, c, t);
    };

    // ── Forest border ──────────────────────────────────────────────────
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
      if (r < 4 || r >= H-4 || c < 4 || c >= W-4) map[r][c] = TREE;
    }

    // ── Random trees in wilderness (north half) ───────────────────────
    for (let r = 5; r < 45; r++) for (let c = 5; c < W-5; c++) {
      if (Math.random() < 0.04) map[r][c] = TREE;
    }

    // ── Mountain range (north, blocking passage) ──────────────────────
    // Far north mountain wall with a narrow pass
    for (let c = 5; c < 65; c++) {
      set(10, c, MOUNTAIN); set(11, c, MOUNTAIN);
    }
    for (let c = 70; c < 130; c++) {
      set(10, c, MOUNTAIN); set(11, c, MOUNTAIN);
    }
    // Mountain pass at c=65-70 (narrow gap)
    for (let c = 65; c < 70; c++) {
      set(10, c, DIRT); set(11, c, DIRT);
    }
    // Second mountain row (jagged)
    for (let c = 5; c < 40; c += 3)  set(12, c, MOUNTAIN);
    for (let c = 80; c < 130; c += 3) set(12, c, MOUNTAIN);

    // ── River (vertical, slightly off-center) ─────────────────────────
    for (let r = 12; r < 88; r++) {
      set(r, 32, WATER); set(r, 33, WATER); set(r, 34, WATER);
    }
    // Bridge 1 (near town)
    for (let r = 42; r < 50; r++) {
      set(r, 32, DIRT); set(r, 33, DIRT); set(r, 34, DIRT);
    }
    // Bridge 2 (north)
    for (let r = 18; r < 22; r++) {
      set(r, 32, DIRT); set(r, 33, DIRT); set(r, 34, DIRT);
    }

    // ── MAIN TOWN (center-left) ────────────────────────────────────────
    const TY1 = 40, TY2 = 70, TX1 = 40, TX2 = 82;
    rect(TY1, TX1, TY2, TX2, FLOOR);
    // Walls
    for (let r = TY1; r <= TY2; r++) { set(r, TX1, WALL); set(r, TX2, WALL); }
    for (let c = TX1; c <= TX2; c++) { set(TY1, c, WALL); set(TY2, c, WALL); }
    // Gates
    for (let c = 58; c <= 62; c++) { set(TY1, c, FLOOR); set(TY2, c, FLOOR); }
    set(TY1-1, 60, DIRT); set(TY1-2, 60, DIRT); // north approach
    set(TY2+1, 60, DIRT); set(TY2+2, 60, DIRT); // south approach
    set(53, TX1, FLOOR); set(54, TX1, FLOOR);    // west gate
    set(53, TX2, FLOOR); set(54, TX2, FLOOR);    // east gate

    // Town buildings (4 blocks)
    rect(43, 43, 50, 55, WALL);  set(50, 49, FLOOR);  // NW building
    rect(43, 65, 50, 78, WALL);  set(50, 71, FLOOR);  // NE building
    rect(58, 43, 65, 55, WALL);  set(58, 49, FLOOR);  // SW building
    rect(58, 65, 65, 78, WALL);  set(58, 71, FLOOR);  // SE building

    // Town courtyard (center plaza)
    rect(50, 55, 58, 65, FLOOR); // open plaza

    // ── Paths ─────────────────────────────────────────────────────────
    // Main road (west-east through town)
    for (let c = 4; c < 40; c++) { set(53, c, DIRT); set(54, c, DIRT); }  // west approach
    for (let c = 83; c < W-4; c++) { set(53, c, DIRT); set(54, c, DIRT); } // east road
    // North road (from town gate to mountain pass)
    for (let r = 12; r < TY1; r++) { set(r, 60, DIRT); set(r, 61, DIRT); }
    // South road
    for (let r = TY2; r < 88; r++) { set(r, 60, DIRT); set(r, 61, DIRT); }

    // ── DUNGEON AREA (north-east) ─────────────────────────────────────
    rect(5, 95, 22, 118, FLOOR);
    // Outer dungeon wall
    for (let r = 5; r <= 22; r++) { set(r, 95, WALL); set(r, 118, WALL); }
    for (let c = 95; c <= 118; c++) { set(5, c, WALL); set(22, c, WALL); }
    // Dungeon gate
    set(22, 106, FLOOR); set(22, 107, FLOOR);
    // Dungeon interior divisions
    rect(10, 98, 15, 108, WALL);  set(15, 103, FLOOR);
    rect(10, 110, 15, 118, WALL); set(15, 114, FLOOR);
    // Path from dungeon to mountain pass
    for (let c = 68; c < 95; c++) { set(13, c, DIRT); set(14, c, DIRT); }
    for (let r = 14; r < 22; r++) { set(r, 95, DIRT); }

    // ── SWAMP (south-west) ────────────────────────────────────────────
    for (let r = 72; r < 88; r++) for (let c = 5; c < 32; c++) {
      if (Math.random() < 0.4) set(r, c, WATER);
    }
    // Swamp path (raised dirt through swamp)
    for (let r = 72; r < 88; r++) { set(r, 16, DIRT); set(r, 17, DIRT); }

    // ── DESERT ZONE (east) ───────────────────────────────────────────
    rect(28, 100, 88, 155, SAND);
    // Desert ruins (stone walls in desert)
    rect(40, 108, 55, 125, WALL);
    rect(41, 109, 54, 124, SAND); // hollow
    // Ruins gates
    set(40, 115, SAND); set(40, 116, SAND);
    set(55, 115, SAND); set(55, 116, SAND);
    set(47, 108, SAND); set(48, 108, SAND);
    set(47, 125, SAND); set(48, 125, SAND);
    // Inside ruins: desert floor
    rect(60, 108, 75, 125, WALL);
    rect(61, 109, 74, 124, SAND);
    set(60, 115, SAND); set(60, 116, SAND);
    set(75, 115, SAND); set(75, 116, SAND);

    // ── GRAVEYARD (south-east) ────────────────────────────────────────
    rect(72, 72, 92, 100, GRAVE_GRASS);
    // Graveyard wall
    for (let r = 72; r <= 92; r++) { set(r, 72, WALL); set(r, 100, WALL); }
    for (let c = 72; c <= 100; c++) { set(72, c, WALL); set(92, c, WALL); }
    set(92, 85, GRAVE_GRASS); set(92, 86, GRAVE_GRASS); // gate
    // Small mausoleum in center of graveyard
    rect(78, 82, 85, 92, WALL);
    rect(79, 83, 84, 91, FLOOR);
    set(78, 86, FLOOR); set(78, 87, FLOOR); // entrance

    // ── SECOND VILLAGE (north-west of desert) ─────────────────────────
    const V2Y1 = 28, V2Y2 = 45, V2X1 = 90, V2X2 = 108;
    rect(V2Y1, V2X1, V2Y2, V2X2, FLOOR);
    for (let r = V2Y1; r <= V2Y2; r++) { set(r, V2X1, WALL); set(r, V2X2, WALL); }
    for (let c = V2X1; c <= V2X2; c++) { set(V2Y1, c, WALL); set(V2Y2, c, WALL); }
    set(V2Y1, 98, FLOOR); set(V2Y1, 99, FLOOR); // north gate
    set(V2Y2, 98, FLOOR); set(V2Y2, 99, FLOOR); // south gate
    // Village buildings
    rect(31, 93, 36, 100, WALL);  set(36, 96, FLOOR);
    rect(31, 102, 36, 108, WALL); set(36, 105, FLOOR);
    rect(38, 93, 43, 100, WALL);  set(38, 96, FLOOR);
    rect(38, 102, 43, 108, WALL); set(38, 105, FLOOR);

    // Path from main road to second village
    for (let c = 84; c < V2X1; c++) { set(53, c, DIRT); }
    for (let r = V2Y2; r < 54; r++) { set(r, 99, DIRT); }

    // Path to graveyard
    for (let r = TY2; r < 72; r++) { set(r, 85, DIRT); set(r, 86, DIRT); }
    for (let c = 85; c < 100; c++) { set(72, c, DIRT); }

    // Path to desert (east from main road)
    for (let r = 50; r < 60; r++) { set(r, 100, DIRT); }

    // ── Render ────────────────────────────────────────────────────────
    const tileKeys = ['tile_grass','tile_dirt','tile_water','tile_wall','tile_floor','tile_tree','tile_mountain','tile_sand','tile_grave_grass'];
    const blocking = [false, false, true, true, false, true, true, false, false];

    this.wallGroup = this.physics.add.staticGroup();

    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        const t = map[r][c];
        const x = c * 32 + 16, y = r * 32 + 16;
        const img = this.add.image(x, y, tileKeys[t]).setDepth(0);
        if (blocking[t]) {
          this.physics.add.existing(img, true);
          this.wallGroup.add(img);
        }
      }
    }

    this.mapData = map;
    this.physics.world.setBounds(0, 0, W * 32, H * 32);
  }

  // ─────────────────── PLAYER ──────────────────────────────────────────

  buildPlayer() {
    // Spawn just south of main town gate (north gate)
    const spawnX = 61 * 32 + 16;
    const spawnY = 38 * 32 + 16;
    window.GameState.spawnX = spawnX;
    window.GameState.spawnY = spawnY;

    this.player = this.physics.add.sprite(
      window.GameState.playerX || spawnX,
      window.GameState.playerY || spawnY,
      'player'
    ).setDepth(10).setCollideWorldBounds(true);
    this.player.body.setSize(20, 20);
    this.player.setScale(1.4); // slightly bigger for visibility

    this.physics.add.collider(this.player, this.wallGroup);

    this.playerLabel = this.add.text(0, 0, 'YOU', {
      fontSize: '10px', fontFamily: 'monospace',
      color: '#ffffff', stroke: '#000', strokeThickness: 2
    }).setDepth(11).setOrigin(0.5);
  }

  // ─────────────────── ENEMIES ─────────────────────────────────────────

  buildEnemies() {
    this.enemyGroup = this.physics.add.group();

    const E = window.ENEMIES;
    const spawns = [
      // — Wilderness (north, easy) —
      { x: 15*32, y: 15*32, ei: 0 }, { x: 22*32, y: 8*32,  ei: 0 },
      { x: 8*32,  y: 7*32,  ei: 0 }, { x: 25*32, y: 14*32, ei: 1 },
      { x: 12*32, y: 20*32, ei: 1 }, { x: 20*32, y: 25*32, ei: 2 },
      { x: 8*32,  y: 28*32, ei: 1 }, { x: 18*32, y: 18*32, ei: 0 },
      // — Near first river (medium) —
      { x: 28*32, y: 30*32, ei: 2 }, { x: 26*32, y: 38*32, ei: 2 },
      { x: 28*32, y: 55*32, ei: 3 }, { x: 27*32, y: 65*32, ei: 3 },
      // — East road (medium) —
      { x: 90*32, y: 55*32, ei: 3 }, { x: 95*32, y: 58*32, ei: 3 },
      { x: 100*32, y: 52*32, ei: 4 },
      // — Dungeon area (hard) —
      { x: 100*32, y: 10*32, ei: 5 }, { x: 108*32, y: 14*32, ei: 5 },
      { x: 112*32, y: 8*32,  ei: 6 }, { x: 105*32, y: 18*32, ei: 6 },
      // — Swamp (medium-hard) —
      { x: 10*32, y: 78*32, ei: 4 }, { x: 15*32, y: 82*32, ei: 4 },
      { x: 20*32, y: 76*32, ei: 5 },
      // — Desert zone (hard) —
      { x: 115*32, y: 40*32, ei: 5 }, { x: 120*32, y: 45*32, ei: 5 },
      { x: 130*32, y: 55*32, ei: 6 }, { x: 125*32, y: 65*32, ei: 6 },
      { x: 140*32, y: 50*32, ei: 6 },
      // — Graveyard (hard) —
      { x: 80*32, y: 78*32, ei: 6 }, { x: 88*32, y: 82*32, ei: 6 },
      { x: 84*32, y: 76*32, ei: 5 },
      // — Second village outskirts (medium) —
      { x: 86*32, y: 30*32, ei: 3 }, { x: 93*32, y: 25*32, ei: 4 },
      // — BOSS AREAS (far from start) —
      { x: 110*32, y: 14*32, ei: 7 },  // Shadow Lord in dungeon
      { x: 145*32, y: 60*32, ei: 8 },  // Arena Champ in deep desert
      { x: 85*32,  y: 88*32, ei: 9 },  // Devil King near graveyard
    ];

    spawns.forEach(sp => {
      if (sp.x >= this.mapWidth*32 || sp.y >= this.mapHeight*32) return;
      const enemyDef = E[sp.ei];
      const sprite = this.physics.add.sprite(sp.x, sp.y, enemyDef.sprite)
        .setDepth(9).setCollideWorldBounds(true);
      sprite.enemyData = enemyDef;
      sprite.wanderTimer = Phaser.Math.Between(500, 2500);
      sprite.body.setSize(22, 22);
      sprite.setScale(1.3);

      if (enemyDef.isBoss) {
        sprite.setScale(1.9);
        // Pulsing tint effect for bosses
        this.tweens.add({
          targets: sprite, tint: { from: 0xff8800, to: 0xff2200 },
          duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });
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

      this.physics.pause();
      this.cameras.main.flash(250, 200, 0, 0);

      this.time.delayedCall(300, () => {
        this.scene.launch('BattleScene', { enemy: enemy.enemyData });
        this.scene.pause();
      });
    });
  }

  // ─────────────────── CAMERA ──────────────────────────────────────────

  buildCamera() {
    this.cameras.main.setBounds(0, 0, this.mapWidth * 32, this.mapHeight * 32);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.2); // slightly zoomed in for retro feel
    this.cameras.main.setBackgroundColor('#0a0a12');
  }

  // ─────────────────── CONTROLS ────────────────────────────────────────

  buildControls() {
    this.cursors = this.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      down:  Phaser.Input.Keyboard.KeyCodes.S,
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      up2:   Phaser.Input.Keyboard.KeyCodes.UP,
      down2: Phaser.Input.Keyboard.KeyCodes.DOWN,
      left2: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right2:Phaser.Input.Keyboard.KeyCodes.RIGHT,
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

  // ─────────────────── MINIMAP ─────────────────────────────────────────

  buildMinimap() {
    // Small minimap in top-right of HUDScene, rendered here for world coords
    this._minimapDirty = true;
  }

  // ─────────────────── UPDATE ──────────────────────────────────────────

  update(time, delta) {
    const speed = 200;
    const { up, down, left, right, up2, down2, left2, right2 } = this.cursors;
    let vx = 0, vy = 0;
    if (left.isDown  || left2.isDown)  vx = -speed;
    if (right.isDown || right2.isDown) vx =  speed;
    if (up.isDown    || up2.isDown)    vy = -speed;
    if (down.isDown  || down2.isDown)  vy =  speed;
    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }
    this.player.setVelocity(vx, vy);
    if (vx < 0) this.player.setFlipX(true);
    else if (vx > 0) this.player.setFlipX(false);
    this.playerLabel.setPosition(this.player.x, this.player.y - 26);

    // Enemy wander AI (simple but different for bosses)
    this.enemyGroup.getChildren().forEach(enemy => {
      enemy.wanderTimer -= delta;
      if (enemy.wanderTimer <= 0) {
        const isBoss = enemy.enemyData.isBoss;
        const spd = enemy.enemyData.moveSpeed * (isBoss ? 0.7 : 1);

        // Bosses occasionally charge toward player
        if (isBoss && Math.random() < 0.35) {
          const dx = this.player.x - enemy.x;
          const dy = this.player.y - enemy.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 800) {
            enemy.setVelocity((dx/dist)*spd*1.5, (dy/dist)*spd*1.5);
            enemy.wanderTimer = 1500;
            return;
          }
        }

        if (Math.random() < 0.18) {
          enemy.setVelocity(0, 0);
          enemy.wanderTimer = Phaser.Math.Between(800, 2000);
        } else {
          const angle = Math.random() * Math.PI * 2;
          enemy.setVelocity(Math.cos(angle)*spd, Math.sin(angle)*spd);
          enemy.wanderTimer = Phaser.Math.Between(1000, 3000);
        }
      }
    });
  }

  showMessage(text, color = '#ffffff') {
    const t = this.add.text(
      this.cameras.main.scrollX + 480,
      this.cameras.main.scrollY + 320,
      text, { fontSize: '24px', fontFamily: 'monospace', fontStyle: 'bold', color, stroke: '#000', strokeThickness: 4 }
    ).setOrigin(0.5).setDepth(100);
    this.tweens.add({ targets: t, y: t.y - 80, alpha: 0, duration: 2000, ease: 'Power2', onComplete: () => t.destroy() });
  }
}
