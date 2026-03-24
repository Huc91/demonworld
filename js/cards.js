// Devil Summoner Card Game — Card Definitions
// Rarities: common < uncommon < rare < mythic < legendary
// Pack pull rates:
//   BASIC:    1 rare/pack, mythic 25%, legendary 3.1%
//   ADVANCED: 1 rare/pack, mythic 50%, legendary 5%
//   LEGEND:   1 rare/pack, mythic 50%, legendary 13%

window.CARDS = [

  // ═══════════════════════════════════════════════════════════
  // DEMONS — each has a unique ability
  // ═══════════════════════════════════════════════════════════

  // ── COST 1 ──────────────────────────────────────────────────
  // Haste: can attack the turn it's played. Strong keyword → very low stats.
  {
    id: 'demon_001', name: 'Imp', subtype: 'dark', type: 'demon',
    cost: 1, manaValue: 1, atk: 1, hp: 1, rarity: 'common',
    ability: 'haste',
    abilityDesc: 'Haste — can attack immediately.',
    desc: 'A weak little demon. Darts in fast.',
  },
  // Poisonous: kills any demon it damages, regardless of HP. Very strong → almost no stats.
  {
    id: 'demon_003', name: 'Plague Rat', subtype: 'beast', type: 'demon',
    cost: 1, manaValue: 1, atk: 1, hp: 1, rarity: 'common',
    ability: 'poisonous',
    abilityDesc: 'Poisonous — kills any demon it damages.',
    desc: 'One scratch is enough.',
  },
  // Battlecry (draw): enters and immediately draws a card. Low aggression.
  {
    id: 'demon_018', name: 'Dusk Faerie', subtype: 'dark', type: 'demon',
    cost: 1, manaValue: 1, atk: 1, hp: 3, rarity: 'uncommon',
    ability: 'battlecry_draw_1',
    abilityDesc: 'Battlecry: Draw 1 card.',
    desc: 'Worth playing for the card it brings.',
  },

  // ── COST 2 ──────────────────────────────────────────────────
  // Haste on a cost-2 body: reduced HP compared to vanilla 3/3.
  {
    id: 'demon_002', name: 'Hellhound', subtype: 'fire', type: 'demon',
    cost: 2, manaValue: 1, atk: 3, hp: 2, rarity: 'common',
    ability: 'haste',
    abilityDesc: 'Haste — can attack immediately.',
    desc: 'Bites hard and fast.',
  },
  // Vanilla 2-drop: solid 3/3 stats, no special ability.
  {
    id: 'demon_004', name: 'Shadow Hound', subtype: 'dark', type: 'demon',
    cost: 2, manaValue: 1, atk: 3, hp: 3, rarity: 'common',
    ability: null, abilityDesc: null,
    desc: 'A reliable fighter with no tricks.',
  },
  // Unblockable: can attack enemy player directly even if they have demons. Very strong → terrible body.
  {
    id: 'demon_006', name: 'Specter', subtype: 'dark', type: 'demon',
    cost: 2, manaValue: 1, atk: 2, hp: 2, rarity: 'uncommon',
    ability: 'unblockable',
    abilityDesc: 'Unblockable — can always attack the enemy directly.',
    desc: 'Slips past any defence.',
  },
  // Battlecry (draw 2): extreme card advantage, almost no body.
  {
    id: 'demon_007', name: 'Succubus', subtype: 'dark', type: 'demon',
    cost: 2, manaValue: 1, atk: 1, hp: 3, rarity: 'rare',
    ability: 'battlecry_draw_2',
    abilityDesc: 'Battlecry: Draw 2 cards.',
    desc: 'Beautiful and deadly — mostly beautiful.',
  },
  // Lifesteal on a slightly sturdier body.
  {
    id: 'demon_008', name: 'Blood Bat', subtype: 'dark', type: 'demon',
    cost: 2, manaValue: 1, atk: 2, hp: 3, rarity: 'common',
    ability: 'lifesteal',
    abilityDesc: 'Lifesteal — heals you for damage it deals.',
    desc: 'Feeds on life force.',
  },

  // ── COST 3 ──────────────────────────────────────────────────
  // Deathrattle (damage): good body + punishes removal. Slightly below vanilla 4/4.
  {
    id: 'demon_005', name: 'Bone Knight', subtype: 'dark', type: 'demon',
    cost: 3, manaValue: 1, atk: 3, hp: 4, rarity: 'common',
    ability: 'deathrattle_damage_2',
    abilityDesc: 'Deathrattle: Deal 2 damage to the enemy when destroyed.',
    desc: 'Even in death it strikes.',
  },
  // Taunt: must be attacked. Giant wall, tiny threat.
  {
    id: 'demon_011', name: 'Wraith', subtype: 'dark', type: 'demon',
    cost: 3, manaValue: 1, atk: 1, hp: 5, rarity: 'uncommon',
    ability: 'taunt',
    abilityDesc: 'Taunt — enemies must attack this first.',
    desc: 'Impossible to ignore.',
  },
  // Battlecry (AOE 1): enters and deals 1 to all enemy demons. Stats hit for it.
  {
    id: 'demon_013', name: 'Ember Drake', subtype: 'fire', type: 'demon',
    cost: 3, manaValue: 1, atk: 3, hp: 3, rarity: 'uncommon',
    ability: 'battlecry_aoe_1',
    abilityDesc: 'Battlecry: Deal 1 damage to all enemy demons.',
    desc: 'Clears the path as it lands.',
  },
  // Vanilla 3-drop: above-curve stats (4/4), no ability.
  {
    id: 'demon_014', name: 'Sand Ghoul', subtype: 'beast', type: 'demon',
    cost: 3, manaValue: 1, atk: 4, hp: 4, rarity: 'common',
    ability: null, abilityDesc: null,
    desc: 'Big and dumb. Also big.',
  },
  // Unblockable at cost 3: consistent face damage. Average body.
  {
    id: 'demon_015', name: 'Void Crawler', subtype: 'dark', type: 'demon',
    cost: 3, manaValue: 1, atk: 3, hp: 3, rarity: 'uncommon',
    ability: 'unblockable',
    abilityDesc: 'Unblockable — can always attack the enemy directly.',
    desc: 'Slips between dimensions.',
  },

  // ── COST 4 ──────────────────────────────────────────────────
  // Taunt + big HP wall. Very low ATK — threatens nothing, absorbs everything.
  {
    id: 'demon_009', name: 'Golem', subtype: 'beast', type: 'demon',
    cost: 4, manaValue: 1, atk: 2, hp: 5, rarity: 'uncommon',
    ability: 'taunt',
    abilityDesc: 'Taunt — enemies must attack this first.',
    desc: 'Slow but hard to kill.',
  },
  // Haste + Poisonous: kills any demon instantly, then usually dies too. Low HP.
  {
    id: 'demon_010', name: 'Cerberus', subtype: 'fire', type: 'demon',
    cost: 4, manaValue: 1, atk: 4, hp: 2, rarity: 'rare',
    ability: 'haste_poisonous',
    abilityDesc: 'Haste. Poisonous — kills any demon it damages.',
    desc: 'Three heads, triple the danger.',
  },
  // Rage: grows stronger each time it survives damage. Average starting stats.
  {
    id: 'demon_012', name: 'Minotaur', subtype: 'beast', type: 'demon',
    cost: 4, manaValue: 1, atk: 3, hp: 6, rarity: 'uncommon',
    ability: 'rage',
    abilityDesc: 'Rage — gains +1 ATK every time it takes damage.',
    desc: 'The more it hurts, the angrier it gets.',
  },
  // Battlecry (face damage 2): enters and hits face for 2. Good body.
  {
    id: 'demon_016', name: 'Nightmare', subtype: 'dark', type: 'demon',
    cost: 4, manaValue: 1, atk: 5, hp: 4, rarity: 'rare',
    ability: 'battlecry_damage_player_2',
    abilityDesc: 'Battlecry: Deal 2 damage to the enemy.',
    desc: 'Its arrival alone causes pain.',
  },
  // Battlecry (buff all +1 ATK): empowers your existing board. Average body.
  {
    id: 'demon_017', name: 'Iron Djinn', subtype: 'light', type: 'demon',
    cost: 4, manaValue: 1, atk: 4, hp: 4, rarity: 'rare',
    ability: 'battlecry_buff_all_atk',
    abilityDesc: 'Battlecry: All your other demons gain +1 ATK.',
    desc: 'Inspires the horde.',
  },
  // Haste + Lifesteal: attacks immediately and heals. Reduced HP for double keyword.
  {
    id: 'demon_019', name: 'Pit Fiend', subtype: 'fire', type: 'demon',
    cost: 4, manaValue: 1, atk: 4, hp: 3, rarity: 'rare',
    ability: 'haste_lifesteal',
    abilityDesc: 'Haste. Lifesteal — heals you for damage it deals.',
    desc: 'Strikes and devours life.',
  },
  // Battlecry (destroy strongest): enters and kills the biggest threat. Solid body.
  {
    id: 'demon_020', name: 'Medusa', subtype: 'beast', type: 'demon',
    cost: 4, manaValue: 1, atk: 4, hp: 5, rarity: 'rare',
    ability: 'battlecry_destroy_strongest',
    abilityDesc: 'Battlecry: Destroy the highest-ATK enemy demon.',
    desc: 'One look kills.',
  },
  // Deathrattle (summon zombie): replaced by a 2/2 when killed. Great resilience.
  {
    id: 'demon_021', name: 'Lich King', subtype: 'dark', type: 'demon',
    cost: 4, manaValue: 1, atk: 5, hp: 5, rarity: 'mythic',
    ability: 'deathrattle_summon_zombie',
    abilityDesc: 'Deathrattle: Summon a 2/2 Zombie when destroyed.',
    desc: 'Death is just a setback.',
  },
  // Battlecry (summon 2 imps): floods the board. Reduced body stats.
  {
    id: 'demon_022', name: 'Beelzebub', subtype: 'dark', type: 'demon',
    cost: 4, manaValue: 1, atk: 3, hp: 5, rarity: 'mythic',
    ability: 'battlecry_summon_imps',
    abilityDesc: 'Battlecry: Summon 2 Imps (1/1 Haste).',
    desc: 'Lord of Flies — never alone.',
  },
  // Battlecry (destroy all enemy demons): board wipe. Good body but not incredible.
  {
    id: 'demon_023', name: 'Baphomet', subtype: 'dark', type: 'demon',
    cost: 4, manaValue: 1, atk: 5, hp: 5, rarity: 'legendary',
    ability: 'battlecry_destroy_all',
    abilityDesc: 'Battlecry: Destroy all enemy demons.',
    desc: 'Dark god of annihilation.',
  },

  // ═══════════════════════════════════════════════════════════
  // SPELLS — no abilities, just effects
  // ═══════════════════════════════════════════════════════════

  // Cost 0
  { id: 'spell_009', name: 'Mana Surge',      type: 'spell', cost: 0, manaValue: 1, rarity: 'uncommon',  effect: 'mana_boost',    value: 2, desc: 'Gain 2 mana this turn.' },
  // Cost 1
  { id: 'spell_004', name: 'Dark Pact',       type: 'spell', cost: 1, manaValue: 1, rarity: 'uncommon',    effect: 'draw',          value: 2, desc: 'Draw 2 cards.' },
  { id: 'spell_016', name: 'Summon Familiar', type: 'spell', cost: 0, manaValue: 1, rarity: 'common',    effect: 'summon_imp',    value: 0, desc: 'Summon an Imp (1/1).' },
  // Cost 2
  { id: 'spell_002', name: 'Heal',            type: 'spell', cost: 1, manaValue: 1, rarity: 'common',    effect: 'heal',          value: 2, desc: 'Restore 2 life.' },
  { id: 'spell_006', name: 'Blood Shield',    type: 'spell', cost: 2, manaValue: 1, rarity: 'common',    effect: 'buff_hp',       value: 2, desc: 'Give a friendly demon +2 HP.' },
  { id: 'spell_013', name: 'Arcane Bolt',     type: 'spell', cost: 1, manaValue: 1, rarity: 'common',    effect: 'damage',        value: 2, desc: 'Deal 2 damage to the enemy.' },
  // Cost 3
  { id: 'spell_001', name: 'Fireball',        type: 'spell', cost: 2, manaValue: 1, rarity: 'common',    effect: 'damage',        value: 3, desc: 'Deal 3 damage to the enemy.' },
  { id: 'spell_007', name: 'Hex',             type: 'spell', cost: 1, manaValue: 1, rarity: 'uncommon',  effect: 'debuff_atk',    value: 2, desc: 'Reduce an enemy demon\'s ATK by 2.' },
  { id: 'spell_011', name: 'Chain Lightning', type: 'spell', cost: 1, manaValue: 1, rarity: 'uncommon',  effect: 'aoe_demon_dmg', value: 1, desc: 'Deal 1 damage to all enemy demons.' },
  { id: 'spell_012', name: 'Soul Harvest',    type: 'spell', cost: 1, manaValue: 1, rarity: 'uncommon',  effect: 'life_per_demon',value: 1, desc: 'Gain 1 life per friendly demon.' },
  { id: 'spell_015', name: 'Plague',          type: 'spell', cost: 4, manaValue: 1, rarity: 'rare',  effect: 'aoe_all_hp',    value: 3, desc: 'All demons lose 3 HP.' },
  // Cost 4
  { id: 'spell_003', name: 'Soul Drain',      type: 'spell', cost: 2, manaValue: 1, rarity: 'rare',  effect: 'destroy',       value: 1, desc: 'Destroy an enemy demon.' },
  { id: 'spell_005', name: 'Inferno',         type: 'spell', cost: 2, manaValue: 1, rarity: 'rare',      effect: 'aoe_enemy',     value: 2, desc: 'Deal 2 damage to all enemy demons.' },
  { id: 'spell_008', name: 'Resurrection',    type: 'spell', cost: 1, manaValue: 1, rarity: 'uncommon',  effect: 'resurrect',     value: 1, desc: 'Return the top card of your discard to hand.' },
  { id: 'spell_010', name: 'Doom',            type: 'spell', cost: 3, manaValue: 1, rarity: 'rare',      effect: 'damage',        value: 4, desc: 'Deal 4 damage to the enemy.' },
  { id: 'spell_014', name: 'Blood Moon',      type: 'spell', cost: 1, manaValue: 1, rarity: 'rare',      effect: 'buff_atk_all',  value: 1, desc: 'All friendly demons gain +1 ATK.' },
  { id: 'spell_017', name: 'Final Hour',      type: 'spell', cost: 4, manaValue: 1, rarity: 'legendary', effect: 'resurrect_all',   value: 0, desc: 'Return all demons from your graveyard to hand.' },
  { id: 'spell_018', name: 'Soul Recall',     type: 'spell', cost: 1, manaValue: 1, rarity: 'mythic', effect: 'reanimate_demon', value: 0, desc: 'Put a demon from your graveyard directly onto the field.' },

  // ═══════════════════════════════════════════════════════════
  // NEW DEMONS
  // ═══════════════════════════════════════════════════════════

  // ── PITCH BONUS ──────────────────────────────────────────────
  { id: 'demon_024', name: 'Mana Wisp',     subtype: 'light', type: 'demon', cost: 1, manaValue: 2, atk: 0, hp: 1, rarity: 'uncommon',    ability: null, abilityDesc: null, desc: 'Channels raw mana. Pitches for 2.' },
  { id: 'demon_025', name: 'Mana Wraith',   subtype: 'dark', type: 'demon', cost: 1, manaValue: 3, atk: 0, hp: 1, rarity: 'rare',      ability: null, abilityDesc: null, desc: 'A powerful conduit. Pitches for 3.' },
  { id: 'demon_026', name: 'Mana Titan',    subtype: 'light', type: 'demon', cost: 1, manaValue: 4, atk: 0, hp: 1, rarity: 'mythic', ability: null, abilityDesc: null, desc: 'A living mana font. Pitches for 4.' },

  // ── AURA DEMONS ──────────────────────────────────────────────
  { id: 'demon_027', name: 'Blood Banner',  type: 'demon', cost: 2, manaValue: 1, atk: 2, hp: 2, rarity: 'uncommon',
    ability: 'aura_front_atk_1', abilityDesc: 'Aura: Other front row demons get +1 ATK.',
    desc: 'Its war cry drives the front lines forward.',
  },
  { id: 'demon_028', name: 'Iron Sigil',    type: 'demon', cost: 2, manaValue: 1, atk: 2, hp: 2, rarity: 'uncommon',
    ability: 'aura_front_hp_2', abilityDesc: 'Aura: Other front row demons get +2 HP.',
    desc: 'Strengthens the resolve of those beside it.',
  },
  { id: 'demon_029', name: 'Warlord',       type: 'demon', cost: 4, manaValue: 1, atk: 0, hp: 4, rarity: 'mythic',
    ability: 'aura_front_haste', abilityDesc: 'Aura: Other front row demons gain Haste.',
    desc: 'Commands an unstoppable charge.',
  },
  { id: 'demon_030', name: 'Death Knell',   type: 'demon', cost: 2, manaValue: 1, atk: 1, hp: 1, rarity: 'rare',
    ability: 'any_death_drain', abilityDesc: 'Whenever any demon dies, the opponent loses 1 HP.',
    desc: 'Every fallen soul feeds its curse.',
  },

  // ── OSIRIS FRAGMENTS ──────────────────────────────────────────
  // Lore: God was not slain. God was shattered and sealed inside five cards
  //       by the Last Demon Council — humans as they are today.
  //       Rumour says a sixth fragment still exists. Roger knew.
  { id: 'demon_031', name: 'Left Arm of Osiris',  type: 'demon', cost: 1, manaValue: 1, atk: 0, hp: 1, rarity: 'legendary',
    ability: 'osiris_piece', abilityDesc: 'If you hold all 5 Osiris pieces, win instantly.',
    desc: '"...the left arm reached for mercy but found only chains." — Fragment I, House of Silence',
  },
  { id: 'demon_032', name: 'Right Arm of Osiris', type: 'demon', cost: 1, manaValue: 1, atk: 0, hp: 1, rarity: 'legendary',
    ability: 'osiris_piece', abilityDesc: 'If you hold all 5 Osiris pieces, win instantly.',
    desc: '"...it struck the Council but they had already become something the old god could not harm." — Fragment II',
  },
  { id: 'demon_033', name: 'Head of Osiris',      type: 'demon', cost: 1, manaValue: 1, atk: 1, hp: 1, rarity: 'legendary',
    ability: 'osiris_piece', abilityDesc: 'If you hold all 5 Osiris pieces, win instantly.',
    desc: '"The god looked upon humans and knew: it was looking at itself." — Fragment III, Shattered Codex',
  },
  { id: 'demon_034', name: 'Left Leg of Osiris',  type: 'demon', cost: 0, manaValue: 1, atk: 1, hp: 1, rarity: 'legendary',
    ability: 'osiris_piece', abilityDesc: 'If you hold all 5 Osiris pieces, win instantly.',
    desc: '"It tried to flee. But humans had inherited the god\'s own speed." — Fragment IV',
  },
  { id: 'demon_035', name: 'Right Leg of Osiris', type: 'demon', cost: 0, manaValue: 1, atk: 1, hp: 1, rarity: 'legendary',
    ability: 'osiris_piece', abilityDesc: 'If you hold all 5 Osiris pieces, win instantly.',
    desc: '"The war ended not with blood, but with a card. And silence." — Fragment V, The Last Council',
  },

  // ── THE GOD CARD ───────────────────────────────────────────────
  // Hidden by Roger D. Richard 20 years ago. Finding this makes you Card King.
  // Lore hint: this IS the god. Reconstituted. The final demon. The first.
  {
    id: 'god_card',
    name: 'ROGER\'S CARD — ◈ THE FIRST ONE ◈',
    type: 'demon',
    subtype: 'dark',
    cost: 0,
    manaValue: 0,
    atk: 0,
    hp: 0,
    rarity: 'legendary',
    ability: 'god_card',
    abilityDesc: '◈ CARD KING ◈ — You are now god. The world bows to your will.',
    desc: '"I found it. I held it. I laughed. Then I hid it again, because some doors should only be opened once."\n— R.D. Roger, Last Entry',
  },

  // ── UTILITY DEMONS ───────────────────────────────────────────
  { id: 'demon_036', name: 'Tactician',     type: 'demon', cost: 2, manaValue: 1, atk: 2, hp: 2, rarity: 'uncommon',
    ability: 'battlecry_reposition_ally', abilityDesc: 'Battlecry: Move one of your demons between rows.',
    desc: 'Shifts the battlefield to its advantage.',
  },
  { id: 'demon_037', name: 'Mind Bender',   type: 'demon', cost: 2, manaValue: 1, atk: 2, hp: 2, rarity: 'uncommon',
    ability: 'battlecry_reposition_enemy', abilityDesc: 'Battlecry: Force an enemy front demon to the rear.',
    desc: 'Breaks enemy formations.',
  },
  { id: 'demon_038', name: 'Sniper Fiend',  type: 'demon', cost: 3, manaValue: 1, atk: 3, hp: 1, rarity: 'uncommon',
    ability: 'battlecry_rear_strike', abilityDesc: 'Battlecry: Deal 1 damage to enemy for each demon in their rear row.',
    desc: 'Targets what hides in the back.',
  },
  { id: 'demon_039', name: 'Hollow Mirror', type: 'demon', cost: 2, manaValue: 1, atk: 0, hp: 0, rarity: 'rare',
    ability: 'mimic_board_count', abilityDesc: 'ATK and HP equal total demons on the battlefield.',
    desc: 'Reflects the power of the field.',
  },
  { id: 'demon_040', name: 'Imp Matron',    type: 'demon', cost: 3, manaValue: 1, atk: 2, hp: 3, rarity: 'uncommon',
    ability: 'battlecry_summon_imp', abilityDesc: 'Battlecry: Summon a 1/1 Imp.',
    desc: 'She never fights alone.',
  },
  { id: 'demon_041', name: 'Equalizer',     type: 'demon', cost: 4, manaValue: 1, atk: 4, hp: 4, rarity: 'mythic',
    ability: 'battlecry_equalize_hp', abilityDesc: 'Battlecry: Set both players\' HP to 8.',
    desc: 'The scales of fate reset.',
  },
  { id: 'demon_042', name: 'Arch Demon',    type: 'demon', cost: 7, manaValue: 1, atk: 8, hp: 8, rarity: 'mythic',
    ability: null, abilityDesc: null, desc: 'A titan of the underworld.',
  },
  { id: 'demon_043', name: 'Demon Overlord',type: 'demon', cost: 10, manaValue: 1, atk: 12, hp: 12, rarity: 'legendary',
    ability: null, abilityDesc: null, desc: 'The ruler of all demons.',
  },
  { id: 'demon_044', name: 'Chaos King Dragon', type: 'demon', cost: 0, manaValue: 1, atk: 6, hp: 6, rarity: 'legendary',
    ability: 'chaos_dragon', abilityDesc: 'Special: Remove 1 light & 1 dark from graveyard to summon. Battlecry: Deal 2 dmg per card in enemy graveyard.',
    desc: 'Cannot be summoned normally.',
  },
  { id: 'demon_045', name: 'Twin Fury',     type: 'demon', cost: 4, manaValue: 1, atk: 2, hp: 2, rarity: 'rare',
    ability: 'double_attack', abilityDesc: 'Can attack twice per turn.',
    desc: 'Strikes before you can breathe.',
  },

  // ═══════════════════════════════════════════════════════════
  // EXPANSION — subtypes: dark | light | fire | water | beast
  // ═══════════════════════════════════════════════════════════

  // ── DARK ─────────────────────────────────────────────────────
  { id: 'demon_046', name: 'Grave Glutton',    subtype: 'dark',  type: 'demon', cost: 1, manaValue: 1, atk: 1, hp: 1, rarity: 'rare',
    ability: 'feed_on_death', abilityDesc: 'Gains +1/+1 whenever any demon dies.',
    desc: 'It gorges on every fallen soul.',
  },
  { id: 'demon_047', name: 'Carrion Beetle',   subtype: 'dark',  type: 'demon', cost: 1, manaValue: 1, atk: 1, hp: 1, rarity: 'uncommon',
    ability: 'ally_death_mana', abilityDesc: 'Whenever a friendly demon dies, gain 1 mana.',
    desc: 'Death is currency.',
  },
  { id: 'demon_048', name: 'Echo Scholar',     subtype: 'dark',  type: 'demon', cost: 2, manaValue: 1, atk: 2, hp: 1, rarity: 'mythic',
    ability: 'battlecry_replay_spell', abilityDesc: 'Battlecry: Replay the last spell in your graveyard for free.',
    desc: 'Every incantation echoes twice.',
  },
  { id: 'demon_049', name: 'Shadow Raider',    subtype: 'dark',  type: 'demon', cost: 2, manaValue: 1, atk: 3, hp: 1, rarity: 'rare',
    ability: 'haste_face_draw', abilityDesc: 'Haste. When this deals face damage, draw 1 card.',
    desc: 'Strikes the mind as well as the body.',
  },
  { id: 'demon_050', name: 'Soul Collector',   subtype: 'dark',  type: 'demon', cost: 3, manaValue: 1, atk: 1, hp: 5, rarity: 'rare',
    ability: 'any_death_draw', abilityDesc: 'Whenever any demon dies, draw 1 card.',
    desc: 'Watches from the void. Learning.',
  },
  { id: 'demon_051', name: 'Necrotic Wisp',    subtype: 'dark',  type: 'demon', cost: 1, manaValue: 1, atk: 0, hp: 1, rarity: 'uncommon',
    ability: 'deathrattle_buff_all', abilityDesc: 'Deathrattle: Give all your other demons +1/+1.',
    desc: 'A tiny sacrifice that fuels the rest.',
  },
  { id: 'demon_052', name: 'Blood Cultist',    subtype: 'dark',  type: 'demon', cost: 2, manaValue: 1, atk: 2, hp: 2, rarity: 'common',
    ability: 'ally_death_lifegain', abilityDesc: 'Whenever a friendly demon dies, gain 1 HP.',
    desc: 'Drinks deep from every death nearby.',
  },
  { id: 'demon_053', name: 'Night Stalker',    subtype: 'dark',  type: 'demon', cost: 2, manaValue: 1, atk: 3, hp: 1, rarity: 'rare',
    ability: 'haste_unblockable', abilityDesc: 'Haste. Unblockable.',
    desc: 'It does not fight. It just kills.',
  },
  { id: 'demon_054', name: "Lich's Familiar",  subtype: 'dark',  type: 'demon', cost: 1, manaValue: 1, atk: 1, hp: 2, rarity: 'common',
    ability: 'spell_lifegain', abilityDesc: 'Gain 1 HP whenever you play a spell.',
    desc: 'Feeds on arcane energy.',
  },
  { id: 'demon_055', name: 'Plague Bearer',    subtype: 'dark',  type: 'demon', cost: 3, manaValue: 1, atk: 2, hp: 4, rarity: 'common',
    ability: 'poisonous', abilityDesc: 'Poisonous — kills any demon it damages.',
    desc: 'It reeks of the end.',
  },
  { id: 'demon_056', name: 'Specter Assassin', subtype: 'dark',  type: 'demon', cost: 3, manaValue: 1, atk: 3, hp: 3, rarity: 'rare',
    ability: 'battlecry_destroy_weak', abilityDesc: 'Battlecry: Destroy an enemy demon with 3 or less HP.',
    desc: 'It picks off the wounded first.',
  },
  { id: 'demon_057', name: 'Mind Shredder',    subtype: 'dark',  type: 'demon', cost: 3, manaValue: 1, atk: 2, hp: 4, rarity: 'uncommon',
    ability: 'battlecry_discard_enemy', abilityDesc: 'Battlecry: Enemy discards their top card.',
    desc: 'Tears knowledge from the mind.',
  },
  { id: 'demon_058', name: 'Dusk Predator',    subtype: 'dark',  type: 'demon', cost: 3, manaValue: 1, atk: 4, hp: 2, rarity: 'rare',
    ability: 'haste_poisonous', abilityDesc: 'Haste. Poisonous.',
    desc: 'One scratch. One corpse.',
  },
  { id: 'demon_059', name: 'Undying Fiend',    subtype: 'dark',  type: 'demon', cost: 3, manaValue: 1, atk: 4, hp: 3, rarity: 'rare',
    ability: 'deathrattle_return_hand', abilityDesc: 'Deathrattle: Return this to your hand when destroyed.',
    desc: 'It refuses to stay dead.',
  },
  { id: 'demon_060', name: 'Larcenous Shade',  subtype: 'dark',  type: 'demon', cost: 1, manaValue: 1, atk: 1, hp: 1, rarity: 'uncommon',
    ability: 'haste_face_mana', abilityDesc: 'Haste. When this deals face damage, gain 1 mana.',
    desc: 'Steals more than just HP.',
  },

  // ── LIGHT ────────────────────────────────────────────────────
  { id: 'demon_061', name: 'Iron Warden',      subtype: 'light', type: 'demon', cost: 2, manaValue: 1, atk: 2, hp: 2, rarity: 'mythic',
    ability: 'tax_spells', abilityDesc: 'Enemy spells cost 1 extra mana.',
    desc: 'Her presence alone slows the enemy.',
  },
  { id: 'demon_062', name: 'Celestial Healer', subtype: 'light', type: 'demon', cost: 3, manaValue: 1, atk: 2, hp: 3, rarity: 'common',
    ability: 'battlecry_heal_3', abilityDesc: 'Battlecry: Restore 3 HP.',
    desc: 'Blessed by the stars.',
  },
  { id: 'demon_063', name: 'Thunder Drake',    subtype: 'light', type: 'demon', cost: 2, manaValue: 1, atk: 3, hp: 2, rarity: 'common',
    ability: 'haste', abilityDesc: 'Haste.',
    desc: 'Fast as a bolt.',
  },
  { id: 'demon_064', name: 'Radiant Sentinel', subtype: 'light', type: 'demon', cost: 3, manaValue: 1, atk: 1, hp: 4, rarity: 'rare',
    ability: 'taunt_regen', abilityDesc: 'Taunt. Restores 1 HP to itself at end of your turn.',
    desc: 'Endures through sheer divine will.',
  },
  { id: 'demon_065', name: 'Star Prophet',     subtype: 'light', type: 'demon', cost: 2, manaValue: 1, atk: 1, hp: 2, rarity: 'rare',
    ability: 'draw_pings', abilityDesc: 'Whenever you draw a card, deal 1 damage to the enemy.',
    desc: 'Each revelation strikes like a blade.',
  },
  { id: 'demon_066', name: 'Holy Knight',      subtype: 'light', type: 'demon', cost: 4, manaValue: 1, atk: 3, hp: 4, rarity: 'rare',
    ability: 'divine_shield', abilityDesc: 'Divine Shield — absorbs the first hit.',
    desc: 'No blade has yet drawn its blood.',
  },
  { id: 'demon_067', name: 'Lightning Herald', subtype: 'light', type: 'demon', cost: 1, manaValue: 1, atk: 1, hp: 1, rarity: 'common',
    ability: 'haste', abilityDesc: 'Haste.',
    desc: 'Arrives with the speed of thunder.',
  },
  { id: 'demon_068', name: 'Gleaming Drake',   subtype: 'light', type: 'demon', cost: 4, manaValue: 1, atk: 5, hp: 5, rarity: 'uncommon',
    ability: 'battlecry_aoe_1', abilityDesc: 'Battlecry: Deal 1 damage to all enemy demons.',
    desc: 'Its wingspan blots out lesser creatures.',
  },
  { id: 'demon_069', name: 'Angelic Guardian', subtype: 'light', type: 'demon', cost: 4, manaValue: 1, atk: 2, hp: 6, rarity: 'rare',
    ability: 'taunt', abilityDesc: 'Taunt.',
    desc: 'Will not yield.',
  },
  { id: 'demon_070', name: 'Seraph',           subtype: 'light', type: 'demon', cost: 4, manaValue: 1, atk: 3, hp: 5, rarity: 'mythic',
    ability: 'divine_shield', abilityDesc: 'Divine Shield — absorbs the first hit.',
    desc: 'Heaven\'s last line of defence.',
  },

  // ── FIRE ─────────────────────────────────────────────────────
  { id: 'demon_071', name: 'Ember Thief',      subtype: 'fire',  type: 'demon', cost: 1, manaValue: 1, atk: 1, hp: 1, rarity: 'rare',
    ability: 'haste_face_mana', abilityDesc: 'Haste. When this deals face damage, gain 1 mana.',
    desc: 'Steals breath with every strike.',
  },
  { id: 'demon_072', name: 'Blaze Imp',        subtype: 'fire',  type: 'demon', cost: 1, manaValue: 1, atk: 2, hp: 1, rarity: 'common',
    ability: 'haste', abilityDesc: 'Haste.',
    desc: 'Burns bright and fast.',
  },
  { id: 'demon_073', name: 'Lava Golem',       subtype: 'fire',  type: 'demon', cost: 3, manaValue: 1, atk: 4, hp: 4, rarity: 'uncommon',
    ability: 'battlecry_damage_random_2', abilityDesc: 'Battlecry: Deal 2 damage to a random enemy demon.',
    desc: 'Erupts on arrival.',
  },
  { id: 'demon_074', name: 'Infernal Drake',   subtype: 'fire',  type: 'demon', cost: 2, manaValue: 1, atk: 3, hp: 2, rarity: 'common',
    ability: 'rage', abilityDesc: 'Rage — gains +1 ATK every time it takes damage.',
    desc: 'Pain makes it stronger.',
  },
  { id: 'demon_075', name: 'Pyromancer',       subtype: 'fire',  type: 'demon', cost: 2, manaValue: 1, atk: 1, hp: 3, rarity: 'rare',
    ability: 'spell_aoe', abilityDesc: 'Whenever you play a spell, deal 1 damage to all enemy demons.',
    desc: 'Every word of power scorches the enemy.',
  },
  { id: 'demon_076', name: 'Magma Titan',      subtype: 'fire',  type: 'demon', cost: 4, manaValue: 1, atk: 5, hp: 4, rarity: 'rare',
    ability: 'battlecry_aoe_rear_2', abilityDesc: 'Battlecry: Deal 2 damage to all enemy rear row demons.',
    desc: 'Reaches over the front line.',
  },
  { id: 'demon_077', name: 'Hellfire Imp',     subtype: 'fire',  type: 'demon', cost: 0, manaValue: 1, atk: 1, hp: 1, rarity: 'common',
    ability: 'haste', abilityDesc: 'Haste.',
    desc: 'Free chaos.',
  },
  { id: 'demon_078', name: 'Cinder Scholar',   subtype: 'fire',  type: 'demon', cost: 3, manaValue: 1, atk: 3, hp: 3, rarity: 'rare',
    ability: 'battlecry_face_per_spell_gy', abilityDesc: 'Battlecry: Deal 1 damage to the enemy for each spell in your graveyard.',
    desc: 'The more you cast, the more it burns.',
  },
  { id: 'demon_079', name: 'Phoenix',          subtype: 'fire',  type: 'demon', cost: 4, manaValue: 1, atk: 3, hp: 3, rarity: 'rare',
    ability: 'deathrattle_return_hand', abilityDesc: 'Deathrattle: Return this to your hand when destroyed.',
    desc: 'Rises from its own ashes.',
  },
  { id: 'demon_080', name: 'Lava Drake',       subtype: 'fire',  type: 'demon', cost: 3, manaValue: 1, atk: 3, hp: 4, rarity: 'common',
    ability: 'lifesteal', abilityDesc: 'Lifesteal.',
    desc: 'Drains life with burning claws.',
  },
  { id: 'demon_081', name: 'Fire Elemental',   subtype: 'fire',  type: 'demon', cost: 4, manaValue: 1, atk: 4, hp: 5, rarity: 'mythic',
    ability: 'battlecry_aoe_2', abilityDesc: 'Battlecry: Deal 2 damage to all enemy demons.',
    desc: 'A living inferno.',
  },
  { id: 'demon_082', name: 'Molten Giant',     subtype: 'fire',  type: 'demon', cost: 5, manaValue: 1, atk: 6, hp: 5, rarity: 'uncommon',
    ability: 'battlecry_aoe_1', abilityDesc: 'Battlecry: Deal 1 damage to all enemy demons.',
    desc: 'The ground cracks beneath its steps.',
  },

  // ── WATER ────────────────────────────────────────────────────
  { id: 'demon_083', name: 'Tidal Terror',     subtype: 'water', type: 'demon', cost: 4, manaValue: 1, atk: 5, hp: 5, rarity: 'mythic',
    ability: 'battlecry_aoe_per_spell', abilityDesc: 'Battlecry: Deal 1 damage to each enemy demon for each spell in your graveyard.',
    desc: 'The tide rises with every spell cast.',
  },
  { id: 'demon_084', name: 'Frost Mage',       subtype: 'water', type: 'demon', cost: 2, manaValue: 1, atk: 1, hp: 3, rarity: 'uncommon',
    ability: 'battlecry_freeze_target', abilityDesc: 'Battlecry: Exhaust (freeze) one enemy demon for a turn.',
    desc: 'A touch and the enemy slows.',
  },
  { id: 'demon_085', name: 'Ice Barrier',      subtype: 'water', type: 'demon', cost: 3, manaValue: 1, atk: 0, hp: 6, rarity: 'rare',
    ability: 'divine_shield', abilityDesc: 'Divine Shield — absorbs the first hit. Taunt.',
    desc: 'An impenetrable wall of frost.',
  },
  { id: 'demon_086', name: 'Sea Serpent',      subtype: 'water', type: 'demon', cost: 4, manaValue: 1, atk: 4, hp: 4, rarity: 'common',
    ability: 'unblockable', abilityDesc: 'Unblockable.',
    desc: 'Slithers through every defence.',
  },
  { id: 'demon_087', name: 'Arcane Leech',     subtype: 'water', type: 'demon', cost: 2, manaValue: 1, atk: 1, hp: 4, rarity: 'common',
    ability: 'lifesteal', abilityDesc: 'Lifesteal.',
    desc: 'Drains the arcane from the living.',
  },
  { id: 'demon_088', name: 'Glacial Colossus', subtype: 'water', type: 'demon', cost: 7, manaValue: 1, atk: 6, hp: 8, rarity: 'mythic',
    ability: 'battlecry_freeze_all', abilityDesc: 'Battlecry: Exhaust all enemy demons.',
    desc: 'Winter itself steps onto the battlefield.',
  },
  { id: 'demon_089', name: 'River Sprite',     subtype: 'water', type: 'demon', cost: 1, manaValue: 1, atk: 0, hp: 2, rarity: 'uncommon',
    ability: 'mana_per_turn', abilityDesc: 'At the start of your turn, gain 1 mana.',
    desc: 'The current never stops.',
  },
  { id: 'demon_090', name: 'Storm Surge',      subtype: 'water', type: 'demon', cost: 3, manaValue: 1, atk: 3, hp: 3, rarity: 'uncommon',
    ability: 'rage', abilityDesc: 'Rage — gains +1 ATK every time it takes damage.',
    desc: 'The storm intensifies.',
  },
  { id: 'demon_091', name: 'Kraken Spawn',     subtype: 'water', type: 'demon', cost: 2, manaValue: 1, atk: 0, hp: 4, rarity: 'common',
    ability: 'taunt', abilityDesc: 'Taunt.',
    desc: 'A wall of writhing tentacles.',
  },
  { id: 'demon_092', name: 'Deep Lurker',      subtype: 'water', type: 'demon', cost: 4, manaValue: 1, atk: 4, hp: 5, rarity: 'rare',
    ability: 'unblockable_lifesteal', abilityDesc: 'Unblockable. Lifesteal.',
    desc: 'Surfaces only to feed.',
  },

  // ── BEAST ────────────────────────────────────────────────────
  { id: 'demon_093', name: 'Mana Dryad',       subtype: 'beast', type: 'demon', cost: 1, manaValue: 1, atk: 1, hp: 1, rarity: 'uncommon',
    ability: 'mana_per_turn', abilityDesc: 'At the start of your turn, gain 1 mana.',
    desc: 'Channels the land\'s energy every turn.',
  },
  { id: 'demon_094', name: 'Elder Treant',     subtype: 'beast', type: 'demon', cost: 2, manaValue: 1, atk: 1, hp: 2, rarity: 'uncommon',
    ability: 'mana_per_turn', abilityDesc: 'At the start of your turn, gain 1 mana.',
    desc: 'Ancient and unyielding.',
  },
  { id: 'demon_095', name: 'Stampeding Bull',  subtype: 'beast', type: 'demon', cost: 3, manaValue: 1, atk: 5, hp: 3, rarity: 'common',
    ability: 'haste', abilityDesc: 'Haste.',
    desc: 'Nothing stops it.',
  },
  { id: 'demon_096', name: 'Giant Spider',     subtype: 'beast', type: 'demon', cost: 3, manaValue: 1, atk: 2, hp: 4, rarity: 'uncommon',
    ability: 'taunt_poisonous', abilityDesc: 'Taunt. Poisonous.',
    desc: 'Every attacker regrets the choice.',
  },
  { id: 'demon_097', name: 'Sabertooth',       subtype: 'beast', type: 'demon', cost: 3, manaValue: 1, atk: 4, hp: 2, rarity: 'common',
    ability: 'haste', abilityDesc: 'Haste.',
    desc: 'Kills before the enemy reacts.',
  },
  { id: 'demon_098', name: 'Pack Alpha',       subtype: 'beast', type: 'demon', cost: 3, manaValue: 1, atk: 3, hp: 3, rarity: 'rare',
    ability: 'battlecry_buff_beast', abilityDesc: 'Battlecry: Give all other friendly beasts +1 ATK.',
    desc: 'Where it howls, the pack surges.',
  },
  { id: 'demon_099', name: 'Thunderous Rex',   subtype: 'beast', type: 'demon', cost: 6, manaValue: 1, atk: 7, hp: 7, rarity: 'mythic',
    ability: 'haste_taunt', abilityDesc: 'Haste. Taunt.',
    desc: 'It charges, and it must be faced.',
  },
  { id: 'demon_100', name: 'Elder Dragon',     subtype: 'beast', type: 'demon', cost: 5, manaValue: 1, atk: 5, hp: 5, rarity: 'mythic',
    ability: 'battlecry_aoe_2', abilityDesc: 'Battlecry: Deal 2 damage to all enemy demons.',
    desc: 'The oldest hunter.',
  },
  { id: 'demon_101', name: 'Dire Wolf',        subtype: 'beast', type: 'demon', cost: 2, manaValue: 1, atk: 3, hp: 2, rarity: 'common',
    ability: 'rage', abilityDesc: 'Rage — gains +1 ATK every time it takes damage.',
    desc: 'Pain makes it more dangerous.',
  },
  { id: 'demon_102', name: 'Ancient Tortoise', subtype: 'beast', type: 'demon', cost: 3, manaValue: 1, atk: 1, hp: 8, rarity: 'rare',
    ability: 'taunt', abilityDesc: 'Taunt.',
    desc: 'Unmovable.',
  },
  { id: 'demon_103', name: 'Primal Dragon',    subtype: 'beast', type: 'demon', cost: 5, manaValue: 1, atk: 5, hp: 6, rarity: 'uncommon',
    ability: 'battlecry_buff_all_atk', abilityDesc: 'Battlecry: All your other demons gain +1 ATK.',
    desc: 'Its roar inspires even the damned.',
  },
  { id: 'demon_104', name: 'Forest Colossus',  subtype: 'beast', type: 'demon', cost: 4, manaValue: 1, atk: 4, hp: 5, rarity: 'rare',
    ability: 'taunt_lifesteal', abilityDesc: 'Taunt. Lifesteal.',
    desc: 'The forest sustains it through every wound.',
  },
  { id: 'demon_105', name: 'Nest Warden',      subtype: 'beast', type: 'demon', cost: 2, manaValue: 1, atk: 2, hp: 3, rarity: 'uncommon',
    ability: 'deathrattle_summon_2_imps', abilityDesc: 'Deathrattle: Summon two 1/1 Imps when destroyed.',
    desc: 'Its young scatter when it falls.',
  },

  // ═══════════════════════════════════════════════════════════
  // EXPANSION SPELLS
  // ═══════════════════════════════════════════════════════════

  // ── RAMP ─────────────────────────────────────────────────────
  { id: 'spell_019', name: 'Dark Ritual',      type: 'spell', cost: 0, manaValue: 1, rarity: 'common',    effect: 'gain_mana',          value: 3,  desc: 'Gain 3 mana this turn.' },
  { id: 'spell_020', name: 'Blood Price',      type: 'spell', cost: 0, manaValue: 1, rarity: 'uncommon',  effect: 'hp_to_mana',         value: 4,  desc: 'Lose 4 HP. Gain 4 mana.' },
  { id: 'spell_021', name: 'Ancient Rites',    type: 'spell', cost: 1, manaValue: 1, rarity: 'uncommon',  effect: 'gain_mana',          value: 4,  desc: 'Gain 4 mana this turn.' },
  { id: 'spell_022', name: 'Mana Convergence', type: 'spell', cost: 2, manaValue: 1, rarity: 'rare',      effect: 'gain_mana',          value: 6,  desc: 'Gain 6 mana this turn.' },
  { id: 'spell_023', name: 'Soul Barter',      type: 'spell', cost: 0, manaValue: 1, rarity: 'uncommon',  effect: 'mana_per_demon',     value: 1,  desc: 'Gain 1 mana per demon you control.' },
  { id: 'spell_024', name: 'Rite of Power',    type: 'spell', cost: 1, manaValue: 1, rarity: 'rare',      effect: 'mana_per_graveyard', value: 5,  desc: 'Gain 1 mana per card in your graveyard (max 5).' },
  { id: 'spell_025', name: 'Essence Surge',    type: 'spell', cost: 1, manaValue: 1, rarity: 'uncommon',  effect: 'deal_and_gain_mana', value: 2,  desc: 'Deal 2 to the enemy. Gain 2 mana.' },

  // ── BURN ─────────────────────────────────────────────────────
  { id: 'spell_026', name: 'Lightning Bolt',   type: 'spell', cost: 1, manaValue: 1, rarity: 'common',    effect: 'deal_face',          value: 3,  desc: 'Deal 3 damage directly to the enemy.' },
  { id: 'spell_027', name: 'Shock',            type: 'spell', cost: 0, manaValue: 1, rarity: 'common',    effect: 'deal_face',          value: 2,  desc: 'Deal 2 damage to the enemy.' },
  { id: 'spell_028', name: 'Lava Burst',       type: 'spell', cost: 2, manaValue: 1, rarity: 'uncommon',  effect: 'deal_face',          value: 5,  desc: 'Deal 5 damage to the enemy.' },
  { id: 'spell_029', name: 'Volcanic Blast',   type: 'spell', cost: 3, manaValue: 1, rarity: 'rare',      effect: 'deal_face',          value: 7,  desc: 'Deal 7 damage to the enemy.' },
  { id: 'spell_030', name: 'Pyroclasm',        type: 'spell', cost: 2, manaValue: 1, rarity: 'uncommon',  effect: 'aoe_all_2',          value: 2,  desc: 'Deal 2 damage to ALL demons on both sides.' },
  { id: 'spell_031', name: 'Searing Touch',    type: 'spell', cost: 1, manaValue: 1, rarity: 'rare',      effect: 'deal_face_if_low',   value: 5,  desc: 'Deal 5 to the enemy if they have 5 or less HP.' },
  { id: 'spell_032', name: 'Fire Storm',       type: 'spell', cost: 3, manaValue: 1, rarity: 'rare',      effect: 'aoe_enemy_and_face', value: 3,  desc: 'Deal 3 to all enemy demons and to the enemy.' },
  { id: 'spell_033', name: 'Chaos Bolt',       type: 'spell', cost: 2, manaValue: 1, rarity: 'rare',      effect: 'chaos_damage',       value: 8,  desc: 'Deal a random 1–8 damage to the enemy.' },
  { id: 'spell_034', name: 'Death Toll',       type: 'spell', cost: 0, manaValue: 1, rarity: 'rare',      effect: 'face_per_graveyard', value: 1,  desc: 'Deal 1 damage to the enemy for each card in your graveyard.' },
  { id: 'spell_035', name: 'Twin Bolt',        type: 'spell', cost: 2, manaValue: 1, rarity: 'uncommon',  effect: 'deal_face',          value: 4,  desc: 'Deal 4 damage to the enemy.' },
  { id: 'spell_036', name: 'Ember Rain',       type: 'spell', cost: 0, manaValue: 1, rarity: 'common',    effect: 'aoe_demon_dmg',      value: 1,  desc: 'Deal 1 damage to all enemy demons.' },

  // ── CONTROL ──────────────────────────────────────────────────
  { id: 'spell_037', name: 'Frost Nova',       type: 'spell', cost: 2, manaValue: 1, rarity: 'uncommon',  effect: 'freeze_all_enemy',   value: 0,  desc: 'Exhaust all enemy demons for one turn.' },
  { id: 'spell_038', name: 'Mind Control',     type: 'spell', cost: 4, manaValue: 1, rarity: 'legendary', effect: 'steal_demon',        value: 0,  desc: 'Take control of the weakest enemy demon.' },
  { id: 'spell_039', name: 'Disruption',       type: 'spell', cost: 1, manaValue: 1, rarity: 'uncommon',  effect: 'return_demon',       value: 0,  desc: 'Return the strongest enemy demon to their hand.' },
  { id: 'spell_040', name: 'Drain Life',       type: 'spell', cost: 3, manaValue: 1, rarity: 'rare',      effect: 'deal_face_drain',    value: 3,  desc: 'Deal 3 to the enemy. Gain 3 HP.' },
  { id: 'spell_041', name: 'Wrath',            type: 'spell', cost: 4, manaValue: 1, rarity: 'mythic',    effect: 'destroy_all_both',   value: 0,  desc: 'Destroy ALL demons on both sides.' },
  { id: 'spell_042', name: 'Silence',          type: 'spell', cost: 1, manaValue: 1, rarity: 'uncommon',  effect: 'silence_demon',      value: 0,  desc: 'Remove the ability from the strongest enemy demon.' },
  { id: 'spell_043', name: 'Dark Transformation', type: 'spell', cost: 2, manaValue: 1, rarity: 'rare',   effect: 'transform_1_1',      value: 0,  desc: 'Transform the weakest enemy demon into a 1/1 with no ability.' },
  { id: 'spell_044', name: 'Frost Bolt',       type: 'spell', cost: 1, manaValue: 1, rarity: 'uncommon',  effect: 'freeze_one_demon',   value: 0,  desc: 'Exhaust one enemy demon for a turn.' },
  { id: 'spell_045', name: 'Execute',          type: 'spell', cost: 1, manaValue: 1, rarity: 'rare',      effect: 'destroy_damaged',    value: 0,  desc: 'Destroy an enemy demon that has taken damage this turn.' },
  { id: 'spell_046', name: 'Terror',           type: 'spell', cost: 1, manaValue: 1, rarity: 'uncommon',  effect: 'destroy_low_atk',    value: 2,  desc: 'Destroy an enemy demon with 2 or less ATK.' },

  // ── DRAW / BUFF ───────────────────────────────────────────────
  { id: 'spell_047', name: 'Blood Draw',       type: 'spell', cost: 0, manaValue: 1, rarity: 'uncommon',  effect: 'hp_for_draw',        value: 2,  desc: 'Lose 2 HP. Draw 2 cards.' },
  { id: 'spell_048', name: 'Cantrip',          type: 'spell', cost: 0, manaValue: 1, rarity: 'common',    effect: 'draw',               value: 1,  desc: 'Draw 1 card.' },
  { id: 'spell_049', name: 'Arcane Study',     type: 'spell', cost: 2, manaValue: 1, rarity: 'uncommon',  effect: 'draw',               value: 3,  desc: 'Draw 3 cards.' },
  { id: 'spell_050', name: 'Rally',            type: 'spell', cost: 1, manaValue: 1, rarity: 'rare',      effect: 'buff_all_stats',     value: 1,  desc: 'Give all your demons +1/+1.' },
  { id: 'spell_051', name: 'Battle Frenzy',    type: 'spell', cost: 2, manaValue: 1, rarity: 'uncommon',  effect: 'buff_atk_all_turn',  value: 2,  desc: 'Give all your demons +2 ATK until end of turn.' },
  { id: 'spell_052', name: 'Divine Favor',     type: 'spell', cost: 1, manaValue: 1, rarity: 'uncommon',  effect: 'buff_hp_all',        value: 1,  desc: 'Give all your demons +1 HP.' },
  { id: 'spell_053', name: 'Spectral Shield',  type: 'spell', cost: 1, manaValue: 1, rarity: 'rare',      effect: 'give_divine_shield', value: 0,  desc: 'Give a friendly demon Divine Shield.' },
  { id: 'spell_054', name: 'Battle Hardened',  type: 'spell', cost: 2, manaValue: 1, rarity: 'rare',      effect: 'buff_target_stats',  value: 3,  desc: 'Give a friendly demon +3/+3.' },
  { id: 'spell_055', name: 'Reanimate',        type: 'spell', cost: 2, manaValue: 1, rarity: 'rare',      effect: 'reanimate_top',      value: 0,  desc: 'Summon the highest-cost demon from your graveyard.' },
  { id: 'spell_056', name: 'Cursed Ground',    type: 'spell', cost: 3, manaValue: 1, rarity: 'rare',      effect: 'debuff_atk_all',     value: 2,  desc: 'All enemy demons lose 2 ATK.' },
  { id: 'spell_057', name: 'Arcane Mastery',   type: 'spell', cost: 0, manaValue: 1, rarity: 'legendary', effect: 'double_next_spell',  value: 0,  desc: 'Your next spell this turn is cast twice.' },
  { id: 'spell_058', name: 'Soul Link',        type: 'spell', cost: 1, manaValue: 1, rarity: 'rare',      effect: 'deal_face_drain',    value: 2,  desc: 'Deal 2 to the enemy. Gain 2 HP.' },

  // ══════════════════════════════════════════════════════
  //  INFERNO ISLAND — fire demons
  // ══════════════════════════════════════════════════════
  {
    id: 'demon_106', name: 'Lava Imp', subtype: 'fire', type: 'demon',
    cost: 1, manaValue: 1, atk: 2, hp: 1, rarity: 'common',
    ability: 'haste',
    abilityDesc: 'Haste — can attack immediately.',
    desc: 'Born screaming from a volcanic vent.',
  },
  {
    id: 'demon_107', name: 'Cinder Hound', subtype: 'fire', type: 'demon',
    cost: 2, manaValue: 1, atk: 3, hp: 2, rarity: 'common',
    ability: 'haste_poisonous',
    abilityDesc: 'Haste. Poisonous — kills any demon it damages.',
    desc: 'Ash in its lungs. Fire in its bite.',
  },
  {
    id: 'demon_108', name: 'Magma Golem', subtype: 'fire', type: 'demon',
    cost: 3, manaValue: 1, atk: 2, hp: 6, rarity: 'uncommon',
    ability: 'taunt',
    abilityDesc: 'Taunt — enemies must attack this first.',
    desc: 'Hardened lava given purpose.',
  },
  {
    id: 'demon_109', name: 'Inferno Drake', subtype: 'fire', type: 'demon',
    cost: 3, manaValue: 1, atk: 5, hp: 2, rarity: 'rare',
    ability: 'haste',
    abilityDesc: 'Haste — can attack immediately.',
    desc: 'Dives and burns before you can blink.',
  },
  {
    id: 'demon_110', name: 'Ember Phoenix', subtype: 'fire', type: 'demon',
    cost: 4, manaValue: 1, atk: 4, hp: 4, rarity: 'rare',
    ability: 'deathrattle_summon_zombie',
    abilityDesc: 'Deathrattle: Summon a 2/2 Ash Wraith when destroyed.',
    desc: 'Death is not the end. It never was on this island.',
  },
  {
    id: 'demon_111', name: 'Volcano Lord', subtype: 'fire', type: 'demon',
    cost: 4, manaValue: 1, atk: 5, hp: 5, rarity: 'mythic',
    ability: 'battlecry_damage_player_2',
    abilityDesc: 'Battlecry: Deal 2 damage to the enemy.',
    desc: '"The mountain speaks. You will not like what it says." — Magma King',
  },

  // ══════════════════════════════════════════════════════
  //  FROST WASTES — ice/beast demons
  // ══════════════════════════════════════════════════════
  {
    id: 'demon_112', name: 'Frost Rat', subtype: 'beast', type: 'demon',
    cost: 1, manaValue: 1, atk: 1, hp: 2, rarity: 'common',
    ability: 'poisonous',
    abilityDesc: 'Poisonous — kills any demon it damages.',
    desc: 'Its bite freezes the blood solid.',
  },
  {
    id: 'demon_113', name: 'Blizzard Imp', subtype: 'beast', type: 'demon',
    cost: 1, manaValue: 1, atk: 2, hp: 1, rarity: 'common',
    ability: 'haste',
    abilityDesc: 'Haste — can attack immediately.',
    desc: 'Moves through snow like it is not there.',
  },
  {
    id: 'demon_114', name: 'Glacier Drake', subtype: 'beast', type: 'demon',
    cost: 2, manaValue: 1, atk: 2, hp: 5, rarity: 'uncommon',
    ability: 'taunt',
    abilityDesc: 'Taunt — enemies must attack this first.',
    desc: 'An ancient predator. Older than the ice itself.',
  },
  {
    id: 'demon_115', name: 'Frost Wraith', subtype: 'beast', type: 'demon',
    cost: 3, manaValue: 1, atk: 3, hp: 3, rarity: 'uncommon',
    ability: 'unblockable',
    abilityDesc: 'Unblockable — can always attack the enemy directly.',
    desc: 'Cold beyond cold. A draft that kills.',
  },
  {
    id: 'demon_116', name: 'Permafrost Titan', subtype: 'beast', type: 'demon',
    cost: 4, manaValue: 1, atk: 4, hp: 7, rarity: 'rare',
    ability: 'taunt',
    abilityDesc: 'Taunt — enemies must attack this first.',
    desc: 'The north does not move. The north waits.',
  },
  {
    id: 'demon_117', name: 'Glacial Sovereign', subtype: 'beast', type: 'demon',
    cost: 4, manaValue: 1, atk: 6, hp: 4, rarity: 'mythic',
    ability: 'battlecry_aoe_1',
    abilityDesc: 'Battlecry: Deal 1 damage to all enemy demons.',
    desc: '"The Final Council met here. In the cold. Before everything ended." — Fragment VII, Frost Inscription',
  },

  // ══════════════════════════════════════════════════════
  //  INFERNO ISLAND & FROST WASTES — new spells
  // ══════════════════════════════════════════════════════
  { id: 'spell_059', name: 'Magma Burst',  type: 'spell', cost: 2, manaValue: 1, rarity: 'rare',      effect: 'damage',    value: 5, desc: 'Deal 5 damage. The volcano does not miss.' },
  { id: 'spell_060', name: 'Blizzard',     type: 'spell', cost: 3, manaValue: 1, rarity: 'rare',      effect: 'aoe_enemy', value: 3, desc: 'Deal 3 damage to all enemy demons. Even the undead feel cold.' },
  { id: 'spell_061', name: 'Lava Shield',  type: 'spell', cost: 1, manaValue: 1, rarity: 'uncommon',  effect: 'buff_hp',   value: 4, desc: 'Give a friendly demon +4 HP. Hardened from within.' },

  // ══════════════════════════════════════════════════════
  //  POISON / STATUS — new mechanic
  // ══════════════════════════════════════════════════════
  { id: 'spell_062', name: 'Toxic Cloud',   type: 'spell', cost: 2, manaValue: 1, rarity: 'uncommon', effect: 'poison_all_enemy', value: 3, desc: 'Poison all enemy demons for 3 turns (1 dmg/turn).' },
  { id: 'spell_063', name: 'Venom Strike',  type: 'spell', cost: 1, manaValue: 1, rarity: 'common',   effect: 'poison_one_enemy', value: 4, desc: 'Poison one enemy demon for 4 turns (1 dmg/turn).' },
  { id: 'spell_064', name: 'Cure',          type: 'spell', cost: 1, manaValue: 1, rarity: 'uncommon', effect: 'cure_all_friendly',value: 0, desc: 'Remove all poison from your demons.' },
  { id: 'spell_065', name: 'Plague Surge',  type: 'spell', cost: 3, manaValue: 1, rarity: 'rare',     effect: 'poison_face',      value: 2, desc: 'Deal 2 damage now, then 2 more each turn for 2 turns.' },

  // ══════════════════════════════════════════════════════
  //  THUNDER PEAK — storm/lightning demons
  // ══════════════════════════════════════════════════════
  {
    id: 'demon_118', name: 'Spark Imp', subtype: 'thunder', type: 'demon',
    cost: 1, manaValue: 1, atk: 2, hp: 1, rarity: 'common',
    ability: 'haste',
    abilityDesc: 'Haste — can attack immediately.',
    desc: 'Born in a lightning strike. Gone in the next.',
  },
  {
    id: 'demon_119', name: 'Storm Hound', subtype: 'thunder', type: 'demon',
    cost: 2, manaValue: 1, atk: 3, hp: 2, rarity: 'common',
    ability: 'haste_poisonous',
    abilityDesc: 'Haste. Poisonous — kills any demon it damages.',
    desc: 'The thunder carries it. The lightning is its bite.',
  },
  {
    id: 'demon_120', name: 'Tempest Knight', subtype: 'thunder', type: 'demon',
    cost: 3, manaValue: 1, atk: 2, hp: 6, rarity: 'uncommon',
    ability: 'taunt',
    abilityDesc: 'Taunt — enemies must attack this first.',
    desc: 'Stands in the eye of the storm. Unmoved.',
  },
  {
    id: 'demon_121', name: 'Thunder Drake', subtype: 'thunder', type: 'demon',
    cost: 3, manaValue: 1, atk: 5, hp: 2, rarity: 'rare',
    ability: 'haste',
    abilityDesc: 'Haste — can attack immediately.',
    desc: 'Strikes from the clouds before you can react.',
  },
  {
    id: 'demon_122', name: 'Stormcaller', subtype: 'thunder', type: 'demon',
    cost: 4, manaValue: 1, atk: 3, hp: 5, rarity: 'rare',
    ability: 'battlecry_aoe_2',
    abilityDesc: 'Battlecry: Deal 2 damage to all enemy demons.',
    desc: '"The storm does not choose its victims. It teaches them." — Stormcaller IX',
  },
  {
    id: 'demon_123', name: 'Thunder Sovereign', subtype: 'thunder', type: 'demon',
    cost: 5, manaValue: 1, atk: 6, hp: 6, rarity: 'mythic',
    ability: 'battlecry_damage_player_2',
    abilityDesc: 'Battlecry: Deal 2 damage to the enemy.',
    desc: '"He who commands the storm commands all. And I command the storm." — Thunder Sovereign',
  },

  // New spells for Thunder Peak
  { id: 'spell_066', name: 'Lightning Bolt',  type: 'spell', cost: 2, manaValue: 1, rarity: 'rare',      effect: 'damage',    value: 6, desc: 'Deal 6 damage. The sky does not warn you.' },
  { id: 'spell_067', name: 'Chain Lightning', type: 'spell', cost: 3, manaValue: 1, rarity: 'rare',      effect: 'aoe_enemy', value: 2, desc: 'Deal 2 damage to all enemy demons. The chain never ends.' },
  { id: 'spell_068', name: 'Thunder Ward',    type: 'spell', cost: 1, manaValue: 1, rarity: 'uncommon',  effect: 'buff_hp',   value: 3, desc: 'Give a friendly demon +3 HP. Hardened by lightning strikes.' },
];

