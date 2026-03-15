class BattleScene extends Phaser.Scene {
  constructor() { super({ key: 'BattleScene' }); }
  init(data) { this.enemyDef = data.enemy; }

  create() {
    // ── Hide overworld HUD ─────────────────────────────────────────────
    this.scene.sleep('HUDScene');
    this.input.mouse.disableContextMenu();

    // ── State ──────────────────────────────────────────────────────────
    this.playerLife  = 10;
    this.enemyLife   = this.enemyDef.life || 10;
    this.playerMana  = 0;
    this.turnNumber  = 1;
    this.turn        = 'player';
    this.gameOver    = false;
    this.attackingDemon  = null;
    this.awaitingTarget  = false;
    this.playerGoesFirst = true; // determined by doDiceRoll

    // Render buckets
    this._handObjs   = [];
    this._pbObjs     = [];
    this._ebObjs     = [];
    this._popupObjs  = [];
    this._zoomObjs   = [];
    this._dragHlObjs = [];

    // Drag state
    this.dragInfo  = null;  // { card, handIdx }
    this.dragGhost = null;

    const rawDeck = window.GameState.playerDeck.length >= 10
      ? [...window.GameState.playerDeck]
      : [...window.STARTER_DECK];

    // Filter undefined cards from decks
    this.playerDeck    = this.shuffleDeck(rawDeck.map(id => window.CARD_MAP[id]).filter(Boolean).map(c => ({ ...c })));
    this.playerHand    = [];
    this.playerBoard   = [];
    this.playerDiscard = [];

    this.enemyDeck    = this.shuffleDeck(this.enemyDef.deckCards.map(id => window.CARD_MAP[id]).filter(Boolean).map(c => ({ ...c })));
    this.enemyHand    = [];
    this.enemyBoard   = [];
    this.enemyDiscard = [];

    // ── Layout constants ───────────────────────────────────────────────
    this.BOARD_Y     = 268;
    this.BOARD_H     = 152;
    this.PITCH_Y     = 420;
    this.PITCH_H     = 55;
    this.HAND_Y      = 510;

    // ── Static background ──────────────────────────────────────────────
    const bg = this.add.graphics();
    bg.fillStyle(0x080810); bg.fillRect(0, 0, 960, 640);
    bg.fillStyle(0x150010); bg.fillRoundedRect(4, 48, 952, 210, 6);
    bg.fillStyle(0x0d0d20); bg.fillRect(0, 258, 960, 10);
    bg.fillStyle(0x00140a); bg.fillRoundedRect(4, 268, 952, 152, 6);
    bg.fillStyle(0x220a00); bg.fillRoundedRect(180, 420, 600, 55, 6);
    bg.lineStyle(1, 0x663300); bg.strokeRoundedRect(180, 420, 600, 55, 6);
    bg.fillStyle(0x0a0a18); bg.fillRect(0, 475, 960, 35);
    bg.fillStyle(0x0c0c1e); bg.fillRect(0, 510, 960, 130);
    bg.lineStyle(1, 0x222244); bg.lineBetween(0, 510, 960, 510);

    // ── Pitch zone label ───────────────────────────────────────────────
    this.add.text(480, 447, '🔥  PITCH ZONE  — drag cards here to sacrifice for mana  (or right-click a card)', {
      fontSize: '11px', fontFamily: 'monospace', color: '#884422'
    }).setOrigin(0.5);

    // ── Enemy header ───────────────────────────────────────────────────
    this.add.text(10, 6, this.enemyDef.name.toUpperCase(), {
      fontSize: '22px', fontFamily: 'monospace', fontStyle: 'bold',
      color: '#ff4444', stroke: '#000', strokeThickness: 4
    });
    this.txtEnemyLife  = this.add.text(10, 30, '', { fontSize: '13px', fontFamily: 'monospace', color: '#ff7777' });
    this.txtEnemyDeck  = this.add.text(780, 10, '', { fontSize: '12px', fontFamily: 'monospace', color: '#666688' });
    this.txtEnemyHand  = this.add.text(780, 26, '', { fontSize: '12px', fontFamily: 'monospace', color: '#666688' });

    // Clickable enemy face for direct attacks
    this.btnFace = this.add.text(880, 22, '⚔ FACE', {
      fontSize: '13px', fontFamily: 'monospace',
      backgroundColor: '#3a0000', padding: { x: 8, y: 4 }, color: '#ff6666'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.btnFace.on('pointerdown', () => this.attackFace());
    this.btnFace.on('pointerover', () => this.btnFace.setStyle({ backgroundColor: '#770000' }));
    this.btnFace.on('pointerout',  () => this.btnFace.setStyle({ backgroundColor: '#3a0000' }));

    // Board zone labels
    this.add.text(480, 50, '— ENEMY BOARD —',   { fontSize: '10px', fontFamily: 'monospace', color: '#442233' }).setOrigin(0.5, 0);
    this.add.text(480, 270, '— YOUR BOARD —',   { fontSize: '10px', fontFamily: 'monospace', color: '#223322' }).setOrigin(0.5, 0);
    this.add.text(480, 512, '— HAND  (hover to zoom · drag to board to play · drag to pitch zone or right-click to sacrifice) —', {
      fontSize: '9px', fontFamily: 'monospace', color: '#333355'
    }).setOrigin(0.5, 0);

    // ── Player info bar ────────────────────────────────────────────────
    this.txtPlayerLife = this.add.text(10, 479, '', { fontSize: '13px', fontFamily: 'monospace', color: '#44ff88', stroke: '#000', strokeThickness: 2 });
    this.txtPlayerMana = this.add.text(250, 479, '', { fontSize: '13px', fontFamily: 'monospace', color: '#5599ff', stroke: '#000', strokeThickness: 2 });
    this.txtDeckInfo   = this.add.text(550, 479, '', { fontSize: '11px', fontFamily: 'monospace', color: '#555566' });
    this.txtTurn       = this.add.text(480, 260, '', {
      fontSize: '11px', fontFamily: 'monospace', fontStyle: 'bold',
      color: '#ffcc00', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5);

    // Buttons
    this.btnEndTurn = this.add.text(910, 490, 'END TURN', {
      fontSize: '13px', fontFamily: 'monospace', fontStyle: 'bold',
      backgroundColor: '#551100', padding: { x: 10, y: 5 }, color: '#ffbbaa'
    }).setOrigin(1).setInteractive({ useHandCursor: true });
    this.btnEndTurn.on('pointerdown', () => { if (this.turn === 'player' && !this.gameOver) this.endPlayerTurn(); });
    this.btnEndTurn.on('pointerover', () => this.btnEndTurn.setStyle({ backgroundColor: '#882200' }));
    this.btnEndTurn.on('pointerout',  () => this.btnEndTurn.setStyle({ backgroundColor: '#551100' }));

    this.btnCancel = this.add.text(760, 490, 'CANCEL', {
      fontSize: '12px', fontFamily: 'monospace',
      backgroundColor: '#222222', padding: { x: 8, y: 5 }, color: '#888888'
    }).setOrigin(1).setVisible(false).setInteractive({ useHandCursor: true });
    this.btnCancel.on('pointerdown', () => this.cancelAttack());

    // ── Global pointer events ──────────────────────────────────────────
    this.input.on('pointermove', (ptr) => {
      if (this.dragGhost) this.dragGhost.setPosition(ptr.x, ptr.y);
    });

    this.input.on('pointerup', (ptr) => {
      if (!this.dragInfo) return;
      this.handleDrop(ptr.x, ptr.y);
    });

    // ── Draw opening hands, then do dice roll ──────────────────────────
    for (let i = 0; i < 5; i++) this.drawPlayerCards(1);
    for (let i = 0; i < 5; i++) this.drawEnemyCard();
    this.updateUI();
    this.renderAll();

    this.doDiceRoll();
  }

  // ═══════════════ TURN FLOW ═══════════════════════════════════════════

  doDiceRoll() {
    // Show a dark overlay with dice result for 2 seconds
    const ov = this.add.graphics().setDepth(50);
    ov.fillStyle(0x000000, 0.82);
    ov.fillRect(0, 0, 960, 640);

    const playerRoll = Phaser.Math.Between(1, 6);
    const enemyRoll  = Phaser.Math.Between(1, 6);

    // Re-roll ties until resolved
    let pRoll = playerRoll, eRoll = enemyRoll;
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
        // Enemy goes first — show their turn banner then run enemy turn
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
    // Going second bonus: +1 free mana on first turn
    if (isFirst && !this.playerGoesFirst) {
      this.playerMana = 1;
      this.showFloat(480, 460, '+1 MANA (going second bonus)', '#4499ff');
    }
    this.playerBoard.forEach(d => { d.exhausted = false; });
    // No card draw here — hand already has 5 from start (or was drawn at end of last turn)
    this.updateUI();
    this.renderAll();
    this.txtTurn.setText('YOUR TURN  (turn ' + this.turnNumber + ')');
    this.btnEndTurn.setAlpha(1);
    this.btnCancel.setVisible(false);
  }

  endPlayerTurn() {
    this.clearPopup();
    this.cancelAttack();
    this.hideZoom();
    this.hideDragHighlights();
    this.btnEndTurn.setAlpha(0.4);
    this.txtTurn.setText('ENEMY TURN...');
    this.turn = 'enemy';

    // Discard remaining hand, draw 5 new cards
    this.playerDiscard.push(...this.playerHand);
    this.playerHand = [];
    this.drawPlayerCards(5);

    this.time.delayedCall(700, () => this.runEnemyTurn());
  }

  runEnemyTurn(isFirstTurn = false) {
    this.enemyBoard.forEach(d => d.exhausted = false);
    // Going-second bonus for enemy: if player goes first, enemy gets +1 mana on their first turn
    let mana = (isFirstTurn && this.playerGoesFirst) ? 1 : 0;

    // Find best demon to play (most expensive we can possibly afford after pitching all others)
    const totalPossibleMana = mana + this.enemyHand.reduce((s, c) => s + (c.manaValue || 1), 0);
    let target = this.enemyHand
      .filter(c => c.type === 'demon' && c.cost <= totalPossibleMana && this.enemyBoard.length < 4)
      .sort((a, b) => b.cost - a.cost)[0];
    if (!target) target = this.enemyHand
      .filter(c => c.type === 'spell' && c.cost <= totalPossibleMana)
      .sort((a, b) => b.cost - a.cost)[0];

    // Pitch everything except target
    [...this.enemyHand].filter(c => c !== target).forEach(c => {
      mana += c.manaValue || 1;
      this.enemyHand.splice(this.enemyHand.indexOf(c), 1);
      this.enemyDiscard.push(c);
    });

    // Play target if affordable
    if (target && target.cost <= mana) {
      mana -= target.cost;
      this.enemyHand.splice(this.enemyHand.indexOf(target), 1);
      if (target.type === 'demon') {
        this.enemyBoard.push({ ...target, currentHp: target.hp, currentAtk: target.atk, exhausted: false });
        this.resolveDemonBattlecry(target, 'enemy');
      } else {
        this.resolveSpell(target, 'enemy');
        this.enemyDiscard.push(target);
      }
    } else if (target) {
      // Can't afford even after pitching all — just discard
      this.enemyHand.splice(this.enemyHand.indexOf(target), 1);
      this.enemyDiscard.push(target);
    }

    // End of turn: discard remaining hand, draw 5 new cards
    this.enemyDiscard.push(...this.enemyHand);
    this.enemyHand = [];
    for (let i = 0; i < 5; i++) this.drawEnemyCard();

    this.renderAll(); this.updateUI();

    // Attack phase after short delay
    this.time.delayedCall(700, () => {
      if (this.gameOver) return;
      [...this.enemyBoard].forEach(demon => {
        if (!this.enemyBoard.includes(demon) || demon.exhausted) return;
        demon.exhausted = true;
        const isUnblockable = demon.ability && demon.ability.includes('unblockable');
        if (this.playerBoard.length > 0 && !isUnblockable) {
          // Prefer taunt targets
          const tauntTargets = this.playerBoard.filter(d => d.ability && d.ability.includes('taunt'));
          const pool = tauntTargets.length > 0 ? tauntTargets : this.playerBoard;
          const t = pool.reduce((a, b) => a.currentHp < b.currentHp ? a : b);

          const dmgToT   = demon.currentAtk;
          const dmgToD   = t.currentAtk;
          t.currentHp    -= dmgToT;
          demon.currentHp -= dmgToD;

          // Rage
          if (demon.ability && demon.ability.includes('rage') && dmgToD  > 0) demon.currentAtk++;
          if (t.ability     && t.ability.includes('rage')     && dmgToT > 0) t.currentAtk++;
          // Lifesteal (enemy heals itself)
          if (demon.ability && demon.ability.includes('lifesteal')) {
            this.enemyLife = Math.min(this.enemyDef.life, this.enemyLife + dmgToT);
          }
          // Poisonous
          if (demon.ability && demon.ability.includes('poisonous') && t.currentHp > 0) t.currentHp = 0;

          this.showFloat(480, 280, '⚔ ' + demon.name + ' attacks!', '#ff4444');
          if (demon.currentHp <= 0) this.killFrom(this.enemyBoard,  this.enemyDiscard, demon);
          if (t.currentHp    <= 0) this.killFrom(this.playerBoard, this.playerDiscard, t);
        } else {
          // Attack face (unblockable or no player demons)
          this.playerLife -= demon.currentAtk;
          if (demon.ability && demon.ability.includes('lifesteal')) {
            this.enemyLife = Math.min(this.enemyDef.life, this.enemyLife + demon.currentAtk);
          }
          this.showFloat(340, 460, '⚔ -' + demon.currentAtk + '!', '#ff2222');
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
        if (!this.playerDiscard.length) break;
        this.playerDeck = this.shuffleDeck([...this.playerDiscard]);
        this.playerDiscard = [];
      }
      const c = this.playerDeck.pop();
      if (this.playerHand.length < 8) this.playerHand.push(c);
      else this.playerDiscard.push(c);
    }
  }

  drawEnemyCard() {
    if (this.enemyDeck.length === 0) {
      if (!this.enemyDiscard.length) return;
      this.enemyDeck = this.shuffleDeck([...this.enemyDiscard]);
      this.enemyDiscard = [];
    }
    const c = this.enemyDeck.pop();
    if (this.enemyHand.length < 8) this.enemyHand.push(c);
    else this.enemyDiscard.push(c);
  }

  // ═══════════════ CARD ACTIONS ════════════════════════════════════════

  pitchCard(card, handIdx) {
    this.playerHand.splice(handIdx, 1);
    this.playerMana += card.manaValue;
    const insertAt = Math.floor(Math.random() * Math.min(6, this.playerDeck.length + 1));
    this.playerDeck.splice(insertAt, 0, card);
    this.clearPopup();
    this.showFloat(480, 443, '+' + card.manaValue + ' MANA  (' + card.name + ' pitched to deck)', '#4499ff');
    this.renderAll(); this.updateUI();
  }

  playForEffect(card, handIdx) {
    if (this.playerMana < card.cost) {
      this.showFloat(480, 450, 'Need ' + card.cost + ' mana — pitch more cards first', '#ff4444');
      return;
    }
    if (card.type === 'demon' && this.playerBoard.length >= 4) {
      this.showFloat(480, 340, 'Board full! (max 4)', '#ff4444'); return;
    }
    this.playerMana -= card.cost;
    this.playerHand.splice(handIdx, 1);
    this.clearPopup();
    if (card.type === 'demon') {
      const hasHaste = card.ability && card.ability.includes('haste');
      const demon = { ...card, currentHp: card.hp, currentAtk: card.atk, exhausted: !hasHaste };
      this.playerBoard.push(demon);
      this.showFloat(480, 340, card.name + ' enters the field!', '#ffcc44');
      this.resolveDemonBattlecry(card, 'player');
    } else {
      this.resolveSpell(card, 'player');
      this.playerDiscard.push(card);
    }
    this.renderAll(); this.updateUI(); this.checkWin();
  }

  // ── Demon abilities ───────────────────────────────────────────────────

  resolveDemonBattlecry(card, who) {
    if (!card.ability || !card.ability.startsWith('battlecry')) return;
    const me = who === 'player';
    const myBoard  = me ? this.playerBoard  : this.enemyBoard;
    const foeBoard = me ? this.enemyBoard   : this.playerBoard;
    const foeDis   = me ? this.enemyDiscard : this.playerDiscard;

    switch (card.ability) {
      case 'battlecry_draw_1':
        if (me) { this.drawPlayerCards(1); this.showFloat(480, 460, 'Draw 1!', '#aaddff'); }
        else     { this.drawEnemyCard(); }
        break;
      case 'battlecry_draw_2':
        if (me) { this.drawPlayerCards(2); this.showFloat(480, 460, 'Draw 2!', '#aaddff'); }
        else     { for (let i = 0; i < 2; i++) this.drawEnemyCard(); }
        break;
      case 'battlecry_damage_player_2':
        if (me) { this.enemyLife -= 2; this.showFloat(700, 80, card.name + '! -2', '#ff6600'); }
        else    { this.playerLife -= 2; }
        break;
      case 'battlecry_aoe_1':
        foeBoard.forEach(d => d.currentHp -= 1);
        this.cleanBoard(foeBoard, foeDis);
        if (me) this.showFloat(700, 150, card.name + '! Splash -1 all!', '#ff8800');
        break;
      case 'battlecry_buff_all_atk':
        // Buff all OTHER friendly demons (the just-placed demon is last in array)
        myBoard.slice(0, myBoard.length - 1).forEach(d => d.currentAtk += 1);
        if (me) this.showFloat(340, 340, 'Iron Djinn! +1 ATK all!', '#4488aa');
        break;
      case 'battlecry_destroy_strongest': {
        if (foeBoard.length) {
          const t = foeBoard.reduce((a, b) => a.currentAtk >= b.currentAtk ? a : b);
          this.killFrom(foeBoard, foeDis, t);
          if (me) this.showFloat(700, 150, 'Medusa! Petrify!', '#22aa44');
        }
        break;
      }
      case 'battlecry_summon_imps': {
        const impDef = window.CARD_MAP['demon_001'];
        for (let i = 0; i < 2 && myBoard.length < 4; i++) {
          if (impDef) myBoard.push({ ...impDef, currentHp: impDef.hp, currentAtk: impDef.atk, exhausted: false });
        }
        if (me) this.showFloat(340, 340, 'Beelzebub! 2 Imps!', '#ffcc00');
        break;
      }
      case 'battlecry_destroy_all':
        while (foeBoard.length > 0) this.killFrom(foeBoard, foeDis, foeBoard[foeBoard.length - 1]);
        if (me) this.showFloat(700, 150, 'Baphomet! ANNIHILATE!', '#ff0044');
        break;
    }
  }

  resolveDeathrattle(demon, who) {
    if (!demon.ability || !demon.ability.startsWith('deathrattle')) return;
    const me = who === 'player';
    const myBoard = me ? this.playerBoard : this.enemyBoard;

    switch (demon.ability) {
      case 'deathrattle_damage_2':
        if (me) { this.enemyLife  -= 2; this.showFloat(700, 80, demon.name + ' DR! -2', '#ff6600'); }
        else    { this.playerLife -= 2; }
        break;
      case 'deathrattle_summon_zombie': {
        if (myBoard.length < 4) {
          const zombie = {
            id: 'zombie', name: 'Zombie', type: 'demon',
            cost: 2, manaValue: 1, atk: 2, hp: 2, rarity: 'common',
            ability: null, abilityDesc: '', desc: 'Risen dead.',
            currentHp: 2, currentAtk: 2, exhausted: true,
          };
          myBoard.push(zombie);
          if (me) this.showFloat(340, 340, 'Lich King DR! Zombie rises!', '#8800ff');
        }
        break;
      }
    }
  }

  // Short 3-char ability badge for card display
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
    return '';
  }

  abilityColor(ability) {
    if (!ability) return '#888888';
    if (ability.includes('haste'))        return '#ffaa00';
    if (ability.includes('taunt'))        return '#44aaff';
    if (ability.includes('lifesteal'))    return '#44ff88';
    if (ability.includes('poisonous'))    return '#88ff44';
    if (ability.includes('unblockable')) return '#ff44ff';
    if (ability.includes('rage'))         return '#ff6644';
    if (ability.startsWith('battlecry')) return '#ffdd44';
    if (ability.startsWith('deathrattle')) return '#bb88ff';
    return '#888888';
  }

  // ═══════════════ SPELLS ═══════════════════════════════════════════════

  resolveSpell(card, who) {
    const me = who === 'player';
    const myBoard  = me ? this.playerBoard  : this.enemyBoard;
    const foeBoard = me ? this.enemyBoard   : this.playerBoard;
    const foeDis   = me ? this.enemyDiscard : this.playerDiscard;
    const fx = (x, y, msg, col) => { if (me) this.showFloat(x, y, msg, col); };
    switch (card.effect) {
      case 'damage':
        if (me) { this.enemyLife  -= card.value; fx(700, 80, card.name + '! -' + card.value, '#ff6600'); }
        else    { this.playerLife -= card.value; }
        break;
      case 'heal':
        if (me) { this.playerLife = Math.min(10, this.playerLife + card.value); fx(340, 460, '+' + card.value + ' life', '#44ff44'); }
        else    { this.enemyLife = Math.min(this.enemyDef.life, this.enemyLife + card.value); }
        break;
      case 'draw':
        if (me) { this.drawPlayerCards(card.value); fx(480, 460, 'Draw ' + card.value, '#aaddff'); }
        else    { for (let i = 0; i < card.value; i++) this.drawEnemyCard(); }
        break;
      case 'destroy':
        if (foeBoard.length) {
          const t = foeBoard.reduce((a, b) => a.currentHp < b.currentHp ? a : b);
          this.killFrom(foeBoard, foeDis, t);
          fx(me ? 700 : 340, 150, 'Soul Drain!', '#8800aa');
        }
        break;
      case 'aoe_enemy':
        foeBoard.forEach(d => d.currentHp -= card.value);
        this.cleanBoard(foeBoard, foeDis);
        fx(700, 150, 'Inferno! -' + card.value, '#ff4400');
        break;
      case 'buff_hp':
        if (myBoard.length) { myBoard[myBoard.length-1].currentHp += card.value; fx(340, 340, '+' + card.value + ' HP', '#44ff44'); }
        break;
      case 'debuff_atk':
        if (foeBoard.length) {
          const t = foeBoard.reduce((a,b) => a.currentAtk > b.currentAtk ? a : b);
          t.currentAtk = Math.max(0, t.currentAtk - card.value);
          fx(700, 150, '-' + card.value + ' ATK', '#00aa66');
        }
        break;
      case 'resurrect':
        if (me && this.playerDiscard.length) {
          const t = this.playerDiscard.pop(); this.playerHand.push(t);
          fx(340, 460, 'Rise! ' + t.name, '#ffcc44');
        }
        break;
      case 'mana_boost':
        if (me) { this.playerMana += card.value; fx(340, 450, '+' + card.value + ' mana!', '#4499ff'); }
        break;
      case 'aoe_demon_dmg':
        foeBoard.forEach(d => d.currentHp -= card.value);
        this.cleanBoard(foeBoard, foeDis);
        fx(me ? 700 : 340, 150, 'Chain Lightning!', '#ffff44');
        break;
      case 'life_per_demon':
        if (me) {
          const g = myBoard.length * card.value;
          this.playerLife = Math.min(10, this.playerLife + g);
          fx(340, 460, '+' + g + ' life', '#44ff44');
        }
        break;
      case 'buff_atk_all':
        myBoard.forEach(d => d.currentAtk += card.value);
        fx(340, 340, 'Blood Moon! +' + card.value + ' ATK', '#cc0066');
        break;
      case 'aoe_all_hp':
        [...this.playerBoard, ...this.enemyBoard].forEach(d => d.currentHp -= card.value);
        this.cleanBoard(this.playerBoard, this.playerDiscard);
        this.cleanBoard(this.enemyBoard,  this.enemyDiscard);
        fx(480, 280, 'Plague!', '#336600');
        break;
      case 'summon_imp':
        if (myBoard.length < 4) {
          myBoard.push({ ...window.CARD_MAP['demon_001'], currentHp: 1, currentAtk: 1, exhausted: true });
          fx(340, 340, 'Imp!', '#884400');
        }
        break;
      case 'win_condition':
        if (me && this.enemyLife <= card.value) { this.enemyLife = 0; fx(480, 80, 'FINAL HOUR!', '#ff0000'); }
        break;
    }
  }

  killFrom(board, discard, demon) {
    const i = board.indexOf(demon);
    if (i >= 0) {
      const who = (board === this.playerBoard) ? 'player' : 'enemy';
      board.splice(i, 1);
      this.resolveDeathrattle(demon, who);
      discard.push(demon);
    }
  }
  cleanBoard(board, discard) {
    for (let i = board.length - 1; i >= 0; i--) {
      if (board[i].currentHp <= 0) {
        const who = (board === this.playerBoard) ? 'player' : 'enemy';
        const dead = board.splice(i, 1)[0];
        this.resolveDeathrattle(dead, who);
        discard.push(dead);
      }
    }
  }

  // ═══════════════ ATTACK ═══════════════════════════════════════════════

  initiateAttack(demon, idx) {
    this.clearPopup();
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
    if (this.enemyBoard.length > 0 && !isUnblockable) {
      const hasTaunt = this.enemyBoard.some(d => d.ability && d.ability.includes('taunt'));
      this.showFloat(480, 150, hasTaunt ? 'Must attack the Taunt demon!' : 'Must attack enemy demons first!', '#ff8800');
      return;
    }
    this.enemyLife -= demon.currentAtk;
    demon.exhausted = true;
    if (demon.ability && demon.ability.includes('lifesteal')) {
      this.playerLife = Math.min(10, this.playerLife + demon.currentAtk);
      this.showFloat(340, 460, '+' + demon.currentAtk + ' (Lifesteal)', '#44ff88');
    }
    this.showFloat(760, 80, '⚔ -' + demon.currentAtk, '#ff2222');
    this.cancelAttack(); this.updateUI(); this.checkWin();
  }

  attackDemon(target) {
    if (!this.attackingDemon) return;
    const { demon } = this.attackingDemon;

    // Enforce taunt targeting
    const tauntTarget = this.enemyBoard.find(d => d.ability && d.ability.includes('taunt'));
    if (tauntTarget && target !== tauntTarget) {
      this.showFloat(480, 150, 'Must attack the Taunt demon first!', '#ff8800');
      return;
    }

    const dmgToTarget = demon.currentAtk;
    const dmgToDemon  = target.currentAtk;

    target.currentHp -= dmgToTarget;
    demon.currentHp  -= dmgToDemon;
    demon.exhausted   = true;

    // Rage: +1 ATK when damaged (if they survive)
    if (demon.ability  && demon.ability.includes('rage')  && dmgToDemon  > 0) demon.currentAtk++;
    if (target.ability && target.ability.includes('rage') && dmgToTarget > 0) target.currentAtk++;

    // Lifesteal
    if (demon.ability && demon.ability.includes('lifesteal')) {
      this.playerLife = Math.min(10, this.playerLife + dmgToTarget);
      this.showFloat(340, 460, '+' + dmgToTarget + ' (Lifesteal)', '#44ff88');
    }

    // Poisonous: kill target regardless of remaining HP
    if (demon.ability && demon.ability.includes('poisonous') && target.currentHp > 0) target.currentHp = 0;

    this.showFloat(700, 150, '⚔ -' + dmgToTarget, '#ff4444');
    this.showFloat(340, 340, '⚔ -' + dmgToDemon, '#ff8888');
    if (target.currentHp <= 0) this.killFrom(this.enemyBoard,  this.enemyDiscard,  target);
    if (demon.currentHp  <= 0) this.killFrom(this.playerBoard, this.playerDiscard, demon);
    this.cancelAttack(); this.updateUI(); this.checkWin();
  }

  // ═══════════════ DRAG SYSTEM ══════════════════════════════════════════

  startDrag(card, handIdx, ptr) {
    if (this.turn !== 'player' || this.gameOver) return;
    this.dragInfo = { card, handIdx };
    this.dragGhost = this.createDragGhost(card);
    this.dragGhost.setPosition(ptr.x, ptr.y);
    this.showDragHighlights();
    this.hideZoom();
    this.renderAll();
  }

  handleDrop(x, y) {
    if (!this.dragInfo) return;
    const { card, handIdx } = this.dragInfo;
    this.dragInfo = null;
    if (this.dragGhost) { this.dragGhost.destroy(); this.dragGhost = null; }
    this.hideDragHighlights();

    const inPitchZone  = y >= this.PITCH_Y && y <= this.PITCH_Y + this.PITCH_H && x >= 180 && x <= 780;
    const inBoardZone  = y >= this.BOARD_Y && y <= this.BOARD_Y + this.BOARD_H;

    if (inPitchZone) {
      this.pitchCard(card, handIdx);
    } else if (inBoardZone) {
      this.playForEffect(card, handIdx);
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

  showDragHighlights() {
    this.hideDragHighlights();
    const b = this.add.graphics().setDepth(12);
    b.fillStyle(0x00ff44, 0.07); b.fillRoundedRect(4, this.BOARD_Y, 952, this.BOARD_H, 6);
    b.lineStyle(2, 0x00ff44, 0.5); b.strokeRoundedRect(4, this.BOARD_Y, 952, this.BOARD_H, 6);
    const bt = this.add.text(480, this.BOARD_Y + this.BOARD_H/2, 'DROP → PLAY', {
      fontSize: '22px', fontFamily: 'monospace', color: '#00ff44', alpha: 0.5
    }).setOrigin(0.5).setDepth(12);
    const p = this.add.graphics().setDepth(12);
    p.fillStyle(0xff4400, 0.2); p.fillRoundedRect(180, this.PITCH_Y, 600, this.PITCH_H, 6);
    p.lineStyle(2, 0xff6600, 0.9); p.strokeRoundedRect(180, this.PITCH_Y, 600, this.PITCH_H, 6);
    const pt = this.add.text(480, this.PITCH_Y + this.PITCH_H/2, '🔥 DROP → PITCH FOR MANA', {
      fontSize: '16px', fontFamily: 'monospace', color: '#ff7744'
    }).setOrigin(0.5).setDepth(12);
    this._dragHlObjs = [b, bt, p, pt];
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
    const px = fromX < 480 ? 880 : 80;
    const py = 280;

    const rarityBorder = { common: 0x556655, uncommon: 0x224488, rare: 0xaa4422, legendary: 0xcc8800 };

    const g = this.add.graphics().setDepth(25);
    g.fillStyle(0x080818); g.fillRoundedRect(px-W/2, py-H/2, W, H, 10);
    g.lineStyle(3, rarityBorder[card.rarity] || 0x556655);
    g.strokeRoundedRect(px-W/2, py-H/2, W, H, 10);
    this._zoomObjs.push(g);

    const artImg = this.add.image(px, py - 30, this.artKey(card))
      .setDisplaySize(140, 110).setDepth(25.05);
    this._zoomObjs.push(artImg);

    const cg = this.add.graphics().setDepth(25.1);
    cg.fillStyle(0x000088); cg.fillCircle(px-W/2+20, py-H/2+20, 18);
    this._zoomObjs.push(cg,
      this.add.text(px-W/2+20, py-H/2+20, '' + (card.cost||0), {
        fontSize: '15px', fontFamily: 'monospace', fontStyle: 'bold', color: '#88ccff'
      }).setOrigin(0.5).setDepth(25.2)
    );

    const mg = this.add.graphics().setDepth(25.1);
    mg.fillStyle(0x004400); mg.fillCircle(px+W/2-20, py-H/2+20, 18);
    this._zoomObjs.push(mg,
      this.add.text(px+W/2-20, py-H/2+20, '+' + (card.manaValue||1), {
        fontSize: '13px', fontFamily: 'monospace', color: '#44dd44'
      }).setOrigin(0.5).setDepth(25.2)
    );

    this._zoomObjs.push(
      this.add.text(px, py-H/2+10, card.name||'?', {
        fontSize: '15px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffffff'
      }).setOrigin(0.5, 0).setDepth(25.1)
    );

    if (card.type === 'demon') {
      this._zoomObjs.push(
        this.add.text(px, py+44, '⚔  ' + card.atk + '        ❤  ' + card.hp, {
          fontSize: '20px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffcc44'
        }).setOrigin(0.5).setDepth(25.1)
      );
    }
    if (card.abilityDesc) {
      this._zoomObjs.push(
        this.add.text(px, py + (card.type==='demon' ? 72 : 44), card.abilityDesc, {
          fontSize: '10px', fontFamily: 'monospace', fontStyle: 'bold',
          color: this.abilityColor(card.ability),
          wordWrap: { width: W-20 }, align: 'center'
        }).setOrigin(0.5, 0).setDepth(25.1)
      );
    }

    this._zoomObjs.push(
      this.add.text(px, py + (card.type==='demon' ? (card.abilityDesc ? 100 : 74) : (card.abilityDesc ? 66 : 44)), card.desc || '', {
        fontSize: '10px', fontFamily: 'monospace', color: '#aaaaaa',
        wordWrap: { width: W-24 }, align: 'center'
      }).setOrigin(0.5, 0).setDepth(25.1),
      this.add.text(px, py+H/2-18, card.rarity.toUpperCase(), {
        fontSize: '11px', fontFamily: 'monospace',
        color: { common:'#888888', uncommon:'#4488ff', rare:'#ff8844', legendary:'#ffaa00' }[card.rarity] || '#888888'
      }).setOrigin(0.5).setDepth(25.1)
    );
  }

  hideZoom() {
    this._zoomObjs.forEach(o => { try { o.destroy(); } catch(e){} });
    this._zoomObjs = [];
  }

  // ═══════════════ RENDERING ════════════════════════════════════════════

  renderAll() { this.renderHand(); this.renderPlayerBoard(); this.renderEnemyBoard(); }
  clear(arr)  { arr.forEach(o => { try { o.destroy(); } catch(e){} }); arr.length = 0; }

  // ── Hand ──────────────────────────────────────────────────────────────

  renderHand() {
    this.clear(this._handObjs);
    const hand = this.playerHand;
    const isDragging = !!this.dragInfo;

    if (!hand.length) {
      this._handObjs.push(
        this.add.text(480, 572, 'Hand empty', { fontSize: '14px', fontFamily: 'monospace', color: '#333355' }).setOrigin(0.5)
      );
      return;
    }

    const CW = 84, CH = 108, GAP = 5;
    const blockW = hand.length * CW + (hand.length-1) * GAP;
    const sx = 480 - blockW/2;

    hand.forEach((card, i) => {
      const cx = sx + i*(CW+GAP) + CW/2;
      const cy = 572;
      const isBeingDragged = isDragging && this.dragInfo.card === card;
      this.drawHandCard(card, i, cx, cy, CW, CH, isBeingDragged);
    });
  }

  drawHandCard(card, handIdx, cx, cy, W, H, dimmed = false) {
    const DEPTH = 6;
    const rarityBorder = { common: 0x446644, uncommon: 0x224488, rare: 0x884422, legendary: 0xaa6600 };
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

    const mvg = this.add.graphics().setDepth(DEPTH+.1).setAlpha(alpha);
    mvg.fillStyle(0x004400); mvg.fillCircle(cx+W/2-10, cy-H/2+10, 10);
    this._handObjs.push(mvg,
      this.add.text(cx+W/2-10, cy-H/2+10, '+'+(card.manaValue||1), {
        fontSize:'9px', fontFamily:'monospace', color:'#44dd44'
      }).setOrigin(0.5).setDepth(DEPTH+.2).setAlpha(alpha)
    );

    this._handObjs.push(
      this.add.text(cx, cy-H/2+4, card.name||'?', {
        fontSize:'8px', fontFamily:'monospace', color:'#dddddd',
        wordWrap:{width:W-4}, align:'center'
      }).setOrigin(0.5,0).setDepth(DEPTH+.2).setAlpha(alpha)
    );

    const artImg = this.add.image(cx, cy - 10, this.artKey(card))
      .setDisplaySize(W - 10, Math.floor(H * 0.52))
      .setDepth(DEPTH + .1).setAlpha(alpha);
    this._handObjs.push(artImg);

    const sb = this.add.graphics().setDepth(DEPTH+.1).setAlpha(alpha);
    sb.fillStyle(0x000000, 0.85); sb.fillRect(cx-W/2, cy+H/2-19, W, 19);
    this._handObjs.push(sb);

    const infoLine = card.type==='demon'
      ? '⚔'+(card.atk||0)+'  ❤'+(card.hp||0)
      : (card.desc||'Spell').substring(0,16);
    this._handObjs.push(
      this.add.text(cx, cy+H/2-18, infoLine, {
        fontSize:'9px', fontFamily:'monospace',
        color: card.type==='demon' ? '#ffcc44' : '#9999ff'
      }).setOrigin(0.5).setDepth(DEPTH+.2).setAlpha(alpha)
    );
    if (card.ability) {
      this._handObjs.push(
        this.add.text(cx, cy+H/2-7, this.abilityTag(card.ability), {
          fontSize:'7px', fontFamily:'monospace',
          color: this.abilityColor(card.ability)
        }).setOrigin(0.5).setDepth(DEPTH+.2).setAlpha(alpha)
      );
    }

    if (dimmed) return;

    // ── Interactive zone ──────────────────────────────────────────────
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
      this.clearPopup();
      this.startDrag(card, handIdx, ptr);
    });

    this._handObjs.push(zone);
  }

  // ── Player Board ──────────────────────────────────────────────────────

  renderPlayerBoard() {
    this.clear(this._pbObjs);
    if (!this.playerBoard.length) {
      this._pbObjs.push(
        this.add.text(480, 344, 'No demons — play cards from hand', {
          fontSize: '13px', fontFamily: 'monospace', color: '#223322'
        }).setOrigin(0.5)
      );
      return;
    }
    const CW = 95, CH = 118, GAP = 10;
    const blockW = this.playerBoard.length*(CW+GAP) - GAP;
    const sx = 480 - blockW/2;
    this.playerBoard.forEach((demon, i) => {
      const cx = sx + i*(CW+GAP) + CW/2, cy = 344;
      this.drawBoardDemon(demon, i, cx, cy, CW, CH, false, this._pbObjs);
    });
  }

  // ── Enemy Board ───────────────────────────────────────────────────────

  renderEnemyBoard() {
    this.clear(this._ebObjs);
    if (!this.enemyBoard.length) {
      this._ebObjs.push(
        this.add.text(480, 153, 'No enemy demons', {
          fontSize: '13px', fontFamily: 'monospace', color: '#332222'
        }).setOrigin(0.5)
      );
      return;
    }
    const CW = 95, CH = 118, GAP = 10;
    const blockW = this.enemyBoard.length*(CW+GAP) - GAP;
    const sx = 480 - blockW/2;
    this.enemyBoard.forEach((demon, i) => {
      const cx = sx + i*(CW+GAP) + CW/2, cy = 153;
      this.drawBoardDemon(demon, i, cx, cy, CW, CH, true, this._ebObjs);
    });
  }

  drawBoardDemon(demon, boardIdx, cx, cy, W, H, isEnemy, arr) {
    const DEPTH = 4;
    const isAttacker = this.attackingDemon && this.attackingDemon.demon === demon;
    const isTarget   = this.awaitingTarget && isEnemy;
    const border = isTarget ? 0xff0000 : isAttacker ? 0xffff00 : demon.exhausted ? 0x333333 : (isEnemy ? 0xff4444 : 0x44ff88);
    const bgCol  = demon.exhausted ? 0x0e0e0e : isEnemy ? 0x1a0008 : 0x081a08;

    const g = this.add.graphics().setDepth(DEPTH);
    g.fillStyle(bgCol); g.fillRoundedRect(cx-W/2, cy-H/2, W, H, 6);
    g.lineStyle(isTarget||isAttacker ? 3 : 2, border);
    g.strokeRoundedRect(cx-W/2, cy-H/2, W, H, 6);
    arr.push(g);

    const artImg = this.add.image(cx, cy - 10, this.artKey(demon))
      .setDisplaySize(W - 14, Math.floor(H * 0.55))
      .setDepth(DEPTH + .1)
      .setAlpha(demon.exhausted ? 0.25 : 1);
    arr.push(artImg);

    arr.push(
      this.add.text(cx, cy-H/2+3, demon.name||'?', {
        fontSize:'8px', fontFamily:'monospace', color:'#cccccc',
        wordWrap:{width:W-4}, align:'center'
      }).setOrigin(0.5,0).setDepth(DEPTH+.2)
    );
    if (demon.ability) {
      arr.push(
        this.add.text(cx, cy-H/2+14, this.abilityTag(demon.ability), {
          fontSize:'7px', fontFamily:'monospace',
          color: this.abilityColor(demon.ability)
        }).setOrigin(0.5,0).setDepth(DEPTH+.2)
      );
    }

    const sb = this.add.graphics().setDepth(DEPTH+.1);
    sb.fillStyle(0x000000, 0.9); sb.fillRect(cx-W/2, cy+H/2-22, W, 22);
    arr.push(sb,
      this.add.text(cx-W/2+5, cy+H/2-11, '⚔'+demon.currentAtk, {
        fontSize:'13px', fontFamily:'monospace', color:'#ff8888'
      }).setOrigin(0, 0.5).setDepth(DEPTH+.2),
      this.add.text(cx+W/2-5, cy+H/2-11, demon.currentHp+'❤', {
        fontSize:'13px', fontFamily:'monospace', color:'#88ff88'
      }).setOrigin(1, 0.5).setDepth(DEPTH+.2)
    );

    if (demon.exhausted) {
      arr.push(this.add.text(cx, cy-4, '😴', { fontSize:'18px' }).setOrigin(0.5).setDepth(DEPTH+.3));
    }
    if (isTarget)   arr.push(this.add.text(cx, cy-H/2-12, '← TARGET',    { fontSize:'9px', fontFamily:'monospace', color:'#ff4444' }).setOrigin(0.5).setDepth(DEPTH+.3));
    if (isAttacker) arr.push(this.add.text(cx, cy-H/2-12, '← ATTACKING', { fontSize:'9px', fontFamily:'monospace', color:'#ffff44' }).setOrigin(0.5).setDepth(DEPTH+.3));

    const zone = this.add.zone(cx, cy, W, H).setDepth(DEPTH+.5).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => { g.lineStyle(3,0xffffff); g.strokeRoundedRect(cx-W/2,cy-H/2,W,H,6); });
    zone.on('pointerout',  () => { g.lineStyle(isTarget||isAttacker?3:2,border); g.strokeRoundedRect(cx-W/2,cy-H/2,W,H,6); });
    zone.on('pointerdown', (_p, _lx, _ly, event) => {
      event.stopPropagation();
      if (this.gameOver) return;
      if (!isEnemy && this.turn==='player' && !demon.exhausted) this.initiateAttack(demon, boardIdx);
      if (isEnemy && this.awaitingTarget) this.attackDemon(demon);
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
    this.hideDragHighlights();
    if (this.dragGhost) { this.dragGhost.destroy(); this.dragGhost = null; }

    this.scene.wake('HUDScene');

    const ov = this.add.graphics().setDepth(20);
    ov.fillStyle(0x000000, 0.92); ov.fillRect(0,0,960,640);

    if (result === 'win') {
      const money   = Phaser.Math.Between(this.enemyDef.rewardMoney[0], this.enemyDef.rewardMoney[1]);
      const cardDrop = Math.random() < 0.38 && this.enemyDef.rewardCard ? this.enemyDef.rewardCard : null;

      this.add.text(480, 210, 'VICTORY!', {
        fontSize: '56px', fontFamily: 'monospace', fontStyle: 'bold',
        color: '#ffd700', stroke: '#000', strokeThickness: 6
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
        this.scene.get('WorldScene').events.emit('battleWon', { money, card: cardDrop });
        this.scene.stop(); this.scene.resume('WorldScene');
      });
      btn.on('pointerover', () => btn.setStyle({ color: '#88ff88' }));
      btn.on('pointerout',  () => btn.setStyle({ color: '#44ff44' }));

    } else {
      this.add.text(480, 230, 'DEFEATED...', {
        fontSize: '50px', fontFamily: 'monospace', fontStyle: 'bold',
        color: '#ff2222', stroke: '#000', strokeThickness: 6
      }).setOrigin(0.5).setDepth(21);

      this.add.text(480, 315, '-10G', {
        fontSize: '22px', fontFamily: 'monospace', color: '#ff8888'
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
    this.txtPlayerLife.setText('❤ ' + Math.max(0, this.playerLife) + ' / 10');
    this.txtPlayerMana.setText('◆ Mana: ' + this.playerMana);
    this.txtDeckInfo.setText('Deck ' + this.playerDeck.length + '  Hand ' + this.playerHand.length + '  Discard ' + this.playerDiscard.length);
  }

  // ═══════════════ CARD ART KEY ══════════════════════════════════════════

  artKey(card) {
    if (card.type === 'demon') return 'card_art_' + card.id;
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
