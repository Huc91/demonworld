class BattleScene extends Phaser.Scene {
  constructor() { super({ key: 'BattleScene' }); }
  init(data) { this.enemyDef = data.enemy; }

  create() {
    // ── Hide overworld HUD ─────────────────────────────────────────────
    this.scene.sleep('HUDScene');
    this.input.mouse.disableContextMenu();

    // ── State ──────────────────────────────────────────────────────────
    // Apply relic bonuses at battle start
    // Only EQUIPPED relics (from charm slots) give battle bonuses
    const _relics = window.GameState?.equippedRelics || [];
    const _relicBonusHp   = _relics.reduce((s, id) => s + (window.RELIC_MAP?.[id]?.effect?.bonusHp   || 0), 0);
    const _relicStartMana = _relics.reduce((s, id) => s + (window.RELIC_MAP?.[id]?.effect?.startMana || 0), 0);
    this._relicShieldActive  = _relics.includes('relic_shield');
    this._relicDemonAtkBonus = _relics.some(id => window.RELIC_MAP?.[id]?.effect?.demonAtkOnPlay) ? 1 : 0;
    const goldRelicBonus = _relics.reduce((s, id) => s + (window.RELIC_MAP?.[id]?.effect?.goldBonus || 0), 0);
    this._relicGoldBonus = 1.0 + goldRelicBonus;
    // Extra draw on first turn
    this._relicExtraDraw = _relics.reduce((s, id) => s + (window.RELIC_MAP?.[id]?.effect?.extraDraw || 0), 0);

    const _levelHpBonus = Math.floor(((window.GameState?.playerLevel || 1) - 1) * 2);
    this.playerMaxLife = 20 + _relicBonusHp + _levelHpBonus;
    this.playerLife    = this.playerMaxLife;
    this.enemyLife   = this.enemyDef.life || 10;
    this.playerMana  = _relicStartMana;
    this.turnNumber  = 1;
    this.turn        = 'player';
    this.gameOver    = false;
    this.attackingDemon  = null;
    this.awaitingTarget  = false;
    this.playerGoesFirst = true;

    // Two-row board state
    this.playerFront = [];
    this.playerRear  = [];
    this.enemyFront  = [];
    this.enemyRear   = [];

    // Row move & arsenal mechanics
    this.rowMoveDone        = false;
    this.arsenalCard        = null;
    this.arsenalUsedThisTurn = false;

    // Action menu state
    this._actionMenu = null; // { demon, row, idx, objs[] }

    // Render buckets
    this._handObjs   = [];
    this._pfObjs     = [];
    this._prObjs     = [];
    this._efObjs     = [];
    this._erObjs     = [];
    this._arsenalObjs = [];
    this._popupObjs  = [];
    this._zoomObjs   = [];
    this._dragHlObjs = [];

    // Battle log
    this._logLines  = [];
    this._logScroll = 0;
    // Graveyard viewer
    this._gyObjs = [];

    // Drag state
    this.dragInfo  = null;  // { card, handIdx }
    this.dragGhost = null;

    const rawDeck = window.GameState.playerDeck.length >= 10
      ? [...window.GameState.playerDeck]
      : [...window.STARTER_DECK];

    this.playerDeck      = this.shuffleDeck(rawDeck.map(id => window.CARD_MAP[id]).filter(Boolean).map(c => ({ ...c })));
    this.playerHand      = [];
    this.playerGraveyard = [];

    this.enemyDeck      = this.shuffleDeck(this.enemyDef.deckCards.map(id => window.CARD_MAP[id]).filter(Boolean).map(c => ({ ...c })));
    this.enemyHand      = [];
    this.enemyGraveyard = [];

    // ── Layout constants ───────────────────────────────────────────────
    // Enemy rear row: cy=78   Enemy front row: cy=168
    // Divider: y=215
    // Player front row: cy=285  Player rear row: cy=375
    // Pitch zone: y=430, h=45
    // Player bar: y=476
    // Hand: cy=568
    this.BOARD_Y  = 241;  // top of player board area (both rows)
    this.BOARD_H  = 178;  // covers y=241..419
    this.PITCH_Y  = 430;
    this.PITCH_H  = 45;
    this.HAND_Y   = 530;

    // ── Static background ──────────────────────────────────────────────
    const bg = this.add.graphics();
    bg.fillStyle(0x080810); bg.fillRect(0, 0, 960, 640);
    // Enemy side
    bg.fillStyle(0x150010); bg.fillRoundedRect(4, 48, 952, 175, 6);
    // Divider
    bg.fillStyle(0x0d0d20); bg.fillRect(0, 223, 960, 8);
    // Player side (both rows)
    bg.fillStyle(0x00140a); bg.fillRoundedRect(4, 241, 952, 178, 6);
    // Pitch zone
    bg.fillStyle(0x220a00); bg.fillRoundedRect(180, 430, 600, 45, 6);
    bg.lineStyle(1, 0x663300); bg.strokeRoundedRect(180, 430, 600, 45, 6);
    // Player bar
    bg.fillStyle(0x0a0a18); bg.fillRect(0, 476, 960, 35);
    // Hand area
    bg.fillStyle(0x0c0c1e); bg.fillRect(0, 511, 960, 129);
    bg.lineStyle(1, 0x222244); bg.lineBetween(0, 511, 960, 511);
    // Row divider inside player side
    bg.lineStyle(1, 0x113311, 0.5); bg.lineBetween(4, 330, 956, 330);
    // Row divider inside enemy side
    bg.lineStyle(1, 0x331111, 0.5); bg.lineBetween(4, 123, 956, 123);
    // Arsenal slot background
    bg.fillStyle(0x0e0e1a); bg.fillRoundedRect(878, 340, 78, 100, 6);
    bg.lineStyle(1, 0x445566); bg.strokeRoundedRect(878, 340, 78, 100, 6);

    // ── Pitch zone label ───────────────────────────────────────────────
    this.add.text(480, 452, '🔥  PITCH ZONE  — drag here or right-click to sacrifice for mana', {
      fontSize: '12px', fontFamily: 'monospace', color: '#884422'
    }).setOrigin(0.5);

    // ── Enemy header ───────────────────────────────────────────────────
    this.add.text(10, 6, this.enemyDef.name.toUpperCase(), {
      fontSize: '22px', fontFamily: 'monospace', fontStyle: 'bold',
      color: '#ff4444', stroke: '#000', strokeThickness: 4
    });
    this.txtEnemyLife  = this.add.text(10, 32, '', { fontSize: '16px', fontFamily: 'monospace', color: '#ff7777', stroke: '#000', strokeThickness: 2 });
    this.txtEnemyDeck  = this.add.text(780, 10, '', { fontSize: '13px', fontFamily: 'monospace', color: '#666688' });
    this.txtEnemyHand  = this.add.text(780, 26, '', { fontSize: '13px', fontFamily: 'monospace', color: '#666688' });
    this.txtEnemyGY = this.add.text(780, 42, '⚰ GY: 0', {
      fontSize: '13px', fontFamily: 'monospace', color: '#664444'
    }).setInteractive({ useHandCursor: true });
    this.txtEnemyGY.on('pointerdown', () => this.showGraveyard('enemy'));
    this.txtEnemyGY.on('pointerover', () => this.txtEnemyGY.setStyle({ color: '#cc7777' }));
    this.txtEnemyGY.on('pointerout',  () => this.txtEnemyGY.setStyle({ color: '#664444' }));

    // Clickable enemy face for direct attacks
    this.btnFace = this.add.text(880, 22, '⚔ FACE', {
      fontSize: '16px', fontFamily: 'monospace',
      backgroundColor: '#3a0000', padding: { x: 8, y: 4 }, color: '#ff6666'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.btnFace.on('pointerdown', () => this.attackFace());
    this.btnFace.on('pointerover', () => this.btnFace.setStyle({ backgroundColor: '#770000' }));
    this.btnFace.on('pointerout',  () => this.btnFace.setStyle({ backgroundColor: '#3a0000' }));

    // Board zone labels
    this.add.text(185, 50, '— ENEMY SIDE —',   { fontSize: '13px', fontFamily: 'monospace', color: '#442233' }).setOrigin(0, 0);
    this.add.text(185, 243, '— YOUR SIDE —',   { fontSize: '13px', fontFamily: 'monospace', color: '#223322' }).setOrigin(0, 0);
    // Row labels
    this.add.text(185, 53, 'FRONT', { fontSize: '10px', fontFamily: 'monospace', color: '#553333' }).setOrigin(0, 0).setAlpha(0.6);
    this.add.text(185, 88, 'REAR',  { fontSize: '10px', fontFamily: 'monospace', color: '#442222' }).setOrigin(0, 0).setAlpha(0.5);
    this.add.text(185, 246, 'FRONT (combat)', { fontSize: '10px', fontFamily: 'monospace', color: '#335533' }).setOrigin(0, 0).setAlpha(0.6);
    this.add.text(185, 336, 'REAR (safe)',    { fontSize: '10px', fontFamily: 'monospace', color: '#224422' }).setOrigin(0, 0).setAlpha(0.5);

    this.add.text(480, 513, '— HAND  (hover to zoom · drag to board · right-click to pitch · shift-click → arsenal) —', {
      fontSize: '11px', fontFamily: 'monospace', color: '#333355'
    }).setOrigin(0.5, 0);

    // Arsenal label
    this.add.text(917, 343, 'ARSENAL', { fontSize: '9px', fontFamily: 'monospace', color: '#445566' }).setOrigin(0.5, 0);

    // ── Player info bar ────────────────────────────────────────────────
    this.txtPlayerLife = this.add.text(10, 477, '', { fontSize: '16px', fontFamily: 'monospace', color: '#44ff88', stroke: '#000', strokeThickness: 2 });
    this.txtPlayerMana = this.add.text(260, 477, '', { fontSize: '16px', fontFamily: 'monospace', color: '#5599ff', stroke: '#000', strokeThickness: 2 });
    this.txtDeckInfo   = this.add.text(460, 479, '', { fontSize: '12px', fontFamily: 'monospace', color: '#555566' });
    this.txtPlayerGY = this.add.text(660, 477, '⚰ GY: 0', {
      fontSize: '14px', fontFamily: 'monospace', color: '#446644'
    }).setInteractive({ useHandCursor: true });
    this.txtPlayerGY.on('pointerdown', () => this.showGraveyard('player'));
    this.txtPlayerGY.on('pointerover', () => this.txtPlayerGY.setStyle({ color: '#77cc77' }));
    this.txtPlayerGY.on('pointerout',  () => this.txtPlayerGY.setStyle({ color: '#446644' }));
    this.txtTurn = this.add.text(480, 228, '', {
      fontSize: '13px', fontFamily: 'monospace', fontStyle: 'bold',
      color: '#ffcc00', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5);

    // Buttons
    this.btnEndTurn = this.add.text(870, 490, 'END TURN', {
      fontSize: '16px', fontFamily: 'monospace', fontStyle: 'bold',
      backgroundColor: '#551100', padding: { x: 10, y: 5 }, color: '#ffbbaa'
    }).setOrigin(1).setInteractive({ useHandCursor: true });
    this.btnEndTurn.on('pointerdown', () => { if (this.turn === 'player' && !this.gameOver) this.endPlayerTurn(); });
    this.btnEndTurn.on('pointerover', () => this.btnEndTurn.setStyle({ backgroundColor: '#882200' }));
    this.btnEndTurn.on('pointerout',  () => this.btnEndTurn.setStyle({ backgroundColor: '#551100' }));

    this.btnCancel = this.add.text(730, 490, 'CANCEL', {
      fontSize: '12px', fontFamily: 'monospace',
      backgroundColor: '#222222', padding: { x: 8, y: 5 }, color: '#888888'
    }).setOrigin(1).setVisible(false).setInteractive({ useHandCursor: true });
    this.btnCancel.on('pointerdown', () => this.cancelAttack());

    // ── Relic indicators (tiny badges right of graveyard) ──────────────
    const ownedRelics = window.GameState?.equippedRelics || [];
    if (ownedRelics.length > 0 && window.RELIC_MAP) {
      ownedRelics.forEach((rid, i) => {
        const relic = window.RELIC_MAP[rid];
        if (!relic) return;
        const rx = 760 + i * 22;
        const rBadge = this.add.text(rx, 479, relic.icon || '[?]', {
          fontSize: '10px', fontFamily: 'monospace',
          backgroundColor: '#1a0d2e', color: '#cc88ff',
          padding: { x: 3, y: 2 }
        }).setInteractive({ useHandCursor: false });
        // Tooltip on hover
        rBadge.on('pointerover', () => this.showFloat(rx, 470, relic.name, '#cc88ff'));
      });
    }

    // ── Battle Log panel ───────────────────────────────────────────────
    const LOG_ROWS = 12;
    const logBg = this.add.graphics().setDepth(2);
    logBg.fillStyle(0x06060f, 0.92); logBg.fillRoundedRect(0, 50, 172, 175, 4);
    logBg.lineStyle(1, 0x222244);    logBg.strokeRoundedRect(0, 50, 172, 175, 4);
    this.add.text(6, 54, 'BATTLE LOG', {
      fontSize: '10px', fontFamily: 'monospace', color: '#444466'
    }).setDepth(3);
    this._logScrollTxt = this.add.text(166, 54, '', {
      fontSize: '9px', fontFamily: 'monospace', color: '#333355'
    }).setOrigin(1, 0).setDepth(3);

    this._logTextObjs = [];
    for (let i = 0; i < LOG_ROWS; i++) {
      this._logTextObjs.push(
        this.add.text(6, 66 + i * 13, '', {
          fontSize: '10px', fontFamily: 'monospace', color: '#888899', wordWrap: { width: 160 }
        }).setDepth(3)
      );
    }

    // Scroll zone
    const logZone = this.add.zone(86, 137, 172, 175).setDepth(3.5).setInteractive();
    logZone.on('wheel', (_ptr, _dx, dy) => {
      const maxScroll = Math.max(0, this._logLines.length - LOG_ROWS);
      if (dy < 0) this._logScroll = Math.min(maxScroll, this._logScroll + 1);
      else        this._logScroll = Math.max(0, this._logScroll - 1);
      this._refreshLog();
    });

    // ── Global pointer events ──────────────────────────────────────────
    this.input.on('pointermove', (ptr) => {
      if (this.dragGhost) this.dragGhost.setPosition(ptr.x, ptr.y);
    });

    this.input.on('pointerup', (ptr) => {
      if (!this.dragInfo) return;
      this.handleDrop(ptr.x, ptr.y);
    });

    // Click elsewhere to dismiss action menu
    this.input.on('pointerdown', () => {
      this.dismissActionMenu();
    });

    // ── Draw opening hands (+ Scholar Quill bonus), then do dice roll ──
    for (let i = 0; i < 5 + (this._relicExtraDraw || 0); i++) this.drawPlayerCards(1);
    for (let i = 0; i < 5; i++) this.drawEnemyCard();
    this.updateUI();
    this.renderAll();

    // Boss intro overlay
    const isBossIntro = this.enemyDef.isBoss || this.enemyDef.difficulty === 'boss';
    if (isBossIntro) {
      this._showBossIntro(() => this.doDiceRoll());
    } else {
      this.doDiceRoll();
    }
  }

  _showBossIntro(onDone) {
    const W = 960, H = 640;
    const bg = this.add.graphics().setDepth(100);
    bg.fillStyle(0x000000, 0.95); bg.fillRect(0, 0, W, H);
    bg.lineStyle(3, 0xff2200, 0.6); bg.strokeRect(8, 8, W-16, H-16);

    // Radiating pixel lines (GBA style — straight lines, no curves)
    const cx = W/2, cy = H/2;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const col = i % 2 === 0 ? 0x440000 : 0x220000;
      bg.lineStyle(1, col, 0.6);
      bg.beginPath();
      bg.moveTo(cx, cy);
      bg.lineTo(cx + Math.cos(a) * 600, cy + Math.sin(a) * 600);
      bg.strokePath();
    }

    const t1 = this.add.text(W/2, 220, '⚔  BOSS BATTLE  ⚔', {
      fontSize: '20px', fontFamily: 'monospace', fontStyle: 'bold',
      color: '#ff4444', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(101).setAlpha(0);

    const t2 = this.add.text(W/2, H/2, this.enemyDef.name.toUpperCase(), {
      fontSize: '68px', fontFamily: 'monospace', fontStyle: 'bold',
      color: '#ffffff', stroke: '#880000', strokeThickness: 8,
    }).setOrigin(0.5).setDepth(101).setAlpha(0);

    const lvlStr = 'Level ' + (this.enemyDef.level || '?') + '  ·  ' + this.enemyDef.life + ' HP';
    const t3 = this.add.text(W/2, H/2 + 66, lvlStr, {
      fontSize: '16px', fontFamily: 'monospace',
      color: '#ff8888', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(101).setAlpha(0);

    const t4 = this.add.text(W/2, H - 100, '"Prepare yourself."', {
      fontSize: '14px', fontFamily: 'monospace', fontStyle: 'italic',
      color: '#884444', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(101).setAlpha(0);

    this.tweens.add({ targets: [bg, t1, t2, t3, t4], alpha: 1, duration: 350, ease: 'Power2' });

    // Dismiss after 2.2s
    this.time.delayedCall(2200, () => {
      this.tweens.add({
        targets: [bg, t1, t2, t3, t4], alpha: 0, duration: 400,
        onComplete: () => { bg.destroy(); t1.destroy(); t2.destroy(); t3.destroy(); t4.destroy(); onDone(); }
      });
    });
  }

  // ── Compatibility getters ────────────────────────────────────────────
  get playerBoard() { return [...this.playerFront, ...this.playerRear]; }
  get enemyBoard()  { return [...this.enemyFront,  ...this.enemyRear];  }

  // ═══════════════ TURN FLOW ═══════════════════════════════════════════

  doDiceRoll() {
    const ov = this.add.graphics().setDepth(50);
    ov.fillStyle(0x000000, 0.82);
    ov.fillRect(0, 0, 960, 640);

    let pRoll = Phaser.Math.Between(1, 6);
    let eRoll = Phaser.Math.Between(1, 6);
    while (pRoll === eRoll) {
      pRoll = Phaser.Math.Between(1, 6);
      eRoll = Phaser.Math.Between(1, 6);
    }

    this.playerGoesFirst = pRoll > eRoll;

    const diceObjs = [];
    diceObjs.push(this.add.text(480, 200, '⚄ INITIATIVE ROLL ⚄', {
      fontSize: '28px', fontFamily: 'monospace', fontStyle: 'bold',
      color: '#ffcc00', stroke: '#000', strokeThickness: 5
    }).setOrigin(0.5).setDepth(51));

    diceObjs.push(this.add.text(310, 300, 'YOU\n' + pRoll, {
      fontSize: '48px', fontFamily: 'monospace', fontStyle: 'bold',
      color: '#44ff88', stroke: '#000', strokeThickness: 5, align: 'center'
    }).setOrigin(0.5).setDepth(51));

    diceObjs.push(this.add.text(650, 300, this.enemyDef.name.toUpperCase() + '\n' + eRoll, {
      fontSize: '48px', fontFamily: 'monospace', fontStyle: 'bold',
      color: '#ff4444', stroke: '#000', strokeThickness: 5, align: 'center'
    }).setOrigin(0.5).setDepth(51));

    const goFirst = this.playerGoesFirst ? 'YOU GO FIRST!' : this.enemyDef.name.toUpperCase() + ' GOES FIRST!';
    const bonus   = this.playerGoesFirst ? '' : '\n(You get +1 mana on your first turn)';

    diceObjs.push(this.add.text(480, 420, goFirst + bonus, {
      fontSize: '20px', fontFamily: 'monospace', fontStyle: 'bold',
      color: '#ffffff', stroke: '#000', strokeThickness: 4, align: 'center'
    }).setOrigin(0.5).setDepth(51));

    this.time.delayedCall(2000, () => {
      ov.destroy();
      diceObjs.forEach(o => { try { o.destroy(); } catch(e){} });

      if (this.playerGoesFirst) {
        this.startPlayerTurn(true);
      } else {
        this.turn = 'enemy';
        this.txtTurn.setText('ENEMY TURN... (they go first)');
        this.btnEndTurn.setAlpha(0.4);
        this.time.delayedCall(500, () => this.runEnemyTurn(true));
      }
    });
  }

  startPlayerTurn(isFirst = false) {
    this.turn = 'player';
    this.playerMana = 0;
    this.rowMoveDone = false;
    this.arsenalUsedThisTurn = false;
    if (isFirst && !this.playerGoesFirst) {
      this.playerMana = 1;
      this.showFloat(480, 460, '+1 MANA (going second bonus)', '#4499ff');
    }
    this.playerFront.forEach(d => { d.exhausted = false; d.attacksThisTurn = 0; });
    this.playerRear.forEach(d => { d.exhausted = false; d.attacksThisTurn = 0; });
    // mana_per_turn: mana dryads / elves
    [...this.playerFront, ...this.playerRear].forEach(d => {
      if (d.ability === 'mana_per_turn') { this.playerMana += 1; }
    });
    // taunt_regen: regenerate 1 hp
    [...this.playerFront, ...this.playerRear].forEach(d => {
      if (d.ability === 'taunt_regen') { d.currentHp = Math.min(d.hp, d.currentHp + 1); }
    });
    this.updateUI();
    this.renderAll();
    this.txtTurn.setText('YOUR TURN  (turn ' + this.turnNumber + ')');
    this.btnEndTurn.setAlpha(1);
    this.btnCancel.setVisible(false);
  }

  endPlayerTurn() {
    this.clearPopup();
    this.dismissActionMenu();
    this.cancelAttack();
    this.hideZoom();
    this.hideDragHighlights();
    this.btnEndTurn.setAlpha(0.4);
    this.txtTurn.setText('ENEMY TURN...');
    this.turn = 'enemy';

    this.playerGraveyard.push(...this.playerHand);
    this.playerHand = [];
    this.drawPlayerCards(5);

    this.time.delayedCall(700, () => this.runEnemyTurn());
  }

  runEnemyTurn(isFirstTurn = false) {
    this.enemyFront.forEach(d => d.exhausted = false);
    this.enemyRear.forEach(d => d.exhausted = false);
    let mana = (isFirstTurn && this.playerGoesFirst) ? 1 : 0;

    const totalPossibleMana = mana + this.enemyHand.reduce((s, c) => s + (c.manaValue || 1), 0);
    const totalEnemyOnBoard = this.enemyFront.length + this.enemyRear.length;

    // tax_spells: player's Iron Warden raises enemy spell costs by 1
    const taxed = [...this.playerFront, ...this.playerRear].some(d => d.ability === 'tax_spells') ? 1 : 0;
    let target = this.enemyHand
      .filter(c => c.type === 'demon' && c.cost <= totalPossibleMana && totalEnemyOnBoard < 8)
      .sort((a, b) => b.cost - a.cost)[0];
    if (!target) target = this.enemyHand
      .filter(c => c.type === 'spell' && (c.cost + taxed) <= totalPossibleMana)
      .sort((a, b) => b.cost - a.cost)[0];

    [...this.enemyHand].filter(c => c !== target).forEach(c => {
      mana += c.manaValue || 1;
      this.enemyHand.splice(this.enemyHand.indexOf(c), 1);
      this.enemyGraveyard.push(c);
    });

    if (target && target.cost <= mana) {
      mana -= target.cost;
      this.enemyHand.splice(this.enemyHand.indexOf(target), 1);
      if (target.type === 'demon') {
        // AI placement logic
        let targetRow;
        const hasTaunt = target.ability && target.ability.includes('taunt');
        if (hasTaunt) {
          // Taunt always front
          targetRow = this.enemyFront.length < 4 ? this.enemyFront : this.enemyRear;
        } else if (this.enemyFront.length >= 4) {
          targetRow = this.enemyRear;
        } else if (this.enemyFront.length < 2) {
          targetRow = this.enemyFront;
        } else {
          // Prefer rear for low HP, front for high ATK
          const isLowHp  = target.hp < 3;
          const isHighAtk = target.atk >= 4;
          targetRow = (isLowHp && !isHighAtk) ? this.enemyRear : this.enemyFront;
        }
        if (targetRow.length >= 4) targetRow = targetRow === this.enemyFront ? this.enemyRear : this.enemyFront;
        if (targetRow.length < 4) {
          const demon = { ...target, currentHp: target.hp, currentAtk: target.atk, exhausted: !(target.ability && target.ability.includes('haste')), divineShield: !!(target.ability && target.ability.includes('divine_shield')) };
          targetRow.push(demon);
          this.addLog('Enemy plays ' + target.name + ' to ' + (targetRow === this.enemyFront ? 'front' : 'rear'), '#ff8888');
          this.resolveDemonBattlecry(target, 'enemy');
        }
      } else {
        this.addLog('Enemy casts ' + target.name, '#ffaaaa');
        this.resolveSpell(target, 'enemy');
        this.enemyGraveyard.push(target);
      }
    } else if (target) {
      this.enemyHand.splice(this.enemyHand.indexOf(target), 1);
      this.enemyGraveyard.push(target);
    }

    this.enemyGraveyard.push(...this.enemyHand);
    this.enemyHand = [];
    for (let i = 0; i < 5; i++) this.drawEnemyCard();

    this.renderAll(); this.updateUI();

    // Attack phase — only front row attacks
    this.time.delayedCall(700, () => {
      if (this.gameOver) return;
      [...this.enemyFront].forEach(demon => {
        if (!this.enemyFront.includes(demon) || demon.exhausted) return;
        demon.exhausted = true;
        const isUnblockable = demon.ability && demon.ability.includes('unblockable');

        // Check player front taunt
        const playerFrontTaunt = this.playerFront.filter(d => d.ability && d.ability.includes('taunt'));

        if (this.playerFront.length > 0 && !isUnblockable) {
          const pool = playerFrontTaunt.length > 0 ? playerFrontTaunt : this.playerFront;
          const t = pool.reduce((a, b) => a.currentHp < b.currentHp ? a : b);

          const dmgToT  = demon.currentAtk;
          const dmgToD  = t.currentAtk;
          t.currentHp   -= dmgToT;
          demon.currentHp -= dmgToD;

          if (demon.ability && demon.ability.includes('rage') && dmgToD > 0)  demon.currentAtk++;
          if (t.ability     && t.ability.includes('rage')    && dmgToT > 0) t.currentAtk++;
          if (demon.ability && demon.ability.includes('lifesteal')) {
            this.enemyLife = Math.min(this.enemyDef.life, this.enemyLife + dmgToT);
          }
          if (demon.ability && demon.ability.includes('poisonous') && t.currentHp > 0) t.currentHp = 0;

          this.showFloat(480, 280, '⚔ ' + demon.name + ' attacks!', '#ff4444');
          this.addLog(demon.name + ' attacks ' + t.name + ' (' + dmgToT + '/' + dmgToD + ')', '#ff8866');
          if (demon.currentHp <= 0) { this.addLog(demon.name + ' dies', '#ff4444'); this.killFrom(this.enemyFront, this.enemyGraveyard, demon); }
          if (t.currentHp    <= 0) { this.addLog(t.name + ' dies', '#ff6644');  this.killFromPlayer(t); }
        } else if (this.playerFront.length === 0 && !isUnblockable) {
          // Front empty — 70% attack face, 30% attack rear if present
          const attackRear = this.playerRear.length > 0 && Math.random() < 0.30;
          if (attackRear) {
            const t = this.playerRear[Math.floor(Math.random() * this.playerRear.length)];
            const dmgToT = demon.currentAtk;
            const dmgToD = t.currentAtk;
            t.currentHp -= dmgToT;
            demon.currentHp -= dmgToD;
            if (demon.ability && demon.ability.includes('rage') && dmgToD > 0) demon.currentAtk++;
            if (t.ability     && t.ability.includes('rage')    && dmgToT > 0) t.currentAtk++;
            if (demon.ability && demon.ability.includes('lifesteal')) {
              this.enemyLife = Math.min(this.enemyDef.life, this.enemyLife + dmgToT);
            }
            if (demon.ability && demon.ability.includes('poisonous') && t.currentHp > 0) t.currentHp = 0;
            this.showFloat(480, 360, '⚔ ' + demon.name + ' attacks rear!', '#ff6666');
            this.addLog(demon.name + ' attacks rear ' + t.name, '#ff8866');
            if (demon.currentHp <= 0) { this.killFrom(this.enemyFront, this.enemyGraveyard, demon); }
            if (t.currentHp    <= 0) { this.killFromPlayer(t); }
          } else {
            if (this._relicShieldActive) {
              this._relicShieldActive = false;
              this.showFloat(340, 460, 'Runed Shield! Hit blocked!', '#8888ff');
              this.addLog('Runed Shield blocked ' + demon.name + '\'s attack!', '#8888ff');
            } else {
              this.playerLife -= demon.currentAtk;
              if (demon.ability && demon.ability.includes('lifesteal')) {
                this.enemyLife = Math.min(this.enemyDef.life, this.enemyLife + demon.currentAtk);
              }
              this._flashScreen(0xff0000);
              this.showFloat(340, 460, '-' + demon.currentAtk + '!', '#ff2222');
              this.addLog(demon.name + ' hits you for ' + demon.currentAtk, '#ff3333');
            }
          }
        } else {
          // Unblockable — attack face (shield does NOT block unblockable)
          this.playerLife -= demon.currentAtk;
          if (demon.ability && demon.ability.includes('lifesteal')) {
            this.enemyLife = Math.min(this.enemyDef.life, this.enemyLife + demon.currentAtk);
          }
          this._flashScreen(0xff0000);
          this.showFloat(340, 460, '-' + demon.currentAtk + ' (UNBLOCKABLE)!', '#ff2222');
          this.addLog(demon.name + ' hits you for ' + demon.currentAtk, '#ff3333');
        }
      });
      this.renderAll(); this.updateUI(); this.checkWin();
      if (!this.gameOver) {
        this.turnNumber++;
        this.time.delayedCall(400, () => this.startPlayerTurn(isFirstTurn));
      }
    });
  }

  // ═══════════════ DRAW ════════════════════════════════════════════════

  drawPlayerCards(n) {
    for (let i = 0; i < n; i++) {
      if (this.playerDeck.length === 0) {
        if (!this.playerGraveyard.length) break;
        this.playerDeck = this.shuffleDeck([...this.playerGraveyard]);
        this.playerGraveyard = [];
      }
      const c = this.playerDeck.pop();
      if (this.playerHand.length < 8) this.playerHand.push(c);
      else this.playerGraveyard.push(c);
      // draw_pings: Star Prophet deals 1 per draw
      [...this.playerFront, ...this.playerRear].filter(d => d.ability === 'draw_pings').forEach(() => {
        this.enemyLife--;
      });
    }
    this._checkOsiris();
  }

  _checkOsiris() {
    const osirisIds = ['demon_031', 'demon_032', 'demon_033', 'demon_034', 'demon_035'];
    const handIds = this.playerHand.map(c => c.id);
    if (osirisIds.every(id => handIds.includes(id))) {
      this.showFloat(480, 280, '⚡ OSIRIS ASSEMBLED! YOU WIN!', '#ffdd00');
      this.time.delayedCall(1000, () => { this.enemyLife = 0; this.checkWin(); });
    }
  }

  drawEnemyCard() {
    if (this.enemyDeck.length === 0) {
      if (!this.enemyGraveyard.length) return;
      this.enemyDeck = this.shuffleDeck([...this.enemyGraveyard]);
      this.enemyGraveyard = [];
    }
    const c = this.enemyDeck.pop();
    if (this.enemyHand.length < 8) this.enemyHand.push(c);
    else this.enemyGraveyard.push(c);
  }

  // ═══════════════ CARD ACTIONS ════════════════════════════════════════

  pitchCard(card, handIdx) {
    this.playerHand.splice(handIdx, 1);
    this.playerMana += card.manaValue;
    const insertAt = Math.floor(Math.random() * Math.min(6, this.playerDeck.length + 1));
    this.playerDeck.splice(insertAt, 0, card);
    this.clearPopup();
    this.showFloat(480, 453, '+' + card.manaValue + ' MANA  (' + card.name + ' pitched to deck)', '#4499ff');
    this.addLog('You pitch ' + card.name + ' (+' + card.manaValue + ' mana)', '#5599ff');
    this.renderAll(); this.updateUI();
  }

  sendToArsenal(card, handIdx) {
    if (this.arsenalCard !== null) {
      this.showFloat(480, 450, 'Arsenal is full! Play it first.', '#ff8800');
      return;
    }
    if (this.arsenalUsedThisTurn) {
      this.showFloat(480, 450, 'Already sent to arsenal this turn!', '#ff8800');
      return;
    }
    this.playerHand.splice(handIdx, 1);
    this.arsenalCard = card;
    this.arsenalUsedThisTurn = true;
    this.showFloat(917, 390, card.name + ' → ARSENAL', '#aaddff');
    this.addLog('You stash ' + card.name + ' in arsenal', '#5599ff');
    this.renderAll(); this.updateUI();
  }

  playFromArsenal() {
    if (!this.arsenalCard) return;
    if (this.turn !== 'player' || this.gameOver) return;
    const card = this.arsenalCard;
    // Simulate as if from hand (handIdx -1 means arsenal)
    if (this.playerMana < card.cost) {
      this.showFloat(917, 390, 'Need ' + card.cost + ' mana', '#ff4444');
      return;
    }
    if (card.type === 'demon') {
      const frontFull = this.playerFront.length >= 4;
      const rearFull  = this.playerRear.length >= 4;
      if (frontFull && rearFull) {
        this.showFloat(917, 390, 'Board full!', '#ff4444');
        return;
      }
    }
    this.arsenalCard = null;
    this.playerMana -= card.cost;
    if (card.type === 'demon') {
      const hasHaste = card.ability && card.ability.includes('haste');
      const hasDivineShield = card.ability && card.ability.includes('divine_shield');
      const demon = { ...card, currentHp: card.hp, currentAtk: card.atk, exhausted: !hasHaste, divineShield: hasDivineShield };
      // Default: place in front if not full, else rear
      const targetRow = this.playerFront.length < 4 ? this.playerFront : this.playerRear;
      targetRow.push(demon);
      this.showFloat(480, 285, card.name + ' (from arsenal) enters the field!', '#ffcc44');
      this.addLog('You play ' + card.name + ' from arsenal', '#ffdd44');
      this.resolveDemonBattlecry(card, 'player');
    } else {
      this.addLog('You cast ' + card.name + ' from arsenal', '#aaaaff');
      this.resolveSpell(card, 'player');
      this.playerGraveyard.push(card);
    }
    this.renderAll(); this.updateUI(); this.checkWin();
  }

  playForEffect(card, handIdx, targetRow) {
    if (this.playerMana < card.cost) {
      this.showFloat(480, 450, 'Need ' + card.cost + ' mana — pitch more cards first', '#ff4444');
      return;
    }
    if (card.type === 'demon') {
      const frontFull = this.playerFront.length >= 4;
      const rearFull  = this.playerRear.length >= 4;
      if (frontFull && rearFull) {
        this.showFloat(480, 330, 'Board full! (max 4 per row)', '#ff4444'); return;
      }
      // Taunt cannot go rear
      if (targetRow === 'rear' && card.ability && card.ability.includes('taunt')) {
        this.showFloat(480, 330, 'Taunt demons must be in FRONT row!', '#ff8800');
        targetRow = 'front';
      }
      // Redirect if chosen row is full
      if (targetRow === 'front' && frontFull) targetRow = 'rear';
      if (targetRow === 'rear'  && rearFull)  targetRow = 'front';
    }
    this.playerMana -= card.cost;
    this.playerHand.splice(handIdx, 1);
    this.clearPopup();
    if (card.type === 'demon') {
      const hasHaste = card.ability && card.ability.includes('haste');
      const hasDivineShield = card.ability && card.ability.includes('divine_shield');
      const atkBonus = this._relicDemonAtkBonus || 0;
      const demon = { ...card, currentHp: card.hp, currentAtk: card.atk + atkBonus, exhausted: !hasHaste, divineShield: hasDivineShield };
      const row = targetRow === 'rear' ? this.playerRear : this.playerFront;
      row.push(demon);
      const rowLabel = targetRow === 'rear' ? 'rear' : 'front';
      const atkStr = atkBonus > 0 ? ' (+' + atkBonus + ' collar)' : '';
      this.showFloat(480, 285, card.name + ' enters the ' + rowLabel + '!' + atkStr, '#ffcc44');
      this.addLog('You play ' + card.name + ' to ' + rowLabel + ' (' + (card.atk + atkBonus) + '/' + card.hp + ')', '#ffdd44');
      this.resolveDemonBattlecry(card, 'player');
    } else {
      this.addLog('You cast ' + card.name, '#aaaaff');
      this.resolveSpell(card, 'player');
      this.playerGraveyard.push(card);
    }
    this.renderAll(); this.updateUI(); this.checkWin();
  }

  // ── Row move ──────────────────────────────────────────────────────────

  moveRow(demon) {
    if (this.rowMoveDone) {
      this.showFloat(480, 330, 'Already moved a demon this turn!', '#ff8800');
      return;
    }
    const inFront = this.playerFront.indexOf(demon);
    const inRear  = this.playerRear.indexOf(demon);
    if (inFront >= 0) {
      if (this.playerRear.length >= 4) {
        this.showFloat(480, 375, 'Rear row is full!', '#ff8800'); return;
      }
      this.playerFront.splice(inFront, 1);
      this.playerRear.push(demon);
      this.showFloat(480, 375, demon.name + ' moves to REAR', '#aaffaa');
      this.addLog(demon.name + ' moved to rear row', '#aaffaa');
    } else if (inRear >= 0) {
      if (this.playerFront.length >= 4) {
        this.showFloat(480, 285, 'Front row is full!', '#ff8800'); return;
      }
      this.playerRear.splice(inRear, 1);
      this.playerFront.push(demon);
      this.showFloat(480, 285, demon.name + ' moves to FRONT', '#ffaaaa');
      this.addLog(demon.name + ' moved to front row', '#ffaaaa');
    }
    this.rowMoveDone = true;
    this.dismissActionMenu();
    this.renderAll(); this.updateUI();
  }

  // ── Demon abilities ───────────────────────────────────────────────────

  resolveDemonBattlecry(card, who) {
    if (!card.ability || !card.ability.startsWith('battlecry')) return;
    const me = who === 'player';
    const myBoard  = me ? [...this.playerFront, ...this.playerRear] : [...this.enemyFront, ...this.enemyRear];
    const foeBoard = me ? [...this.enemyFront, ...this.enemyRear]   : [...this.playerFront, ...this.playerRear];
    const myFront  = me ? this.playerFront : this.enemyFront;

    switch (card.ability) {
      case 'battlecry_draw_1':
        if (me) { this.drawPlayerCards(1); this.showFloat(480, 460, 'Draw 1!', '#aaddff'); }
        else    { this.drawEnemyCard(); }
        break;
      case 'battlecry_draw_2':
        if (me) { this.drawPlayerCards(2); this.showFloat(480, 460, 'Draw 2!', '#aaddff'); }
        else    { for (let i = 0; i < 2; i++) this.drawEnemyCard(); }
        break;
      case 'battlecry_damage_player_2':
        if (me) { this.enemyLife -= 2; this.showFloat(700, 80, card.name + '! -2', '#ff6600'); }
        else    { this.playerLife -= 2; }
        break;
      case 'battlecry_aoe_1':
        foeBoard.forEach(d => d.currentHp -= 1);
        this._cleanAllBoards();
        if (me) this.showFloat(700, 150, card.name + '! Splash -1 all!', '#ff8800');
        break;
      case 'battlecry_buff_all_atk':
        myBoard.slice(0, myBoard.length - 1).forEach(d => d.currentAtk += 1);
        if (me) this.showFloat(340, 285, 'Iron Djinn! +1 ATK all!', '#4488aa');
        break;
      case 'battlecry_destroy_strongest': {
        if (foeBoard.length) {
          const t = foeBoard.reduce((a, b) => a.currentAtk >= b.currentAtk ? a : b);
          this._killDemon(t, me ? 'enemy' : 'player');
          if (me) this.showFloat(700, 150, 'Medusa! Petrify!', '#22aa44');
        }
        break;
      }
      case 'battlecry_summon_imps': {
        const impDef = window.CARD_MAP['demon_001'];
        for (let i = 0; i < 2; i++) {
          if (myFront.length < 4 && impDef)
            myFront.push({ ...impDef, currentHp: impDef.hp, currentAtk: impDef.atk, exhausted: false });
        }
        if (me) this.showFloat(340, 285, 'Beelzebub! 2 Imps!', '#ffcc00');
        break;
      }
      case 'battlecry_destroy_all': {
        const foeCopy = [...foeBoard];
        foeCopy.forEach(d => this._killDemon(d, me ? 'enemy' : 'player'));
        if (me) this.showFloat(700, 150, 'Baphomet! ANNIHILATE!', '#ff0044');
        break;
      }
      case 'battlecry_heal_3':
        if (me) { this.playerLife = Math.min(this.playerMaxLife, this.playerLife + 3); this.showFloat(340, 460, 'Heal +3!', '#44ff44'); }
        else    { this.enemyLife = Math.min(this.enemyDef.life, this.enemyLife + 3); }
        break;
      case 'battlecry_damage_player_1':
        if (me) { this.enemyLife -= 1; this.showFloat(700, 80, card.name + '! -1', '#ff6600'); }
        else    { this.playerLife -= 1; }
        break;
      case 'battlecry_destroy_weak': {
        const weak = [...foeBoard].filter(d => d.currentHp <= 3);
        if (weak.length) {
          const t = weak.reduce((a, b) => a.currentHp <= b.currentHp ? a : b);
          this._killDemon(t, me ? 'enemy' : 'player');
          if (me) this.showFloat(700, 150, card.name + '! Finish them!', '#ff4422');
        }
        break;
      }
      case 'battlecry_discard_enemy': {
        const oppHand = me ? this.enemyHand : this.playerHand;
        if (oppHand.length) {
          oppHand.splice(oppHand.length - 1, 1);
          if (me) this.showFloat(700, 150, card.name + '! Discard!', '#cc44cc');
        }
        break;
      }
      case 'battlecry_freeze_target': {
        if (foeBoard.length) {
          foeBoard[0].exhausted = true;
          if (me) this.showFloat(700, 150, card.name + '! Frozen!', '#88ccff');
        }
        break;
      }
      case 'battlecry_freeze_all': {
        foeBoard.forEach(d => { d.exhausted = true; });
        if (me) this.showFloat(700, 150, card.name + '! All frozen!', '#88ccff');
        break;
      }
      case 'battlecry_damage_random_2': {
        if (foeBoard.length) {
          const t = foeBoard[Math.floor(Math.random() * foeBoard.length)];
          t.currentHp -= 2;
          this._cleanAllBoards();
          if (me) this.showFloat(700, 150, card.name + '! -2 random', '#ff8800');
        }
        break;
      }
      case 'battlecry_aoe_rear_2': {
        const foeRear = me ? this.enemyRear : this.playerRear;
        foeRear.forEach(d => { d.currentHp -= 2; });
        this._cleanAllBoards();
        if (me) this.showFloat(700, 220, card.name + '! Rear -2!', '#ff4400');
        break;
      }
      case 'battlecry_face_per_spell_gy': {
        const spellCount = this.playerGraveyard.filter(c => c.type === 'spell').length;
        if (me && spellCount > 0) {
          this.enemyLife -= spellCount;
          this.showFloat(700, 80, card.name + '! -' + spellCount + ' (spells)', '#ff6600');
        } else if (!me) {
          const ec = this.enemyGraveyard.filter(c => c.type === 'spell').length;
          this.playerLife -= ec;
        }
        break;
      }
      case 'battlecry_aoe_per_spell': {
        const spellCount = me
          ? this.playerGraveyard.filter(c => c.type === 'spell').length
          : this.enemyGraveyard.filter(c => c.type === 'spell').length;
        foeBoard.forEach(d => { d.currentHp -= spellCount; });
        this._cleanAllBoards();
        if (me) this.showFloat(700, 150, card.name + '! -' + spellCount + ' each!', '#88ccff');
        break;
      }
      case 'battlecry_buff_beast': {
        myBoard.filter(d => d.subtype === 'beast' && d !== card).forEach(d => { d.currentAtk++; });
        if (me) this.showFloat(340, 285, card.name + '! Beasts +1 ATK!', '#88aa44');
        break;
      }
      case 'battlecry_aoe_2': {
        foeBoard.forEach(d => { d.currentHp -= 2; });
        this._cleanAllBoards();
        if (me) this.showFloat(700, 150, card.name + '! All -2!', '#ff6600');
        break;
      }
      case 'battlecry_replay_spell': {
        if (me) {
          const spells = this.playerGraveyard.filter(c => c.type === 'spell');
          if (spells.length) {
            const s = spells[spells.length - 1];
            this.resolveSpell(s, 'player');
            this.showFloat(340, 460, card.name + '! Replay: ' + s.name, '#ffcc44');
          }
        }
        break;
      }
      case 'battlecry_summon_imp': {
        if (myFront.length < 4) {
          const impBase = { ...window.CARD_MAP['demon_001'], ability: null, abilityDesc: null };
          myFront.push({ ...impBase, currentHp: 1, currentAtk: 1, exhausted: true });
        }
        if (me) this.showFloat(340, 285, card.name + '! Imp arrives!', '#884400');
        break;
      }
      case 'battlecry_rear_strike': {
        const enemyRear = me ? this.enemyRear : this.playerRear;
        const dmg = enemyRear.length;
        if (dmg > 0) {
          if (me) { this.enemyLife -= dmg; this.showFloat(700, 80, card.name + '! -' + dmg + ' (rear)', '#ff6600'); }
          else    { this.playerLife -= dmg; }
        }
        break;
      }
      case 'battlecry_equalize_hp': {
        this.playerLife = Math.min(this.playerLife, 8);
        this.enemyLife  = Math.min(this.enemyLife,  8);
        if (me) this.showFloat(480, 280, 'Equalizer! Both capped at 8!', '#ffdd44');
        break;
      }
      case 'battlecry_reposition_ally': {
        const myRearArr  = me ? this.playerRear  : this.enemyRear;
        const myFrontArr = me ? this.playerFront : this.enemyFront;
        if (myRearArr.length > 0 && myFrontArr.length < 4) {
          const moved = myRearArr.splice(0, 1)[0];
          myFrontArr.push(moved);
          if (me) this.showFloat(340, 285, card.name + '! Demon to front!', '#aaffaa');
        } else if (myFrontArr.length > 1 && myRearArr.length < 4) {
          const moved = myFrontArr.splice(0, 1)[0];
          myRearArr.push(moved);
          if (me) this.showFloat(340, 375, card.name + '! Demon to rear!', '#aaffaa');
        }
        break;
      }
      case 'battlecry_reposition_enemy': {
        const foeFront = me ? this.enemyFront : this.playerFront;
        const foeRear  = me ? this.enemyRear  : this.playerRear;
        if (foeFront.length > 0 && foeRear.length < 4) {
          const moved = foeFront.splice(0, 1)[0];
          foeRear.push(moved);
          if (me) this.showFloat(700, 150, card.name + '! Enemy forced to rear!', '#ff88aa');
        }
        break;
      }
      case 'aura_front_atk_1': {
        myFront.slice(0, -1).forEach(d => d.currentAtk++);
        if (me) this.showFloat(340, 285, card.name + '! Front +1 ATK!', '#ffaa44');
        break;
      }
      case 'aura_front_hp_2': {
        myFront.slice(0, -1).forEach(d => d.currentHp += 2);
        if (me) this.showFloat(340, 285, card.name + '! Front +2 HP!', '#44ff88');
        break;
      }
      case 'aura_front_haste': {
        myFront.slice(0, -1).forEach(d => { d.exhausted = false; });
        if (me) this.showFloat(340, 285, card.name + '! Front row Haste!', '#ffaa00');
        break;
      }
    }
  }

  resolveDeathrattle(demon, who) {
    if (!demon.ability || !demon.ability.startsWith('deathrattle')) return;
    const me = who === 'player';
    const myFront = me ? this.playerFront : this.enemyFront;

    switch (demon.ability) {
      case 'deathrattle_damage_2':
        if (me) { this.enemyLife  -= 2; this.showFloat(700, 80, demon.name + ' DR! -2', '#ff6600'); }
        else    { this.playerLife -= 2; }
        break;
      case 'deathrattle_buff_all': {
        const myBoard = me ? [...this.playerFront, ...this.playerRear] : [...this.enemyFront, ...this.enemyRear];
        myBoard.forEach(d => { d.currentAtk++; d.currentHp++; d.hp++; });
        if (me) this.showFloat(340, 285, demon.name + ' DR! All +1/+1!', '#ffcc44');
        break;
      }
      case 'deathrattle_return_hand': {
        if (me && this.playerHand.length < 8) {
          this.playerHand.push({ ...demon });
          this.showFloat(340, 460, demon.name + ' returns to hand!', '#aaddff');
        }
        break;
      }
      case 'deathrattle_summon_2_imps': {
        const myFront = me ? this.playerFront : this.enemyFront;
        for (let i = 0; i < 2; i++) {
          if (myFront.length < 4) {
            const impBase = { ...window.CARD_MAP['demon_001'], ability: null, abilityDesc: null };
            myFront.push({ ...impBase, currentHp: 1, currentAtk: 1, exhausted: true });
          }
        }
        if (me) this.showFloat(340, 285, demon.name + ' DR! 2 Imps!', '#884400');
        break;
      }
      case 'aura_front_atk_1': {
        const myFront = me ? this.playerFront : this.enemyFront;
        myFront.forEach(d => { d.currentAtk = Math.max(0, d.currentAtk - 1); });
        if (me) this.showFloat(340, 285, demon.name + ' aura fades! -1 ATK', '#888888');
        break;
      }
      case 'aura_front_hp_2': {
        const myFront = me ? this.playerFront : this.enemyFront;
        myFront.forEach(d => { d.currentHp -= 2; });
        this._cleanAllBoards();
        if (me) this.showFloat(340, 285, demon.name + ' aura fades! -2 HP', '#888888');
        break;
      }
      case 'deathrattle_summon_zombie': {
        if (myFront.length < 4) {
          const zombie = {
            id: 'zombie', name: 'Zombie', type: 'demon',
            cost: 2, manaValue: 1, atk: 2, hp: 2, rarity: 'common',
            ability: null, abilityDesc: '', desc: 'Risen dead.',
            currentHp: 2, currentAtk: 2, exhausted: true,
          };
          myFront.push(zombie);
          if (me) this.showFloat(340, 285, 'Lich King DR! Zombie rises!', '#8800ff');
        }
        break;
      }
    }
  }

  abilityTag(ability) {
    if (!ability) return '';
    if (ability.includes('haste') && ability.includes('poisonous')) return 'HST+PSN';
    if (ability.includes('haste') && ability.includes('lifesteal')) return 'HST+LST';
    if (ability.includes('haste'))        return 'HASTE';
    if (ability.includes('taunt'))        return 'TAUNT';
    if (ability.includes('lifesteal'))    return 'LIFESTEAL';
    if (ability.includes('poisonous'))    return 'POISON';
    if (ability.includes('unblockable')) return 'UNBLOCKABL';
    if (ability.includes('rage'))         return 'RAGE';
    if (ability.startsWith('battlecry')) return 'BATTLECRY';
    if (ability.startsWith('deathrattle')) return 'DEATHRATTL';
    if (ability.startsWith('aura'))          return 'AURA';
    if (ability === 'any_death_drain')       return 'DEATH DRAIN';
    if (ability === 'any_death_draw')        return 'DEATH DRAW';
    if (ability === 'feed_on_death')         return 'FEED';
    if (ability === 'ally_death_mana')       return 'DEATH MANA';
    if (ability === 'ally_death_lifegain')   return 'DEATH HEAL';
    if (ability === 'osiris_piece')          return 'OSIRIS';
    if (ability === 'double_attack')         return '2x ATTACK';
    if (ability === 'mimic_board_count')     return 'MIMIC';
    if (ability === 'chaos_dragon')          return 'CHAOS';
    if (ability === 'divine_shield')         return 'DIV SHIELD';
    if (ability === 'mana_per_turn')         return 'MANA RAMP';
    if (ability === 'spell_lifegain')        return 'SPELL HEAL';
    if (ability === 'spell_aoe')             return 'SPELL AOE';
    if (ability === 'tax_spells')            return 'TAXED';
    if (ability === 'taunt_regen')           return 'TNT+REGEN';
    if (ability === 'taunt_poisonous')       return 'TNT+PSN';
    if (ability === 'taunt_lifesteal')       return 'TNT+LST';
    if (ability === 'haste_taunt')           return 'HST+TNT';
    if (ability === 'haste_unblockable')     return 'HST+UNBLK';
    if (ability === 'haste_face_draw')       return 'HST+DRAW';
    if (ability === 'haste_face_mana')       return 'HST+MANA';
    if (ability === 'unblockable_lifesteal') return 'UNBLK+LST';
    if (ability === 'draw_pings')            return 'DRAW PING';
    if (ability === 'deathrattle_buff_all')  return 'DR: +1/+1';
    if (ability === 'deathrattle_return_hand') return 'DR: RETURN';
    return '';
  }

  abilityColor(ability) {
    if (!ability) return '#888888';
    if (ability.includes('haste'))        return '#ffaa00';
    if (ability.includes('taunt'))        return '#44aaff';
    if (ability.includes('lifesteal'))    return '#44ff88';
    if (ability.includes('poisonous'))    return '#88ff44';
    if (ability.includes('unblockable')) return '#ff44ff';
    if (ability.includes('rage'))          return '#ff6644';
    if (ability.startsWith('battlecry'))  return '#ffdd44';
    if (ability.startsWith('deathrattle'))return '#bb88ff';
    if (ability.startsWith('aura'))       return '#44ddff';
    if (ability === 'any_death_drain' || ability === 'any_death_draw') return '#cc44cc';
    if (ability === 'feed_on_death' || ability === 'ally_death_mana' || ability === 'ally_death_lifegain') return '#884488';
    if (ability === 'osiris_piece')       return '#ffdd00';
    if (ability === 'double_attack')      return '#ff8844';
    if (ability === 'mimic_board_count')  return '#aaaaaa';
    if (ability === 'chaos_dragon')       return '#ff2244';
    if (ability === 'divine_shield')      return '#ffffaa';
    if (ability === 'mana_per_turn')      return '#44bb44';
    if (ability === 'spell_aoe' || ability === 'spell_lifegain') return '#ff9944';
    if (ability === 'tax_spells')         return '#cc8844';
    if (ability.includes('taunt'))        return '#44aaff';
    if (ability.includes('haste'))        return '#ffaa00';
    if (ability.includes('unblockable'))  return '#ff44ff';
    if (ability === 'draw_pings')         return '#44ccff';
    return '#888888';
  }

  // ═══════════════ SPELLS ═══════════════════════════════════════════════

  resolveSpell(card, who) {
    const me = who === 'player';
    const myBoard  = me ? [...this.playerFront, ...this.playerRear] : [...this.enemyFront, ...this.enemyRear];
    const foeBoard = me ? [...this.enemyFront, ...this.enemyRear]   : [...this.playerFront, ...this.playerRear];

    // Pyromancer: deal 1 to all enemies when any spell is played
    if (me) {
      [...this.playerFront, ...this.playerRear].filter(d => d.ability === 'spell_aoe').forEach(() => {
        this.enemyFront.forEach(d => d.currentHp--);
        this.enemyRear.forEach(d => d.currentHp--);
        this._cleanAllBoards();
      });
      // Star Prophet: deal 1 to enemy when cards are drawn (handled in drawPlayerCards)
      // draw_pings handled separately
    }
    // double_next_spell: resolve spell twice
    if (me && this._doubleNextSpell && card.effect !== 'double_next_spell') {
      this._doubleNextSpell = false;
    }
    const fx = (x, y, msg, col) => { if (me) this.showFloat(x, y, msg, col); };
    switch (card.effect) {
      case 'damage':
        if (me) { this.enemyLife  -= card.value; fx(700, 80, card.name + '! -' + card.value, '#ff6600'); }
        else    { this.playerLife -= card.value; }
        break;
      case 'heal':
        if (me) { this.playerLife = Math.min(this.playerMaxLife, this.playerLife + card.value); fx(340, 460, '+' + card.value + ' life', '#44ff44'); }
        else    { this.enemyLife = Math.min(this.enemyDef.life, this.enemyLife + card.value); }
        break;
      case 'draw':
        if (me) { this.drawPlayerCards(card.value); fx(480, 460, 'Draw ' + card.value, '#aaddff'); }
        else    { for (let i = 0; i < card.value; i++) this.drawEnemyCard(); }
        break;
      case 'destroy':
        if (foeBoard.length) {
          const t = foeBoard.reduce((a, b) => a.currentHp < b.currentHp ? a : b);
          this._killDemon(t, me ? 'enemy' : 'player');
          fx(me ? 700 : 340, 150, 'Soul Drain!', '#8800aa');
        }
        break;
      case 'aoe_enemy':
        foeBoard.forEach(d => d.currentHp -= card.value);
        this._cleanAllBoards();
        fx(700, 150, 'Inferno! -' + card.value, '#ff4400');
        break;
      case 'buff_hp':
        if (myBoard.length) { myBoard[myBoard.length-1].currentHp += card.value; fx(340, 285, '+' + card.value + ' HP', '#44ff44'); }
        break;
      case 'debuff_atk':
        if (foeBoard.length) {
          const t = foeBoard.reduce((a,b) => a.currentAtk > b.currentAtk ? a : b);
          t.currentAtk = Math.max(0, t.currentAtk - card.value);
          fx(700, 150, '-' + card.value + ' ATK', '#00aa66');
        }
        break;
      case 'resurrect':
        if (me && this.playerGraveyard.length) {
          const t = this.playerGraveyard.pop(); this.playerHand.push(t);
          fx(340, 460, 'Rise! ' + t.name, '#ffcc44');
        }
        break;
      case 'mana_boost':
        if (me) { this.playerMana += card.value; fx(340, 450, '+' + card.value + ' mana!', '#4499ff'); }
        break;
      case 'aoe_demon_dmg':
        foeBoard.forEach(d => d.currentHp -= card.value);
        this._cleanAllBoards();
        fx(me ? 700 : 340, 150, 'Chain Lightning!', '#ffff44');
        break;
      case 'life_per_demon':
        if (me) {
          const g = myBoard.length * card.value;
          this.playerLife = Math.min(this.playerMaxLife, this.playerLife + g);
          fx(340, 460, '+' + g + ' life', '#44ff44');
        }
        break;
      case 'buff_atk_all':
        myBoard.forEach(d => d.currentAtk += card.value);
        fx(340, 285, 'Blood Moon! +' + card.value + ' ATK', '#cc0066');
        break;
      case 'aoe_all_hp':
        [...this.playerFront, ...this.playerRear, ...this.enemyFront, ...this.enemyRear].forEach(d => d.currentHp -= card.value);
        this._cleanAllBoards();
        fx(480, 280, 'Plague!', '#336600');
        break;
      case 'summon_imp': {
        const noHasteImp = { ...window.CARD_MAP['demon_001'], ability: null, abilityDesc: null };
        if (this.playerFront.length < 4 && me) {
          this.playerFront.push({ ...noHasteImp, currentHp: 1, currentAtk: 1, exhausted: true });
          fx(340, 285, 'Imp!', '#884400');
        } else if (!me && this.enemyFront.length < 4) {
          this.enemyFront.push({ ...noHasteImp, currentHp: 1, currentAtk: 1, exhausted: true });
        }
        break;
      }
      case 'win_condition':
        if (me && this.enemyLife <= card.value) { this.enemyLife = 0; fx(480, 80, 'FINAL HOUR!', '#ff0000'); }
        break;
      case 'resurrect_all': {
        if (me) {
          const demons = this.playerGraveyard.filter(c => c.type === 'demon');
          demons.forEach(d => {
            this.playerGraveyard.splice(this.playerGraveyard.indexOf(d), 1);
            this.playerHand.push(d);
          });
          fx(480, 460, 'Final Hour! +' + demons.length + ' demons to hand!', '#ffcc44');
        }
        break;
      }
      case 'gain_mana':
        if (me) { this.playerMana += card.value; fx(340, 450, '+' + card.value + ' mana!', '#4499ff'); }
        break;
      case 'hp_to_mana':
        if (me) { this.playerLife -= card.value; this.playerMana += card.value; fx(340, 450, '-' + card.value + ' HP, +' + card.value + ' mana!', '#cc44cc'); }
        break;
      case 'mana_per_demon':
        if (me) {
          const g = [...this.playerFront, ...this.playerRear].length;
          this.playerMana += g; fx(340, 450, '+' + g + ' mana!', '#4499ff');
        }
        break;
      case 'mana_per_graveyard':
        if (me) {
          const g = Math.min(card.value, this.playerGraveyard.length);
          this.playerMana += g; fx(340, 450, '+' + g + ' mana!', '#4499ff');
        }
        break;
      case 'deal_and_gain_mana':
        if (me) { this.enemyLife -= card.value; this.playerMana += card.value; fx(700, 80, '-' + card.value + ' + mana!', '#ff6600'); }
        else    { this.playerLife -= card.value; }
        break;
      case 'deal_face':
        if (me) { this.enemyLife  -= card.value; fx(700, 80, card.name + '! -' + card.value, '#ff4400'); }
        else    { this.playerLife -= card.value; }
        break;
      case 'deal_face_if_low':
        if (me && this.enemyLife <= card.value) { this.enemyLife -= card.value; fx(700, 80, card.name + '! -' + card.value, '#ff0000'); }
        break;
      case 'aoe_all_2':
        [...this.playerFront, ...this.playerRear, ...this.enemyFront, ...this.enemyRear].forEach(d => d.currentHp -= card.value);
        this._cleanAllBoards();
        fx(480, 280, card.name + '! All -' + card.value, '#ff8800');
        break;
      case 'aoe_enemy_and_face':
        foeBoard.forEach(d => d.currentHp -= card.value);
        if (me) this.enemyLife -= card.value; else this.playerLife -= card.value;
        this._cleanAllBoards();
        fx(700, 150, card.name + '! -' + card.value + ' all!', '#ff4400');
        break;
      case 'chaos_damage': {
        const dmg = 1 + Math.floor(Math.random() * card.value);
        if (me) { this.enemyLife -= dmg; fx(700, 80, 'Chaos! -' + dmg, '#ff44ff'); }
        else    { this.playerLife -= dmg; }
        break;
      }
      case 'face_per_graveyard': {
        const count = me ? this.playerGraveyard.length : this.enemyGraveyard.length;
        if (me) { this.enemyLife -= count; fx(700, 80, card.name + '! -' + count, '#cc0044'); }
        else    { this.playerLife -= count; }
        break;
      }
      case 'freeze_all_enemy':
        foeBoard.forEach(d => { d.exhausted = true; });
        fx(700, 150, 'Frost Nova! All frozen!', '#88ccff');
        break;
      case 'freeze_one_demon':
        if (foeBoard.length) { foeBoard[0].exhausted = true; fx(700, 150, 'Frozen!', '#88ccff'); }
        break;
      case 'steal_demon': {
        if (me && this.enemyFront.length > 0) {
          const t = this.enemyFront.reduce((a, b) => a.currentHp < b.currentHp ? a : b);
          this.enemyFront.splice(this.enemyFront.indexOf(t), 1);
          if (this.playerFront.length < 4) this.playerFront.push({ ...t, exhausted: true });
          fx(480, 285, 'Mind Control! Stolen: ' + t.name, '#cc44ff');
        }
        break;
      }
      case 'return_demon': {
        const foeArr = me ? this.enemyFront : this.playerFront;
        if (foeArr.length) {
          const t = foeArr.reduce((a, b) => a.currentAtk >= b.currentAtk ? a : b);
          foeArr.splice(foeArr.indexOf(t), 1);
          const oppHand = me ? this.enemyHand : this.playerHand;
          if (oppHand.length < 8) oppHand.push(t);
          fx(700, 150, 'Disruption! ' + t.name + ' returned!', '#cc44cc');
        }
        break;
      }
      case 'deal_face_drain':
        if (me) { this.enemyLife -= card.value; this.playerLife = Math.min(this.playerMaxLife, this.playerLife + card.value); fx(700, 80, 'Drain! -' + card.value + '/+' + card.value, '#44ff88'); }
        else    { this.playerLife -= card.value; this.enemyLife = Math.min(this.enemyDef.life, this.enemyLife + card.value); }
        break;
      case 'destroy_all_both': {
        const all = [...this.playerFront, ...this.playerRear, ...this.enemyFront, ...this.enemyRear];
        all.forEach(d => {
          const owner = (this.playerFront.includes(d) || this.playerRear.includes(d)) ? 'player' : 'enemy';
          this._killDemon(d, owner);
        });
        fx(480, 280, 'WRATH! All destroyed!', '#ff0000');
        break;
      }
      case 'silence_demon': {
        if (foeBoard.length) {
          const t = foeBoard.reduce((a, b) => a.currentAtk >= b.currentAtk ? a : b);
          t.ability = null; t.abilityDesc = null;
          fx(700, 150, 'Silence! ' + t.name + ' silenced!', '#888888');
        }
        break;
      }
      case 'transform_1_1': {
        if (foeBoard.length) {
          const t = foeBoard.reduce((a, b) => a.currentHp <= b.currentHp ? a : b);
          t.currentAtk = 1; t.currentHp = 1; t.atk = 1; t.hp = 1;
          t.ability = null; t.abilityDesc = null; t.name = 'Toad';
          fx(700, 150, 'Dark Transformation! Toad!', '#558833');
        }
        break;
      }
      case 'destroy_low_atk': {
        const targets = foeBoard.filter(d => d.currentAtk <= card.value);
        if (targets.length) {
          const t = targets[0];
          this._killDemon(t, me ? 'enemy' : 'player');
          fx(700, 150, card.name + '! Destroyed!', '#884400');
        }
        break;
      }
      case 'destroy_damaged': {
        const damagedTargets = foeBoard.filter(d => d.currentHp < d.hp);
        if (damagedTargets.length) {
          const t = damagedTargets[0];
          this._killDemon(t, me ? 'enemy' : 'player');
          fx(700, 150, 'Execute! Destroyed!', '#ff4400');
        }
        break;
      }
      case 'hp_for_draw':
        if (me) { this.playerLife -= card.value; this.drawPlayerCards(card.value); fx(340, 460, '-' + card.value + ' HP, draw ' + card.value, '#aaddff'); }
        break;
      case 'buff_all_stats':
        myBoard.forEach(d => { d.currentAtk += card.value; d.currentHp += card.value; d.hp += card.value; });
        fx(340, 285, 'Rally! +' + card.value + '/+' + card.value + '!', '#ffaa44');
        break;
      case 'buff_atk_all_turn':
        myBoard.forEach(d => { d.currentAtk += card.value; d._battleFrenzyBonus = (d._battleFrenzyBonus || 0) + card.value; });
        fx(340, 285, 'Battle Frenzy! +' + card.value + ' ATK!', '#ffdd44');
        break;
      case 'buff_hp_all':
        myBoard.forEach(d => { d.currentHp += card.value; d.hp += card.value; });
        fx(340, 285, 'Divine Favor! +' + card.value + ' HP!', '#44ff88');
        break;
      case 'give_divine_shield':
        if (myBoard.length) {
          const t = myBoard[myBoard.length - 1];
          t.divineShield = true;
          fx(340, 285, 'Divine Shield on ' + t.name + '!', '#ffee44');
        }
        break;
      case 'buff_target_stats':
        if (myBoard.length) {
          const t = myBoard[myBoard.length - 1];
          t.currentAtk += card.value; t.currentHp += card.value; t.hp += card.value;
          fx(340, 285, '+' + card.value + '/+' + card.value + ' on ' + t.name, '#ffaa44');
        }
        break;
      case 'reanimate_top': {
        if (me) {
          const demons = this.playerGraveyard.filter(c => c.type === 'demon');
          if (demons.length && this.playerFront.length < 4) {
            const top = demons.reduce((a, b) => (a.cost || 0) >= (b.cost || 0) ? a : b);
            this.playerGraveyard.splice(this.playerGraveyard.indexOf(top), 1);
            this.playerFront.push({ ...top, currentHp: top.hp, currentAtk: top.atk, exhausted: true });
            fx(480, 460, 'Reanimate! ' + top.name + ' rises!', '#bb88ff');
          }
        }
        break;
      }
      case 'debuff_atk_all':
        foeBoard.forEach(d => { d.currentAtk = Math.max(0, d.currentAtk - card.value); });
        fx(700, 150, 'Cursed Ground! All -' + card.value + ' ATK!', '#558833');
        break;
      case 'double_next_spell':
        if (me) { this._doubleNextSpell = true; fx(340, 450, 'Arcane Mastery! Next spell doubled!', '#ffcc44'); }
        break;
      case 'reanimate_demon': {
        if (me) {
          const demons = this.playerGraveyard.filter(c => c.type === 'demon');
          if (demons.length > 0 && this.playerFront.length < 4) {
            const d = demons[demons.length - 1];
            this.playerGraveyard.splice(this.playerGraveyard.indexOf(d), 1);
            this.playerFront.push({ ...d, currentHp: d.hp, currentAtk: d.atk, exhausted: true });
            fx(480, 460, 'Soul Recall! ' + d.name + ' rises!', '#ffcc44');
          }
        }
        break;
      }
    }
  }

  // ── Kill helpers ──────────────────────────────────────────────────────

  _killDemon(demon, side) {
    // side = 'player' or 'enemy'
    if (side === 'player') {
      this.killFrom(this.playerFront, this.playerGraveyard, demon);
      this.killFrom(this.playerRear,  this.playerGraveyard, demon);
    } else {
      this.killFrom(this.enemyFront, this.enemyGraveyard, demon);
      this.killFrom(this.enemyRear,  this.enemyGraveyard, demon);
    }
  }

  killFromPlayer(demon) {
    // Try player front then rear
    let i = this.playerFront.indexOf(demon);
    if (i >= 0) {
      this._spawnDeathParticles(this._boardDemonX(this.playerFront, i), 285, 0x8844ff);
      this.playerFront.splice(i, 1);
      this.resolveDeathrattle(demon, 'player');
      this.playerGraveyard.push(demon);
      return;
    }
    i = this.playerRear.indexOf(demon);
    if (i >= 0) {
      this._spawnDeathParticles(this._boardDemonX(this.playerRear, i), 375, 0x8844ff);
      this.playerRear.splice(i, 1);
      this.resolveDeathrattle(demon, 'player');
      this.playerGraveyard.push(demon);
    }
  }

  killFrom(board, discard, demon) {
    const i = board.indexOf(demon);
    if (i >= 0) {
      const isPlayerBoard = (board === this.playerFront || board === this.playerRear);
      const who = isPlayerBoard ? 'player' : 'enemy';
      // Determine row Y for particles
      let ry = 285;
      if (board === this.playerRear)  ry = 375;
      else if (board === this.enemyFront) ry = 168;
      else if (board === this.enemyRear)  ry = 78;
      const color = isPlayerBoard ? 0x8844ff : 0xff2222;
      this._spawnDeathParticles(this._boardDemonX(board, i), ry, color);
      board.splice(i, 1);
      this.resolveDeathrattle(demon, who);
      discard.push(demon);
      this._resolveDeathTriggers(who);
    }
  }

  // ── Death particle burst ──────────────────────────────────────────────────

  _boardDemonX(board, idx) {
    const CW = 88, GAP = 8;
    const blockW = board.length * (CW + GAP) - GAP;
    const sx = Math.max(185, 480 - blockW / 2);
    return sx + idx * (CW + GAP) + CW / 2;
  }

  _flashScreen(color) {
    // GBA-style: single-frame white flash, snaps off
    const flash = this.add.rectangle(480, 320, 960, 640, color, 1).setDepth(97);
    this.time.delayedCall(50, () => flash.destroy());
  }

  _spawnDeathParticles(cx, cy, color) {
    // GBA-style: 8 pixel squares fly out in 8 directions, no alpha — they just move and disappear
    const DIRS = [
      [-1,-1],[ 0,-1],[ 1,-1],
      [-1, 0],        [ 1, 0],
      [-1, 1],[ 0, 1],[ 1, 1],
    ];
    DIRS.forEach(([dx, dy]) => {
      const dist = 28 + Math.floor(Math.random() * 20);
      const sz   = 2 + Math.floor(Math.random() * 3) * 2; // 2, 4, or 6px — always even for pixel-art
      const g = this.add.graphics().setDepth(99);
      g.fillStyle(color, 1);
      g.fillRect(-sz/2, -sz/2, sz, sz);
      g.x = cx; g.y = cy;
      this.tweens.add({
        targets: g,
        x: cx + dx * dist,
        y: cy + dy * dist,
        duration: 140,
        ease: 'Linear',
        onComplete: () => {
          // Second phase: white replacement pixel, then gone
          g.clear();
          g.fillStyle(0xffffff, 1);
          g.fillRect(-2, -2, 4, 4);
          this.time.delayedCall(60, () => g.destroy());
        },
      });
    });
    // White 4x4 flash at center — GBA hit spark
    const spark = this.add.graphics().setDepth(99);
    spark.fillStyle(0xffffff, 1);
    spark.fillRect(-4, -4, 8, 8);
    spark.x = cx; spark.y = cy;
    this.time.delayedCall(80, () => spark.destroy());
  }

  cleanBoard(board, discard) {
    for (let i = board.length - 1; i >= 0; i--) {
      if (board[i].currentHp <= 0) {
        const isPlayerBoard = (board === this.playerFront || board === this.playerRear);
        const who = isPlayerBoard ? 'player' : 'enemy';
        const dead = board.splice(i, 1)[0];
        this.resolveDeathrattle(dead, who);
        discard.push(dead);
        this._resolveDeathTriggers(who);
      }
    }
  }

  _resolveDeathTriggers(deadOwner) {
    const playerBoard = [...this.playerFront, ...this.playerRear];
    const enemyBoard  = [...this.enemyFront,  ...this.enemyRear];

    // any_death_drain: opponent's Death Knell deals 1 to the owner
    const oppBoard = deadOwner === 'player' ? enemyBoard : playerBoard;
    if (oppBoard.some(d => d.ability === 'any_death_drain')) {
      if (deadOwner === 'player') this.playerLife -= 1;
      else                        this.enemyLife  -= 1;
    }

    // any_death_draw: player draws if they have Soul Collector
    if (playerBoard.some(d => d.ability === 'any_death_draw')) {
      this.drawPlayerCards(1);
    }

    // feed_on_death: player's Grave Glutton grows +1/+1
    playerBoard.filter(d => d.ability === 'feed_on_death').forEach(d => {
      d.currentAtk++; d.currentHp++; d.hp++;
    });
    enemyBoard.filter(d => d.ability === 'feed_on_death').forEach(d => {
      d.currentAtk++; d.currentHp++; d.hp++;
    });

    // ally_death_mana / ally_death_lifegain: only fires when a FRIENDLY demon dies
    if (deadOwner === 'player') {
      playerBoard.filter(d => d.ability === 'ally_death_mana').forEach(() => { this.playerMana += 1; });
      playerBoard.filter(d => d.ability === 'ally_death_lifegain').forEach(() => { this.playerLife = Math.min(this.playerMaxLife, this.playerLife + 1); });
    }
  }

  _cleanAllBoards() {
    this.cleanBoard(this.playerFront, this.playerGraveyard);
    this.cleanBoard(this.playerRear,  this.playerGraveyard);
    this.cleanBoard(this.enemyFront,  this.enemyGraveyard);
    this.cleanBoard(this.enemyRear,   this.enemyGraveyard);
  }

  // ═══════════════ ATTACK ═══════════════════════════════════════════════

  initiateAttack(demon) {
    this.clearPopup();
    this.dismissActionMenu();
    // Only front row can attack
    if (!this.playerFront.includes(demon)) {
      this.showFloat(480, 375, 'Rear row demons cannot attack!', '#ff8800');
      return;
    }
    const idx = this.playerFront.indexOf(demon);
    this.attackingDemon = { demon, idx };
    this.awaitingTarget = true;
    this.btnCancel.setVisible(true);
    this.renderAll();
    this.txtTurn.setText('⚔ Choose a target — enemy demon or FACE button');
  }

  cancelAttack() {
    this.attackingDemon = null; this.awaitingTarget = false;
    this.btnCancel.setVisible(false); this.renderAll();
    this.txtTurn.setText('YOUR TURN  (turn ' + this.turnNumber + ')');
  }

  attackFace() {
    if (!this.attackingDemon) { this.showFloat(480, 390, 'Select your demon first', '#ff8800'); return; }
    const { demon } = this.attackingDemon;
    const isUnblockable = demon.ability && demon.ability.includes('unblockable');

    if (!isUnblockable) {
      // Must attack front taunt first
      const frontTaunt = this.enemyFront.find(d => d.ability && d.ability.includes('taunt'));
      if (frontTaunt) {
        this.showFloat(480, 150, 'Must attack the Taunt demon!', '#ff8800');
        return;
      }
      // If enemy front has demons, must attack them
      if (this.enemyFront.length > 0) {
        this.showFloat(480, 150, 'Must attack enemy front demons first!', '#ff8800');
        return;
      }
    }

    this.enemyLife -= demon.currentAtk;
    this._flashScreen(0xffffff);
    demon.attacksThisTurn = (demon.attacksThisTurn || 0) + 1;
    demon.exhausted = !(demon.ability === 'double_attack' && demon.attacksThisTurn < 2);
    if (demon.ability === 'haste_face_draw' || demon.ability === 'face_damage_draw') {
      this.drawPlayerCards(1); this.showFloat(340, 460, 'Draw!', '#aaddff');
    }
    if (demon.ability === 'haste_face_mana' || demon.ability === 'face_damage_mana') {
      this.playerMana += 1; this.showFloat(340, 460, '+1 mana!', '#4499ff');
    }
    if (demon.ability && demon.ability.includes('lifesteal')) {
      this.playerLife = Math.min(this.playerMaxLife, this.playerLife + demon.currentAtk);
      this.showFloat(340, 460, '+' + demon.currentAtk + ' (Lifesteal)', '#44ff88');
    }
    this.showFloat(760, 80, '⚔ -' + demon.currentAtk, '#ff2222');
    this.addLog(demon.name + ' hits enemy for ' + demon.currentAtk, '#ffee44');
    this.cancelAttack(); this.updateUI(); this.checkWin();
  }

  attackDemon(target, targetSide) {
    // targetSide: 'front' or 'rear'
    if (!this.attackingDemon) return;
    const { demon } = this.attackingDemon;
    const isUnblockable = demon.ability && demon.ability.includes('unblockable');

    if (!isUnblockable) {
      // Enforce taunt on front row
      const frontTaunt = this.enemyFront.find(d => d.ability && d.ability.includes('taunt'));
      if (frontTaunt && target !== frontTaunt) {
        this.showFloat(480, 150, 'Must attack the Taunt demon first!', '#ff8800');
        return;
      }
      // Cannot attack rear if front has demons
      if (targetSide === 'rear' && this.enemyFront.length > 0) {
        this.showFloat(480, 150, 'Enemy rear is protected by front row!', '#ff8800');
        return;
      }
    }

    const dmgToTarget = demon.currentAtk;
    const dmgToDemon  = target.currentAtk;

    // divine_shield absorbs first hit
    if (target.divineShield && dmgToTarget > 0) { target.divineShield = false; }
    else target.currentHp -= dmgToTarget;
    if (demon.divineShield && dmgToDemon > 0) { demon.divineShield = false; }
    else demon.currentHp -= dmgToDemon;
    demon.attacksThisTurn = (demon.attacksThisTurn || 0) + 1;
    demon.exhausted = !(demon.ability === 'double_attack' && demon.attacksThisTurn < 2);

    if (demon.ability  && demon.ability.includes('rage')  && dmgToDemon  > 0) demon.currentAtk++;
    if (target.ability && target.ability.includes('rage') && dmgToTarget > 0) target.currentAtk++;

    if (demon.ability && demon.ability.includes('lifesteal')) {
      this.playerLife = Math.min(this.playerMaxLife, this.playerLife + dmgToTarget);
      this.showFloat(340, 460, '+' + dmgToTarget + ' (Lifesteal)', '#44ff88');
    }

    if (demon.ability && demon.ability.includes('poisonous') && target.currentHp > 0) target.currentHp = 0;

    this.showFloat(700, 150, '⚔ -' + dmgToTarget, '#ff4444');
    this.showFloat(340, 285, '⚔ -' + dmgToDemon, '#ff8888');
    this.addLog(demon.name + ' attacks ' + target.name + ' (' + dmgToTarget + '/' + dmgToDemon + ')', '#ffee44');

    if (target.currentHp <= 0) {
      this.addLog(target.name + ' dies', '#ff6644');
      this.killFrom(targetSide === 'front' ? this.enemyFront : this.enemyRear, this.enemyGraveyard, target);
    }
    if (demon.currentHp <= 0) {
      this.addLog(demon.name + ' dies', '#ff8866');
      this.killFrom(this.playerFront, this.playerGraveyard, demon);
    }
    this.cancelAttack(); this.updateUI(); this.checkWin();
  }

  // ═══════════════ ACTION MENU ══════════════════════════════════════════

  showActionMenu(demon, cx, cy) {
    this.dismissActionMenu();
    if (this.turn !== 'player' || this.gameOver) return;

    const objs = [];
    const menuY = cy - 75;
    const menuX = cx;

    const bg = this.add.graphics().setDepth(18);
    bg.fillStyle(0x1a1a2a, 0.97);
    bg.fillRoundedRect(menuX - 52, menuY - 8, 104, 66, 6);
    bg.lineStyle(1, 0x445566);
    bg.strokeRoundedRect(menuX - 52, menuY - 8, 104, 66, 6);
    objs.push(bg);

    // Attack button
    const canAttack = !demon.exhausted && this.playerFront.includes(demon);
    const atkBtn = this.add.text(menuX, menuY + 6, '⚔ Attack', {
      fontSize: '12px', fontFamily: 'monospace',
      color: canAttack ? '#ffcc44' : '#555555',
      backgroundColor: canAttack ? '#2a1800' : '#111111',
      padding: { x: 6, y: 3 }
    }).setOrigin(0.5, 0).setDepth(19);
    if (canAttack) {
      atkBtn.setInteractive({ useHandCursor: true });
      atkBtn.on('pointerdown', (p) => { p.event && p.event.stopPropagation && p.event.stopPropagation(); this.initiateAttack(demon); });
      atkBtn.on('pointerover', () => atkBtn.setStyle({ backgroundColor: '#443300' }));
      atkBtn.on('pointerout',  () => atkBtn.setStyle({ backgroundColor: '#2a1800' }));
    }
    objs.push(atkBtn);

    // Move row button
    const canMove = !this.rowMoveDone;
    const inFront = this.playerFront.includes(demon);
    const moveLabel = '↕ ' + (inFront ? 'Move → Rear' : 'Move → Front');
    const moveBtn = this.add.text(menuX, menuY + 32, moveLabel, {
      fontSize: '11px', fontFamily: 'monospace',
      color: canMove ? '#aaffaa' : '#555555',
      backgroundColor: canMove ? '#0a2a0a' : '#111111',
      padding: { x: 6, y: 3 }
    }).setOrigin(0.5, 0).setDepth(19);
    if (canMove) {
      moveBtn.setInteractive({ useHandCursor: true });
      moveBtn.on('pointerdown', (p) => { p.event && p.event.stopPropagation && p.event.stopPropagation(); this.moveRow(demon); });
      moveBtn.on('pointerover', () => moveBtn.setStyle({ backgroundColor: '#0f3a0f' }));
      moveBtn.on('pointerout',  () => moveBtn.setStyle({ backgroundColor: '#0a2a0a' }));
    }
    objs.push(moveBtn);

    this._actionMenu = { demon, objs };
  }

  dismissActionMenu() {
    if (!this._actionMenu) return;
    this._actionMenu.objs.forEach(o => { try { o.destroy(); } catch(e){} });
    this._actionMenu = null;
  }

  // ═══════════════ DRAG SYSTEM ══════════════════════════════════════════

  startDrag(card, handIdx, ptr) {
    if (this.turn !== 'player' || this.gameOver) return;
    this.dragInfo = { card, handIdx };
    this.dragGhost = this.createDragGhost(card);
    this.dragGhost.setPosition(ptr.x, ptr.y);
    this.showDragHighlights(card);
    this.hideZoom();
    this.renderAll();
  }

  handleDrop(x, y) {
    if (!this.dragInfo) return;
    const { card, handIdx } = this.dragInfo;
    this.dragInfo = null;
    if (this.dragGhost) { this.dragGhost.destroy(); this.dragGhost = null; }
    this.hideDragHighlights();

    const inPitchZone = y >= this.PITCH_Y && y <= this.PITCH_Y + this.PITCH_H && x >= 180 && x <= 780;
    const inBoardZone = y >= this.BOARD_Y && y <= this.BOARD_Y + this.BOARD_H;

    if (inPitchZone) {
      this.pitchCard(card, handIdx);
    } else if (inBoardZone) {
      // Determine front vs rear based on y position
      const targetRow = y < 330 ? 'front' : 'rear';
      this.playForEffect(card, handIdx, targetRow);
    } else {
      this.renderAll();
    }
  }

  createDragGhost(card) {
    const W = 90, H = 120;
    const g = this.add.graphics().setDepth(30);
    g.fillStyle(0x1a1a33, 0.95); g.fillRoundedRect(-W/2, -H/2, W, H, 6);
    g.lineStyle(3, 0xffffff, 0.9); g.strokeRoundedRect(-W/2, -H/2, W, H, 6);

    const artImg = this.add.image(0, -10, this.artKey(card))
      .setDisplaySize(W - 8, Math.floor(H * 0.55)).setDepth(30.05);

    const nm = this.add.text(0, -H/2+6, card.name||'?', {
      fontSize: '9px', fontFamily: 'monospace', color: '#fff',
      wordWrap: { width: W-6 }, align: 'center'
    }).setOrigin(0.5, 0).setDepth(30.1);

    const st = this.add.text(0, H/2-16,
      card.type === 'demon' ? '⚔' + card.atk + '  ❤' + card.hp : 'cost ' + card.cost, {
        fontSize: '11px', fontFamily: 'monospace', color: '#ffcc44'
      }).setOrigin(0.5, 0).setDepth(30.1);

    const cont = this.add.container(0, 0, [g, artImg, nm, st]).setDepth(30);
    return cont;
  }

  showDragHighlights(card) {
    this.hideDragHighlights();
    const isDemon = card && card.type === 'demon';

    if (isDemon) {
      // Front row highlight
      const bFront = this.add.graphics().setDepth(12);
      bFront.fillStyle(0x00ff44, 0.08); bFront.fillRect(4, this.BOARD_Y, 870, 89);
      bFront.lineStyle(2, 0x00ff44, 0.5); bFront.strokeRect(4, this.BOARD_Y, 870, 89);
      const bFrontT = this.add.text(440, this.BOARD_Y + 44, 'DROP → FRONT ROW', {
        fontSize: '16px', fontFamily: 'monospace', color: '#00ff44', alpha: 0.6
      }).setOrigin(0.5).setDepth(12);
      // Rear row highlight
      const bRear = this.add.graphics().setDepth(12);
      bRear.fillStyle(0x00aa33, 0.06); bRear.fillRect(4, this.BOARD_Y + 89, 870, 89);
      bRear.lineStyle(2, 0x00aa33, 0.4); bRear.strokeRect(4, this.BOARD_Y + 89, 870, 89);
      const bRearT = this.add.text(440, this.BOARD_Y + 89 + 44, 'DROP → REAR ROW', {
        fontSize: '16px', fontFamily: 'monospace', color: '#00aa33', alpha: 0.5
      }).setOrigin(0.5).setDepth(12);
      this._dragHlObjs.push(bFront, bFrontT, bRear, bRearT);
    } else {
      const b = this.add.graphics().setDepth(12);
      b.fillStyle(0x00ff44, 0.07); b.fillRoundedRect(4, this.BOARD_Y, 870, this.BOARD_H, 6);
      b.lineStyle(2, 0x00ff44, 0.5); b.strokeRoundedRect(4, this.BOARD_Y, 870, this.BOARD_H, 6);
      const bt = this.add.text(440, this.BOARD_Y + this.BOARD_H/2, 'DROP → PLAY', {
        fontSize: '22px', fontFamily: 'monospace', color: '#00ff44', alpha: 0.5
      }).setOrigin(0.5).setDepth(12);
      this._dragHlObjs.push(b, bt);
    }

    const p = this.add.graphics().setDepth(12);
    p.fillStyle(0xff4400, 0.2); p.fillRoundedRect(180, this.PITCH_Y, 600, this.PITCH_H, 6);
    p.lineStyle(2, 0xff6600, 0.9); p.strokeRoundedRect(180, this.PITCH_Y, 600, this.PITCH_H, 6);
    const pt = this.add.text(480, this.PITCH_Y + this.PITCH_H/2, '🔥 DROP → PITCH FOR MANA', {
      fontSize: '16px', fontFamily: 'monospace', color: '#ff7744'
    }).setOrigin(0.5).setDepth(12);
    this._dragHlObjs.push(p, pt);
  }

  hideDragHighlights() {
    this._dragHlObjs.forEach(o => { try { o.destroy(); } catch(e){} });
    this._dragHlObjs = [];
  }

  // ═══════════════ ZOOM PREVIEW ═════════════════════════════════════════

  showZoom(card, fromX) {
    this.hideZoom();
    this._zoomObjs = [];
    const W = 190, H = 270;
    const px = fromX < 480 ? Math.min(960 - W/2 - 5, 855) : Math.max(W/2 + 5, 105);
    const py = 280;

    const rarityBorder = { common: 0x444444, uncommon: 0xcccccc, rare: 0x2266cc, mythic: 0x9933cc, legendary: 0xff6600 };

    const g = this.add.graphics().setDepth(25);
    g.fillStyle(0x080818); g.fillRoundedRect(px-W/2, py-H/2, W, H, 10);
    g.lineStyle(3, rarityBorder[card.rarity] || 0x556655);
    g.strokeRoundedRect(px-W/2, py-H/2, W, H, 10);
    this._zoomObjs.push(g);

    const artImg = this.add.image(px, py - 38, this.artKey(card))
      .setDisplaySize(100, 100).setDepth(25.05);
    this._zoomObjs.push(artImg);

    const cg = this.add.graphics().setDepth(25.1);
    cg.fillStyle(0x000088); cg.fillCircle(px-W/2+20, py-H/2+20, 18);
    this._zoomObjs.push(cg,
      this.add.text(px-W/2+20, py-H/2+20, '' + (card.cost||0), {
        fontSize: '15px', fontFamily: 'monospace', fontStyle: 'bold', color: '#88ccff'
      }).setOrigin(0.5).setDepth(25.2)
    );


    this._zoomObjs.push(
      this.add.text(px, py-H/2+8, card.name||'?', {
        fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffffff'
      }).setOrigin(0.5, 0).setDepth(25.1)
    );

    if (card.type === 'demon') {
      this._zoomObjs.push(
        this.add.text(px, py+30, '⚔ ' + card.atk + '    ❤ ' + card.hp, {
          fontSize: '18px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffcc44'
        }).setOrigin(0.5).setDepth(25.1)
      );
    }
    if (card.abilityDesc) {
      this._zoomObjs.push(
        this.add.text(px, py + (card.type==='demon' ? 54 : 34), card.abilityDesc, {
          fontSize: '10px', fontFamily: 'monospace', fontStyle: 'bold',
          color: this.abilityColor(card.ability),
          wordWrap: { width: W-20 }, align: 'center'
        }).setOrigin(0.5, 0).setDepth(25.1)
      );
    }

    if (card.type === 'demon' && card.desc) {
      this._zoomObjs.push(
        this.add.text(px, py + (card.abilityDesc ? 78 : 54), card.desc, {
          fontSize: '10px', fontFamily: 'monospace', color: '#aaaaaa',
          wordWrap: { width: W-24 }, align: 'center'
        }).setOrigin(0.5, 0).setDepth(25.1)
      );
    }
    this._zoomObjs.push(
      this.add.text(px, py+H/2-10, (card.rarity||'common').toUpperCase(), {
        fontSize: '10px', fontFamily: 'monospace',
        color: { common:'#888888', uncommon:'#cccccc', rare:'#2266cc', mythic:'#9933cc', legendary:'#ff6600' }[card.rarity] || '#888888'
      }).setOrigin(0.5, 1).setDepth(25.1)
    );
  }

  hideZoom() {
    this._zoomObjs.forEach(o => { try { o.destroy(); } catch(e){} });
    this._zoomObjs = [];
  }

  // ═══════════════ GRAVEYARD VIEWER ════════════════════════════════════

  showGraveyard(who) {
    this.closeGraveyard();
    const cards = who === 'player' ? this.playerGraveyard : this.enemyGraveyard;
    const title = who === 'player' ? 'YOUR GRAVEYARD' : 'ENEMY GRAVEYARD';
    const W = 420, H = 440, px = 480, py = 305;

    const bg = this.add.graphics().setDepth(40);
    bg.fillStyle(0x040408, 0.97); bg.fillRoundedRect(px-W/2, py-H/2, W, H, 10);
    bg.lineStyle(2, who === 'player' ? 0x336633 : 0x663333);
    bg.strokeRoundedRect(px-W/2, py-H/2, W, H, 10);
    this._gyObjs.push(bg);

    this._gyObjs.push(
      this.add.text(px, py-H/2+18, title + ' — ' + cards.length + ' card' + (cards.length !== 1 ? 's' : ''), {
        fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold',
        color: who === 'player' ? '#55cc55' : '#cc5555'
      }).setOrigin(0.5).setDepth(40.1)
    );

    this._gyObjs.push(
      this.add.text(px-W/2+12, py-H/2+36, 'NAME', { fontSize: '10px', fontFamily: 'monospace', color: '#444466' }).setDepth(40.1),
      this.add.text(px+W/2-14, py-H/2+36, 'TYPE', { fontSize: '10px', fontFamily: 'monospace', color: '#444466' }).setOrigin(1, 0).setDepth(40.1)
    );

    const rarityColor = { common: '#888888', uncommon: '#cccccc', rare: '#2266cc', mythic: '#9933cc', legendary: '#ff6600' };

    if (!cards.length) {
      this._gyObjs.push(
        this.add.text(px, py, '— empty —', { fontSize: '13px', fontFamily: 'monospace', color: '#333355' }).setOrigin(0.5).setDepth(40.1)
      );
    } else {
      const maxShow = 20;
      const start   = Math.max(0, cards.length - maxShow);
      if (start > 0) {
        this._gyObjs.push(
          this.add.text(px, py-H/2+50, '... (' + start + ' older cards not shown)', {
            fontSize: '10px', fontFamily: 'monospace', color: '#333355'
          }).setOrigin(0.5, 0).setDepth(40.1)
        );
      }
      const listStart = start > 0 ? py-H/2+62 : py-H/2+50;
      cards.slice(start).forEach((card, i) => {
        const cy    = listStart + i * 18;
        const col   = rarityColor[card.rarity] || '#888888';
        const stat  = card.type === 'demon' ? ' ' + card.atk + '/' + card.hp : '';
        const label = card.name + stat;
        const tag   = card.type === 'demon' ? (card.ability ? card.ability.split('_')[0].toUpperCase() : 'DEMON') : 'SPELL';
        this._gyObjs.push(
          this.add.text(px-W/2+12, cy, label, { fontSize: '11px', fontFamily: 'monospace', color: col }).setDepth(40.1),
          this.add.text(px+W/2-14, cy, tag,   { fontSize: '10px', fontFamily: 'monospace', color: '#444466' }).setOrigin(1, 0).setDepth(40.1)
        );
      });
    }

    const close = this.add.text(px+W/2-8, py-H/2+14, '✕', {
      fontSize: '17px', fontFamily: 'monospace', color: '#884444'
    }).setOrigin(1, 0).setDepth(40.2).setInteractive({ useHandCursor: true });
    close.on('pointerdown', () => this.closeGraveyard());
    close.on('pointerover', () => close.setStyle({ color: '#ff4444' }));
    close.on('pointerout',  () => close.setStyle({ color: '#884444' }));
    this._gyObjs.push(close);

    const overlay = this.add.zone(480, 320, 960, 640).setDepth(39).setInteractive();
    overlay.on('pointerdown', () => this.closeGraveyard());
    this._gyObjs.push(overlay);
  }

  closeGraveyard() {
    this._gyObjs.forEach(o => { try { o.destroy(); } catch(e){} });
    this._gyObjs = [];
  }

  addLog(msg, color) {
    this._logLines.push({ msg, color: color || '#aaaacc' });
    if (this._logScroll > 0) this._logScroll++;
    this._refreshLog();
  }

  _refreshLog() {
    const LOG_ROWS = 12;
    const total    = this._logLines.length;
    this._logScroll = Phaser.Math.Clamp(this._logScroll, 0, Math.max(0, total - LOG_ROWS));
    const startIdx = Math.max(0, total - LOG_ROWS - this._logScroll);
    this._logTextObjs.forEach((t, i) => {
      const entry = this._logLines[startIdx + i];
      if (entry) { t.setText(entry.msg); t.setStyle({ color: entry.color }); }
      else        t.setText('');
    });
    if (total > LOG_ROWS) {
      const showing = startIdx + LOG_ROWS;
      this._logScrollTxt.setText(showing + '/' + total + (this._logScroll > 0 ? ' ▲' : ''));
    } else {
      this._logScrollTxt.setText('');
    }
  }

  // ═══════════════ RENDERING ════════════════════════════════════════════

  renderAll() {
    this.renderHand();
    this.renderPlayerFront();
    this.renderPlayerRear();
    this.renderEnemyFront();
    this.renderEnemyRear();
    this.renderArsenal();
  }

  clear(arr) { arr.forEach(o => { try { o.destroy(); } catch(e){} }); arr.length = 0; }

  // ── Hand ──────────────────────────────────────────────────────────────

  renderHand() {
    this.clear(this._handObjs);
    const hand = this.playerHand;
    const isDragging = !!this.dragInfo;

    if (!hand.length) {
      this._handObjs.push(
        this.add.text(480, 565, 'Hand empty', { fontSize: '14px', fontFamily: 'monospace', color: '#333355' }).setOrigin(0.5)
      );
      return;
    }

    const HAND_L = 185, HAND_R = 870;
    const MAX_W = HAND_R - HAND_L;
    const GAP = 4;
    let CW = 90, CH = 116;
    const needed = hand.length * CW + (hand.length - 1) * GAP;
    if (needed > MAX_W) {
      CW = Math.floor((MAX_W - (hand.length - 1) * GAP) / hand.length);
      CH = Math.floor(CW * 1.28);
    }
    const blockW = hand.length * CW + (hand.length-1) * GAP;
    const sx = Math.max(HAND_L, (HAND_L + HAND_R) / 2 - blockW / 2);

    hand.forEach((card, i) => {
      const cx = sx + i*(CW+GAP) + CW/2;
      const cy = 568;
      const isBeingDragged = isDragging && this.dragInfo.card === card;
      this.drawHandCard(card, i, cx, cy, CW, CH, isBeingDragged);
    });
  }

  drawHandCard(card, handIdx, cx, cy, W, H, dimmed = false) {
    const DEPTH = 6;
    const rarityBorder = { common: 0x444444, uncommon: 0xcccccc, rare: 0x2266cc, mythic: 0x9933cc, legendary: 0xff6600 };
    const border = rarityBorder[card.rarity] || 0x446644;
    const alpha  = dimmed ? 0.25 : 1;

    const g = this.add.graphics().setDepth(DEPTH).setAlpha(alpha);
    g.fillStyle(0x0e0e22); g.fillRoundedRect(cx-W/2, cy-H/2, W, H, 5);
    g.lineStyle(2, border); g.strokeRoundedRect(cx-W/2, cy-H/2, W, H, 5);
    this._handObjs.push(g);

    const cg = this.add.graphics().setDepth(DEPTH+.1).setAlpha(alpha);
    cg.fillStyle(0x000088); cg.fillCircle(cx-W/2+10, cy-H/2+10, 10);
    this._handObjs.push(cg,
      this.add.text(cx-W/2+10, cy-H/2+10, ''+(card.cost||0), {
        fontSize:'10px', fontFamily:'monospace', fontStyle:'bold', color:'#88ccff'
      }).setOrigin(0.5).setDepth(DEPTH+.2).setAlpha(alpha)
    );


    this._handObjs.push(
      this.add.text(cx, cy-H/2+5, card.name||'?', {
        fontSize:'11px', fontFamily:'monospace', color:'#dddddd',
        wordWrap:{width:W-6}, align:'center'
      }).setOrigin(0.5,0).setDepth(DEPTH+.2).setAlpha(alpha)
    );

    const artSize = Math.min(W - 8, Math.floor(H * 0.48));
    const artImg = this.add.image(cx, cy - H/2 + 20 + artSize/2, this.artKey(card))
      .setDisplaySize(artSize, artSize)
      .setDepth(DEPTH + .1).setAlpha(alpha);
    this._handObjs.push(artImg);

    const sb = this.add.graphics().setDepth(DEPTH+.1).setAlpha(alpha);
    sb.fillStyle(0x000000, 0.85); sb.fillRect(cx-W/2, cy+H/2-26, W, 26);
    this._handObjs.push(sb);

    const infoLine = card.type==='demon'
      ? '⚔'+(card.atk||0)+'  ❤'+(card.hp||0)
      : (card.desc||'Spell').substring(0,18);
    this._handObjs.push(
      this.add.text(cx, cy+H/2-24, infoLine, {
        fontSize:'11px', fontFamily:'monospace',
        color: card.type==='demon' ? '#ffcc44' : '#9999ff',
        wordWrap:{width:W-4}, align:'center'
      }).setOrigin(0.5,0).setDepth(DEPTH+.2).setAlpha(alpha)
    );
    if (card.ability) {
      this._handObjs.push(
        this.add.text(cx, cy+H/2-11, this.abilityTag(card.ability), {
          fontSize:'9px', fontFamily:'monospace',
          color: this.abilityColor(card.ability)
        }).setOrigin(0.5).setDepth(DEPTH+.2).setAlpha(alpha)
      );
    }

    if (dimmed) return;

    const zone = this.add.zone(cx, cy, W, H).setDepth(DEPTH+.5).setInteractive({ useHandCursor: true });

    zone.on('pointerover', () => {
      if (this.dragInfo) return;
      g.clear();
      g.fillStyle(0x1a1a38); g.fillRoundedRect(cx-W/2, cy-H/2, W, H, 5);
      g.lineStyle(3, 0xffffff); g.strokeRoundedRect(cx-W/2, cy-H/2, W, H, 5);
      this.showZoom(card, cx);
    });
    zone.on('pointerout', () => {
      if (this.dragInfo) return;
      g.clear();
      g.fillStyle(0x0e0e22); g.fillRoundedRect(cx-W/2, cy-H/2, W, H, 5);
      g.lineStyle(2, border); g.strokeRoundedRect(cx-W/2, cy-H/2, W, H, 5);
      this.hideZoom();
    });

    zone.on('pointerdown', (ptr) => {
      if (this.turn !== 'player' || this.gameOver) return;
      if (ptr.rightButtonDown()) {
        this.pitchCard(card, handIdx);
        return;
      }
      // Shift+click → arsenal
      if (ptr.event && ptr.event.shiftKey) {
        this.sendToArsenal(card, handIdx);
        return;
      }
      this.clearPopup();
      this.startDrag(card, handIdx, ptr);
    });

    this._handObjs.push(zone);
  }

  // ── Arsenal ───────────────────────────────────────────────────────────

  renderArsenal() {
    this.clear(this._arsenalObjs);
    const AX = 917, AY = 360; // center of arsenal slot

    if (!this.arsenalCard) {
      const empty = this.add.text(AX, AY, 'empty', {
        fontSize: '9px', fontFamily: 'monospace', color: '#334455'
      }).setOrigin(0.5).setDepth(5);
      this._arsenalObjs.push(empty);
      return;
    }

    const card = this.arsenalCard;
    const W = 66, H = 86;
    const DEPTH = 5;

    const g = this.add.graphics().setDepth(DEPTH);
    g.fillStyle(0x1a1a2e); g.fillRoundedRect(AX-W/2, AY-H/2, W, H, 5);
    g.lineStyle(2, 0x445599); g.strokeRoundedRect(AX-W/2, AY-H/2, W, H, 5);
    this._arsenalObjs.push(g);

    const artSize = 40;
    const artImg = this.add.image(AX, AY - 10, this.artKey(card))
      .setDisplaySize(artSize, artSize).setDepth(DEPTH + .1);
    this._arsenalObjs.push(artImg);

    this._arsenalObjs.push(
      this.add.text(AX, AY - H/2 + 3, card.name, {
        fontSize: '8px', fontFamily: 'monospace', color: '#aaaadd',
        wordWrap: { width: W - 4 }, align: 'center'
      }).setOrigin(0.5, 0).setDepth(DEPTH + .2)
    );

    const infoLine = card.type === 'demon' ? '⚔' + card.atk + ' ❤' + card.hp : 'spell';
    this._arsenalObjs.push(
      this.add.text(AX, AY + H/2 - 14, infoLine, {
        fontSize: '9px', fontFamily: 'monospace', color: '#ffcc44'
      }).setOrigin(0.5, 0).setDepth(DEPTH + .2)
    );

    // Cost badge
    const cg = this.add.graphics().setDepth(DEPTH + .1);
    cg.fillStyle(0x000088); cg.fillCircle(AX - W/2 + 8, AY - H/2 + 8, 8);
    this._arsenalObjs.push(cg,
      this.add.text(AX - W/2 + 8, AY - H/2 + 8, '' + (card.cost || 0), {
        fontSize: '8px', fontFamily: 'monospace', color: '#88ccff'
      }).setOrigin(0.5).setDepth(DEPTH + .2)
    );

    // Hover + click to play
    const zone = this.add.zone(AX, AY, W, H).setDepth(DEPTH + .5).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => {
      g.clear();
      g.fillStyle(0x222244); g.fillRoundedRect(AX-W/2, AY-H/2, W, H, 5);
      g.lineStyle(3, 0x8899ff); g.strokeRoundedRect(AX-W/2, AY-H/2, W, H, 5);
      this.showZoom(card, AX - 80);
    });
    zone.on('pointerout', () => {
      g.clear();
      g.fillStyle(0x1a1a2e); g.fillRoundedRect(AX-W/2, AY-H/2, W, H, 5);
      g.lineStyle(2, 0x445599); g.strokeRoundedRect(AX-W/2, AY-H/2, W, H, 5);
      this.hideZoom();
    });
    zone.on('pointerdown', (ptr) => {
      ptr.event && ptr.event.stopPropagation && ptr.event.stopPropagation();
      if (this.turn !== 'player' || this.gameOver) return;
      this.playFromArsenal();
    });
    this._arsenalObjs.push(zone);
  }

  // ── Player Front Row ──────────────────────────────────────────────────

  renderPlayerFront() {
    this.clear(this._pfObjs);
    const cy = 285;
    if (!this.playerFront.length) {
      this._pfObjs.push(
        this.add.text(480, cy, 'Front row empty', {
          fontSize: '12px', fontFamily: 'monospace', color: '#223322'
        }).setOrigin(0.5)
      );
      return;
    }
    const CW = 88, CH = 84, GAP = 8;
    const blockW = this.playerFront.length*(CW+GAP) - GAP;
    const sx = Math.max(185, 480 - blockW/2);
    this.playerFront.forEach((demon, i) => {
      const cx = sx + i*(CW+GAP) + CW/2;
      this.drawBoardDemon(demon, i, cx, cy, CW, CH, false, 'front', this._pfObjs);
    });
  }

  // ── Player Rear Row ───────────────────────────────────────────────────

  renderPlayerRear() {
    this.clear(this._prObjs);
    const cy = 375;
    if (!this.playerRear.length) {
      this._prObjs.push(
        this.add.text(480, cy, 'Rear row empty', {
          fontSize: '12px', fontFamily: 'monospace', color: '#1a2a1a'
        }).setOrigin(0.5)
      );
      return;
    }
    const CW = 88, CH = 84, GAP = 8;
    const blockW = this.playerRear.length*(CW+GAP) - GAP;
    const sx = Math.max(185, 480 - blockW/2);
    this.playerRear.forEach((demon, i) => {
      const cx = sx + i*(CW+GAP) + CW/2;
      this.drawBoardDemon(demon, i, cx, cy, CW, CH, false, 'rear', this._prObjs);
    });
  }

  // ── Enemy Front Row ───────────────────────────────────────────────────

  renderEnemyFront() {
    this.clear(this._efObjs);
    const cy = 168;
    if (!this.enemyFront.length) {
      this._efObjs.push(
        this.add.text(480, cy, 'No enemy front demons', {
          fontSize: '12px', fontFamily: 'monospace', color: '#332222'
        }).setOrigin(0.5)
      );
      return;
    }
    const CW = 88, CH = 84, GAP = 8;
    const blockW = this.enemyFront.length*(CW+GAP) - GAP;
    const sx = Math.max(185, 480 - blockW/2);
    this.enemyFront.forEach((demon, i) => {
      const cx = sx + i*(CW+GAP) + CW/2;
      this.drawBoardDemon(demon, i, cx, cy, CW, CH, true, 'front', this._efObjs);
    });
  }

  // ── Enemy Rear Row ────────────────────────────────────────────────────

  renderEnemyRear() {
    this.clear(this._erObjs);
    const cy = 78;
    if (!this.enemyRear.length) {
      this._erObjs.push(
        this.add.text(480, cy, 'No enemy rear demons', {
          fontSize: '12px', fontFamily: 'monospace', color: '#221515'
        }).setOrigin(0.5)
      );
      return;
    }
    const CW = 88, CH = 84, GAP = 8;
    const blockW = this.enemyRear.length*(CW+GAP) - GAP;
    const sx = Math.max(185, 480 - blockW/2);
    this.enemyRear.forEach((demon, i) => {
      const cx = sx + i*(CW+GAP) + CW/2;
      this.drawBoardDemon(demon, i, cx, cy, CW, CH, true, 'rear', this._erObjs);
    });
  }

  drawBoardDemon(demon, _boardIdx, cx, cy, W, H, isEnemy, rowType, arr) {
    const DEPTH = 4;
    const isAttacker = this.attackingDemon && this.attackingDemon.demon === demon;
    const isTarget   = this.awaitingTarget && isEnemy;

    // Rear enemy is only a valid target if enemy front is empty
    const isValidTarget = isTarget && (rowType === 'front' || this.enemyFront.length === 0);
    const border = isValidTarget ? 0xff0000 :
                   (isTarget && !isValidTarget) ? 0x555555 :
                   isAttacker ? 0xffff00 :
                   demon.exhausted ? 0x333333 :
                   (isEnemy ? 0xff4444 : (rowType === 'rear' ? 0x226622 : 0x44ff88));
    const bgCol  = demon.exhausted ? 0x0e0e0e : isEnemy ? 0x1a0008 : (rowType === 'rear' ? 0x061306 : 0x081a08);

    const g = this.add.graphics().setDepth(DEPTH);
    g.fillStyle(bgCol); g.fillRoundedRect(cx-W/2, cy-H/2, W, H, 6);
    g.lineStyle(isValidTarget || isAttacker ? 3 : 2, border);
    g.strokeRoundedRect(cx-W/2, cy-H/2, W, H, 6);
    arr.push(g);

    // Rear indicator strip
    if (rowType === 'rear') {
      const rg = this.add.graphics().setDepth(DEPTH + .05);
      rg.fillStyle(isEnemy ? 0x220011 : 0x001100, 0.8);
      rg.fillRect(cx-W/2, cy-H/2, W, 8);
      arr.push(rg);
      arr.push(this.add.text(cx, cy-H/2+4, 'REAR', {
        fontSize: '7px', fontFamily: 'monospace', color: isEnemy ? '#441122' : '#114411'
      }).setOrigin(0.5).setDepth(DEPTH + .1));
    }

    const bArtSize = Math.min(W - 10, Math.floor(H * 0.5));
    const artImg = this.add.image(cx, cy - H/2 + 14 + bArtSize/2, this.artKey(demon))
      .setDisplaySize(bArtSize, bArtSize)
      .setDepth(DEPTH + .1)
      .setAlpha(demon.exhausted ? 0.25 : 1);
    arr.push(artImg);

    arr.push(
      this.add.text(cx, cy-H/2+3, demon.name||'?', {
        fontSize:'10px', fontFamily:'monospace', color:'#cccccc',
        wordWrap:{width:W-4}, align:'center'
      }).setOrigin(0.5,0).setDepth(DEPTH+.2)
    );
    if (demon.ability) {
      arr.push(
        this.add.text(cx, cy-H/2+15, this.abilityTag(demon.ability), {
          fontSize:'8px', fontFamily:'monospace',
          color: this.abilityColor(demon.ability)
        }).setOrigin(0.5,0).setDepth(DEPTH+.2)
      );
    }

    const sb = this.add.graphics().setDepth(DEPTH+.1);
    sb.fillStyle(0x000000, 0.9); sb.fillRect(cx-W/2, cy+H/2-20, W, 20);
    arr.push(sb,
      this.add.text(cx-W/2+4, cy+H/2-10, '⚔'+demon.currentAtk, {
        fontSize:'12px', fontFamily:'monospace', color:'#ff8888'
      }).setOrigin(0, 0.5).setDepth(DEPTH+.2),
      this.add.text(cx+W/2-4, cy+H/2-10, demon.currentHp+'❤', {
        fontSize:'12px', fontFamily:'monospace', color:'#88ff88'
      }).setOrigin(1, 0.5).setDepth(DEPTH+.2)
    );

    if (demon.exhausted) {
      arr.push(this.add.text(cx, cy, 'ZZZ', { fontSize:'12px', fontFamily:'monospace', color:'#666688' }).setOrigin(0.5).setDepth(DEPTH+.3));
    }
    if (isValidTarget) arr.push(this.add.text(cx, cy-H/2-12, '← TARGET', { fontSize:'10px', fontFamily:'monospace', color:'#ff4444' }).setOrigin(0.5).setDepth(DEPTH+.3));
    if (!isValidTarget && isTarget && rowType === 'rear') arr.push(this.add.text(cx, cy-H/2-12, 'PROTECTED', { fontSize:'9px', fontFamily:'monospace', color:'#555555' }).setOrigin(0.5).setDepth(DEPTH+.3));
    if (isAttacker) arr.push(this.add.text(cx, cy-H/2-12, '← ATTACKING', { fontSize:'10px', fontFamily:'monospace', color:'#ffff44' }).setOrigin(0.5).setDepth(DEPTH+.3));

    const zone = this.add.zone(cx, cy, W, H).setDepth(DEPTH+.5).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => {
      g.lineStyle(3, 0xffffff); g.strokeRoundedRect(cx-W/2, cy-H/2, W, H, 6);
      this.showZoom(demon, cx);
    });
    zone.on('pointerout', () => {
      g.lineStyle(isValidTarget||isAttacker?3:2, border);
      g.strokeRoundedRect(cx-W/2, cy-H/2, W, H, 6);
      this.hideZoom();
    });
    zone.on('pointerdown', (_ptr, _lx, _ly, event) => {
      if (event) event.stopPropagation();
      if (this.gameOver) return;

      if (!isEnemy && this.turn === 'player') {
        // Player demon clicked
        if (this.awaitingTarget) return; // ignore friendly during target selection
        if (this._actionMenu && this._actionMenu.demon === demon) {
          this.dismissActionMenu();
        } else {
          this.dismissActionMenu();
          this.showActionMenu(demon, cx, cy);
        }
        return;
      }

      if (isEnemy && this.awaitingTarget) {
        this.attackDemon(demon, rowType);
      }
    });
    arr.push(zone);
  }

  // ── Popup ─────────────────────────────────────────────────────────────

  clearPopup() { this.clear(this._popupObjs); }

  // ═══════════════ WIN / LOSS ═══════════════════════════════════════════

  checkWin() {
    if (this.gameOver) return;
    if (this.enemyLife <= 0) { this.gameOver = true; this.time.delayedCall(400, () => this.endBattle('win')); }
    else if (this.playerLife <= 0) { this.gameOver = true; this.time.delayedCall(400, () => this.endBattle('lose')); }
  }

  endBattle(result) {
    this.clearPopup();
    this.hideZoom();
    this.closeGraveyard();
    this.hideDragHighlights();
    this.dismissActionMenu();
    if (this.dragGhost) { this.dragGhost.destroy(); this.dragGhost = null; }

    this.scene.wake('HUDScene');

    const ov = this.add.graphics().setDepth(20);
    ov.fillStyle(0x000000, 0.92); ov.fillRect(0,0,960,640);

    if (result === 'win') {
      const rawMoney = Phaser.Math.Between(this.enemyDef.rewardMoney[0], this.enemyDef.rewardMoney[1]);
      const money    = Math.floor(rawMoney * (this._relicGoldBonus || 1.0));
      const cardDrop = Math.random() < 0.38 && this.enemyDef.rewardCard ? this.enemyDef.rewardCard : null;
      const isBoss = this.enemyDef.isBoss || this.enemyDef.difficulty === 'boss';

      // Victory pixel burst — GBA style (16 pixel squares fly to screen corners)
      const burstColors = isBoss
        ? [0xffd700, 0xff8800, 0xffffff, 0xff4400]
        : [0xffd700, 0xffffff, 0x44ff88, 0xffd700];
      for (let k = 0; k < 16; k++) {
        const angle = (k / 16) * Math.PI * 2;
        const dist  = 180 + (k % 3) * 60;
        const col   = burstColors[k % burstColors.length];
        const sz    = isBoss ? 6 : 4;
        const g = this.add.graphics().setDepth(22);
        g.fillStyle(col, 1);
        g.fillRect(-sz/2, -sz/2, sz, sz);
        g.x = 480; g.y = 320;
        this.tweens.add({
          targets: g,
          x: 480 + Math.cos(angle) * dist,
          y: 320 + Math.sin(angle) * dist,
          duration: 180,
          ease: 'Linear',
          onComplete: () => {
            g.clear(); g.fillStyle(0xffffff, 1); g.fillRect(-2,-2,4,4);
            this.time.delayedCall(80, () => g.destroy());
          },
        });
      }

      const victoryLabel = isBoss ? 'BOSS SLAIN!' : 'VICTORY!';
      const victoryColor = isBoss ? '#ff8800' : '#ffd700';

      this.add.text(480, 210, victoryLabel, {
        fontSize: '56px', fontFamily: 'monospace', fontStyle: 'bold',
        color: victoryColor, stroke: '#000', strokeThickness: 6
      }).setOrigin(0.5).setDepth(21);

      this.add.text(480, 300, '+' + money + 'G' + (cardDrop ? '\n+ ' + window.CARD_MAP[cardDrop].name : ''), {
        fontSize: '24px', fontFamily: 'monospace', color: '#ffee88',
        stroke: '#000', strokeThickness: 4, align: 'center'
      }).setOrigin(0.5).setDepth(21);

      const btn = this.add.text(480, 400, '[ CONTINUE ]', {
        fontSize: '28px', fontFamily: 'monospace', color: '#44ff44',
        stroke: '#000', strokeThickness: 4
      }).setOrigin(0.5).setDepth(21).setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => {
        this.scene.get('WorldScene').events.emit('battleWon', {
          money,
          card: cardDrop,
          enemyDef: this.enemyDef,
          bossId: window.GameState.currentEnemySpawnId || null,
        });
        window.GameState.currentEnemySpawnId = null;
        this.scene.stop(); this.scene.resume('WorldScene');
      });
      btn.on('pointerover', () => btn.setStyle({ color: '#88ff88' }));
      btn.on('pointerout',  () => btn.setStyle({ color: '#44ff44' }));

    } else {
      this.add.text(480, 230, 'DEFEATED...', {
        fontSize: '50px', fontFamily: 'monospace', fontStyle: 'bold',
        color: '#ff2222', stroke: '#000', strokeThickness: 6
      }).setOrigin(0.5).setDepth(21);

      const hearts = window.GameState.hearts ?? 3;
      const penaltyMsg = hearts <= 1
        ? 'LAST HEART — gold lost on death!'
        : '♥ Lost a heart  (' + (hearts - 1) + ' remain)';
      this.add.text(480, 315, penaltyMsg, {
        fontSize: '18px', fontFamily: 'monospace', color: '#ff8888',
        stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(21);

      const btn = this.add.text(480, 400, '[ RETREAT ]', {
        fontSize: '28px', fontFamily: 'monospace', color: '#ff8888',
        stroke: '#000', strokeThickness: 4
      }).setOrigin(0.5).setDepth(21).setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => {
        this.scene.get('WorldScene').events.emit('battleLost');
        this.scene.stop(); this.scene.resume('WorldScene');
      });
      btn.on('pointerover', () => btn.setStyle({ color: '#ffaaaa' }));
      btn.on('pointerout',  () => btn.setStyle({ color: '#ff8888' }));
    }
  }

  // ═══════════════ UI ════════════════════════════════════════════════════

  updateUI() {
    this.txtEnemyLife.setText('❤ ' + Math.max(0, this.enemyLife) + ' / ' + this.enemyDef.life);
    this.txtEnemyDeck.setText('Deck: ' + this.enemyDeck.length);
    this.txtEnemyHand.setText('Hand: ' + this.enemyHand.length);
    this.txtEnemyGY.setText('⚰ GY: ' + this.enemyGraveyard.length);
    this.txtPlayerLife.setText('❤ ' + Math.max(0, this.playerLife) + ' / ' + this.playerMaxLife + '  Lv.' + (window.GameState?.playerLevel || 1));
    this.txtPlayerMana.setText('◆ Mana: ' + this.playerMana);
    this.txtDeckInfo.setText('Deck ' + this.playerDeck.length + '  Hand ' + this.playerHand.length);
    this.txtPlayerGY.setText('⚰ GY: ' + this.playerGraveyard.length);
  }

  // ═══════════════ CARD ART KEY ══════════════════════════════════════════

  artKey(card) {
    if (card.type === 'demon') {
      const key = 'card_art_' + card.id;
      if (this.textures.exists(key)) return key;
      return 'card_art_demon_' + (card.rarity || 'common');
    }
    const dmg  = ['damage','aoe_enemy','aoe_all_hp','aoe_demon_dmg'];
    const heal = ['heal','resurrect','life_per_demon'];
    if (dmg.includes(card.effect))  return 'card_art_spell_damage';
    if (heal.includes(card.effect)) return 'card_art_spell_heal';
    return 'card_art_spell_utility';
  }

  // ═══════════════ UTILS ════════════════════════════════════════════════

  shuffleDeck(arr) {
    for (let i = arr.length-1; i > 0; i--) {
      const j = Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]];
    }
    return arr;
  }

  showFloat(x, y, text, color='#ffffff') {
    const t = this.add.text(x, y, text, {
      fontSize: '17px', fontFamily: 'monospace', fontStyle: 'bold',
      color, stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(15);
    this.tweens.add({ targets: t, y: y-55, alpha: 0, duration: 1200, ease: 'Power2', onComplete: () => t.destroy() });
  }
}
