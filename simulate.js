// Battle Simulator — runs N games, tracks win rates and balance issues
// Usage: node simulate.js [numGames]

const CARDS = [
  { id:'demon_001', name:'Imp',          type:'demon', cost:1, manaValue:1, atk:1, hp:1, rarity:'common',    ability:'haste' },
  { id:'demon_003', name:'Plague Rat',   type:'demon', cost:1, manaValue:1, atk:1, hp:1, rarity:'common',    ability:'poisonous' },
  { id:'demon_018', name:'Dusk Faerie',  type:'demon', cost:1, manaValue:1, atk:1, hp:3, rarity:'rare',      ability:'battlecry_draw_1' },
  { id:'demon_002', name:'Hellhound',    type:'demon', cost:2, manaValue:1, atk:3, hp:2, rarity:'common',    ability:'haste' },
  { id:'demon_004', name:'Shadow Hound', type:'demon', cost:2, manaValue:1, atk:2, hp:2, rarity:'common',    ability:'lifesteal' },
  { id:'demon_006', name:'Specter',      type:'demon', cost:2, manaValue:1, atk:2, hp:1, rarity:'uncommon',  ability:'unblockable' },
  { id:'demon_007', name:'Succubus',     type:'demon', cost:2, manaValue:1, atk:1, hp:3, rarity:'uncommon',  ability:'battlecry_draw_2' },
  { id:'demon_008', name:'Blood Bat',    type:'demon', cost:2, manaValue:1, atk:2, hp:3, rarity:'common',    ability:'lifesteal' },
  { id:'demon_005', name:'Bone Knight',  type:'demon', cost:3, manaValue:1, atk:3, hp:4, rarity:'common',    ability:'deathrattle_damage_2' },
  { id:'demon_011', name:'Wraith',       type:'demon', cost:3, manaValue:1, atk:1, hp:7, rarity:'uncommon',  ability:'taunt' },
  { id:'demon_013', name:'Ember Drake',  type:'demon', cost:3, manaValue:1, atk:3, hp:3, rarity:'uncommon',  ability:'battlecry_aoe_1' },
  { id:'demon_014', name:'Sand Ghoul',   type:'demon', cost:3, manaValue:1, atk:4, hp:2, rarity:'common',    ability:'haste' },
  { id:'demon_015', name:'Void Crawler', type:'demon', cost:3, manaValue:1, atk:3, hp:3, rarity:'uncommon',  ability:'unblockable' },
  { id:'demon_009', name:'Golem',        type:'demon', cost:4, manaValue:1, atk:2, hp:9, rarity:'uncommon',  ability:'taunt' },
  { id:'demon_010', name:'Cerberus',     type:'demon', cost:4, manaValue:1, atk:4, hp:2, rarity:'uncommon',  ability:'haste_poisonous' },
  { id:'demon_012', name:'Minotaur',     type:'demon', cost:4, manaValue:1, atk:3, hp:6, rarity:'uncommon',  ability:'rage' },
  { id:'demon_016', name:'Nightmare',    type:'demon', cost:4, manaValue:1, atk:5, hp:4, rarity:'rare',      ability:'battlecry_damage_player_2' },
  { id:'demon_017', name:'Iron Djinn',   type:'demon', cost:4, manaValue:1, atk:4, hp:4, rarity:'rare',      ability:'battlecry_buff_all_atk' },
  { id:'demon_019', name:'Pit Fiend',    type:'demon', cost:4, manaValue:1, atk:4, hp:3, rarity:'rare',      ability:'haste_lifesteal' },
  { id:'demon_020', name:'Medusa',       type:'demon', cost:4, manaValue:1, atk:4, hp:5, rarity:'rare',      ability:'battlecry_destroy_strongest' },
  { id:'demon_021', name:'Lich King',    type:'demon', cost:4, manaValue:1, atk:5, hp:5, rarity:'legendary', ability:'deathrattle_summon_zombie' },
  { id:'demon_022', name:'Beelzebub',    type:'demon', cost:4, manaValue:1, atk:3, hp:5, rarity:'legendary', ability:'battlecry_summon_imps' },
  { id:'demon_023', name:'Baphomet',     type:'demon', cost:4, manaValue:1, atk:5, hp:5, rarity:'legendary', ability:'battlecry_destroy_all' },
  { id:'spell_009', name:'Mana Surge',      type:'spell', cost:0, manaValue:1, rarity:'uncommon', effect:'mana_boost',    value:3 },
  { id:'spell_004', name:'Dark Pact',       type:'spell', cost:1, manaValue:1, rarity:'common',   effect:'draw',          value:2 },
  { id:'spell_016', name:'Summon Familiar', type:'spell', cost:1, manaValue:1, rarity:'common',   effect:'summon_imp',    value:0 },
  { id:'spell_002', name:'Heal',            type:'spell', cost:2, manaValue:1, rarity:'common',   effect:'heal',          value:2 },
  { id:'spell_006', name:'Blood Shield',    type:'spell', cost:2, manaValue:1, rarity:'common',   effect:'buff_hp',       value:2 },
  { id:'spell_013', name:'Arcane Bolt',     type:'spell', cost:2, manaValue:1, rarity:'common',   effect:'damage',        value:2 },
  { id:'spell_001', name:'Fireball',        type:'spell', cost:3, manaValue:1, rarity:'common',   effect:'damage',        value:3 },
  { id:'spell_007', name:'Hex',             type:'spell', cost:3, manaValue:1, rarity:'uncommon', effect:'debuff_atk',    value:2 },
  { id:'spell_011', name:'Chain Lightning', type:'spell', cost:3, manaValue:1, rarity:'uncommon', effect:'aoe_demon_dmg', value:1 },
  { id:'spell_012', name:'Soul Harvest',    type:'spell', cost:3, manaValue:1, rarity:'uncommon', effect:'life_per_demon',value:1 },
  { id:'spell_015', name:'Plague',          type:'spell', cost:3, manaValue:1, rarity:'uncommon', effect:'aoe_all_hp',    value:1 },
  { id:'spell_003', name:'Soul Drain',      type:'spell', cost:4, manaValue:1, rarity:'uncommon', effect:'destroy',       value:1 },
  { id:'spell_005', name:'Inferno',         type:'spell', cost:4, manaValue:1, rarity:'rare',     effect:'aoe_enemy',     value:2 },
  { id:'spell_008', name:'Resurrection',    type:'spell', cost:4, manaValue:1, rarity:'uncommon', effect:'resurrect',     value:1 },
  { id:'spell_010', name:'Doom',            type:'spell', cost:4, manaValue:1, rarity:'rare',     effect:'damage',        value:4 },
  { id:'spell_014', name:'Blood Moon',      type:'spell', cost:4, manaValue:1, rarity:'rare',     effect:'buff_atk_all',  value:1 },
  { id:'spell_017', name:'Final Hour',      type:'spell', cost:4, manaValue:1, rarity:'legendary',effect:'win_condition', value:3 },
];