window.CARD_MAP = {};
window.CARDS.forEach(c => { window.CARD_MAP[c.id] = c; });

window.STARTER_DECK = [
  // Cheap pressure
  'demon_001','demon_001',               // 2x Imp (1/1 Haste)
  'demon_003','demon_003','demon_003',               // 2x Plague Rat (1/1 Poisonous)
  'demon_018','demon_018',                           // 1x Dusk Faerie (draw)
  // Mid demons
  'demon_002','demon_002',               // 2x Hellhound (3/2 Haste)
  'demon_006',                           // 1x Specter (2/1 Unblockable)
  'demon_008','demon_008',               // 2x Blood Bat (2/3 Lifesteal)
  'demon_005','demon_005',               // 2x Bone Knight (Deathrattle)
  'demon_013',                           // 1x Ember Drake (AOE on entry)
  'demon_015',                           // 1x Void Crawler (3/3 Unblockable)
  'demon_012',                           // 1x Minotaur (3/6 Rage)
  'demon_011','demon_011',                           // 1x Wraith (1/5 Taunt)
  // Spells
  'spell_004','spell_004',               // 2x Dark Pact (draw 2)
  'spell_016','spell_016',               // 2x Summon Familiar
  'spell_013','spell_013',               // 2x Arcane Bolt (2 dmg)
  'spell_001',                           // 1x Fireball (3 dmg)
  'spell_009',                           // 1x Mana Surge
  'spell_003',                           // 1x Soul Drain (destroy)
  'spell_007',                           // 1x Hex
  'spell_002',                           // 1x Heal
];
// 2+2+1+2+1+2+2+1+1+1+1+1+1+1 + 2+2+2+1+1+1+1+1 = 30 ✓

