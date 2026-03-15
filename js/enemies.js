// Devil Summoner — Enemy Definitions
// Decks are aggressive: cheap demons + draw/cycle spells, scaling with level.
window.ENEMIES = [
  {
    id: 'enemy_001', name: 'Street Punk', level: 1, sprite: 'enemy_0',
    moveSpeed: 40, life: 10, rewardMoney: [10, 20], rewardCard: null, isBoss: false,
    color: 0xff6600,
    // Level 1: flood of 1-cost demons, draw spells to cycle fast
    deckCards: [
      'demon_001','demon_001','demon_001','demon_001','demon_001',
      'demon_003','demon_003','demon_003','demon_003','demon_003',
      'demon_008','demon_008','demon_008','demon_002','demon_002',
      'spell_016','spell_016','spell_016','spell_004','spell_004',
      'spell_013','spell_013','spell_004','spell_016','spell_013',
      'demon_001','demon_003','demon_008','spell_004','spell_016',
    ],
  },
  {
    id: 'enemy_002', name: 'Alley Witch', level: 2, sprite: 'enemy_1',
    moveSpeed: 50, life: 10, rewardMoney: [20, 35], rewardCard: 'demon_006', isBoss: false,
    color: 0xaa44cc,
    // Level 2: 1-2 cost demons + familiar summons, draw cycle
    deckCards: [
      'demon_001','demon_001','demon_001','demon_003','demon_003',
      'demon_004','demon_004','demon_004','demon_008','demon_008',
      'demon_006','demon_006','demon_002','demon_002','demon_002',
      'spell_016','spell_016','spell_016','spell_004','spell_004',
      'spell_013','spell_013','spell_013','spell_004','spell_016',
      'demon_001','demon_004','demon_008','spell_004','spell_013',
    ],
  },
  {
    id: 'enemy_003', name: 'Card Shark', level: 3, sprite: 'enemy_2',
    moveSpeed: 45, life: 10, rewardMoney: [30, 50], rewardCard: null, isBoss: false,
    color: 0x4488ff,
    // Level 3: cheap aggro + mana surge + draw spells to combo
    deckCards: [
      'demon_001','demon_001','demon_003','demon_003','demon_003',
      'demon_004','demon_004','demon_008','demon_008','demon_006',
      'demon_006','demon_002','demon_002','demon_002','demon_001',
      'spell_009','spell_009','spell_009','spell_004','spell_004',
      'spell_016','spell_016','spell_013','spell_013','spell_004',
      'demon_004','demon_006','demon_008','spell_009','spell_016',
    ],
  },
  {
    id: 'enemy_004', name: 'Gang Leader', level: 4, sprite: 'enemy_3',
    moveSpeed: 55, life: 10, rewardMoney: [40, 60], rewardCard: 'demon_010', isBoss: false,
    color: 0xcc3300,
    // Level 4: cheap base + mid-cost threats (cost 3-4) + removal
    deckCards: [
      'demon_001','demon_003','demon_003','demon_008','demon_008',
      'demon_006','demon_006','demon_002','demon_002','demon_004',
      'demon_004','demon_010','demon_010','demon_009','demon_012',
      'demon_005','demon_005','spell_001','spell_001','spell_013',
      'spell_013','spell_004','spell_004','spell_016','spell_016',
      'demon_010','demon_009','spell_001','spell_013','spell_004',
    ],
  },
  {
    id: 'enemy_005', name: 'Dark Priest', level: 5, sprite: 'enemy_4',
    moveSpeed: 40, life: 10, rewardMoney: [50, 80], rewardCard: 'demon_016', isBoss: false,
    color: 0x4400aa,
    // Level 5: cheap base + mid demons + destroy/damage removal
    deckCards: [
      'demon_001','demon_003','demon_008','demon_008','demon_006',
      'demon_006','demon_004','demon_004','demon_009','demon_009',
      'demon_011','demon_011','demon_013','demon_013','demon_005',
      'spell_003','spell_003','spell_001','spell_001','spell_013',
      'spell_013','spell_004','spell_004','spell_016','spell_007',
      'demon_009','demon_011','spell_003','spell_001','spell_004',
    ],
  },
  {
    id: 'enemy_006', name: 'Bone Collector', level: 6, sprite: 'enemy_5',
    moveSpeed: 35, life: 10, rewardMoney: [70, 100], rewardCard: 'demon_019', isBoss: false,
    color: 0xddddaa,
    // Level 6: cheap base + mid-cost + damage and removal spells
    deckCards: [
      'demon_001','demon_003','demon_008','demon_006','demon_006',
      'demon_009','demon_009','demon_011','demon_011','demon_012',
      'demon_012','demon_014','demon_014','demon_015','demon_015',
      'spell_001','spell_001','spell_003','spell_003','spell_013',
      'spell_013','spell_004','spell_004','spell_007','spell_007',
      'demon_009','demon_012','spell_001','spell_003','spell_004',
    ],
  },
  {
    id: 'enemy_007', name: 'Blood Mage', level: 7, sprite: 'enemy_6',
    moveSpeed: 60, life: 10, rewardMoney: [90, 120], rewardCard: 'demon_020', isBoss: false,
    color: 0xcc0044,
    // Level 7: bigger demons (cost 4-6) + heavy damage spells
    deckCards: [
      'demon_008','demon_006','demon_006','demon_009','demon_009',
      'demon_012','demon_012','demon_016','demon_016','demon_017',
      'demon_017','demon_019','demon_019','demon_020','demon_020',
      'spell_001','spell_001','spell_010','spell_010','spell_005',
      'spell_005','spell_003','spell_003','spell_013','spell_014',
      'demon_016','demon_017','spell_010','spell_005','spell_003',
    ],
  },
  // BOSSES
  {
    id: 'enemy_008', name: 'Shadow Boss', level: 8, sprite: 'enemy_7',
    moveSpeed: 30, life: 15, rewardMoney: [150, 200], rewardCard: 'demon_021', isBoss: true,
    color: 0x220066,
    // Boss 1: powerful demons + board-clear spells
    deckCards: [
      'demon_001','demon_008','demon_006','demon_009','demon_009',
      'demon_016','demon_016','demon_017','demon_017','demon_019',
      'demon_019','demon_020','demon_020','demon_021','demon_021',
      'spell_005','spell_005','spell_010','spell_010','spell_003',
      'spell_003','spell_014','spell_014','spell_001','spell_001',
      'demon_016','demon_019','spell_005','spell_010','spell_014',
    ],
  },
  {
    id: 'enemy_009', name: 'Arena Champ', level: 9, sprite: 'enemy_8',
    moveSpeed: 35, life: 15, rewardMoney: [200, 250], rewardCard: 'demon_022', isBoss: true,
    color: 0xff8800,
    // Boss 2: fast aggro into big finishers + board-clears
    deckCards: [
      'demon_001','demon_003','demon_008','demon_010','demon_010',
      'demon_012','demon_012','demon_015','demon_015','demon_017',
      'demon_017','demon_022','demon_022','demon_019','demon_019',
      'spell_001','spell_001','spell_005','spell_005','spell_010',
      'spell_010','spell_014','spell_014','spell_003','spell_003',
      'demon_010','demon_022','spell_005','spell_010','spell_014',
    ],
  },
  {
    id: 'enemy_010', name: 'Devil King', level: 10, sprite: 'enemy_9',
    moveSpeed: 20, life: 20, rewardMoney: [500, 500], rewardCard: 'demon_023', isBoss: true,
    color: 0xff0000,
    // Boss 3: maximum threat — legendary demons + all board-clears + win-con
    deckCards: [
      'demon_008','demon_016','demon_016','demon_019','demon_019',
      'demon_020','demon_020','demon_021','demon_021','demon_022',
      'demon_022','demon_023','demon_023','demon_017','demon_017',
      'spell_005','spell_005','spell_010','spell_010','spell_014',
      'spell_014','spell_003','spell_003','spell_001','spell_001',
      'demon_021','demon_023','spell_005','spell_010','spell_017',
    ],
  },
];
