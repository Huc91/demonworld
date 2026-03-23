/**
 * MenuScene — opens over the WorldScene (which pauses).
 * Three tabs: COLLECTION | DECK BUILDER | SHOP
 * Open with M key in overworld, close with ESC.
 */
class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  create() {
    this.activeTab = 'collection'; // 'collection' | 'deck' | 'shop'
    this._contentObjs = [];
    this._collScrollY = 0;
    this._deckScrollY = 0;

    // ── Backdrop ──────────────────────────────────────────────────────
    const ov = this.add.graphics();
    ov.fillStyle(0x000000, 0.88); ov.fillRect(0, 0, 960, 640);
    ov.fillStyle(0x0a0a20); ov.fillRoundedRect(20, 20, 920, 600, 10);
    ov.lineStyle(2, 0x3333aa); ov.strokeRoundedRect(20, 20, 920, 600, 10);

    // ── Title ─────────────────────────────────────────────────────────
    this.add.text(480, 36, 'DEVIL SUMMONER — MENU', {
      fontSize: '18px', fontFamily: 'monospace', fontStyle: 'bold',
      color: '#8844cc', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5, 0);

    // ── Close hint ────────────────────────────────────────────────────
    this.add.text(900, 36, '[ESC]', {
      fontSize: '12px', fontFamily: 'monospace', color: '#666666'
    }).setOrigin(1, 0);

    this.input.keyboard.on('keydown-ESC', () => this.closeMenu());
    this.input.keyboard.on('keydown-M',   () => this.closeMenu());

    // ── Tabs ──────────────────────────────────────────────────────────
    const tabs = ['COLLECTION', 'DECK BUILDER', 'SHOP', 'QUESTS'];
    const tabW = 175, tabY = 68;
    const tabStartX = 480 - (tabs.length * tabW + (tabs.length-1)*8) / 2;

    this.tabBtns = tabs.map((label, i) => {
      const tx = tabStartX + i * (tabW + 8) + tabW/2;
      const btn = this.add.text(tx, tabY, label, {
        fontSize: '13px', fontFamily: 'monospace', fontStyle: 'bold',
        backgroundColor: '#111133', padding: { x: 12, y: 8 }, color: '#888899'
      }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
      const keyMap = { 'COLLECTION': 'collection', 'DECK BUILDER': 'deck', 'SHOP': 'shop', 'QUESTS': 'quests' };
      const key = keyMap[label] || label.toLowerCase();
      btn.on('pointerdown', () => this.switchTab(key));
      btn.on('pointerover', () => { if (this.activeTab !== key) btn.setStyle({ color: '#ccccff' }); });
      btn.on('pointerout',  () => { if (this.activeTab !== key) btn.setStyle({ color: '#888899' }); });
      return { btn, key };
    });

    // ── Gold display ──────────────────────────────────────────────────
    this.goldText = this.add.text(900, 620, '', {
      fontSize: '15px', fontFamily: 'monospace', color: '#ffd700',
      stroke: '#000', strokeThickness: 3
    }).setOrigin(1, 1);

    this.refreshGold();
    this.switchTab('collection');
  }

  closeMenu() {
    this.scene.get('WorldScene').events.emit('menuClosed');
    this.scene.stop();
    this.scene.resume('WorldScene');
  }

  switchTab(key) {
    this.activeTab = key;
    this.tabBtns.forEach(({ btn, key: k }) => {
      if (k === key) btn.setStyle({ backgroundColor: '#332266', color: '#ffffff' });
      else           btn.setStyle({ backgroundColor: '#111133', color: '#888899' });
    });
    this.clearContent();
    if (key === 'collection') this.buildCollection();
    else if (key === 'deck')  this.buildDeckBuilder();
    else if (key === 'shop')  this.buildShop();
    else if (key === 'quests') this.buildQuests();
  }

  clearContent() {
    this.hideCardPreview();
    if (this._scrollHandler) {
      this.input.off('wheel', this._scrollHandler);
      this._scrollHandler = null;
    }
    this._contentObjs.forEach(o => { try { o.destroy(); } catch(e){} });
    this._contentObjs = [];
  }

  // ── Full card preview on hover (mirrors BattleScene.showZoom) ─────────
  _abilityColor(ability) {
    if (!ability) return '#888888';
    if (ability.includes('poisonous'))  return '#44ff44';
    if (ability.includes('lifesteal'))  return '#ff4488';
    if (ability.includes('taunt'))      return '#44aaff';
    if (ability.includes('haste'))      return '#ffaa00';
    if (ability.includes('unblockable'))return '#ff44ff';
    if (ability.includes('rage'))       return '#ff6644';
    if (ability.startsWith('battlecry'))return '#ffdd44';
    if (ability.startsWith('deathrattle')) return '#bb88ff';
    if (ability === 'divine_shield')    return '#ffffaa';
    if (ability === 'mana_per_turn')    return '#44bb44';
    if (ability === 'spell_aoe' || ability === 'spell_lifegain') return '#ff9944';
    if (ability === 'tax_spells')       return '#cc8844';
    if (ability === 'draw_pings')       return '#44ccff';
    if (ability === 'any_death_draw' || ability === 'feed_on_death' ||
        ability === 'ally_death_mana'  || ability === 'ally_death_lifegain') return '#884488';
    return '#888888';
  }

  showCardPreview(card, fromX) {
    this.hideCardPreview();
    this._previewObjs = [];
    const W = 190, H = 270;
    const DEPTH = 60;
    const rarityBorder = { common: 0x444444, uncommon: 0xcccccc, rare: 0x2266cc, mythic: 0x9933cc, legendary: 0xff6600 };
    const rarityColor  = { common: '#888888', uncommon: '#cccccc', rare: '#2266cc', mythic: '#9933cc', legendary: '#ff6600' };

    // Position: right side if hovered card is in left half, left side otherwise
    const px = fromX < 480 ? Math.min(960 - W/2 - 15, 855) : Math.max(W/2 + 15, 105);
    const py = 340;

    const g = this.add.graphics().setDepth(DEPTH);
    g.fillStyle(0x080818); g.fillRoundedRect(px-W/2, py-H/2, W, H, 10);
    g.lineStyle(3, rarityBorder[card.rarity] || 0x556655);
    g.strokeRoundedRect(px-W/2, py-H/2, W, H, 10);
    this._previewObjs.push(g);

    // Art
    const artImg = this.add.image(px, py - 38, this.artKey(card))
      .setDisplaySize(100, 100).setDepth(DEPTH + .05);
    this._previewObjs.push(artImg);

    // Cost badge
    const cg = this.add.graphics().setDepth(DEPTH + .1);
    cg.fillStyle(0x000088); cg.fillCircle(px - W/2 + 20, py - H/2 + 20, 18);
    this._previewObjs.push(cg,
      this.add.text(px - W/2 + 20, py - H/2 + 20, '' + (card.cost || 0), {
        fontSize: '15px', fontFamily: 'monospace', fontStyle: 'bold', color: '#88ccff'
      }).setOrigin(0.5).setDepth(DEPTH + .2)
    );


    // Name
    this._previewObjs.push(
      this.add.text(px, py - H/2 + 8, card.name || '?', {
        fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffffff',
        wordWrap: { width: W - 20 }, align: 'center'
      }).setOrigin(0.5, 0).setDepth(DEPTH + .1)
    );

    // Stats (demon) or description preview (spell)
    if (card.type === 'demon') {
      this._previewObjs.push(
        this.add.text(px, py + 30, '⚔ ' + card.atk + '    ❤ ' + card.hp, {
          fontSize: '18px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffcc44'
        }).setOrigin(0.5).setDepth(DEPTH + .1)
      );
    }

    // Ability
    if (card.abilityDesc) {
      this._previewObjs.push(
        this.add.text(px, py + (card.type === 'demon' ? 54 : 34), card.abilityDesc, {
          fontSize: '10px', fontFamily: 'monospace', fontStyle: 'bold',
          color: this._abilityColor(card.ability),
          wordWrap: { width: W - 20 }, align: 'center'
        }).setOrigin(0.5, 0).setDepth(DEPTH + .1)
      );
    }

    // Flavour desc — demons only (spells already show desc as the effect line above)
    if (card.type === 'demon' && card.desc) {
      const descY = py + (card.abilityDesc ? 78 : 54);
      this._previewObjs.push(
        this.add.text(px, descY, card.desc, {
          fontSize: '10px', fontFamily: 'monospace', color: '#aaaaaa',
          wordWrap: { width: W - 24 }, align: 'center'
        }).setOrigin(0.5, 0).setDepth(DEPTH + .1)
      );
    }

    // Rarity + subtype label
    const subtypeStr = card.subtype ? '  [' + card.subtype.toUpperCase() + ']' : '';
    this._previewObjs.push(
      this.add.text(px, py + H/2 - 10, (card.rarity || 'common').toUpperCase() + subtypeStr, {
        fontSize: '10px', fontFamily: 'monospace',
        color: rarityColor[card.rarity] || '#888888'
      }).setOrigin(0.5, 1).setDepth(DEPTH + .1)
    );
  }

  hideCardPreview() {
    if (!this._previewObjs) return;
    this._previewObjs.forEach(o => { try { o.destroy(); } catch(e){} });
    this._previewObjs = [];
  }

  refreshGold() {
    this.goldText.setText('Gold: ' + window.GameState.playerMoney + 'G');
  }

  // ── Card art key helper ────────────────────────────────────────────
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

  // ════════════════════════════════════════════════════════════════════
  // COLLECTION TAB
  // ════════════════════════════════════════════════════════════════════

  buildCollection() {
    const SCROLL_TOP = 140, SCROLL_BOT = 618, VISIBLE_H = SCROLL_BOT - SCROLL_TOP;

    const coll = window.GameState.playerCollection;
    this._contentObjs.push(this.add.text(480, 115, 'All cards you own  (' + coll.length + ' total)', {
      fontSize: '13px', fontFamily: 'monospace', color: '#8888bb'
    }).setOrigin(0.5, 0));

    const counts = {};
    coll.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
    const unique = Object.keys(counts).map(id => window.CARD_MAP[id]).filter(Boolean);
    unique.sort((a, b) => { if (a.type !== b.type) return a.type === 'demon' ? -1 : 1; return a.cost - b.cost; });

    const CW = 100, CH = 90, GAP = 6, COLS = 8;
    const gridX = 40;
    const totalH = Math.ceil(unique.length / COLS) * (CH + GAP);
    const maxScroll = Math.max(0, totalH - VISIBLE_H + CH);
    this._collScrollY = Phaser.Math.Clamp(this._collScrollY, -maxScroll, 0);

    // Clip mask (fixed in world space)
    const maskGfx = this.add.graphics();
    maskGfx.fillStyle(0xffffff).fillRect(20, SCROLL_TOP, 920, VISIBLE_H);
    const mask = maskGfx.createGeometryMask();
    maskGfx.setVisible(false);
    this._contentObjs.push(maskGfx);

    // Scrollable container — y offset drives scroll
    const container = this.add.container(0, SCROLL_TOP + this._collScrollY);
    container.setMask(mask);
    this._contentObjs.push(container);

    if (unique.length === 0) {
      const t = this.add.text(480, 200, 'No cards yet — win battles to collect!', {
        fontSize: '16px', fontFamily: 'monospace', color: '#554455'
      }).setOrigin(0.5);
      container.add(t);
    }

    unique.forEach((card, i) => {
      const col = i % COLS, row = Math.floor(i / COLS);
      const cx = gridX + col*(CW+GAP) + CW/2;
      const cy = row*(CH+GAP) + CH/2; // relative to container

      this.drawMiniCard(card, counts[card.id], cx, cy, CW, CH, container);

      const zone = this.add.zone(cx, cy, CW, CH).setInteractive();
      zone.on('pointerover', () => this.showCardPreview(card, cx));
      zone.on('pointerout',  () => this.hideCardPreview());
      container.add(zone);
    });

    // Scrollbar track + thumb
    this._drawScrollbar(920, SCROLL_TOP, VISIBLE_H, totalH, -this._collScrollY, container);

    // Wheel handler
    this._scrollHandler = (_p, _g, _x, deltaY) => {
      this._collScrollY = Phaser.Math.Clamp(this._collScrollY - deltaY * 0.4, -maxScroll, 0);
      container.y = SCROLL_TOP + this._collScrollY;
      this._updateScrollbar(container, -this._collScrollY, totalH, VISIBLE_H);
    };
    this.input.on('wheel', this._scrollHandler);
  }

  drawMiniCard(card, count, cx, cy, W, H, container = null) {
    const rarityBorder = { common: 0x444444, uncommon: 0xcccccc, rare: 0x2266cc, mythic: 0x9933cc, legendary: 0xff6600 };
    const border = rarityBorder[card.rarity] || 0x444444;
    const add = (obj) => { container ? container.add(obj) : this._contentObjs.push(obj); return obj; };

    // Frame
    const g = this.add.graphics();
    g.fillStyle(0x151525); g.fillRoundedRect(cx-W/2, cy-H/2, W, H, 4);
    g.lineStyle(2, border); g.strokeRoundedRect(cx-W/2, cy-H/2, W, H, 4);
    add(g);

    // Art
    const artSize = Math.min(W - 10, Math.floor(H * 0.5));
    add(this.add.image(cx, cy - 4, this.artKey(card)).setDisplaySize(artSize, artSize));

    // Name
    add(this.add.text(cx, cy - H/2 + 3, card.name, {
      fontSize: '7px', fontFamily: 'monospace', color: '#dddddd',
      wordWrap: { width: W - 6 }, align: 'center'
    }).setOrigin(0.5, 0));

    // Cost badge
    const cg = this.add.graphics();
    cg.fillStyle(0x000088); cg.fillCircle(cx - W/2 + 9, cy - H/2 + 9, 8);
    add(cg);
    add(this.add.text(cx - W/2 + 9, cy - H/2 + 9, '' + (card.cost || 0), {
      fontSize: '8px', fontFamily: 'monospace', fontStyle: 'bold', color: '#88ccff'
    }).setOrigin(0.5));

    // Stats
    const statLine = card.type === 'demon' ? '⚔' + card.atk + ' ❤' + card.hp : 'SPELL';
    add(this.add.text(cx, cy + H/2 - 10, statLine, {
      fontSize: '8px', fontFamily: 'monospace',
      color: card.type === 'demon' ? '#ffcc44' : '#aaaaff', align: 'center'
    }).setOrigin(0.5, 1));

    // Quantity badge
    if (count > 1) {
      add(this.add.text(cx + W/2 - 3, cy - H/2 + 3, 'x' + count, {
        fontSize: '7px', fontFamily: 'monospace', color: '#aaaaaa'
      }).setOrigin(1, 0));
    }
  }

  // ════════════════════════════════════════════════════════════════════
  // DECK BUILDER TAB
  // ════════════════════════════════════════════════════════════════════

  buildDeckBuilder() {
    const deckIds = window.GameState.playerDeck;
    const coll    = window.GameState.playerCollection;

    const collCounts = {};
    coll.forEach(id => { collCounts[id] = (collCounts[id] || 0) + 1; });

    const deckCounts = {};
    deckIds.forEach(id => { deckCounts[id] = (deckCounts[id] || 0) + 1; });

    const deckSize = deckIds.length;

    // ── Deck side (right) ──
    this._contentObjs.push(this.add.text(740, 112, 'YOUR DECK  (' + deckSize + '/30)', {
      fontSize: '13px', fontFamily: 'monospace', fontStyle: 'bold', color: '#aaffaa'
    }).setOrigin(0.5, 0));

    const deckUnique = Object.keys(deckCounts).map(id => window.CARD_MAP[id]).filter(Boolean);
    deckUnique.sort((a,b) => a.cost - b.cost);

    let dy = 140;
    deckUnique.forEach(card => {
      const cnt = deckCounts[card.id];
      const col = card.type === 'demon' ? '#ffcc44' : '#aaaaff';
      const row = this.add.text(600, dy, (cnt > 1 ? cnt + 'x ' : '   ') + card.name + '  (' + card.cost + ')', {
        fontSize: '12px', fontFamily: 'monospace', color: col
      }).setInteractive({ useHandCursor: false });
      row.on('pointerover', () => this.showCardPreview(card, 740));
      row.on('pointerout',  () => this.hideCardPreview());
      const rmv = this.add.text(890, dy, '[-]', {
        fontSize: '12px', fontFamily: 'monospace', color: '#ff6666'
      }).setInteractive({ useHandCursor: true });
      rmv.on('pointerdown', () => this.removeFromDeck(card.id));
      rmv.on('pointerover', () => rmv.setStyle({ color: '#ff2222' }));
      rmv.on('pointerout',  () => rmv.setStyle({ color: '#ff6666' }));
      this._contentObjs.push(row, rmv);
      dy += 16;
    });

    if (!deckUnique.length) {
      this._contentObjs.push(this.add.text(740, 200, 'Deck is empty!\nAdd cards from left →', {
        fontSize: '13px', fontFamily: 'monospace', color: '#554455', align: 'center'
      }).setOrigin(0.5, 0));
    }

    // Divider
    const dv = this.add.graphics();
    dv.lineStyle(1, 0x333355); dv.lineBetween(580, 105, 580, 610);
    this._contentObjs.push(dv);

    // ── Collection side (left, scrollable) ──
    const SCROLL_TOP = 140, SCROLL_BOT = 618, VISIBLE_H = SCROLL_BOT - SCROLL_TOP;
    this._contentObjs.push(this.add.text(40, 112, 'COLLECTION  (click to add to deck)', {
      fontSize: '12px', fontFamily: 'monospace', color: '#8888bb'
    }));

    const unique = Object.keys(collCounts).map(id => window.CARD_MAP[id]).filter(Boolean);
    unique.sort((a,b) => { if (a.type !== b.type) return a.type==='demon'?-1:1; return a.cost - b.cost; });

    const CW = 90, CH = 80, GAP = 5, COLS = 5;
    const gridX = 40;
    const totalH = Math.ceil(unique.length / COLS) * (CH + GAP);
    const maxScroll = Math.max(0, totalH - VISIBLE_H + CH);
    this._deckScrollY = Phaser.Math.Clamp(this._deckScrollY, -maxScroll, 0);

    const maskGfx = this.add.graphics();
    maskGfx.fillStyle(0xffffff).fillRect(20, SCROLL_TOP, 558, VISIBLE_H);
    const mask = maskGfx.createGeometryMask();
    maskGfx.setVisible(false);
    this._contentObjs.push(maskGfx);

    const container = this.add.container(0, SCROLL_TOP + this._deckScrollY);
    container.setMask(mask);
    this._contentObjs.push(container);

    unique.forEach((card, i) => {
      const col = i % COLS, row = Math.floor(i / COLS);
      const cx = gridX + col*(CW+GAP) + CW/2;
      const cy = row*(CH+GAP) + CH/2; // relative to container

      const inDeck = deckCounts[card.id] || 0;
      const owned  = collCounts[card.id] || 0;
      const canAdd = inDeck < owned && deckSize < 30;

      const g = this.add.graphics();
      g.fillStyle(canAdd ? 0x151525 : 0x0e0e18);
      g.fillRoundedRect(cx-CW/2, cy-CH/2, CW, CH, 4);
      g.lineStyle(2, canAdd ? 0x445544 : 0x222233);
      g.strokeRoundedRect(cx-CW/2, cy-CH/2, CW, CH, 4);
      container.add(g);

      const artSize2 = Math.min(CW - 10, Math.floor(CH * 0.5));
      container.add(this.add.image(cx, cy - 4, this.artKey(card))
        .setDisplaySize(artSize2, artSize2).setAlpha(canAdd ? 1 : 0.35));

      container.add(this.add.text(cx, cy - CH/2 + 3, card.name, {
        fontSize: '7px', fontFamily: 'monospace', color: canAdd ? '#dddddd' : '#555555',
        wordWrap: { width: CW - 6 }, align: 'center'
      }).setOrigin(0.5, 0));

      const cg2 = this.add.graphics();
      cg2.fillStyle(canAdd ? 0x000088 : 0x111122); cg2.fillCircle(cx - CW/2 + 9, cy - CH/2 + 9, 8);
      container.add(cg2);
      container.add(this.add.text(cx - CW/2 + 9, cy - CH/2 + 9, '' + (card.cost || 0), {
        fontSize: '8px', fontFamily: 'monospace', fontStyle: 'bold',
        color: canAdd ? '#88ccff' : '#334455'
      }).setOrigin(0.5));

      const statLine2 = card.type === 'demon' ? '⚔' + card.atk + ' ❤' + card.hp : 'SPELL';
      container.add(this.add.text(cx, cy + CH/2 - 16, statLine2, {
        fontSize: '8px', fontFamily: 'monospace',
        color: canAdd ? (card.type === 'demon' ? '#ffcc44' : '#aaaaff') : '#444422', align: 'center'
      }).setOrigin(0.5, 1));

      container.add(this.add.text(cx, cy + CH/2 - 4, inDeck + '/' + owned, {
        fontSize: '7px', fontFamily: 'monospace', color: canAdd ? '#44aa44' : '#555555'
      }).setOrigin(0.5, 1));

      const zone = this.add.zone(cx, cy, CW, CH).setInteractive({ useHandCursor: canAdd });
      if (canAdd) zone.on('pointerdown', () => this.addToDeck(card.id));
      zone.on('pointerover', () => {
        this.showCardPreview(card, cx);
        if (canAdd) { g.clear(); g.fillStyle(0x223322); g.fillRoundedRect(cx-CW/2, cy-CH/2, CW, CH, 4); g.lineStyle(2, 0x88ff88); g.strokeRoundedRect(cx-CW/2, cy-CH/2, CW, CH, 4); }
      });
      zone.on('pointerout', () => {
        this.hideCardPreview();
        if (canAdd) { g.clear(); g.fillStyle(0x151525); g.fillRoundedRect(cx-CW/2, cy-CH/2, CW, CH, 4); g.lineStyle(2, 0x445544); g.strokeRoundedRect(cx-CW/2, cy-CH/2, CW, CH, 4); }
      });
      container.add(zone);
    });

    this._drawScrollbar(570, SCROLL_TOP, VISIBLE_H, totalH, -this._deckScrollY, container);

    this._scrollHandler = (_p, _g, _x, deltaY) => {
      this._deckScrollY = Phaser.Math.Clamp(this._deckScrollY - deltaY * 0.4, -maxScroll, 0);
      container.y = SCROLL_TOP + this._deckScrollY;
      this._updateScrollbar(container, -this._deckScrollY, totalH, VISIBLE_H);
    };
    this.input.on('wheel', this._scrollHandler);
  }

  addToDeck(cardId) {
    if (window.GameState.playerDeck.length >= 30) {
      this.flashMsg('Deck full! (30/30)', '#ff4444');
      return;
    }
    window.GameState.playerDeck.push(cardId);
    this.clearContent();
    this.buildDeckBuilder();
  }

  removeFromDeck(cardId) {
    const idx = window.GameState.playerDeck.indexOf(cardId);
    if (idx >= 0) window.GameState.playerDeck.splice(idx, 1);
    this.clearContent();
    this.buildDeckBuilder();
  }

  // ════════════════════════════════════════════════════════════════════
  // SHOP TAB
  // ════════════════════════════════════════════════════════════════════

  buildShop() {
    this._contentObjs.push(this.add.text(480, 112, 'SHOP — spend your gold on booster packs!', {
      fontSize: '14px', fontFamily: 'monospace', color: '#aaaacc'
    }).setOrigin(0.5, 0));

    // Slot 0 = premium slot (rare minimum, upgrades to mythic/legendary)
    // Slots 1–4 = standard slots
    const packs = [
      {
        name: 'Basic Pack',
        desc: '5 cards\n1 rare guaranteed\n25% mythic | 3% legend',
        cost: 40,
        color: 0x224444,
        border: 0x44aaaa,
        premiumSlot:  { rare: 71.9, mythic: 25,  legendary: 3.1 },
        standardSlot: { common: 60, uncommon: 35, rare: 5 },
      },
      {
        name: 'Advanced Pack',
        desc: '5 cards\n50% mythic slot\n5% legendary slot',
        cost: 100,
        color: 0x224488,
        border: 0x4488ff,
        premiumSlot:  { rare: 45, mythic: 50,   legendary: 5  },
        standardSlot: { common: 40, uncommon: 35, rare: 20, mythic: 5 },
      },
      {
        name: 'Legend Pack',
        desc: '5 cards\n50% mythic slot\n13% legendary slot',
        cost: 200,
        color: 0x440022,
        border: 0xff2266,
        premiumSlot:  { rare: 37, mythic: 50,   legendary: 13 },
        standardSlot: { common: 30, uncommon: 30, rare: 30, mythic: 10 },
      },
    ];

    packs.forEach((pack, i) => {
      const cx = 200 + i * 240, cy = 270;
      const W = 170, H = 220;

      const g = this.add.graphics();
      g.fillStyle(pack.color); g.fillRoundedRect(cx-W/2, cy-H/2, W, H, 8);
      g.lineStyle(2, pack.border); g.strokeRoundedRect(cx-W/2, cy-H/2, W, H, 8);
      this._contentObjs.push(g);

      this._contentObjs.push(this.add.text(cx, cy-H/2+14, pack.name, {
        fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffffff'
      }).setOrigin(0.5, 0));

      this._contentObjs.push(this.add.text(cx, cy-H/2+38, pack.desc, {
        fontSize: '11px', fontFamily: 'monospace', color: '#bbbbbb', align: 'center'
      }).setOrigin(0.5, 0));

      this._contentObjs.push(this.add.text(cx, cy+H/2-50, pack.cost + 'G', {
        fontSize: '22px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffd700'
      }).setOrigin(0.5, 0));

      const canBuy = window.GameState.playerMoney >= pack.cost;
      const buyBtn = this.add.text(cx, cy+H/2-20, canBuy ? '[ BUY ]' : '(no gold)', {
        fontSize: '14px', fontFamily: 'monospace',
        backgroundColor: canBuy ? '#006600' : '#333333',
        padding: { x: 10, y: 6 },
        color: canBuy ? '#88ff88' : '#555555'
      }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });

      if (canBuy) {
        buyBtn.on('pointerdown', () => this.openPack(pack));
        buyBtn.on('pointerover', () => buyBtn.setStyle({ backgroundColor: '#009900' }));
        buyBtn.on('pointerout',  () => buyBtn.setStyle({ backgroundColor: '#006600' }));
      }
      this._contentObjs.push(buyBtn);
    });
  }

