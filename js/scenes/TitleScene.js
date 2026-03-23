/**
 * TitleScene — Devil Summoner opening screen.
 * Shows logo, NEW GAME / CONTINUE, controls hint.
 * Auto-detects localStorage save to enable CONTINUE.
 */
class TitleScene extends Phaser.Scene {
  constructor() { super({ key: 'TitleScene' }); }

  create() {
    const W = 960, H = 640;

    // ── Starfield background ─────────────────────────────────────────────
    const stars = [];
    const starGfx = this.add.graphics().setDepth(0);
    for (let i = 0; i < 220; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() < 0.12 ? 1.5 : 0.8,
        alpha: 0.3 + Math.random() * 0.7,
        speed: 0.02 + Math.random() * 0.06,
        twinkleOffset: Math.random() * Math.PI * 2,
      });
    }

    // Blood moon (large reddish circle, top-right)
    const moonGfx = this.add.graphics().setDepth(1);
    moonGfx.fillStyle(0x660010, 0.18);
    moonGfx.fillCircle(W - 160, 140, 90);
    moonGfx.fillStyle(0x880020, 0.12);
    moonGfx.fillCircle(W - 160, 140, 110);
    moonGfx.fillStyle(0xaa0020, 0.25);
    moonGfx.fillCircle(W - 160, 140, 70);
    moonGfx.fillStyle(0xdd1030, 0.3);
    moonGfx.fillCircle(W - 160, 140, 50);

    // ── Ground silhouette ────────────────────────────────────────────────
    const groundGfx = this.add.graphics().setDepth(2);
    groundGfx.fillStyle(0x000000);
    // Jagged castle/dungeon silhouette
    groundGfx.fillRect(0, 560, W, 80);
    const battlements = [
      [60,540],[80,540],[80,555],[100,555],[100,540],[130,540],[130,555],[155,555],[155,540],
      [200,540],[220,540],[220,555],[240,555],[240,540],[260,540],
      // Main tower
      [350,480],[360,470],[370,460],[380,460],[390,450],[400,450],[410,460],[420,460],[430,470],[440,480],
      [440,540],[460,540],[460,555],[480,555],[480,540],[500,540],[500,555],[520,555],[520,540],
      // Right section
      [600,510],[620,510],[620,525],[640,525],[640,510],[670,510],[680,500],[690,490],[700,490],
      [710,500],[720,510],[750,510],[760,515],[760,540],
      [800,540],[820,540],[820,555],[840,555],[840,540],[870,540],[870,555],[890,555],[890,540],[960,540],
    ];
    groundGfx.fillPoints([
      { x: 0, y: 640 },
      ...battlements.map(([x,y]) => ({ x, y })),
      { x: 960, y: 640 },
    ], true);

    // Glowing windows on castle
    const windowGfx = this.add.graphics().setDepth(3);
    [[390, 510], [400, 495], [410, 510]].forEach(([wx, wy]) => {
      windowGfx.fillStyle(0xff4400, 0.6);
      windowGfx.fillRect(wx - 3, wy - 5, 6, 8);
    });
    [[640, 528], [660, 522]].forEach(([wx, wy]) => {
      windowGfx.fillStyle(0xffaa00, 0.5);
      windowGfx.fillRect(wx - 2, wy - 4, 5, 7);
    });

    // ── Fog / atmosphere ─────────────────────────────────────────────────
    const fogGfx = this.add.graphics().setDepth(4);
    for (let i = 0; i < 6; i++) {
      const fogX = (Math.random() * 1200) - 100;
      const fogY = 440 + Math.random() * 80;
      const fogW = 200 + Math.random() * 300;
      fogGfx.fillStyle(0x0a0014, 0.08 + Math.random() * 0.08);
      fogGfx.fillEllipse(fogX, fogY, fogW, 40 + Math.random() * 30);
    }

    // ── Title logo ───────────────────────────────────────────────────────
    // "DEVIL SUMMONER" main title
    const titleShadow = this.add.text(W/2 + 4, 170 + 4, 'DEVIL SUMMONER', {
      fontSize: '70px', fontFamily: 'monospace', fontStyle: 'bold',
      color: '#000000',
    }).setOrigin(0.5).setDepth(5).setAlpha(0);

    const titleText = this.add.text(W/2, 170, 'DEVIL SUMMONER', {
      fontSize: '70px', fontFamily: 'monospace', fontStyle: 'bold',
      color: '#cc0022',
      stroke: '#440000',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(6).setAlpha(0);

    // "BloodDungeon" subtitle
    const subText = this.add.text(W/2, 250, 'B L O O D D U N G E O N', {
      fontSize: '22px', fontFamily: 'monospace',
      color: '#882244',
      stroke: '#000', strokeThickness: 3,
      letterSpacing: 4,
    }).setOrigin(0.5).setDepth(6).setAlpha(0);

    // Decorative rune line
    const runeText = this.add.text(W/2, 282, '— ☽ ✦ ⚔ ✦ ☾ —', {
      fontSize: '14px', fontFamily: 'monospace',
      color: '#551133',
    }).setOrigin(0.5).setDepth(6).setAlpha(0);

    // ── Buttons ──────────────────────────────────────────────────────────
    const hasSave = !!localStorage.getItem('blooddungeon_save');

    const btnNewGame = this.add.text(W/2, 360, '▶  NEW GAME', {
      fontSize: '26px', fontFamily: 'monospace', fontStyle: 'bold',
      backgroundColor: '#3a0010',
      padding: { x: 36, y: 14 },
      color: '#ff6688',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(6).setAlpha(0).setInteractive({ useHandCursor: true });

    btnNewGame.on('pointerover', () => btnNewGame.setStyle({ backgroundColor: '#660022', color: '#ffaacc' }));
    btnNewGame.on('pointerout',  () => btnNewGame.setStyle({ backgroundColor: '#3a0010', color: '#ff6688' }));
    btnNewGame.on('pointerdown', () => this._startNewGame());

    let btnContinue = null;
    if (hasSave) {
      btnContinue = this.add.text(W/2, 430, '↩  CONTINUE', {
        fontSize: '22px', fontFamily: 'monospace', fontStyle: 'bold',
        backgroundColor: '#001a30',
        padding: { x: 30, y: 12 },
        color: '#55aaff',
        stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(6).setAlpha(0).setInteractive({ useHandCursor: true });

      btnContinue.on('pointerover', () => btnContinue.setStyle({ backgroundColor: '#003366', color: '#99ccff' }));
      btnContinue.on('pointerout',  () => btnContinue.setStyle({ backgroundColor: '#001a30', color: '#55aaff' }));
      btnContinue.on('pointerdown', () => this._continueGame());
    }

    // Lore teaser
    const loreText = this.add.text(W/2, hasSave ? 486 : 432, '"Twenty years ago, Roger hid the most powerful card ever made.\nThe one who finds it becomes Card King — and something more."', {
      fontSize: '10px', fontFamily: 'monospace',
      color: '#331122', align: 'center', fontStyle: 'italic',
    }).setOrigin(0.5).setDepth(6).setAlpha(0);

    // Controls hint
    const hintText = this.add.text(W/2, hasSave ? 520 : 467, 'WASD/Arrows: Move  ·  F: Interact  ·  Space: Jump  ·  M/ESC: Menu', {
      fontSize: '11px', fontFamily: 'monospace',
      color: '#443355',
    }).setOrigin(0.5).setDepth(6).setAlpha(0);

    // Version tag
    this.add.text(W - 10, H - 10, 'v1.0 — Devil Summoner', {
      fontSize: '9px', fontFamily: 'monospace', color: '#331122'
    }).setOrigin(1, 1).setDepth(6);

    // ── Fade-in sequence ─────────────────────────────────────────────────
    this.tweens.add({
      targets: [titleShadow, titleText],
      alpha: { from: 0, to: 1 },
      duration: 1200,
      ease: 'Power2',
      delay: 400,
    });
    this.tweens.add({
      targets: [subText, runeText],
      alpha: { from: 0, to: 1 },
      duration: 900,
      ease: 'Power2',
      delay: 900,
    });

    const btnObjs = [btnNewGame, loreText, hintText, ...(btnContinue ? [btnContinue] : [])].filter(Boolean);
    this.tweens.add({
      targets: btnObjs,
      alpha: { from: 0, to: 1 },
      duration: 700,
      ease: 'Power2',
      delay: 1500,
    });

    // Title pulse tween
    this.time.delayedCall(1600, () => {
      this.tweens.add({
        targets: titleText,
        alpha: { from: 1, to: 0.75 },
        duration: 1800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });

    // ── Animated stars update ─────────────────────────────────────────────
    this._stars = stars;
    this._starGfx = starGfx;
    this._time = 0;
  }

  update(time, delta) {
    this._time += delta * 0.001;
    const gfx = this._starGfx;
    gfx.clear();
    gfx.fillStyle(0x050508);
    gfx.fillRect(0, 0, 960, 640);
    this._stars.forEach(s => {
      const a = s.alpha * (0.5 + 0.5 * Math.sin(this._time * s.speed * 60 + s.twinkleOffset));
      gfx.fillStyle(0xffffff, a);
      gfx.fillCircle(s.x, s.y, s.r);
    });
  }

  _startNewGame() {
    localStorage.removeItem('blooddungeon_save');
    window.resetGameState();
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.time.delayedCall(620, () => {
      this.scene.start('PreloadScene');
    });
  }

  _continueGame() {
    const ok = window.loadGame();
    if (!ok) { this._startNewGame(); return; }
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.time.delayedCall(620, () => {
      this.scene.start('PreloadScene');
    });
  }
}
