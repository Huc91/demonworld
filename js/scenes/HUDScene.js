class HUDScene extends Phaser.Scene {
  constructor() { super({ key: 'HUDScene' }); }

  create() {
    // ── Top bar ───────────────────────────────────────────────────────────
    const bar = this.add.graphics();
    bar.fillStyle(0x000000, 0.55);
    bar.fillRect(0, 0, 960, 40);

    this.moneyText = this.add.text(12, 8, '', {
      fontSize: '16px', fontFamily: 'monospace',
      color: '#ffd700', stroke: '#000', strokeThickness: 3
    });

    this.deckText = this.add.text(200, 8, '', {
      fontSize: '16px', fontFamily: 'monospace',
      color: '#aaddff', stroke: '#000', strokeThickness: 3
    });

    this.collectionText = this.add.text(400, 8, '', {
      fontSize: '16px', fontFamily: 'monospace',
      color: '#cc88ff', stroke: '#000', strokeThickness: 3
    });

    // Hearts container (right of collection text)
    this.heartsContainer = this.add.container(580, 8);

    this.add.text(680, 10, 'WASD: Move  |  F: Interact  |  Space: Jump  |  M: Menu  |  World: 320×200', {
      fontSize: '10px', fontFamily: 'monospace',
      color: '#888888', stroke: '#000', strokeThickness: 2
    });

    // ── Minimap ───────────────────────────────────────────────────────────
    // Panel background
    this.minimapBg = this.add.graphics();
    this.minimapBg.fillStyle(0x000000, 0.7);
    this.minimapBg.fillRect(750, 46, 204, 154);
    this.minimapBg.lineStyle(1, 0x555555, 1);
    this.minimapBg.strokeRect(750, 46, 204, 154);

    // Canvas for minimap drawing
    this._minimapCanvas = this.textures.createCanvas('hud_minimap', 200, 150);
    this.minimapImg = this.add.image(751, 47, 'hud_minimap').setOrigin(0, 0).setDepth(50);

    this.add.text(752, 48, 'MAP', {
      fontSize: '8px', fontFamily: 'monospace', color: '#aaaaaa'
    }).setDepth(51);

    // Active quest tracker (bottom-left)
    this.questHintBg = this.add.graphics().setDepth(40);
    this.questHintText = this.add.text(10, 630, '', {
      fontSize: '10px', fontFamily: 'monospace',
      color: '#aa88ff', stroke: '#000', strokeThickness: 2,
      backgroundColor: '#00000066', padding: { x: 6, y: 3 },
    }).setDepth(41).setOrigin(0, 1);

    // Reward text placeholder
    this.rewardText = null;

    this.updateHUD();

    // Minimap refresh every 500ms
    this.time.addEvent({
      delay: 500,
      loop: true,
      callback: this._updateMinimap,
      callbackScope: this,
    });
  }

  // ── HUD update ────────────────────────────────────────────────────────────

  updateHUD() {
    this.moneyText.setText('G: ' + window.GameState.playerMoney);
    this.deckText.setText('Deck: ' + window.GameState.playerDeck.length + ' cards');
    this.collectionText.setText('Collection: ' + window.GameState.playerCollection.length);
    this._renderHearts();
    this._renderActiveQuest();
  }

  _renderActiveQuest() {
    if (!this.questHintText) return;
    const qs = window.GameState.questProgress;
    if (!qs || !window.QUESTS) return;
    const active = window.QUESTS.find(q => qs[q.id]?.status === 'active');
    if (!active) {
      this.questHintText.setText('');
      return;
    }
    const state = qs[active.id];
    const obj   = active.objective;
    const needed = obj.count || 1;
    const prog   = Math.min(state.progress, needed);
    const progStr = obj.type.startsWith('kill_boss') ? (prog >= 1 ? '1/1' : '0/1') : prog + '/' + needed;
    this.questHintText.setText('⚔ Quest: ' + active.name + '  [' + progStr + ']  — ' + active.npc);
  }

  _renderHearts() {
    this.heartsContainer.removeAll(true);
    const hearts    = window.GameState.hearts    ?? 3;
    const maxHearts = window.GameState.maxHearts ?? 3;
    for (let i = 0; i < maxHearts; i++) {
      const filled = i < hearts;
      const t = this.add.text(i * 22, 0, filled ? '♥' : '♡', {
        fontSize: '18px', fontFamily: 'monospace',
        color: filled ? '#ff3333' : '#553333',
        stroke: '#000', strokeThickness: 2
      });
      this.heartsContainer.add(t);
    }
  }

  // ── Minimap rendering ─────────────────────────────────────────────────────

  _updateMinimap() {
    const mapData  = window.GameState.mapData;
    if (!mapData) return;

    const MW = 200, MH = 150;
    const COLS = 320, ROWS = 200;
    const scaleX = MW / COLS;
    const scaleY = MH / ROWS;

    const canvas = this._minimapCanvas;
    const ctx    = canvas.getContext();
    ctx.clearRect(0, 0, MW, MH);
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, MW, MH);

    // Tile colours
    const TILE_COLOR = [
      '#1a3a1a',  // 0 GRASS
      '#6b5533',  // 1 DIRT
      '#1a3399',  // 2 WATER
      '#555555',  // 3 WALL
      '#333333',  // 4 FLOOR
      '#0d2e0d',  // 5 TREE
      '#7a7a7a',  // 6 MOUNTAIN
      '#ccbb66',  // 7 SAND
      '#1a2e1a',  // 8 GRAVE_GRASS
    ];

    const explored = window.GameState.explored;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!explored || !explored.has(r + ',' + c)) continue;
        const t = mapData[r]?.[c] ?? 0;
        ctx.fillStyle = TILE_COLOR[t] || '#1a3a1a';
        const px = Math.floor(c * scaleX);
        const py = Math.floor(r * scaleY);
        ctx.fillRect(px, py, Math.max(1, Math.ceil(scaleX)), Math.max(1, Math.ceil(scaleY)));
      }
    }

    // Enemy dots (red) — only if tile explored
    const enemies = window.GameState.enemyPositions || [];
    ctx.fillStyle = '#ff2222';
    enemies.forEach(e => {
      const er = Math.floor(e.y / 32);
      const ec = Math.floor(e.x / 32);
      if (!explored || !explored.has(er + ',' + ec)) return;
      const ex = Math.floor(ec * scaleX);
      const ey = Math.floor(er * scaleY);
      ctx.fillRect(ex - 1, ey - 1, 3, 3);
    });

    // Player dot (white)
    const world = this.scene.get('WorldScene');
    if (world && world.player) {
      const pr = Math.floor(world.player.y / 32);
      const pc = Math.floor(world.player.x / 32);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(
        Math.floor(pc * scaleX) - 2,
        Math.floor(pr * scaleY) - 2,
        5, 5
      );
    }

    canvas.refresh();
  }

  // ── Reward pop-up ─────────────────────────────────────────────────────────

  showReward(money, card) {
    if (this.rewardText) this.rewardText.destroy();

    let msg = '+' + money + 'G';
    if (card) msg += '  +' + (window.CARD_MAP && window.CARD_MAP[card] ? window.CARD_MAP[card].name : card) + '!';

    this.rewardText = this.add.text(480, 320, msg, {
      fontSize: '28px', fontFamily: 'monospace', fontStyle: 'bold',
      color: '#ffd700', stroke: '#000', strokeThickness: 5,
      backgroundColor: '#00000088', padding: { x: 16, y: 8 }
    }).setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: this.rewardText,
      y: 200, alpha: 0,
      duration: 2500, ease: 'Power2',
      onComplete: () => {
        if (this.rewardText) { this.rewardText.destroy(); this.rewardText = null; }
      }
    });
  }
}
