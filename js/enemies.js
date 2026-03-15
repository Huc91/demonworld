// Devil Summoner — Enemy Definitions
// difficulty: 'weak' (green) | 'normal' (blue) | 'hard' (red) | 'boss' (black glow)
window.ENEMIES = [

  // ══════════════════════════════════════════════════════
  //  WEAK — cheap decks, cost 1-2 only, life 15
  //  Tint: green — easy to beat with starter deck
  // ══════════════════════════════════════════════════════
  {
    id: 'enemy_w1', name: 'Street Rat', level: 1, sprite: 'enemy_0',
    moveSpeed: 40, life: 15, rewardMoney: [8, 15], rewardCard: null,
    difficulty: 'weak', isBoss: false,
    deckCards: [
      'demon_001','demon_001','demon_001','demon_001','demon_001',
      'demon_003','demon_003','demon_003',
      'demon_004','demon_004','demon_004',
      'demon_018','demon_018',
      'spell_016','spell_016','spell_016',
      'spell_004','spell_004',
      'spell_013','spell_013',
      'spell_009','spell_009',
      'demon_001','demon_003','demon_004',
      'spell_016','spell_004','spell_013','spell_009','demon_018',
    ],
  },
  {
    id: 'enemy_w2', name: 'Alley Witch', level: 1, sprite: 'enemy_1',
    moveSpeed: 50, life: 15, rewardMoney: [10, 18], rewardCard: 'demon_004',
    difficulty: 'weak', isBoss: false,
    deckCards: [
      'demon_001','demon_001','demon_001','demon_003','demon_003',
      'demon_003','demon_008','demon_008','demon_008',
      'demon_004','demon_004','demon_018','demon_018',
      'spell_016','spell_016','spell_016',
      'spell_004','spell_004',
      'spell_013','spell_013',
      'spell_009',
      'demon_001','demon_008','demon_004',
      'spell_016','spell_013','spell_004','spell_009','demon_003',
    ],
  },
  {
    id: 'enemy_w3', name: 'Cursed Farmer', level: 1, sprite: 'enemy_5',
    moveSpeed: 35, life: 15, rewardMoney: [12, 20], rewardCard: 'demon_018',
    difficulty: 'weak', isBoss: false,
    deckCards: [
      'demon_001','demon_001','demon_001','demon_001',
      'demon_003','demon_003','demon_003',
      'demon_008','demon_008','demon_008',
      'demon_004','demon_004','demon_018',
      'spell_016','spell_016','spell_016',
      'spell_004','spell_004','spell_004',
      'spell_013','spell_013',
      'spell_009','spell_009',
      'demon_001','demon_003','demon_008',
      'spell_016','spell_004','spell_013','demon_018',
    ],
  },

  // ══════════════════════════════════════════════════════
  //  NORMAL — cost 1-3 cards, some abilities, life 20
  //  Tint: blue — requires strategy
  // ══════════════════════════════════════════════════════
  {
    id: 'enemy_n1', name: 'Card Shark', level: 3, sprite: 'enemy_2',
    moveSpeed: 45, life: 20, rewardMoney: [25, 40], rewardCard: 'demon_006',
    difficulty: 'normal', isBoss: false,
    deckCards: [
      'demon_001','demon_001','demon_003','demon_003','demon_008',
      'demon_008','demon_002','demon_002','demon_006','demon_006',
      'demon_014','demon_014','demon_005','demon_005','demon_018',
      'spell_016','spell_016','spell_004','spell_004',
      'spell_013','spell_013','spell_001','spell_009',
      'spell_002','spell_007',
      'demon_002','demon_006','spell_001','spell_013','spell_004',
    ],
  },
  {
    id: 'enemy_n2', name: 'Gang Leader', level: 3, sprite: 'enemy_3',
    moveSpeed: 55, life: 20, rewardMoney: [30, 50], rewardCard: 'demon_002',
    difficulty: 'normal', isBoss: false,
    deckCards: [
      'demon_001','demon_001','demon_002','demon_002','demon_002',
      'demon_003','demon_003','demon_008','demon_008','demon_014',
      'demon_014','demon_006','demon_006','demon_015','demon_007',
      'spell_016','spell_016','spell_004','spell_004',
      'spell_013','spell_013','spell_001','spell_001',
      'spell_009','spell_002',
      'demon_002','demon_014','spell_001','spell_013','spell_004',
    ],
  },
  {
    id: 'enemy_n3', name: 'Dark Priest', level: 4, sprite: 'enemy_4',
    moveSpeed: 40, life: 20, rewardMoney: [35, 55], rewardCard: 'demon_015',
    difficulty: 'normal', isBoss: false,
    deckCards: [
      'demon_001','demon_003','demon_008','demon_008','demon_006',
      'demon_006','demon_007','demon_007','demon_005','demon_005',
      'demon_013','demon_013','demon_015','demon_015','demon_014',
      'spell_016','spell_016','spell_004','spell_004',
      'spell_013','spell_013','spell_001','spell_001',
      'spell_007','spell_002',
      'demon_013','demon_015','spell_001','spell_007','spell_004',
    ],
  },

  // ══════════════════════════════════════════════════════
  //  HARD — full 1-4 cost pool, strong abilities, life 20
  //  Tint: red — tough fights
  // ══════════════════════════════════════════════════════
  {
    id: 'enemy_h1', name: 'Bone Collector', level: 6, sprite: 'enemy_5',
    moveSpeed: 35, life: 20, rewardMoney: [60, 90], rewardCard: 'demon_010',
    difficulty: 'hard', isBoss: false,
    deckCards: [
      'demon_001','demon_003','demon_008','demon_006','demon_006',
      'demon_009','demon_009','demon_011','demon_011','demon_012',
      'demon_012','demon_010','demon_010','demon_019','demon_005',
      'spell_001','spell_001','spell_003','spell_003','spell_013',
      'spell_013','spell_004','spell_004','spell_007','spell_007',
      'demon_009','demon_012','spell_001','spell_003','spell_004',
    ],
  },
  {
    id: 'enemy_h2', name: 'Blood Mage', level: 7, sprite: 'enemy_6',
    moveSpeed: 60, life: 20, rewardMoney: [75, 110], rewardCard: 'demon_016',
    difficulty: 'hard', isBoss: false,
    deckCards: [
      'demon_008','demon_006','demon_006','demon_009','demon_009',
      'demon_012','demon_012','demon_016','demon_016','demon_017',
      'demon_017','demon_019','demon_019','demon_020','demon_020',
      'spell_001','spell_001','spell_010','spell_010','spell_005',
      'spell_005','spell_003','spell_003','spell_013','spell_014',
      'demon_016','demon_017','spell_010','spell_005','spell_003',
    ],
  },
  {
    id: 'enemy_h3', name: 'Dread Warlock', level: 7, sprite: 'enemy_4',
    moveSpeed: 40, life: 20, rewardMoney: [80, 120], rewardCard: 'demon_019',
    difficulty: 'hard', isBoss: false,
    deckCards: [
      'demon_003','demon_006','demon_006','demon_011','demon_011',
      'demon_010','demon_010','demon_020','demon_020','demon_019',
      'demon_019','demon_016','demon_012','demon_012','demon_005',
      'spell_003','spell_003','spell_001','spell_001','spell_013',
      'spell_013','spell_005','spell_015','spell_007','spell_004',
      'demon_010','demon_020','spell_003','spell_005','spell_001',
    ],
  },

  // ══════════════════════════════════════════════════════
  //  BOSS — meta optimized decks, life 30-40, black glow
  //  Ultra hard — legendary cards included
  // ══════════════════════════════════════════════════════
  {
    id: 'enemy_b1', name: 'Shadow Lord', level: 9, sprite: 'enemy_7',
    moveSpeed: 30, life: 30, rewardMoney: [150, 200], rewardCard: 'demon_021',
    difficulty: 'boss', isBoss: true,
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
    id: 'enemy_b2', name: 'Arena Champ', level: 9, sprite: 'enemy_8',
    moveSpeed: 35, life: 35, rewardMoney: [200, 280], rewardCard: 'demon_022',
    difficulty: 'boss', isBoss: true,
    deckCards: [
      'demon_001','demon_003','demon_010','demon_010','demon_012',
      'demon_012','demon_015','demon_015','demon_017','demon_017',
      'demon_019','demon_019','demon_022','demon_022','demon_021',
      'spell_001','spell_001','spell_005','spell_005','spell_010',
      'spell_010','spell_014','spell_014','spell_003','spell_003',
      'demon_010','demon_022','spell_005','spell_010','spell_014',
    ],
  },
  {
    id: 'enemy_b3', name: 'Devil King', level: 10, sprite: 'enemy_9',
    moveSpeed: 20, life: 40, rewardMoney: [500, 500], rewardCard: 'demon_023',
    difficulty: 'boss', isBoss: true,
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