  openPack(pack) {
    window.GameState.playerMoney -= pack.cost;
    // Slot 0: premium guaranteed slot (rare at minimum)
    // Slots 1–4: standard slots
    const drawn = [
      this.rollRarity(pack.premiumSlot),
      this.rollRarity(pack.standardSlot),
      this.rollRarity(pack.standardSlot),
      this.rollRarity(pack.standardSlot),
      this.rollRarity(pack.standardSlot),
    ];
    drawn.forEach(card => window.GameState.playerCollection.push(card.id));
    this.refreshGold();
    this.scene.get('HUDScene').updateHUD();
    this.showPackOpening(drawn);
  }

  // Rolls a rarity using decimal weights then picks a random card of that rarity.
  rollRarity(weights) {
    const total = Object.values(weights).reduce((s, w) => s + w, 0);
    let roll = Math.random() * total;
    let rarity = 'common';
    for (const [r, w] of Object.entries(weights)) {
      roll -= w;
      if (roll <= 0) { rarity = r; break; }
    }
    const pool = window.CARDS.filter(c => c.rarity === rarity);
    if (!pool.length) return window.CARDS[Math.floor(Math.random() * window.CARDS.length)];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // ════════════════════════════════════════════════════════════════════
  // PACK OPENING ANIMATION
  // ════════════════════════════════════════════════════════════════════

  showPackOpening(cards) {
    // All overlay objects tracked for cleanup
    const overlayObjs = [];

    // Dark overlay (depth 50) covering the whole screen
    const darkOv = this.add.graphics().setDepth(50);
    darkOv.fillStyle(0x000000, 0.92);
    darkOv.fillRect(0, 0, 960, 640);
    overlayObjs.push(darkOv);

    let currentIdx = 0;
    // Objects for the currently displayed card
    let cardObjs = [];

    const rarityBorderColor = {
      common:    0x444444,
      uncommon:  0xcccccc,
      rare:      0x2266cc,
      mythic:    0x9933cc,
      legendary: 0xff6600,
    };
    const rarityTextColor = {
      common:    '#888888',
      uncommon:  '#cccccc',
      rare:      '#2266cc',
      mythic:    '#9933cc',
      legendary: '#ff6600',
    };

    const clearCard = () => {
      cardObjs.forEach(o => { try { o.destroy(); } catch(e){} });
      cardObjs = [];
    };

    const closeAll = () => {
      clearCard();
      overlayObjs.forEach(o => { try { o.destroy(); } catch(e){} });
      this.clearContent();
      this.buildShop();
    };

    const showCard = (idx) => {
      clearCard();
      const card = cards[idx];
      const W = 220, H = 310;
      const cx = 480, cy = 320;
      const DEPTH = 52;

      const borderCol = rarityBorderColor[card.rarity] || 0x556655;

      // Frame — starts scaled to 0 on x (flip-in), same style as zoom
      const frame = this.add.graphics().setDepth(DEPTH).setScale(0, 1);
      frame.fillStyle(0x080818);
      frame.fillRoundedRect(cx - W/2, cy - H/2, W, H, 10);
      frame.lineStyle(4, borderCol);
      frame.strokeRoundedRect(cx - W/2, cy - H/2, W, H, 10);
      cardObjs.push(frame);

      // All content starts invisible, revealed after flip
      const D = DEPTH + .1;

      // Art
      const artImg = this.add.image(cx, cy - 40, this.artKey(card))
        .setDisplaySize(110, 110).setDepth(D).setAlpha(0);
      cardObjs.push(artImg);

      // Cost badge
      const cg = this.add.graphics().setDepth(D).setAlpha(0);
      cg.fillStyle(0x000088); cg.fillCircle(cx - W/2 + 22, cy - H/2 + 22, 20);
      const costText = this.add.text(cx - W/2 + 22, cy - H/2 + 22, '' + (card.cost || 0), {
        fontSize: '17px', fontFamily: 'monospace', fontStyle: 'bold', color: '#88ccff'
      }).setOrigin(0.5).setDepth(D + .1).setAlpha(0);
      cardObjs.push(cg, costText);

      // Name
      const nameText = this.add.text(cx, cy - H/2 + 10, card.name, {
        fontSize: '17px', fontFamily: 'monospace', fontStyle: 'bold',
        color: '#ffffff', stroke: '#000', strokeThickness: 3,
        wordWrap: { width: W - 20 }, align: 'center'
      }).setOrigin(0.5, 0).setDepth(D).setAlpha(0);
      cardObjs.push(nameText);

      // ATK / HP (demon) or spell desc
      const statLine = card.type === 'demon'
        ? '⚔ ' + card.atk + '    ❤ ' + card.hp
        : (card.desc || card.effect || 'Spell');
      const statsText = this.add.text(cx, cy + 34, statLine, {
        fontSize: card.type === 'demon' ? '22px' : '12px',
        fontFamily: 'monospace',
        color: card.type === 'demon' ? '#ffcc44' : '#aaaaff',
        stroke: '#000', strokeThickness: 2,
        wordWrap: { width: W - 20 }, align: 'center'
      }).setOrigin(0.5, 0).setDepth(D).setAlpha(0);
      cardObjs.push(statsText);

      // Ability
      const abilityText = card.abilityDesc
        ? this.add.text(cx, cy + (card.type === 'demon' ? 64 : 52), card.abilityDesc, {
            fontSize: '11px', fontFamily: 'monospace', fontStyle: 'bold',
            color: this._abilityColor(card.ability),
            stroke: '#000', strokeThickness: 2,
            wordWrap: { width: W - 20 }, align: 'center'
          }).setOrigin(0.5, 0).setDepth(D).setAlpha(0)
        : null;
      if (abilityText) cardObjs.push(abilityText);

      // Flavour desc — demons only (spells already show desc as the effect line above)
      const descY = cy + (card.abilityDesc ? 92 : 64);
      const descText = (card.type === 'demon' && card.desc)
        ? this.add.text(cx, descY, card.desc, {
            fontSize: '10px', fontFamily: 'monospace', color: '#aaaaaa',
            stroke: '#000', strokeThickness: 1,
            wordWrap: { width: W - 24 }, align: 'center'
          }).setOrigin(0.5, 0).setDepth(D).setAlpha(0)
        : null;
      if (descText) cardObjs.push(descText);

      // Rarity + subtype
      const subtypeStr = card.subtype ? '  [' + card.subtype.toUpperCase() + ']' : '';
      const rarText = this.add.text(cx, cy + H/2 - 12, (card.rarity || 'common').toUpperCase() + subtypeStr, {
        fontSize: '12px', fontFamily: 'monospace', fontStyle: 'bold',
        color: rarityTextColor[card.rarity] || '#888888',
        stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5, 1).setDepth(D).setAlpha(0);
      cardObjs.push(rarText);

      // Counter
      const counterText = this.add.text(cx, 105, (idx + 1) + ' / ' + cards.length, {
        fontSize: '16px', fontFamily: 'monospace', color: '#666666'
      }).setOrigin(0.5).setDepth(D).setAlpha(0);
      cardObjs.push(counterText);

      const revealObjs = [artImg, cg, costText, nameText, statsText, abilityText, descText, rarText, counterText].filter(Boolean);

      // Flip tween: scaleX 0 → 1
      this.tweens.add({
        targets: frame,
        scaleX: 1,
        duration: 220,
        ease: 'Power2',
        onComplete: () => {
          revealObjs.forEach(obj => {
            this.tweens.add({ targets: obj, alpha: 1, duration: 150, ease: 'Linear' });
          });

          // Show NEXT or DONE button
          const isLast = idx === cards.length - 1;
          const btnLabel = isLast ? 'DONE' : 'NEXT →';
          const btnCol   = isLast ? '#ff8844' : '#44ff88';
          const btnBg    = isLast ? '#442200' : '#004422';

          const nextBtn = this.add.text(cx, cy + H/2 + 10, btnLabel, {
            fontSize: '20px', fontFamily: 'monospace', fontStyle: 'bold',
            backgroundColor: btnBg, padding: { x: 20, y: 10 },
            color: btnCol, stroke: '#000', strokeThickness: 3
          }).setOrigin(0.5, 0).setDepth(53).setAlpha(0).setInteractive({ useHandCursor: true });
          cardObjs.push(nextBtn);

          this.tweens.add({ targets: nextBtn, alpha: 1, duration: 200, ease: 'Linear' });

          nextBtn.on('pointerover', () => nextBtn.setStyle({ backgroundColor: isLast ? '#884400' : '#008844' }));
          nextBtn.on('pointerout',  () => nextBtn.setStyle({ backgroundColor: btnBg }));
          nextBtn.on('pointerdown', () => {
            if (isLast) {
              closeAll();
            } else {
              currentIdx++;
              showCard(currentIdx);
            }
          });
        }
      });
    };

    showCard(0);
  }

  // ── Scrollbar helpers ────────────────────────────────────────────────
  // Draws a fixed-position scrollbar track + thumb. Returns { track, thumb }.
  // The graphics objects are stored on `this` so _updateScrollbar can find them.
  _drawScrollbar(x, top, visibleH, totalH, scrollY, _container) {
    const TRACK_W = 6;
    const thumbH  = Math.max(20, Math.round(visibleH * (visibleH / Math.max(totalH, visibleH + 1))));
    const trackH  = visibleH;
    const maxScroll = Math.max(0, totalH - visibleH);
    const thumbY  = maxScroll > 0 ? Math.round((scrollY / maxScroll) * (trackH - thumbH)) : 0;

    // Track
    const track = this.add.graphics();
    track.fillStyle(0x222244, 0.8);
    track.fillRoundedRect(x, top, TRACK_W, trackH, 3);
    this._contentObjs.push(track);

    // Thumb
    const thumb = this.add.graphics();
    thumb.fillStyle(0x6655cc, 1);
    thumb.fillRoundedRect(x, top + thumbY, TRACK_W, thumbH, 3);
    this._contentObjs.push(thumb);

    // Store refs for update
    this._scrollbarTrack = track;
    this._scrollbarThumb = thumb;
    this._scrollbarMeta  = { x, top, trackH, thumbH, totalH, visibleH };
  }

  _updateScrollbar(_container, scrollY, _totalH, _visibleH) {
    if (!this._scrollbarThumb || !this._scrollbarMeta) return;
    const { x, top, trackH, thumbH, totalH: tH, visibleH: vH } = this._scrollbarMeta;
    const maxScroll = Math.max(0, tH - vH);
    const thumbY = maxScroll > 0 ? Math.round((scrollY / maxScroll) * (trackH - thumbH)) : 0;
    this._scrollbarThumb.clear();
    this._scrollbarThumb.fillStyle(0x6655cc, 1);
    this._scrollbarThumb.fillRoundedRect(x, top + thumbY, 6, thumbH, 3);
  }

  flashMsg(msg, color) {
    const t = this.add.text(480, 320, msg, {
      fontSize: '22px', fontFamily: 'monospace', fontStyle: 'bold',
      color, stroke: '#000', strokeThickness: 4,
      backgroundColor: '#00000099', padding: { x: 14, y: 8 }
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: t, y: 250, alpha: 0, duration: 2000, ease: 'Power2', onComplete: () => t.destroy() });
  }

  // ════════════════════════════════════════════════════════════════════
  // QUESTS TAB
  // ════════════════════════════════════════════════════════════════════

  buildQuests() {
    if (!window.QUESTS || !window.GameState.questProgress) {
      this._contentObjs.push(this.add.text(480, 300, 'No quests available.', {
        fontSize: '16px', fontFamily: 'monospace', color: '#554455'
      }).setOrigin(0.5));
      return;
    }

    const qs = window.GameState.questProgress;
    const statusColor = {
      locked:   '#333344',
      active:   '#aaaaff',
      complete: '#ffd700',
      claimed:  '#44cc88',
    };
    const statusLabel = {
      locked:   '🔒 LOCKED',
      active:   '⚔ ACTIVE',
      complete: '★ READY TO CLAIM',
      claimed:  '✓ COMPLETE',
    };

    // Header
    this._contentObjs.push(this.add.text(480, 110, 'QUESTS', {
      fontSize: '22px', fontFamily: 'monospace', fontStyle: 'bold',
      color: '#cc88ff', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5, 0));

    // Stats bar
    const totalQ  = window.QUESTS.length;
    const doneQ   = window.QUESTS.filter(q => qs[q.id]?.status === 'claimed').length;
    this._contentObjs.push(this.add.text(480, 140, 'Progress: ' + doneQ + ' / ' + totalQ + ' quests completed', {
      fontSize: '13px', fontFamily: 'monospace', color: '#6655aa',
    }).setOrigin(0.5, 0));

    // Progress bar
    const barW = 600, barH = 8;
    const bg = this.add.graphics();
    bg.fillStyle(0x221133); bg.fillRoundedRect(480 - barW/2, 162, barW, barH, 4);
    bg.fillStyle(0x8844ff); bg.fillRoundedRect(480 - barW/2, 162, Math.round(barW * doneQ / totalQ), barH, 4);
    this._contentObjs.push(bg);

    // Quest list
    let y = 192;
    window.QUESTS.forEach(quest => {
      const state = qs[quest.id] || { status: 'locked', progress: 0 };
      const col   = statusColor[state.status] || '#444444';
      const label = statusLabel[state.status]  || '?';
      const isLocked = state.status === 'locked';

      // Quest card background
      const card = this.add.graphics();
      const cardAlpha = isLocked ? 0.4 : 0.8;
      card.fillStyle(isLocked ? 0x111122 : 0x110a22, cardAlpha);
      card.fillRoundedRect(40, y - 2, 880, 66, 6);
      if (!isLocked) {
        card.lineStyle(1, isLocked ? 0x222233 : 0x443366);
        card.strokeRoundedRect(40, y - 2, 880, 66, 6);
      }
      this._contentObjs.push(card);

      // Quest name
      this._contentObjs.push(this.add.text(60, y + 4, quest.name, {
        fontSize: '16px', fontFamily: 'monospace', fontStyle: 'bold',
        color: isLocked ? '#333344' : '#eeddff',
        stroke: '#000', strokeThickness: 2,
      }));

      // Status badge
      this._contentObjs.push(this.add.text(880, y + 4, label, {
        fontSize: '13px', fontFamily: 'monospace', fontStyle: 'bold',
        color: col,
      }).setOrigin(1, 0));

      // Description
      if (!isLocked) {
        this._contentObjs.push(this.add.text(60, y + 24, quest.description.replace(/\n/g, '  '), {
          fontSize: '11px', fontFamily: 'monospace', color: '#8877aa',
          wordWrap: { width: 620 },
        }));

        // Objective progress bar
        const obj      = quest.objective;
        const needed   = obj.count || 1;
        const prog     = Math.min(state.progress, needed);
        const progStr  = obj.type.startsWith('kill_boss') ? (prog >= 1 ? '1/1' : '0/1')
                                                          : prog + '/' + needed;

        this._contentObjs.push(this.add.text(60, y + 46, 'Progress: ' + progStr, {
          fontSize: '10px', fontFamily: 'monospace',
          color: state.status === 'claimed' ? '#44cc88' : '#6655aa',
        }));

        // Mini progress bar
        const miniW = 200;
        const miniGfx = this.add.graphics();
        miniGfx.fillStyle(0x221133); miniGfx.fillRoundedRect(160, y + 48, miniW, 5, 2);
        const fill = state.status === 'claimed' ? miniW : Math.round(miniW * prog / needed);
        miniGfx.fillStyle(state.status === 'claimed' ? 0x44cc88 : 0x8844ff);
        miniGfx.fillRoundedRect(160, y + 48, fill, 5, 2);
        this._contentObjs.push(miniGfx);

        // Reward preview
        const rewardStr = '+' + quest.reward.gold + 'G' +
          (quest.reward.card && window.CARD_MAP?.[quest.reward.card] ?
            '  +' + window.CARD_MAP[quest.reward.card].name : '');
        this._contentObjs.push(this.add.text(880, y + 24, 'Reward: ' + rewardStr, {
          fontSize: '11px', fontFamily: 'monospace', color: '#cc9944',
        }).setOrigin(1, 0));

        // NPC location hint + island badge
        const islandBadge = quest.island === 1 ? ' [INFERNO]' : quest.island === 2 ? ' [FROST]' : '';
        const islandBadgeColor = quest.island === 1 ? '#ff6622' : quest.island === 2 ? '#88ccff' : '#554477';
        this._contentObjs.push(this.add.text(880, y + 40, 'NPC: ' + quest.npc + islandBadge, {
          fontSize: '10px', fontFamily: 'monospace', color: islandBadgeColor,
        }).setOrigin(1, 0));
      }

      y += 74;
    });
  }
}
