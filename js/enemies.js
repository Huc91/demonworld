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
    moveSpeed: 35, life: 20, rewardMoney: [60, 90], rewardCard: 'spell_063',
    difficulty: 'hard', isBoss: false,
    deckCards: [
      'demon_001','demon_003','demon_008','demon_006','demon_006',
      'demon_009','demon_009','demon_011','demon_011','demon_012',
      'demon_012','demon_010','demon_010','demon_019','demon_005',
      'spell_001','spell_001','spell_003','spell_003','spell_063',
      'spell_063','spell_004','spell_004','spell_007','spell_007',
      'demon_009','demon_012','spell_001','spell_063','spell_004',
    ],
  },
  {
    id: 'enemy_h2', name: 'Blood Mage', level: 7, sprite: 'enemy_6',
    moveSpeed: 60, life: 20, rewardMoney: [75, 110], rewardCard: 'spell_062',
    difficulty: 'hard', isBoss: false,
    deckCards: [
      'demon_008','demon_006','demon_006','demon_009','demon_009',
      'demon_012','demon_012','demon_016','demon_016','demon_017',
      'demon_017','demon_019','demon_019','demon_020','demon_020',
      'spell_001','spell_001','spell_062','spell_062','spell_005',
      'spell_005','spell_003','spell_003','spell_063','spell_065',
      'demon_016','demon_017','spell_062','spell_005','spell_003',
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
      'spell_003','spell_003','spell_062','spell_001','spell_063',
      'spell_063','spell_005','spell_065','spell_007','spell_004',
      'demon_010','demon_020','spell_003','spell_062','spell_065',
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

  // ══════════════════════════════════════════════════════
  //  INFERNO ISLAND — fire-type enemies
  // ══════════════════════════════════════════════════════
  {
    id: 'enemy_inf1', name: 'Ash Crawler', level: 2, sprite: 'enemy_0',
    moveSpeed: 45, life: 15, rewardMoney: [12, 22], rewardCard: 'demon_106',
    difficulty: 'weak', isBoss: false,
    deckCards: [
      'demon_106','demon_106','demon_106','demon_001','demon_001',
      'demon_002','demon_002','demon_107','spell_016','spell_016',
      'spell_016','spell_013','spell_013','spell_004','spell_004',
      'spell_009','demon_106','demon_001','demon_002','spell_016',
      'spell_013','spell_004','spell_009','demon_107','spell_001',
      'demon_106','demon_001','spell_016','spell_013','spell_004',
    ],
  },
  {
    id: 'enemy_inf2', name: 'Lava Witch', level: 2, sprite: 'enemy_1',
    moveSpeed: 50, life: 15, rewardMoney: [15, 25], rewardCard: 'demon_107',
    difficulty: 'weak', isBoss: false,
    deckCards: [
      'demon_106','demon_106','demon_107','demon_107','demon_107',
      'demon_001','demon_001','demon_008','spell_016','spell_016',
      'spell_013','spell_013','spell_004','spell_004','spell_009',
      'spell_009','demon_106','demon_107','demon_001','spell_016',
      'spell_013','spell_004','spell_009','demon_008','spell_001',
      'demon_106','demon_107','spell_016','spell_013','spell_009',
    ],
  },
  {
    id: 'enemy_inf3', name: 'Magma Knight', level: 4, sprite: 'enemy_2',
    moveSpeed: 40, life: 20, rewardMoney: [40, 60], rewardCard: 'demon_108',
    difficulty: 'normal', isBoss: false,
    deckCards: [
      'demon_106','demon_106','demon_107','demon_107','demon_108',
      'demon_108','demon_109','demon_001','demon_002','demon_006',
      'spell_016','spell_016','spell_013','spell_013','spell_004',
      'spell_001','spell_001','spell_007','spell_009','demon_106',
      'demon_107','demon_108','spell_016','spell_013','spell_004',
      'spell_001','spell_009','demon_109','spell_007','demon_002',
    ],
  },
  {
    id: 'enemy_inf4', name: 'Cinder Shade', level: 5, sprite: 'enemy_4',
    moveSpeed: 55, life: 20, rewardMoney: [50, 70], rewardCard: 'demon_109',
    difficulty: 'normal', isBoss: false,
    deckCards: [
      'demon_106','demon_107','demon_107','demon_109','demon_109',
      'demon_108','demon_008','demon_008','demon_016','demon_016',
      'spell_016','spell_016','spell_013','spell_001','spell_001',
      'spell_007','spell_004','spell_059','spell_059','spell_009',
      'demon_107','demon_109','spell_059','spell_001','spell_013',
      'spell_004','demon_016','spell_007','spell_009','demon_108',
    ],
  },
  {
    id: 'enemy_inf5', name: 'Flame Colossus', level: 7, sprite: 'enemy_6',
    moveSpeed: 30, life: 20, rewardMoney: [80, 120], rewardCard: 'demon_110',
    difficulty: 'hard', isBoss: false,
    deckCards: [
      'demon_107','demon_109','demon_109','demon_110','demon_110',
      'demon_111','demon_016','demon_016','demon_019','demon_019',
      'spell_059','spell_059','spell_001','spell_001','spell_005',
      'spell_005','spell_003','spell_010','spell_013','spell_014',
      'demon_109','demon_110','spell_059','spell_005','spell_010',
      'spell_003','demon_019','spell_001','spell_013','demon_016',
    ],
  },
  {
    id: 'enemy_inf6', name: 'Inferno Wraith', level: 8, sprite: 'enemy_7',
    moveSpeed: 55, life: 20, rewardMoney: [90, 130], rewardCard: 'demon_111',
    difficulty: 'hard', isBoss: false,
    deckCards: [
      'demon_106','demon_107','demon_109','demon_109','demon_110',
      'demon_110','demon_111','demon_111','demon_016','demon_019',
      'spell_059','spell_059','spell_010','spell_010','spell_005',
      'spell_005','spell_003','spell_001','spell_014','spell_013',
      'demon_109','demon_111','spell_059','spell_010','spell_005',
      'spell_003','demon_019','spell_001','spell_014','demon_110',
    ],
  },
  {
    id: 'enemy_inf7', name: 'Magma King', level: 10, sprite: 'enemy_8',
    moveSpeed: 20, life: 35, rewardMoney: [800, 800], rewardCard: 'demon_111',
    difficulty: 'boss', isBoss: true,
    deckCards: [
      'demon_107','demon_109','demon_109','demon_110','demon_110',
      'demon_111','demon_111','demon_019','demon_019','demon_016',
      'demon_016','spell_059','spell_059','spell_010','spell_010',
      'spell_005','spell_005','spell_003','spell_003','spell_014',
      'spell_014','spell_001','spell_001','demon_111','demon_109',
      'spell_059','spell_010','spell_005','spell_003','spell_014',
    ],
  },

  // ══════════════════════════════════════════════════════
  //  FROST WASTES — ice/beast enemies
  // ══════════════════════════════════════════════════════
  {
    id: 'enemy_fr1', name: 'Ice Gnome', level: 2, sprite: 'enemy_5',
    moveSpeed: 40, life: 15, rewardMoney: [12, 22], rewardCard: 'demon_112',
    difficulty: 'weak', isBoss: false,
    deckCards: [
      'demon_112','demon_112','demon_112','demon_113','demon_113',
      'demon_001','demon_003','demon_004','spell_016','spell_016',
      'spell_016','spell_013','spell_013','spell_004','spell_004',
      'spell_009','demon_112','demon_113','demon_001','spell_016',
      'spell_013','spell_004','spell_009','demon_003','spell_001',
      'demon_112','demon_113','spell_016','spell_013','spell_009',
    ],
  },
  {
    id: 'enemy_fr2', name: 'Frost Sprite', level: 2, sprite: 'enemy_1',
    moveSpeed: 60, life: 15, rewardMoney: [15, 25], rewardCard: 'demon_113',
    difficulty: 'weak', isBoss: false,
    deckCards: [
      'demon_112','demon_112','demon_113','demon_113','demon_113',
      'demon_001','demon_006','demon_008','spell_016','spell_016',
      'spell_013','spell_013','spell_004','spell_004','spell_009',
      'spell_009','demon_112','demon_113','demon_001','spell_016',
      'spell_013','spell_004','spell_009','demon_006','spell_001',
      'demon_112','spell_016','spell_013','spell_004','spell_009',
    ],
  },
  {
    id: 'enemy_fr3', name: 'Blizzard Warrior', level: 4, sprite: 'enemy_3',
    moveSpeed: 45, life: 20, rewardMoney: [40, 60], rewardCard: 'demon_114',
    difficulty: 'normal', isBoss: false,
    deckCards: [
      'demon_112','demon_112','demon_113','demon_114','demon_114',
      'demon_115','demon_001','demon_009','demon_009','demon_003',
      'spell_016','spell_016','spell_013','spell_013','spell_004',
      'spell_001','spell_007','spell_009','spell_012','demon_114',
      'demon_112','spell_016','spell_013','spell_004','spell_001',
      'spell_009','demon_115','spell_007','spell_012','demon_003',
    ],
  },
  {
    id: 'enemy_fr4', name: 'Snow Witch', level: 5, sprite: 'enemy_4',
    moveSpeed: 40, life: 20, rewardMoney: [50, 70], rewardCard: 'demon_115',
    difficulty: 'normal', isBoss: false,
    deckCards: [
      'demon_112','demon_113','demon_114','demon_114','demon_115',
      'demon_115','demon_011','demon_011','demon_009','demon_007',
      'spell_016','spell_016','spell_004','spell_004','spell_001',
      'spell_001','spell_007','spell_008','spell_012','spell_009',
      'demon_114','demon_115','spell_001','spell_007','spell_008',
      'spell_004','demon_007','spell_012','spell_009','demon_011',
    ],
  },
  {
    id: 'enemy_fr5', name: 'Glacier Titan', level: 7, sprite: 'enemy_6',
    moveSpeed: 25, life: 20, rewardMoney: [80, 120], rewardCard: 'demon_116',
    difficulty: 'hard', isBoss: false,
    deckCards: [
      'demon_114','demon_114','demon_115','demon_115','demon_116',
      'demon_116','demon_117','demon_009','demon_009','demon_012',
      'spell_060','spell_060','spell_001','spell_001','spell_003',
      'spell_007','spell_005','spell_005','spell_013','spell_015',
      'demon_116','demon_117','spell_060','spell_005','spell_003',
      'spell_007','demon_009','spell_001','spell_013','demon_012',
    ],
  },
  {
    id: 'enemy_fr6', name: 'Frost Wraith', level: 8, sprite: 'enemy_7',
    moveSpeed: 50, life: 20, rewardMoney: [90, 130], rewardCard: 'demon_117',
    difficulty: 'hard', isBoss: false,
    deckCards: [
      'demon_112','demon_114','demon_115','demon_115','demon_116',
      'demon_116','demon_117','demon_117','demon_019','demon_020',
      'spell_060','spell_060','spell_003','spell_003','spell_005',
      'spell_005','spell_001','spell_014','spell_007','spell_013',
      'demon_117','demon_115','spell_060','spell_003','spell_005',
      'spell_007','demon_019','spell_001','spell_014','demon_116',
    ],
  },
  {
    id: 'enemy_fr7', name: 'Glacier Sovereign', level: 10, sprite: 'enemy_9',
    moveSpeed: 15, life: 35, rewardMoney: [800, 800], rewardCard: 'demon_117',
    difficulty: 'boss', isBoss: true,
    deckCards: [
      'demon_114','demon_115','demon_115','demon_116','demon_116',
      'demon_117','demon_117','demon_012','demon_012','demon_020',
      'demon_020','spell_060','spell_060','spell_003','spell_003',
      'spell_005','spell_005','spell_015','spell_015','spell_001',
      'spell_001','spell_007','spell_007','demon_117','demon_116',
      'spell_060','spell_003','spell_005','spell_015','spell_007',
    ],
  },

  // ══════════════════════════════════════════════════════
  //  THUNDER PEAK — lightning enemies
  // ══════════════════════════════════════════════════════
  {
    id: 'enemy_th1', name: 'Spark Runner', level: 2, sprite: 'enemy_0',
    moveSpeed: 55, life: 20, rewardMoney: [45, 75], rewardCard: null,
    difficulty: 'normal', isBoss: false,
    deckCards: [
      'demon_118','demon_118','demon_118','demon_118','demon_119',
      'demon_119','demon_119','demon_001','demon_001','demon_002',
      'demon_002','demon_006','demon_006','spell_001','spell_001',
      'spell_013','spell_013','spell_066','spell_066','spell_004',
      'spell_004','demon_005','demon_005','demon_003','demon_003',
      'spell_009','spell_009','demon_118','demon_119','spell_066',
    ],
  },
  {
    id: 'enemy_th2', name: 'Cloud Witch', level: 3, sprite: 'enemy_1',
    moveSpeed: 45, life: 22, rewardMoney: [50, 80], rewardCard: 'demon_118',
    difficulty: 'normal', isBoss: false,
    deckCards: [
      'demon_118','demon_118','demon_119','demon_119','demon_119',
      'demon_120','demon_120','demon_001','demon_001','demon_006',
      'demon_006','spell_066','spell_066','spell_013','spell_013',
      'spell_001','spell_001','spell_004','spell_004','spell_067',
      'demon_005','demon_005','demon_011','demon_011','demon_003',
      'spell_009','demon_118','demon_119','spell_066','spell_067',
    ],
  },
  {
    id: 'enemy_th3', name: 'Storm Warrior', level: 5, sprite: 'enemy_2',
    moveSpeed: 40, life: 25, rewardMoney: [70, 100], rewardCard: 'demon_119',
    difficulty: 'normal', isBoss: false,
    deckCards: [
      'demon_118','demon_118','demon_119','demon_119','demon_119',
      'demon_120','demon_120','demon_121','demon_121','demon_006',
      'demon_006','spell_066','spell_066','spell_067','spell_067',
      'spell_013','spell_013','spell_001','spell_001','spell_004',
      'spell_004','demon_005','demon_012','demon_012','demon_011',
      'spell_009','demon_119','demon_121','spell_066','spell_067',
    ],
  },
  {
    id: 'enemy_th4', name: 'Thunderclap Mage', level: 6, sprite: 'enemy_4',
    moveSpeed: 38, life: 28, rewardMoney: [80, 120], rewardCard: 'demon_120',
    difficulty: 'hard', isBoss: false,
    deckCards: [
      'demon_118','demon_119','demon_119','demon_120','demon_120',
      'demon_121','demon_121','demon_122','demon_001','demon_006',
      'demon_012','spell_066','spell_066','spell_066','spell_067',
      'spell_067','spell_013','spell_001','spell_003','spell_004',
      'spell_004','demon_005','demon_011','demon_015','demon_019',
      'spell_009','demon_120','demon_121','spell_066','spell_067',
    ],
  },
  {
    id: 'enemy_th5', name: 'Sky Colossus', level: 8, sprite: 'enemy_6',
    moveSpeed: 25, life: 32, rewardMoney: [120, 160], rewardCard: 'demon_121',
    difficulty: 'hard', isBoss: false,
    deckCards: [
      'demon_119','demon_120','demon_120','demon_121','demon_121',
      'demon_122','demon_122','demon_012','demon_012','demon_019',
      'demon_019','spell_066','spell_066','spell_067','spell_067',
      'spell_003','spell_003','spell_001','spell_001','spell_015',
      'spell_015','demon_021','demon_021','demon_022','demon_020',
      'spell_009','demon_121','demon_122','spell_066','spell_067',
    ],
  },
  {
    id: 'enemy_th6', name: 'Thunder Wraith', level: 9, sprite: 'enemy_7',
    moveSpeed: 20, life: 33, rewardMoney: [150, 200], rewardCard: 'demon_122',
    difficulty: 'hard', isBoss: false,
    deckCards: [
      'demon_120','demon_121','demon_121','demon_122','demon_122',
      'demon_123','demon_012','demon_012','demon_019','demon_020',
      'demon_020','spell_066','spell_066','spell_067','spell_067',
      'spell_003','spell_003','spell_015','spell_015','spell_001',
      'spell_001','demon_021','demon_021','demon_022','spell_009',
      'spell_009','demon_122','demon_121','spell_066','spell_067',
    ],
  },
  {
    id: 'enemy_th7', name: 'Thunder Sovereign', level: 10, sprite: 'enemy_9',
    moveSpeed: 12, life: 38, rewardMoney: [900, 900], rewardCard: 'demon_123',
    difficulty: 'boss', isBoss: true,
    deckCards: [
      'demon_121','demon_122','demon_122','demon_123','demon_123',
      'demon_120','demon_120','demon_019','demon_020','demon_020',
      'demon_021','spell_066','spell_066','spell_066','spell_067',
      'spell_067','spell_003','spell_003','spell_015','spell_015',
      'spell_001','spell_001','demon_022','demon_022','demon_023',
      'spell_009','demon_123','demon_122','spell_066','spell_067',
    ],
  },
];
