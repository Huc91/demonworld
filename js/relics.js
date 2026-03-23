/**
 * Relics — Hollow Knight-style charm system.
 *
 * Relics are bought from the shop and stored in your inventory.
 * To take a relic into battle you must EQUIP it, which uses Notch slots.
 * The player starts with 4 Notch slots. Extra notches are unlocked by
 * purchasing the "Notch Upgrade" in the shop or finding them in chests.
 *
 * notches: how many Notch slots this relic costs when equipped (1–3)
 */
window.RELICS = [
  // ── 1-notch relics ──────────────────────────────────────────────────────
  {
    id:      'relic_mana',
    name:    'Mana Shard',
    icon:    '[M]',
    notches: 1,
    desc:    'Start each battle with +1 mana.',
    cost:    60,
    effect:  { startMana: 1 },
  },
  {
    id:      'relic_gold',
    name:    'Midas Coin',
    icon:    '[G]',
    notches: 1,
    desc:    'Earn +20% bonus gold after every victory.',
    cost:    70,
    effect:  { goldBonus: 0.20 },
  },
  {
    id:      'relic_echo',
    name:    'Echo Charm',
    icon:    '[E]',
    notches: 1,
    desc:    'On death, you keep 25% of your dropped gold (not lost to echo).',
    cost:    80,
    effect:  { echoKeep: 0.25 },
  },
  {
    id:      'relic_draw',
    name:    'Scholar Quill',
    icon:    '[Q]',
    notches: 1,
    desc:    'Draw 1 extra card at the start of your first turn in battle.',
    cost:    65,
    effect:  { extraDraw: 1 },
  },

  // ── 2-notch relics ──────────────────────────────────────────────────────
  {
    id:      'relic_tome',
    name:    'Ancient Tome',
    icon:    '[T]',
    notches: 2,
    desc:    'Start each battle with +2 mana.',
    cost:    100,
    effect:  { startMana: 2 },
  },
  {
    id:      'relic_pact',
    name:    'Blood Pact',
    icon:    '[B]',
    notches: 2,
    desc:    'Your starting battle HP is +6.',
    cost:    110,
    effect:  { bonusHp: 6 },
  },
  {
    id:      'relic_shield',
    name:    'Runed Shield',
    icon:    '[S]',
    notches: 2,
    desc:    'The first direct face-hit each battle is completely blocked.',
    cost:    120,
    effect:  { firstHitShield: true },
  },
  {
    id:      'relic_collar',
    name:    'Demon Collar',
    icon:    '[C]',
    notches: 2,
    desc:    'Each demon you play gains +1 ATK when it enters the field.',
    cost:    130,
    effect:  { demonAtkOnPlay: 1 },
  },

  // ── 3-notch relics ──────────────────────────────────────────────────────
  {
    id:      'relic_heart',
    name:    'Iron Heart',
    icon:    '[H]',
    notches: 3,
    desc:    'Gain +1 maximum heart (permanent, applied on equip).',
    cost:    180,
    effect:  { maxHeart: 1 },
    permanent: true, // effect fires on equip, not just battle start
  },
  {
    id:      'relic_king',
    name:    "Summoner's Crown",
    icon:    '[K]',
    notches: 3,
    desc:    '+2 mana, +4 HP, and all your demons gain +1 ATK on play.',
    cost:    280,
    effect:  { startMana: 2, bonusHp: 4, demonAtkOnPlay: 1 },
  },
  {
    id:      'relic_goldmax',
    name:    'Treasure Hoard',
    icon:    '[R]',
    notches: 3,
    desc:    'Earn +50% bonus gold after every victory.',
    cost:    250,
    effect:  { goldBonus: 0.50 },
  },
];

window.RELIC_MAP = {};
window.RELICS.forEach(r => { window.RELIC_MAP[r.id] = r; });

/**
 * Returns the total notches used by equipped relics.
 */
window.relicNotchesUsed = function() {
  const equipped = window.GameState?.equippedRelics || [];
  return equipped.reduce((sum, id) => {
    return sum + (window.RELIC_MAP[id]?.notches || 0);
  }, 0);
};

/**
 * Returns the total notch slots available.
 */
window.relicNotchSlots = function() {
  return (window.GameState?.relicNotches || 4);
};
