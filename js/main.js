// BloodDungeon — main entry point

// ── Default Game State Factory ────────────────────────────────────────────────
window.resetGameState = function() {
  window.GameState = {
    playerMoney:      200,
    playerDeck:       [...window.STARTER_DECK],
    playerCollection: [...window.STARTER_DECK],
    bossesDefeated:   [],
    playerX:          null,
    playerY:          null,
    spawnX:           0,
    spawnY:           0,
    defeatedEnemy:    null,
    currentEnemy:     null,
    hearts:           3,
    maxHearts:        3,
    checkpoint:       null,
    echoGold:         0,
    echoX:            null,
    echoY:            null,
    explored:         new Set(),
    mapData:          null,
    enemyPositions:   [],
    questProgress:    window.initQuestState(),
    // Counters for quest tracking
    totalKills:       0,
    hardKills:        0,
    chestsOpened:     0,
    currentEnemySpawnId: null,
    // Island system
    currentIsland:    0,
    visitedIslands:   [0],
    // Relics
    relics:           [],
    // Player level
    playerXP:         0,
    playerLevel:      1,
    // Card upgrades (id -> count)
    upgradedCards:    {},
  };
};

// ── Save / Load (localStorage) ────────────────────────────────────────────────
window.saveGame = function() {
  try {
    const gs = window.GameState;
    const data = {
      playerMoney:    gs.playerMoney,
      playerDeck:     gs.playerDeck,
      playerCollection: gs.playerCollection,
      bossesDefeated: gs.bossesDefeated,
      hearts:         gs.hearts,
      maxHearts:      gs.maxHearts,
      checkpoint:     gs.checkpoint,
      echoGold:       gs.echoGold,
      echoX:          gs.echoX,
      echoY:          gs.echoY,
      explored:       [...gs.explored],
      questProgress:  gs.questProgress,
      totalKills:     gs.totalKills || 0,
      hardKills:      gs.hardKills  || 0,
      chestsOpened:   gs.chestsOpened || 0,
      currentIsland:  gs.currentIsland || 0,
      visitedIslands: gs.visitedIslands || [0],
      relics:         gs.relics || [],
      playerXP:       gs.playerXP       || 0,
      playerLevel:    gs.playerLevel    || 1,
      upgradedCards:  gs.upgradedCards  || {},
      savedAt:        Date.now(),
    };
    localStorage.setItem('blooddungeon_save', JSON.stringify(data));
    return true;
  } catch(e) {
    console.warn('Save failed:', e);
    return false;
  }
};

window.loadGame = function() {
  try {
    const raw = localStorage.getItem('blooddungeon_save');
    if (!raw) return false;
    const data = JSON.parse(raw);

    window.resetGameState();
    const gs = window.GameState;
    gs.playerMoney      = data.playerMoney     ?? 200;
    gs.playerDeck       = data.playerDeck      ?? [...window.STARTER_DECK];
    gs.playerCollection = data.playerCollection ?? [...window.STARTER_DECK];
    gs.bossesDefeated   = data.bossesDefeated  ?? [];
    gs.hearts           = data.hearts          ?? 3;
    gs.maxHearts        = data.maxHearts       ?? 3;
    gs.checkpoint       = data.checkpoint      ?? null;
    gs.echoGold         = data.echoGold        ?? 0;
    gs.echoX            = data.echoX           ?? null;
    gs.echoY            = data.echoY           ?? null;
    gs.explored         = new Set(data.explored || []);
    gs.questProgress    = data.questProgress   ?? window.initQuestState();
    // Backfill any quests added after the save was created
    if (window.QUESTS) {
      window.QUESTS.forEach(q => {
        if (!gs.questProgress[q.id]) {
          const autoActive = !q.prereq && q.island !== undefined && q.island !== 0;
          gs.questProgress[q.id] = { status: autoActive ? 'active' : 'locked', progress: 0 };
        }
      });
    }
    gs.totalKills       = data.totalKills      ?? 0;
    gs.hardKills        = data.hardKills       ?? 0;
    gs.chestsOpened     = data.chestsOpened    ?? 0;
    gs.currentIsland    = data.currentIsland   ?? 0;
    gs.visitedIslands   = data.visitedIslands  ?? [0];
    gs.relics           = data.relics          ?? [];
    gs.playerXP         = data.playerXP        ?? 0;
    gs.playerLevel      = data.playerLevel      ?? 1;
    gs.upgradedCards    = data.upgradedCards    ?? {};
    // Re-apply card upgrades to CARD_MAP on load
    if (window.CARD_MAP) {
      Object.entries(gs.upgradedCards).forEach(([id, count]) => {
        const card = window.CARD_MAP[id];
        if (!card || count <= 0) return;
        if (card.type === 'demon') card.atk += count;
        else if (card.value !== undefined) card.value += count;
      });
    }
    return true;
  } catch(e) {
    console.warn('Load failed:', e);
    return false;
  }
};

// ── Init GameState (new game) ─────────────────────────────────────────────────
window.resetGameState();

// ── Phaser Game Config ────────────────────────────────────────────────────────
const config = {
  type: Phaser.AUTO,
  width:  960,
  height: 640,
  backgroundColor: '#050508',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode:       Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade:  { gravity: { y: 0 }, debug: false },
  },
  scene: [TitleScene, PreloadScene, SeaScene, WorldScene, BattleScene, HUDScene, MenuScene],
};

new Phaser.Game(config);
