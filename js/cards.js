// Devil Summoner Card Game — Card Definitions
// Balance rule: every card pitches for exactly 1 mana. Max cost = 4.
// Ability balance: stronger abilities = lower stats vs vanilla (vanilla per cost ≈ N+1/N+2).
// Vanilla reference: cost 1 → 2/2, cost 2 → 3/3, cost 3 → 4/4, cost 4 → 5/5

window.CARDS = [

  // ═══════════════════════════════════════════════════════════
  // DEMONS — each has a unique ability
  // ═══════════════════════════════════════════════════════════

  // ── COST 1 ──────────────────────────────────────────────────
  // Haste: can attack the turn it's played. Strong keyword → very low stats.
  {
    id: 'demon_001', name: 'Imp', type: 'demon',
    cost: 1, manaValue: 1, atk: 1, hp: 1, rarity: 'common',
    ability: 'haste',
    abilityDesc: 'Haste — can attack immediately.',
    desc: 'A weak little demon. Darts in fast.',
  },
  // Poisonous: kills any demon it damages, regardless of HP. Very strong → almost no stats.
  {
    id: 'demon_003', name: 'Plague Rat', type: 'demon',
    cost: 1, manaValue: 1, atk: 1, hp: 1, rarity: 'common',
    ability: 'poisonous',
    abilityDesc: 'Poisonous — kills any demon it damages.',
    desc: 'One scratch is enough.',
  },
  // Battlecry (draw): enters and immediately draws a card. Low aggression.
  {
    id: 'demon_018', name: 'Dusk Faerie', type: 'demon',
    cost: 1, manaValue: 1, atk: 1, hp: 3, rarity: 'rare',
    ability: 'battlecry_draw_1',
    abilityDesc: 'Battlecry: Draw 1 card.',
    desc: 'Worth playing for the card it brings.',
  },

  // ── COST 2 ──────────────────────────────────────────────────
  // Haste on a cost-2 body: reduced HP compared to vanilla 3/3.
  {
    id: 'demon_002', name: 'Hellhound', type: 'demon',
    cost: 2, manaValue: 1, atk: 3, hp: 2, rarity: 'common',
    ability: 'haste',
    abilityDesc: 'Haste — can attack immediately.',
    desc: 'Bites hard and fast.',
  },
  // Lifesteal: restores life equal to damage dealt. Reduced stats vs vanilla 3/3.
  {
    id: 'demon_004', name: 'Shadow Hound', type: 'demon',
    cost: 2, manaValue: 1, atk: 2, hp: 2, rarity: 'common',
    ability: 'lifesteal',
    abilityDesc: 'Lifesteal — heals you for damage it deals.',
    desc: 'Feeds as it fights.',
  },
  // Unblockable: can attack enemy player directly even if they have demons. Very strong → terrible body.
  {
    id: 'demon_006', name: 'Specter', type: 'demon',
    cost: 2, manaValue: 1, atk: 2, hp: 1, rarity: 'uncommon',
    ability: 'unblockable',
    abilityDesc: 'Unblockable — can always attack the enemy directly.',
    desc: 'Slips past any defence.',
  },
  // Battlecry (draw 2): extreme card advantage, almost no body.
  {
    id: 'demon_007', name: 'Succubus', type: 'demon',
    cost: 2, manaValue: 1, atk: 1, hp: 3, rarity: 'uncommon',
    ability: 'battlecry_draw_2',
    abilityDesc: 'Battlecry: Draw 2 cards.',
    desc: 'Beautiful and deadly — mostly beautiful.',
  },
  // Lifesteal on a slightly sturdier body.
  {
    id: 'demon_008', name: 'Blood Bat', type: 'demon',
    cost: 2, manaValue: 1, atk: 2, hp: 3, rarity: 'common',
    ability: 'lifesteal',
    abilityDesc: 'Lifesteal — heals you for damage it deals.',
    desc: 'Feeds on life force.',
  },

  // ── COST 3 ──────────────────────────────────────────────────
  // Deathrattle (damage): good body + punishes removal. Slightly below vanilla 4/4.
  {
    id: 'demon_005', name: 'Bone Knight', type: 'demon',
    cost: 3, manaValue: 1, atk: 3, hp: 4, rarity: 'common',
    ability: 'deathrattle_damage_2',
    abilityDesc: 'Deathrattle: Deal 2 damage to the enemy when destroyed.',
    desc: 'Even in death it strikes.',
  },
  // Taunt: must be attacked. Giant wall, tiny threat.
  {
    id: 'demon_011', name: 'Wraith', type: 'demon',
    cost: 3, manaValue: 1, atk: 1, hp: 7, rarity: 'uncommon',
    ability: 'taunt',
    abilityDesc: 'Taunt — enemies must attack this first.',
    desc: 'Impossible to ignore.',
  },
  // Battlecry (AOE 1): enters and deals 1 to all enemy demons. Stats hit for it.
  {
    id: 'demon_013', name: 'Ember Drake', type: 'demon',
    cost: 3, manaValue: 1, atk: 3, hp: 3, rarity: 'uncommon',
    ability: 'battlecry_aoe_1',
    abilityDesc: 'Battlecry: Deal 1 damage to all enemy demons.',
    desc: 'Clears the path as it lands.',
  },
  // Haste at cost 3: high ATK glass cannon. Below vanilla 4/4 HP.
  {
    id: 'demon_014', name: 'Sand Ghoul', type: 'demon',
    cost: 3, manaValue: 1, atk: 4, hp: 2, rarity: 'common',
    ability: 'haste',
    abilityDesc: 'Haste — can attack immediately.',
    desc: 'Desert ambush specialist.',
  },
  // Unblockable at cost 3: consistent face damage. Average body.
  {
    id: 'demon_015', name: 'Void Crawler', type: 'demon',
    cost: 3, manaValue: 1, atk: 3, hp: 3, rarity: 'uncommon',
    ability: 'unblockable',
    abilityDesc: 'Unblockable — can always attack the enemy directly.',
    desc: 'Slips between dimensions.',
  },

  // ── COST 4 ──────────────────────────────────────────────────
  // Taunt + big HP wall. Very low ATK — threatens nothing, absorbs everything.
  {
    id: 'demon_009', name: 'Golem', type: 'demon',
    cost: 4, manaValue: 1, atk: 2, hp: 7, rarity: 'uncommon',
    ability: 'taunt',
    abilityDesc: 'Taunt — enemies must attack this first.',
    desc: 'Slow but hard to kill.',
  },
  // Haste + Poisonous: kills any demon instantly, then usually dies too. Low HP.
  {
    id: 'demon_010', name: 'Cerberus', type: 'demon',
    cost: 4, manaValue: 1, atk: 4, hp: 2, rarity: 'uncommon',
    ability: 'haste_poisonous',
    abilityDesc: 'Haste. Poisonous — kills any demon it damages.',
    desc: 'Three heads, triple the danger.',
  },
  // Rage: grows stronger each time it survives damage. Average starting stats.
  {
    id: 'demon_012', name: 'Minotaur', type: 'demon',
    cost: 4, manaValue: 1, atk: 3, hp: 6, rarity: 'uncommon',
    ability: 'rage',
    abilityDesc: 'Rage — gains +1 ATK every time it takes damage.',
    desc: 'The more it hurts, the angrier it gets.',
  },
  // Battlecry (face damage 2): enters and hits face for 2. Good body.
  {
    id: 'demon_016', name: 'Nightmare', type: 'demon',
    cost: 4, manaValue: 1, atk: 5, hp: 4, rarity: 'rare',
    ability: 'battlecry_damage_player_2',
    abilityDesc: 'Battlecry: Deal 2 damage to the enemy.',
    desc: 'Its arrival alone causes pain.',
  },
  // Battlecry (buff all +1 ATK): empowers your existing board. Average body.
  {
    id: 'demon_017', name: 'Iron Djinn', type: 'demon',
    cost: 4, manaValue: 1, atk: 4, hp: 4, rarity: 'rare',
    ability: 'battlecry_buff_all_atk',
    abilityDesc: 'Battlecry: All your other demons gain +1 ATK.',
    desc: 'Inspires the horde.',
  },
  // Haste + Lifesteal: attacks immediately and heals. Reduced HP for double keyword.
  {
    id: 'demon_019', name: 'Pit Fiend', type: 'demon',
    cost: 4, manaValue: 1, atk: 4, hp: 3, rarity: 'rare',
    ability: 'haste_lifesteal',
    abilityDesc: 'Haste. Lifesteal — heals you for damage it deals.',
    desc: 'Strikes and devours life.',
  },
  // Battlecry (destroy strongest): enters and kills the biggest threat. Solid body.
  {
    id: 'demon_020', name: 'Medusa', type: 'demon',
    cost: 4, manaValue: 1, atk: 4, hp: 5, rarity: 'rare',
    ability: 'battlecry_destroy_strongest',
    abilityDesc: 'Battlecry: Destroy the highest-ATK enemy demon.',
    desc: 'One look kills.',
  },
  // Deathrattle (summon zombie): replaced by a 2/2 when killed. Great resilience.
  {
    id: 'demon_021', name: 'Lich King', type: 'demon',
    cost: 4, manaValue: 1, atk: 5, hp: 5, rarity: 'legendary',
    ability: 'deathrattle_summon_zombie',
    abilityDesc: 'Deathrattle: Summon a 2/2 Zombie when destroyed.',
    desc: 'Death is just a setback.',
  },
  // Battlecry (summon 2 imps): floods the board. Reduced body stats.
  {
    id: 'demon_022', name: 'Beelzebub', type: 'demon',
    cost: 4, manaValue: 1, atk: 3, hp: 5, rarity: 'legendary',
    ability: 'battlecry_summon_imps',
    abilityDesc: 'Battlecry: Summon 2 Imps (1/1 Haste).',
    desc: 'Lord of Flies — never alone.',
  },
  // Battlecry (destroy all enemy demons): board wipe. Good body but not incredible.
  {
    id: 'demon_023', name: 'Baphomet', type: 'demon',
    cost: 4, manaValue: 1, atk: 5, hp: 5, rarity: 'legendary',
    ability: 'battlecry_destroy_all',
    abilityDesc: 'Battlecry: Destroy all enemy demons.',
    desc: 'Dark god of annihilation.',
  },

  // ═══════════════════════════════════════════════════════════
  // SPELLS — no abilities, just effects
  // ═══════════════════════════════════════════════════════════

  // Cost 0
  { id: 'spell_009', name: 'Mana Surge',      type: 'spell', cost: 0, manaValue: 1, rarity: 'uncommon',  effect: 'mana_boost',    value: 3, desc: 'Gain 3 mana this turn.' },
  // Cost 1
  { id: 'spell_004', name: 'Dark Pact',       type: 'spell', cost: 1, manaValue: 1, rarity: 'common',    effect: 'draw',          value: 2, desc: 'Draw 2 cards.' },
  { id: 'spell_016', name: 'Summon Familiar', type: 'spell', cost: 1, manaValue: 1, rarity: 'common',    effect: 'summon_imp',    value: 0, desc: 'Summon an Imp (1/1 Haste).' },
  // Cost 2
  { id: 'spell_002', name: 'Heal',            type: 'spell', cost: 2, manaValue: 1, rarity: 'common',    effect: 'heal',          value: 2, desc: 'Restore 2 life.' },
  { id: 'spell_006', name: 'Blood Shield',    type: 'spell', cost: 2, manaValue: 1, rarity: 'common',    effect: 'buff_hp',       value: 2, desc: 'Give a friendly demon +2 HP.' },
  { id: 'spell_013', name: 'Arcane Bolt',     type: 'spell', cost: 2, manaValue: 1, rarity: 'common',    effect: 'damage',        value: 2, desc: 'Deal 2 damage to the enemy.' },
  // Cost 3
  { id: 'spell_001', name: 'Fireball',        type: 'spell', cost: 3, manaValue: 1, rarity: 'common',    effect: 'damage',        value: 3, desc: 'Deal 3 damage to the enemy.' },
  { id: 'spell_007', name: 'Hex',             type: 'spell', cost: 3, manaValue: 1, rarity: 'uncommon',  effect: 'debuff_atk',    value: 2, desc: 'Reduce an enemy demon\'s ATK by 2.' },
  { id: 'spell_011', name: 'Chain Lightning', type: 'spell', cost: 3, manaValue: 1, rarity: 'uncommon',  effect: 'aoe_demon_dmg', value: 1, desc: 'Deal 1 damage to all enemy demons.' },
  { id: 'spell_012', name: 'Soul Harvest',    type: 'spell', cost: 3, manaValue: 1, rarity: 'uncommon',  effect: 'life_per_demon',value: 1, desc: 'Gain 1 life per friendly demon.' },
  { id: 'spell_015', name: 'Plague',          type: 'spell', cost: 3, manaValue: 1, rarity: 'uncommon',  effect: 'aoe_all_hp',    value: 1, desc: 'All demons lose 1 HP.' },
  // Cost 4
  { id: 'spell_003', name: 'Soul Drain',      type: 'spell', cost: 4, manaValue: 1, rarity: 'uncommon',  effect: 'destroy',       value: 1, desc: 'Destroy an enemy demon.' },
  { id: 'spell_005', name: 'Inferno',         type: 'spell', cost: 4, manaValue: 1, rarity: 'rare',      effect: 'aoe_enemy',     value: 2, desc: 'Deal 2 damage to all enemy demons.' },
  { id: 'spell_008', name: 'Resurrection',    type: 'spell', cost: 4, manaValue: 1, rarity: 'uncommon',  effect: 'resurrect',     value: 1, desc: 'Return the top card of your discard to hand.' },
  { id: 'spell_010', name: 'Doom',            type: 'spell', cost: 4, manaValue: 1, rarity: 'rare',      effect: 'damage',        value: 4, desc: 'Deal 4 damage to the enemy.' },
  { id: 'spell_014', name: 'Blood Moon',      type: 'spell', cost: 4, manaValue: 1, rarity: 'rare',      effect: 'buff_atk_all',  value: 1, desc: 'All friendly demons gain +1 ATK.' },
  { id: 'spell_017', name: 'Final Hour',      type: 'spell', cost: 4, manaValue: 1, rarity: 'legendary', effect: 'win_condition', value: 3, desc: 'Win instantly if the enemy has 3 or less life.' },
];