const CARD_MAP = {};
CARDS.forEach(c => { CARD_MAP[c.id] = c; });

const STARTER_DECK = [
  'demon_001','demon_001','demon_001',
  'demon_003','demon_003',
  'demon_018',
  'demon_002','demon_002',
  'demon_004','demon_004',
  'demon_008','demon_008',
  'demon_005','demon_005',
  'demon_011',
  'spell_004','spell_004',
  'spell_016','spell_016',
  'spell_002','spell_002',
  'spell_013','spell_013',
  'spell_001',
  'spell_009',
  'spell_007',
];

// Full card pool decks for enemy levels
const AGGRO_DECK = [
  'demon_001','demon_001','demon_001','demon_001','demon_001',
  'demon_002','demon_002','demon_002',
  'demon_003','demon_003','demon_003',
  'demon_014','demon_014','demon_014',
  'demon_010','demon_010',
  'demon_019','demon_019',
  'spell_016','spell_016','spell_016',
  'spell_004','spell_004',
  'spell_013','spell_013',
  'spell_001','spell_001',
  'demon_016','demon_016',
  'demon_023',
];

const CONTROL_DECK = [
  'demon_011','demon_011','demon_011',
  'demon_009','demon_009',
  'demon_012','demon_012',
  'demon_021','demon_021',
  'demon_020','demon_020',
  'demon_022',
  'demon_023',
  'spell_003','spell_003',
  'spell_005','spell_005',
  'spell_010','spell_010',
  'spell_002','spell_002',
  'spell_007','spell_007',
  'spell_011','spell_011',
  'spell_015','spell_015',
  'spell_008',
  'demon_017',
  'demon_005',
];

