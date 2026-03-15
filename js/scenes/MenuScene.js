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
    const tabs = ['COLLECTION', 'DECK BUILDER', 'SHOP'];
    const tabW = 200, tabY = 68;
    const tabStartX = 480 - (tabs.length * tabW + (tabs.length-1)*8) / 2;

    this.tabBtns = tabs.map((label, i) => {
      const tx = tabStartX + i * (tabW + 8) + tabW/2;
      const btn = this.add.text(tx, tabY, label, {
        fontSize: '13px', fontFamily: 'monospace', fontStyle: 'bold',
        backgroundColor: '#111133', padding: { x: 12, y: 8 }, color: '#888899'
      }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
      const key = label === 'COLLECTION' ? 'collection' : label === 'DECK BUILDER' ? 'deck' : 'shop';
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
    else                      this.buildShop();
  }

  clearContent() {
    this._contentObjs.forEach(o => { try { o.destroy(); } catch(e){} });
    this._contentObjs = [];
  }

  refreshGold() {
    this.goldText.setText('Gold: ' + window.GameState.playerMoney + 'G');
  }

  // ── Card art key helper ────────────────────────────────────────────
  artKey(card) {
    if (card.type === 'demon') return 'card_art_' + card.id;
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
    const coll = window.GameState.playerCollection;

    this._contentObjs.push(this.add.text(480, 115, 'All cards you own  (' + coll.length + ' total)', {
      fontSize: '13px', fontFamily: 'monospace', color: '#8888bb'
    }).setOrigin(0.5, 0));

    // Count duplicates
    const counts = {};
    coll.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
    const unique = Object.keys(counts).map(id => window.CARD_MAP[id]).filter(Boolean);

    // Sort: demons first, then by cost
    unique.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'demon' ? -1 : 1;
      return a.cost - b.cost;
    });

    // Grid: 8 per row
    const CW = 100, CH = 90, GAP = 6, COLS = 8;
    const gridX = 40, gridY = 145;

    unique.forEach((card, i) => {
      const col = i % COLS, row = Math.floor(i / COLS);
      const cx = gridX + col*(CW+GAP) + CW/2;
      const cy = gridY + row*(CH+GAP) + CH/2;
      if (cy + CH/2 > 600) return; // clip

      this.drawMiniCard(card, counts[card.id], cx, cy, CW, CH);
    });

    if (unique.length === 0) {
      this._contentObjs.push(this.add.text(480, 350, 'No cards yet — win battles to collect!', {
        fontSize: '16px', fontFamily: 'monospace', color: '#554455'
      }).setOrigin(0.5));
    }
  }

  drawMiniCard(card, count, cx, cy, W, H) {
    const rarityBorder = { common: 0x445544, uncommon: 0x224488, rare: 0x884422, legendary: 0xaa6600 };
    const border = rarityBorder[card.rarity] || 0x445544;

    const g = this.add.graphics();
    g.fillStyle(0x151525); g.fillRoundedRect(cx-W/2, cy-H/2, W, H, 4);
    g.lineStyle(2, border); g.strokeRoundedRect(cx-W/2, cy-H/2, W, H, 4);
    this._contentObjs.push(g);

    // Card art image instead of colored geometry dot
    const artImg = this.add.image(cx, cy - 8, this.artKey(card))
      .setDisplaySize(W - 12, Math.floor(H * 0.5));
    this._contentObjs.push(artImg);

    this._contentObjs.push(this.add.text(cx, cy-H/2+3, card.name, {
      fontSize: '7px', fontFamily: 'monospace', color: '#cccccc', wordWrap:{width:W-4}, align:'center'
    }).setOrigin(0.5, 0));

    const statLine = card.type === 'demon' ? '⚔' + card.atk + '/❤' + card.hp : card.effect || 'spell';
    this._contentObjs.push(this.add.text(cx, cy+H/2-18, statLine, {
      fontSize: '9px', fontFamily: 'monospace', color: card.type === 'demon' ? '#ffcc44' : '#aaaaff'
    }).setOrigin(0.5, 0));

    this._contentObjs.push(this.add.text(cx, cy+H/2-6, 'cost ' + card.cost + '  x' + count, {
      fontSize: '8px', fontFamily: 'monospace', color: '#888888'
    }).setOrigin(0.5, 0));
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
      });
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

    // ── Collection side (left) ──
    this._contentObjs.push(this.add.text(40, 112, 'COLLECTION  (click to add to deck)', {
      fontSize: '12px', fontFamily: 'monospace', color: '#8888bb'
    }));

    const unique = Object.keys(collCounts).map(id => window.CARD_MAP[id]).filter(Boolean);
    unique.sort((a,b) => { if (a.type !== b.type) return a.type==='demon'?-1:1; return a.cost - b.cost; });

    const CW = 90, CH = 80, GAP = 5, COLS = 5;
    const gridX = 40, gridY = 142;

    unique.forEach((card, i) => {
      const col = i % COLS, row = Math.floor(i / COLS);
      const cx = gridX + col*(CW+GAP) + CW/2;
      const cy = gridY + row*(CH+GAP) + CH/2;
      if (cy + CH/2 > 610) return;

      const inDeck = deckCounts[card.id] || 0;
      const owned  = collCounts[card.id] || 0;
      const canAdd = inDeck < owned && deckSize < 30;

      const g = this.add.graphics();
      g.fillStyle(canAdd ? 0x151525 : 0x0e0e18);
      g.fillRoundedRect(cx-CW/2, cy-CH/2, CW, CH, 4);
      g.lineStyle(2, canAdd ? 0x445544 : 0x222233);
      g.strokeRoundedRect(cx-CW/2, cy-CH/2, CW, CH, 4);
      this._contentObjs.push(g);

      const artImg = this.add.image(cx, cy - 8, this.artKey(card))
        .setDisplaySize(CW - 10, Math.floor(CH * 0.48))
        .setAlpha(canAdd ? 1 : 0.35);
      this._contentObjs.push(artImg);

      this._contentObjs.push(this.add.text(cx, cy-CH/2+3, card.name, {
        fontSize: '7px', fontFamily: 'monospace', color: canAdd ? '#cccccc' : '#555555',
        wordWrap: { width: CW-4 }, align: 'center'
      }).setOrigin(0.5, 0));

      this._contentObjs.push(this.add.text(cx, cy+CH/2-22, 'cost ' + card.cost, {
        fontSize: '8px', fontFamily: 'monospace', color: canAdd ? '#888888' : '#333333'
      }).setOrigin(0.5, 0));

      this._contentObjs.push(this.add.text(cx, cy+CH/2-10, 'in deck: ' + inDeck + '/' + owned, {
        fontSize: '8px', fontFamily: 'monospace', color: canAdd ? '#44aa44' : '#555555'
      }).setOrigin(0.5, 0));

      if (canAdd) {
        const zone = this.add.zone(cx, cy, CW, CH).setInteractive({ useHandCursor: true });
        zone.on('pointerdown', () => this.addToDeck(card.id));
        zone.on('pointerover', () => {
          g.clear();
          g.fillStyle(0x223322); g.fillRoundedRect(cx-CW/2, cy-CH/2, CW, CH, 4);
          g.lineStyle(2, 0x88ff88); g.strokeRoundedRect(cx-CW/2, cy-CH/2, CW, CH, 4);
        });
        zone.on('pointerout', () => {
          g.clear();
          g.fillStyle(0x151525); g.fillRoundedRect(cx-CW/2, cy-CH/2, CW, CH, 4);
          g.lineStyle(2, 0x445544); g.strokeRoundedRect(cx-CW/2, cy-CH/2, CW, CH, 4);
        });
        this._contentObjs.push(zone);
      }
    });
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

    const packs = [
      {
        name: 'Basic Pack',
        desc: '3 random cards\n(mostly common)',
        cost: 30,
        cards: 3,
        rarityWeights: { common: 70, uncommon: 25, rare: 5, legendary: 0 },
        color: 0x224444,
        border: 0x44aaaa,
      },
      {
        name: 'Rare Pack',
        desc: '3 cards\n(uncommon guaranteed)',
        cost: 60,
        cards: 3,
        rarityWeights: { common: 30, uncommon: 50, rare: 18, legendary: 2 },
        color: 0x224488,
        border: 0x4488ff,
      },
      {
        name: 'Legendary Pack',
        desc: '5 cards\n(rare guaranteed)',
        cost: 120,
        cards: 5,
        rarityWeights: { common: 20, uncommon: 40, rare: 35, legendary: 5 },
        color: 0x442200,
        border: 0xffaa22,
      },
      {
        name: 'Devil Pack',
        desc: '5 cards\n(legend. possible)',
        cost: 200,
        cards: 5,
        rarityWeights: { common: 10, uncommon: 30, rare: 40, legendary: 20 },
        color: 0x440022,
        border: 0xff2266,
      },
    ];

    packs.forEach((pack, i) => {
      const cx = 160 + i * 200, cy = 270;
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
    const drawn = [];
    for (let i = 0; i < pack.cards; i++) {
      drawn.push(this.rollCard(pack.rarityWeights));
    }
    drawn.forEach(card => {
      window.GameState.playerCollection.push(card.id);
    });
    this.refreshGold();
    this.scene.get('HUDScene').updateHUD();
    // Trigger animated pack opening instead of just a flash
    this.showPackOpening(drawn);
  }

  rollCard(weights) {
    const rarityPool = [];
    Object.entries(weights).forEach(([rarity, weight]) => {
      for (let i = 0; i < weight; i++) rarityPool.push(rarity);
    });
    const rarity = rarityPool[Math.floor(Math.random() * rarityPool.length)];
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
      common:    0x556655,
      uncommon:  0x224488,
      rare:      0xaa4422,
      legendary: 0xcc8800,
    };
    const rarityTextColor = {
      common:    '#888888',
      uncommon:  '#4488ff',
      rare:      '#ff8844',
      legendary: '#ffaa00',
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
      const CW = 200, CH = 280;
      const cx = 480, cy = 310;

      const borderCol = rarityBorderColor[card.rarity] || 0x556655;

      // Card frame — starts scaled to 0 on x axis (flip-in)
      const frame = this.add.graphics().setDepth(52);
      frame.fillStyle(0x080818);
      frame.fillRoundedRect(cx - CW/2, cy - CH/2, CW, CH, 10);
      frame.lineStyle(4, borderCol);
      frame.strokeRoundedRect(cx - CW/2, cy - CH/2, CW, CH, 10);
      frame.setScale(0, 1);
      cardObjs.push(frame);

      // Art image — initially invisible, shown after frame flips
      const artImg = this.add.image(cx, cy - 40, this.artKey(card))
        .setDisplaySize(CW - 20, Math.floor(CH * 0.48))
        .setDepth(53)
        .setAlpha(0);
      cardObjs.push(artImg);

      // Card name
      const nameText = this.add.text(cx, cy - CH/2 + 14, card.name, {
        fontSize: '18px', fontFamily: 'monospace', fontStyle: 'bold',
        color: '#ffffff', stroke: '#000', strokeThickness: 3
      }).setOrigin(0.5, 0).setDepth(53).setAlpha(0);
      cardObjs.push(nameText);

      // Stats / effect line
      const statLine = card.type === 'demon'
        ? '⚔ ' + card.atk + '   ❤ ' + card.hp
        : (card.desc || card.effect || 'Spell');
      const statsText = this.add.text(cx, cy + 50, statLine, {
        fontSize: card.type === 'demon' ? '22px' : '13px',
        fontFamily: 'monospace',
        color: card.type === 'demon' ? '#ffcc44' : '#aaaaff',
        stroke: '#000', strokeThickness: 3,
        wordWrap: { width: CW - 20 }, align: 'center'
      }).setOrigin(0.5, 0).setDepth(53).setAlpha(0);
      cardObjs.push(statsText);

      // Rarity label
      const rarText = this.add.text(cx, cy + CH/2 - 28, card.rarity.toUpperCase(), {
        fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold',
        color: rarityTextColor[card.rarity] || '#888888',
        stroke: '#000', strokeThickness: 3
      }).setOrigin(0.5, 0).setDepth(53).setAlpha(0);
      cardObjs.push(rarText);

      // Card counter
      const counterText = this.add.text(cx, 120, (idx + 1) + ' / ' + cards.length, {
        fontSize: '16px', fontFamily: 'monospace', color: '#888888'
      }).setOrigin(0.5).setDepth(53).setAlpha(0);
      cardObjs.push(counterText);

      // Flip tween: scaleX 0 → 1
      this.tweens.add({
        targets: frame,
        scaleX: 1,
        duration: 220,
        ease: 'Power2',
        onComplete: () => {
          // Reveal card content after flip
          [artImg, nameText, statsText, rarText, counterText].forEach(obj => {
            this.tweens.add({ targets: obj, alpha: 1, duration: 150, ease: 'Linear' });
          });

          // Show NEXT or DONE button
          const isLast = idx === cards.length - 1;
          const btnLabel = isLast ? 'DONE' : 'NEXT →';
          const btnCol   = isLast ? '#ff8844' : '#44ff88';
          const btnBg    = isLast ? '#442200' : '#004422';

          const nextBtn = this.add.text(cx, cy + CH/2 + 10, btnLabel, {
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

  flashMsg(msg, color) {
    const t = this.add.text(480, 320, msg, {
      fontSize: '22px', fontFamily: 'monospace', fontStyle: 'bold',
      color, stroke: '#000', strokeThickness: 4,
      backgroundColor: '#00000099', padding: { x: 14, y: 8 }
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: t, y: 250, alpha: 0, duration: 2000, ease: 'Power2', onComplete: () => t.destroy() });
  }
}