window.CARD_MAP = {};
window.CARDS.forEach(c => { window.CARD_MAP[c.id] = c; });

window.STARTER_DECK = [
  // Cheap aggro
  'demon_001','demon_001','demon_001',   // 3x Imp (1/1 Haste)
  'demon_003','demon_003',               // 2x Plague Rat (1/1 Poisonous)
  'demon_018',                           // 1x Dusk Faerie (draw)
  // Mid demons
  'demon_002','demon_002',               // 2x Hellhound (3/2 Haste)
  'demon_004','demon_004',               // 2x Shadow Hound (Lifesteal)
  'demon_008','demon_008',               // 2x Blood Bat (Lifesteal)
  'demon_005','demon_005',               // 2x Bone Knight (Deathrattle)
  'demon_011',                           // 1x Wraith (Taunt)
  // Spells
  'spell_004','spell_004',               // 2x Dark Pact (draw 2)
  'spell_016','spell_016',               // 2x Summon Familiar
  'spell_002','spell_002',               // 2x Heal
  'spell_013','spell_013',               // 2x Arcane Bolt
  'spell_001',                           // 1x Fireball
  'spell_009',                           // 1x Mana Surge
  'spell_007',                           // 1x Hex
];
// 3+2+1+2+2+2+2+1 + 2+2+2+2+1+1+1 = 30 ✓