// ═══════════════════════════════════════════════════════════
// PACK DEFINITIONS
// Each pack = 5 cards: 2 commons, 1 uncommon, 1 rare, 1 premium slot
// Premium slot probabilities (legendary > mythic > rare fallback):
// ═══════════════════════════════════════════════════════════
window.PACKS = {
  basic: {
    name: 'Basic Pack',
    cost: 100,           // gold cost
    size: 5,
    slots: ['common', 'common', 'uncommon', 'rare', 'premium'],
    premiumRates: {
      legendary: 0.031,  // ~3.1%
      mythic:    0.25,   // 25%
      // fallback: rare
    },
  },
  advanced: {
    name: 'Advanced Pack',
    cost: 250,
    size: 5,
    slots: ['common', 'common', 'uncommon', 'rare', 'premium'],
    premiumRates: {
      legendary: 0.05,   // 5%
      mythic:    1/2,    // 50%
    },
  },
  legend: {
    name: 'Legend Pack',
    cost: 500,
    size: 5,
    slots: ['common', 'common', 'uncommon', 'rare', 'premium'],
    premiumRates: {
      legendary: 0.13,   // 13%
      mythic:    1/2,    // 50%
    },
  },
};

// Pull a single card from a specific rarity pool
window.pullCard = function(rarity) {
  const pool = window.CARDS.filter(c => c.rarity === rarity);
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
};

// Open a pack and return array of cards
window.openPack = function(packType) {
  const pack = window.PACKS[packType];
  if (!pack) return [];
  const result = [];
  for (const slot of pack.slots) {
    if (slot !== 'premium') {
      result.push(window.pullCard(slot));
    } else {
      const r = Math.random();
      if (r < pack.premiumRates.legendary)    result.push(window.pullCard('legendary'));
      else if (r < pack.premiumRates.mythic)  result.push(window.pullCard('mythic'));
      else                                    result.push(window.pullCard('rare'));
    }
  }
  return result.filter(Boolean);
};
