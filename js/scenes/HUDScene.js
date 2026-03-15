class HUDScene extends Phaser.Scene {
  constructor() { super({ key: 'HUDScene' }); }

  create() {
    // Semi-transparent top bar
    const bar = this.add.graphics();
    bar.fillStyle(0x000000, 0.5);
    bar.fillRect(0, 0, 960, 36);

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

    this.add.text(680, 8, 'WASD: Move  |  M: Menu/Deck/Shop  |  World: 160×100', {
      fontSize: '12px', fontFamily: 'monospace',
      color: '#888888', stroke: '#000', strokeThickness: 2
    });

    this.updateHUD();

    // Listen for reward notifications
    this.rewardText = null;
  }

  updateHUD() {
    this.moneyText.setText('G: ' + window.GameState.playerMoney);
    this.deckText.setText('Deck: ' + window.GameState.playerDeck.length + ' cards');
    this.collectionText.setText('Collection: ' + window.GameState.playerCollection.length);
  }

  showReward(money, card) {
    if (this.rewardText) this.rewardText.destroy();

    let msg = '+' + money + 'G';
    if (card) msg += '  +' + window.CARD_MAP[card].name + '!';

    this.rewardText = this.add.text(480, 320, msg, {
      fontSize: '28px', fontFamily: 'monospace', fontStyle: 'bold',
      color: '#ffd700', stroke: '#000', strokeThickness: 5,
      backgroundColor: '#00000088', padding: { x: 16, y: 8 }
    }).setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: this.rewardText,
      y: 200, alpha: 0,
      duration: 2500, ease: 'Power2',
      onComplete: () => { if (this.rewardText) { this.rewardText.destroy(); this.rewardText = null; } }
    });
  }
}