function shuffle(arr) {
  const a = arr.map(id => ({ ...CARD_MAP[id] })).filter(Boolean);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function drawCards(deck, hand, discard, n) {
  for (let i = 0; i < n; i++) {
    if (deck.length === 0) {
      if (!discard.length) break;
      deck.push(...shuffle(discard.map(c => c.id)));
      discard.length = 0;
    }
    const c = deck.pop();
    if (hand.length < 8) hand.push(c);
    else discard.push(c);
  }
}

function killDemon(board, discard, demon, state, who) {
  const i = board.indexOf(demon);
  if (i < 0) return;
  board.splice(i, 1);
  // deathrattle
  if (demon.ability === 'deathrattle_damage_2') {
    if (who === 'player') state.enemyLife -= 2;
    else state.playerLife -= 2;
  }
  if (demon.ability === 'deathrattle_summon_zombie') {
    if (board.length < 4) {
      board.push({ id:'zombie', name:'Zombie', type:'demon', cost:2, manaValue:1, atk:2, hp:2, rarity:'common', ability:null, currentHp:2, currentAtk:2, exhausted:true });
    }
  }
  discard.push(demon);
}

function cleanBoard(board, discard, state, who) {
  for (let i = board.length - 1; i >= 0; i--) {
    if (board[i].currentHp <= 0) killDemon(board, discard, board[i], state, who);
  }
}

function resolveBattlecry(card, who, state) {
  if (!card.ability || !card.ability.startsWith('battlecry')) return;
  const me = who === 'player';
  const myBoard  = me ? state.pBoard : state.eBoard;
  const foeBoard = me ? state.eBoard : state.pBoard;
  const foeDis   = me ? state.eDiscard : state.pDiscard;

  switch (card.ability) {
    case 'battlecry_draw_1':
      if (me) drawCards(state.pDeck, state.pHand, state.pDiscard, 1);
      else    drawCards(state.eDeck, state.eHand, state.eDiscard, 1);
      break;
    case 'battlecry_draw_2':
      if (me) drawCards(state.pDeck, state.pHand, state.pDiscard, 2);
      else    { drawCards(state.eDeck, state.eHand, state.eDiscard, 1); drawCards(state.eDeck, state.eHand, state.eDiscard, 1); }
      break;
    case 'battlecry_damage_player_2':
      if (me) state.enemyLife -= 2; else state.playerLife -= 2;
      break;
    case 'battlecry_aoe_1':
      foeBoard.forEach(d => d.currentHp -= 1);
      cleanBoard(foeBoard, foeDis, state, me ? 'enemy' : 'player');
      break;
    case 'battlecry_buff_all_atk':
      myBoard.slice(0, myBoard.length - 1).forEach(d => d.currentAtk += 1);
      break;
    case 'battlecry_destroy_strongest':
      if (foeBoard.length) {
        const t = foeBoard.reduce((a, b) => a.currentAtk >= b.currentAtk ? a : b);
        killDemon(foeBoard, foeDis, t, state, me ? 'enemy' : 'player');
      }
      break;
    case 'battlecry_summon_imps': {
      const imp = CARD_MAP['demon_001'];
      for (let i = 0; i < 2 && myBoard.length < 4; i++) {
        myBoard.push({ ...imp, currentHp: imp.hp, currentAtk: imp.atk, exhausted: false });
      }
      break;
    }
    case 'battlecry_destroy_all':
      while (foeBoard.length > 0) killDemon(foeBoard, foeDis, foeBoard[foeBoard.length-1], state, me ? 'enemy' : 'player');
      break;
  }
}

function resolveSpell(card, who, state) {
  const me = who === 'player';
  const myBoard  = me ? state.pBoard : state.eBoard;
  const foeBoard = me ? state.eBoard : state.pBoard;
  const foeDis   = me ? state.eDiscard : state.pDiscard;
  const myDis    = me ? state.pDiscard : state.eDiscard;

  switch (card.effect) {
    case 'damage':
      if (me) state.enemyLife -= card.value; else state.playerLife -= card.value; break;
    case 'heal':
      if (me) state.playerLife = Math.min(10, state.playerLife + card.value);
      else    state.enemyLife  = Math.min(10, state.enemyLife  + card.value); break;
    case 'draw':
      if (me) drawCards(state.pDeck, state.pHand, state.pDiscard, card.value);
      else    for (let i=0;i<card.value;i++) drawCards(state.eDeck, state.eHand, state.eDiscard,1); break;
    case 'destroy':
      if (foeBoard.length) killDemon(foeBoard, foeDis, foeBoard.reduce((a,b)=>a.currentHp<b.currentHp?a:b), state, me?'enemy':'player'); break;
    case 'aoe_enemy':
      foeBoard.forEach(d => d.currentHp -= card.value);
      cleanBoard(foeBoard, foeDis, state, me?'enemy':'player'); break;
    case 'aoe_demon_dmg':
      foeBoard.forEach(d => d.currentHp -= card.value);
      cleanBoard(foeBoard, foeDis, state, me?'enemy':'player'); break;
    case 'aoe_all_hp':
      [...state.pBoard,...state.eBoard].forEach(d => d.currentHp -= card.value);
      cleanBoard(state.pBoard, state.pDiscard, state, 'player');
      cleanBoard(state.eBoard, state.eDiscard, state, 'enemy'); break;
    case 'buff_hp':
      if (myBoard.length) myBoard[myBoard.length-1].currentHp += card.value; break;
    case 'buff_atk_all':
      myBoard.forEach(d => d.currentAtk += card.value); break;
    case 'debuff_atk':
      if (foeBoard.length) { const t = foeBoard.reduce((a,b)=>a.currentAtk>b.currentAtk?a:b); t.currentAtk = Math.max(0, t.currentAtk - card.value); } break;
    case 'resurrect':
      if (me && myDis.length) { const t = myDis.pop(); state.pHand.push(t); } break;
    case 'mana_boost':
      if (me) state.playerMana += card.value; break;
    case 'summon_imp': {
      const imp = CARD_MAP['demon_001'];
      if (imp && myBoard.length < 4) myBoard.push({...imp, currentHp:imp.hp, currentAtk:imp.atk, exhausted:false}); break;
    }
    case 'win_condition':
      if (me && state.enemyLife <= card.value) state.enemyLife = 0; break;
    case 'life_per_demon':
      if (me) state.playerLife = Math.min(10, state.playerLife + myBoard.length * card.value); break;
  }
}

// Greedy AI: pitch all except best demon, play it, attack
function aiTurn(who, state) {
  const me = who === 'player';
  const myBoard   = me ? state.pBoard   : state.eBoard;
  const myHand    = me ? state.pHand    : state.eHand;
  const myDiscard = me ? state.pDiscard : state.eDiscard;
  const myDeck    = me ? state.pDeck    : state.eDeck;
  const foeBoard  = me ? state.eBoard   : state.pBoard;
  const foeDis    = me ? state.eDiscard : state.pDiscard;
  const foeLife   = me ? ()=>state.enemyLife  : ()=>state.playerLife;
  const setFoeLife = me ? v=>state.enemyLife=v : v=>state.playerLife=v;
  const myLife    = me ? ()=>state.playerLife : ()=>state.enemyLife;
  const setMyLife = me ? v=>state.playerLife=v : v=>state.enemyLife=v;

  // Refresh exhaustion
  myBoard.forEach(d => d.exhausted = false);
  let mana = 0;

  // Find best demon to play
  const totalMana = mana + myHand.reduce((s,c)=>s+(c.manaValue||1),0);
  let target = myHand
    .filter(c => c.type==='demon' && c.cost<=totalMana && myBoard.length<4)
    .sort((a,b) => b.cost - a.cost)[0];
  if (!target) target = myHand
    .filter(c => c.type==='spell' && c.cost<=totalMana)
    .sort((a,b) => b.cost - a.cost)[0];

  // Pitch everything except target
  [...myHand].filter(c => c!==target).forEach(c => {
    mana += c.manaValue || 1;
    myHand.splice(myHand.indexOf(c),1);
    myDiscard.push(c);
  });

  // Play target
  if (target && target.cost <= mana) {
    mana -= target.cost;
    myHand.splice(myHand.indexOf(target),1);
    if (target.type === 'demon') {
      const hasHaste = target.ability && target.ability.includes('haste');
      myBoard.push({...target, currentHp:target.hp, currentAtk:target.atk, exhausted:!hasHaste});
      resolveBattlecry(target, who, state);
    } else {
      resolveSpell(target, who, state);
      myDiscard.push(target);
    }
  } else if (target) {
    myHand.splice(myHand.indexOf(target),1);
    myDiscard.push(target);
  }

  // Discard remaining hand, draw 5
  myDiscard.push(...myHand);
  myHand.length = 0;
  drawCards(myDeck, myHand, myDiscard, 5);

  // Attack phase
  [...myBoard].forEach(demon => {
    if (!myBoard.includes(demon) || demon.exhausted) return;
    demon.exhausted = true;
    const isUnblockable = demon.ability && demon.ability.includes('unblockable');

    if (foeBoard.length > 0 && !isUnblockable) {
      const tauntTargets = foeBoard.filter(d => d.ability && d.ability.includes('taunt'));
      const pool = tauntTargets.length > 0 ? tauntTargets : foeBoard;
      const t = pool.reduce((a,b) => a.currentHp < b.currentHp ? a : b);

      const dmgToT = demon.currentAtk;
      const dmgToD = t.currentAtk;
      t.currentHp    -= dmgToT;
      demon.currentHp -= dmgToD;

      if (demon.ability && demon.ability.includes('rage') && dmgToD > 0)  demon.currentAtk++;
      if (t.ability     && t.ability.includes('rage')     && dmgToT > 0) t.currentAtk++;
      if (demon.ability && demon.ability.includes('lifesteal')) setMyLife(Math.min(10, myLife() + dmgToT));
      if (demon.ability && demon.ability.includes('poisonous') && t.currentHp > 0) t.currentHp = 0;

      if (demon.currentHp <= 0) killDemon(myBoard,  myDiscard, demon, state, who);
      if (t.currentHp    <= 0) killDemon(foeBoard, foeDis,    t,     state, me?'enemy':'player');
    } else {
      const dmg = demon.currentAtk;
      setFoeLife(foeLife() - dmg);
      if (demon.ability && demon.ability.includes('lifesteal')) setMyLife(Math.min(10, myLife() + dmg));
    }
  });
}

// ── Run a single battle ─────────────────────────────────────────────────────
function runBattle(deckA, deckB, aGoesFirst) {
  const state = {
    playerLife: 10, enemyLife: 10,
    playerMana: 0,  enemyMana: 0,
    pBoard: [], eBoard: [],
    pDiscard: [], eDiscard: [],
  };
  state.pDeck = shuffle(deckA);
  state.eDeck = shuffle(deckB);
  state.pHand = []; drawCards(state.pDeck, state.pHand, state.pDiscard, 5);
  state.eHand = []; drawCards(state.eDeck, state.eHand, state.eDiscard, 5);

  // Going-second bonus
  if (!aGoesFirst) state.playerMana = 1; else state.enemyMana = 1;

  let turn = 0;
  const MAX_TURNS = 60;

  while (state.playerLife > 0 && state.enemyLife > 0 && turn < MAX_TURNS) {
    const whoseTurn = (turn % 2 === 0) ? (aGoesFirst ? 'player' : 'enemy') : (aGoesFirst ? 'enemy' : 'player');
    aiTurn(whoseTurn, state);
    turn++;
  }

  return {
    winner: state.playerLife <= 0 ? 'enemy' : state.enemyLife <= 0 ? 'player' : 'draw',
    turns: Math.floor(turn / 2),
    playerLifeLeft: state.playerLife,
    enemyLifeLeft: state.enemyLife,
  };
}

// ── Run simulation ──────────────────────────────────────────────────────────
const N = parseInt(process.argv[2] || '200');
const results = { player: 0, enemy: 0, draw: 0 };
const turnCounts = [];
const lifeLeftWinner = [];
const stats = {
  starterVsAggro:   { w:0, l:0, d:0 },
  starterVsControl: { w:0, l:0, d:0 },
  aggroVsControl:   { w:0, l:0, d:0 },
};

// Track per-ability effectiveness
const abilityStats = {};
CARDS.filter(c=>c.type==='demon'&&c.ability).forEach(c => {
  if (!abilityStats[c.ability]) abilityStats[c.ability] = { wins:0, games:0 };
});

for (let i = 0; i < N; i++) {
  const matchup = i % 3;
  const aGoesFirst = Math.random() < 0.5;

  let deckA, deckB, matchupKey;
  if (matchup === 0) { deckA = STARTER_DECK; deckB = AGGRO_DECK; matchupKey = 'starterVsAggro'; }
  else if (matchup === 1) { deckA = STARTER_DECK; deckB = CONTROL_DECK; matchupKey = 'starterVsControl'; }
  else { deckA = AGGRO_DECK; deckB = CONTROL_DECK; matchupKey = 'aggroVsControl'; }

  const r = runBattle(deckA, deckB, aGoesFirst);
  results[r.winner]++;
  turnCounts.push(r.turns);
  stats[matchupKey][r.winner === 'player' ? 'w' : r.winner === 'enemy' ? 'l' : 'd']++;
  lifeLeftWinner.push(r.winner === 'player' ? r.playerLifeLeft : r.enemyLifeLeft);
}

const avgTurns = (turnCounts.reduce((a,b)=>a+b,0) / N).toFixed(1);
const avgLife  = (lifeLeftWinner.reduce((a,b)=>a+b,0) / N).toFixed(1);
const shortGames = turnCounts.filter(t=>t<=3).length;
const longGames  = turnCounts.filter(t=>t>=15).length;

console.log('\n══════════════════════════════════════════════════════');
console.log(`  BATTLE SIMULATION — ${N} games`);
console.log('══════════════════════════════════════════════════════');
console.log(`\n  Overall: Player wins ${results.player} | Enemy wins ${results.enemy} | Draws ${results.draw}`);
console.log(`  Win rate Player A (deck1): ${(results.player/N*100).toFixed(1)}%`);
console.log(`\n  Avg game length: ${avgTurns} turns`);
console.log(`  Avg life left for winner: ${avgLife}/10`);
console.log(`  Short games (≤3 turns): ${shortGames} (${(shortGames/N*100).toFixed(1)}%)`);
console.log(`  Long games (≥15 turns): ${longGames} (${(longGames/N*100).toFixed(1)}%)`);

console.log('\n  ── Matchup breakdown ──────────────────────────────');
console.log(`  Starter vs Aggro:   W ${stats.starterVsAggro.w}  L ${stats.starterVsAggro.l}  D ${stats.starterVsAggro.d}`);
console.log(`  Starter vs Control: W ${stats.starterVsControl.w}  L ${stats.starterVsControl.l}  D ${stats.starterVsControl.d}`);
console.log(`  Aggro vs Control:   W ${stats.aggroVsControl.w}  L ${stats.aggroVsControl.l}  D ${stats.aggroVsControl.d}`);

console.log('\n  ── Turn distribution ──────────────────────────────');
const hist = {};
turnCounts.forEach(t => { const b = Math.floor(t/3)*3; hist[b]=(hist[b]||0)+1; });
Object.keys(hist).sort((a,b)=>+a-+b).forEach(k => {
  const bar = '█'.repeat(Math.round(hist[k]/N*40));
  console.log(`  T${String(+k).padStart(2)}-${+k+2}: ${bar} ${hist[k]}`);
});

console.log('\n  ── Balance flags ──────────────────────────────────');
const issues = [];
if (shortGames / N > 0.15) issues.push(`⚠ Too many short games (${(shortGames/N*100).toFixed(0)}% end in ≤3 turns) — aggro is TOO fast`);
if (longGames  / N > 0.20) issues.push(`⚠ Too many long games (${(longGames/N*100).toFixed(0)}% last ≥15 turns) — control too defensive`);
if (avgLife > 7) issues.push(`⚠ Winner has too much life left (${avgLife}/10) — games not close enough`);
if (avgLife < 2) issues.push(`⚠ Games too swingy — winner barely survives (avg ${avgLife}/10 life left)`);
if (stats.starterVsAggro.l / (N/3) > 0.70) issues.push('⚠ Aggro crushes Starter — Starter needs more cheap blockers or removal');
if (stats.starterVsControl.l / (N/3) > 0.70) issues.push('⚠ Control crushes Starter — add more card draw / late-game to Starter');
if (stats.aggroVsControl.w / (N/3) > 0.75) issues.push('⚠ Aggro beats Control too easily — Control needs more early taunts');
if (stats.aggroVsControl.l / (N/3) > 0.75) issues.push('⚠ Control crushes Aggro — reduce Wraith/Golem HP or add more aggro haste');

if (issues.length === 0) issues.push('✓ No major balance issues detected');
issues.forEach(i => console.log('  ' + i));
console.log('\n══════════════════════════════════════════════════════\n');
