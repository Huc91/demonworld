/**
 * SeaScene — Boat travel transition between islands.
 * Receives init data: { destination: 0|1|2 }
 * Shows animated ocean, sailing ship, destination text.
 * After 3s transitions to WorldScene on the new island.
 */
class SeaScene extends Phaser.Scene {
  constructor() { super({ key: 'SeaScene' }); }

  init(data) {
    this._dest = data.destination ?? 0;
  }

  create() {
    const W = 960, H = 640;
    const DEST_NAMES = ['Home Island', 'Inferno Island', 'Frost Wastes'];

    // ── Ocean background (tiled dark-blue rectangles) ─────────────────────
    const bgGfx = this.add.graphics();
    bgGfx.fillStyle(0x001133);
    bgGfx.fillRect(0, 0, W, H);

    // Wave rows — dark/light alternating bands (GBA ocean look)
    const waveColors = [0x002255, 0x001a44, 0x003366, 0x001a44];
    for (let row = 0; row < 16; row++) {
      const wy = row * 40;
      const wh = 40;
      this.add.graphics()
        .fillStyle(waveColors[row % waveColors.length], 1)
        .fillRect(0, wy, W, wh);
    }

    // Animated horizontal wave lines
    this._waveGfx = this.add.graphics().setDepth(1);
    this._waveTime = 0;

    // ── Horizon line ─────────────────────────────────────────────────────
    this.add.graphics().fillStyle(0x112244).fillRect(0, 0, W, 160).setDepth(0);
    // Sky gradient hint (dark above)
    for (let i = 0; i < 8; i++) {
      const shade = Math.floor(0x050508 + i * 0x001100);
      this.add.graphics().fillStyle(shade, 1).fillRect(0, i * 20, W, 20).setDepth(0);
    }

    // Stars at top
    for (let i = 0; i < 60; i++) {
      const sx = Math.random() * W;
      const sy = Math.random() * 140;
      const sz = Math.random() < 0.2 ? 2 : 1;
      this.add.graphics().fillStyle(0xffffff, 0.7).fillRect(sx, sy, sz, sz).setDepth(1);
    }

    // ── Ship sprite (drawn procedurally) ─────────────────────────────────
    if (!this.textures.exists('sea_ship')) {
      const sh = this.textures.createCanvas('sea_ship', 96, 80);
      const ctx = sh.getContext();
      // Hull
      ctx.fillStyle = '#6b3a1a';
      ctx.beginPath();
      ctx.moveTo(8, 50); ctx.lineTo(88, 50);
      ctx.lineTo(80, 68); ctx.lineTo(16, 68);
      ctx.closePath(); ctx.fill();
      // Hull highlight
      ctx.fillStyle = '#8b5a30';
      ctx.fillRect(10, 48, 76, 4);
      // Deck
      ctx.fillStyle = '#9b7040';
      ctx.fillRect(14, 36, 68, 16);
      // Mast
      ctx.fillStyle = '#5a3010';
      ctx.fillRect(45, 6, 4, 48);
      // Main sail
      ctx.fillStyle = '#eeddcc';
      ctx.beginPath();
      ctx.moveTo(49, 8); ctx.lineTo(76, 28); ctx.lineTo(49, 38);
      ctx.closePath(); ctx.fill();
      // Sail shadow
      ctx.fillStyle = '#ccbbaa';
      ctx.beginPath();
      ctx.moveTo(47, 8); ctx.lineTo(47, 38); ctx.lineTo(30, 30);
      ctx.closePath(); ctx.fill();
      // Crow's nest
      ctx.fillStyle = '#6b3a1a';
      ctx.fillRect(42, 4, 10, 6);
      // Flag
      ctx.fillStyle = '#cc0022';
      ctx.beginPath();
      ctx.moveTo(49, 5); ctx.lineTo(64, 10); ctx.lineTo(49, 14);
      ctx.closePath(); ctx.fill();
      // Portholes
      ctx.fillStyle = '#ffcc44';
      [[24,56],[40,56],[56,56],[72,56]].forEach(([px,py]) => {
        ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI*2); ctx.fill();
      });
      sh.refresh();
    }

