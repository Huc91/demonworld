// BloodDungeon — main entry point

// ── Global Game State ────────────────────────────────────────────────────────
window.GameState = {
  playerMoney:      5000,
  playerDeck:       [...window.STARTER_DECK],   // 30 card IDs
  playerCollection: [...window.STARTER_DECK],   // all owned cards
  bossesDefeated:   [],
  playerX:          null,
  playerY:          null,
  spawnX:           0,
  spawnY:           0,
  defeatedEnemy:    null,
  currentEnemy:     null,
};

// ── Phaser Game Config ────────────────────────────────────────────────────────
const config = {
  type: Phaser.AUTO,
  width:  960,
  height: 640,
  backgroundColor: '#0a0a12',
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
  scene: [PreloadScene, WorldScene, BattleScene, HUDScene, MenuScene],
};

new Phaser.Game(config);
