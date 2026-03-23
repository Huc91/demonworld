/**
 * Relics — passive items bought from the shop.
 * Each relic is bought once and persists through death.
 */
window.RELICS = [
  {
    id:   'relic_tome',
    name: 'Ancient Tome',
    icon: '[T]',
    desc: 'Start each battle with +2 mana.',
    cost: 80,
    effect: { startMana: 2 },
  },
  {
    id:   'relic_pact',
    name: 'Blood Pact',
    icon: '[B]',
    desc: 'Your starting battle HP is 25 instead of 20.',
    cost: 100,
    effect: { bonusHp: 5 },
  },
  {
    id:   'relic_heart',
    name: 'Iron Heart',
    icon: '[H]',
    desc: 'Gain +1 maximum heart (applied on purchase).',
    cost: 150,
    effect: { maxHeart: 1 },
  },
  {
    id:   'relic_collar',
    name: 'Demon Collar',
    icon: '[C]',
    desc: 'Each demon you play gains +1 ATK when it enters the field.',
    cost: 120,
    effect: { demonAtkOnPlay: 1 },
  },
  {
    id:   'relic_shield',
    name: 'Runed Shield',
    icon: '[S]',
    desc: 'The first direct hit to your face each battle is completely blocked.',
    cost: 130,
    effect: { firstHitShield: true },
  },
  {
    id:   'relic_gold',
    name: 'Midas Coin',
    icon: '[G]',
    desc: 'Earn +30% bonus gold after every victory.',
    cost: 180,
    effect: { goldBonus: 0.30 },
  },
];

window.RELIC_MAP = {};
window.RELICS.forEach(r => { window.RELIC_MAP[r.id] = r; });