    // Ship starts off left edge, sails right
    this._ship = this.add.image(-100, H/2 + 20, 'sea_ship').setDepth(5).setScale(1.5);

    // Ship bob tween
    this.tweens.add({
      targets: this._ship,
      y: H/2 + 28,
      duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // Ship sail-in
    this.tweens.add({
      targets: this._ship,
      x: W/2,
      duration: 1600,
      ease: 'Power2',
    });

    // ── Wake trail ────────────────────────────────────────────────────────
    this._wakeObjs = [];
    this.time.addEvent({
      delay: 100, loop: true,
      callback: () => {
        if (this._ship.x < 50) return;
        const w = this.add.graphics().setDepth(4);
        w.fillStyle(0x4488bb, 1);
        w.fillRect(-6, -2, 12, 4);
        w.x = this._ship.x - 60;
        w.y = this._ship.y + 30;
        this._wakeObjs.push(w);
        this.tweens.add({
          targets: w, scaleX: 3, alpha: 0,
          duration: 800, ease: 'Power2',
          onComplete: () => { w.destroy(); },
        });
      },
    });

    // ── Destination text ──────────────────────────────────────────────────
    const destName = DEST_NAMES[this._dest] || 'Unknown Waters';
    this.add.text(W/2, 60, 'SETTING SAIL', {
      fontSize: '16px', fontFamily: 'monospace', fontStyle: 'bold',
      color: '#aaccee', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(10).setAlpha(0);

    const dest = this.add.text(W/2, 90, '— ' + destName.toUpperCase() + ' —', {
      fontSize: '24px', fontFamily: 'monospace', fontStyle: 'bold',
      color: '#ffd700', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(10).setAlpha(0);

    const sailing = this.add.text(W/2, H - 60,
      '"Every island has its own demons. Its own truths."\n— Harbor Master Kael', {
        fontSize: '11px', fontFamily: 'monospace', fontStyle: 'italic',
        color: '#556677', align: 'center',
      }).setOrigin(0.5).setDepth(10).setAlpha(0);

    this.tweens.add({
      targets: [dest, sailing], alpha: 1,
      delay: 600, duration: 800, ease: 'Power2',
    });

    // ── Sea event (40% chance) ────────────────────────────────────────────
    this._seaEvent();

    // ── Transition after 3s ───────────────────────────────────────────────
    this.time.delayedCall(3200, () => {
      // Ship sails off right
      this.tweens.add({
        targets: this._ship,
        x: W + 150,
        duration: 1000, ease: 'Power2',
      });
      this.cameras.main.fadeOut(1000, 0, 0, 0);
    });

    this.cameras.main.on('camerafadeoutcomplete', () => {
      window.GameState.currentIsland  = this._dest;
      window.GameState.playerX        = null;
      window.GameState.playerY        = null;
      window.GameState.checkpoint     = null;
      window.GameState.explored       = new Set();
      window.GameState.mapData        = null;
      window.saveGame();
      this.scene.start('WorldScene');
    });
  }

  _seaEvent() {
    if (Math.random() > 0.40) return; // 40% chance

    const SEA_EVENTS = [
      {
        title: 'FLOATING WRECKAGE',
        body:  'Your crew pulls a waterlogged chest from the waves.\nContents: scattered gold coins.',
        reward: () => {
          const g = 50 + Math.floor(Math.random() * 100);
          window.GameState.playerMoney = (window.GameState.playerMoney || 0) + g;
          return '+' + g + 'G found!';
        },
        color: '#ffd700',
      },
      {
        title: 'MYSTERIOUS BOTTLE',
        body:  'A sealed bottle bobs alongside the hull.\nInside: a folded card.',
        reward: () => {
          const pool = window.CARDS.filter(c => c.rarity === 'uncommon' || c.rarity === 'rare');
          const card = pool[Math.floor(Math.random() * pool.length)];
          if (card) {
            window.GameState.playerCollection.push(card.id);
          }
          return card ? 'Found: ' + card.name + '!' : 'Nothing useful inside.';
        },
        color: '#88ccff',
      },
      {
        title: 'PASSING MERCHANT',
        body:  'A small merchant vessel sails alongside.\nThey toss you a gift before sailing off.',
        reward: () => {
          const g = 30 + Math.floor(Math.random() * 70);
          window.GameState.playerMoney = (window.GameState.playerMoney || 0) + g;
          return '+' + g + 'G  —  "Safe travels!"';
        },
        color: '#ffcc44',
      },
      {
        title: 'SEA SERPENT SIGHTING',
        body:  '"Something massive passed beneath us.\nThe crew is shaken, but we sail on."',
        reward: () => null,
        color: '#88ff88',
      },
      {
        title: 'ANCIENT CHART',
        body:  'A waterproof scroll describes a forgotten island route.\nYou add the knowledge to your charts.',
        reward: () => {
          // Give a random card from the destination island pool
          const destPools = [
            [],
            ['demon_106','demon_107','demon_108','demon_109','demon_110'],
            ['demon_112','demon_113','demon_114','demon_115','demon_116'],
          ];
          const pool = destPools[this._dest] || [];
          if (!pool.length) {
            const g = 80;
            window.GameState.playerMoney = (window.GameState.playerMoney || 0) + g;
            return '+' + g + 'G from salvaged trade goods.';
          }
          const id = pool[Math.floor(Math.random() * pool.length)];
          const card = window.CARD_MAP?.[id];
          if (card) {
            window.GameState.playerCollection.push(id);
            return 'Found island card: ' + card.name + '!';
          }
          return 'Nothing useful.';
        },
        color: '#cc88ff',
      },
    ];

    const evt = SEA_EVENTS[Math.floor(Math.random() * SEA_EVENTS.length)];
    const rewardMsg = evt.reward();

    const W = 960, H = 640;
    const EW = 480, EH = 120;
    const ex = W/2 - EW/2, ey = H - 200;

    this.time.delayedCall(1400, () => {
      const bg = this.add.graphics().setDepth(15);
      bg.fillStyle(0x05050f, 0.93);
      bg.fillRoundedRect(ex, ey, EW, EH, 8);
      bg.lineStyle(2, Phaser.Display.Color.HexStringToColor(evt.color.replace('#','0x')).color || 0x4488ff);
      bg.strokeRoundedRect(ex, ey, EW, EH, 8);
      bg.setAlpha(0);

      const t1 = this.add.text(ex + EW/2, ey + 14, '-- ' + evt.title + ' --', {
        fontSize: '13px', fontFamily: 'monospace', fontStyle: 'bold',
        color: evt.color, stroke: '#000', strokeThickness: 3
      }).setOrigin(0.5, 0).setDepth(16).setAlpha(0);

      const t2 = this.add.text(ex + EW/2, ey + 36, evt.body, {
        fontSize: '10px', fontFamily: 'monospace', color: '#aaaaaa',
        align: 'center', wordWrap: { width: EW - 20 }
      }).setOrigin(0.5, 0).setDepth(16).setAlpha(0);

      const t3 = rewardMsg ? this.add.text(ex + EW/2, ey + EH - 22, rewardMsg, {
        fontSize: '11px', fontFamily: 'monospace', fontStyle: 'bold',
        color: '#ffd700', stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5, 0).setDepth(16).setAlpha(0) : null;

      [bg, t1, t2, ...(t3 ? [t3] : [])].forEach(o => {
        this.tweens.add({ targets: o, alpha: 1, duration: 500, ease: 'Power2' });
      });
    });
  }

  update(time, delta) {
    this._waveTime += delta * 0.001;
    const gfx = this._waveGfx;
    gfx.clear();
    // Scrolling wave crests (white dashes)
    for (let row = 4; row < 20; row++) {
      const wy = row * 40 + Math.sin(this._waveTime * 1.2 + row * 0.8) * 3;
      gfx.lineStyle(1, 0x4488bb, 0.4);
      for (let cx = 0; cx < 960; cx += 32) {
        const wx = (cx + this._waveTime * 40 * (row % 2 === 0 ? 1 : -1)) % 960;
        gfx.beginPath();
        gfx.moveTo(wx, wy);
        gfx.lineTo(wx + 16, wy);
        gfx.strokePath();
      }
    }
  }
}
