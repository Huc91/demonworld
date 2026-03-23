/**
 * Quest definitions for BloodDungeon — Devil Summoner
 *
 * Quest status flow:
 *   'locked'   → not yet available (prereq not complete)
 *   'active'   → available, in progress
 *   'complete' → objective met, reward not yet claimed
 *   'claimed'  → reward taken
 *
 * NPC positions are in WORLD PIXEL coords (tileX * 32 + 16)
 */
window.QUESTS = [
  {
    id: 'q001',
    name: 'First Blood',
    npc: 'Elder Seraphon',
    npcTileX: 120, npcTileY: 109,   // Main town plaza
    description: 'The wilderness beyond our walls teems with darkness.\nProve yourself — defeat 3 enemies.',
    objective: { type: 'kill_any', count: 3 },
    reward: { gold: 300, card: 'demon_007', xp: 0 },
    prereq: null,
    dialogue: {
      locked:    'Rest, traveller.',
      active:    'Go forth — defeat 3 enemies in the wilds and return. Roger walked this same road twenty years ago.',
      complete:  'You returned. Most don\'t. Accept this — and keep looking for what Roger left behind.',
      claimed:   '"He who fights, may lose. He who does not fight, has already lost." — R.D. Roger',
    },
  },
  {
    id: 'q002',
    name: 'Swamp Plague',
    npc: 'Swamp Hermit Grak',
    npcTileX: 33, npcTileY: 158,    // Swamp path campfire
    description: 'Something ancient stirs in the swamp.\nEliminate 3 powerful creatures lurking here.',
    objective: { type: 'kill_hard', count: 3 },
    reward: { gold: 600, card: 'demon_015', xp: 0 },
    prereq: 'q001',
    dialogue: {
      locked:    '...(the hermit stares into the water)',
      active:    'Three of the old ones. Deep in the swamp. Kill \'em and I\'ll tell you what I saw Roger carry through here.',
      complete:  'Good. He carried a card in a sealed box. Said it was "the first and last". Then he laughed.',
      claimed:   'The swamp remembers everything. Especially mistakes.',
    },
  },
  {
    id: 'q003',
    name: 'Echoes of the Old War',
    npc: 'Scholar Aldus',
    npcTileX: 197, npcTileY: 72,    // Village 2 plaza
    description: 'The desert ruins hold relics of the war between demons and humans.\nRecover 4 chests from the ruins.',
    objective: { type: 'open_chests', count: 4 },
    reward: { gold: 900, card: 'demon_020', xp: 0 },
    prereq: 'q001',
    dialogue: {
      locked:    'I\'m trying to decipher something. Not now.',
      active:    'The ruins hold cards from before the Sealing. Recover 4 chests — the fragments inside will tell you what we are.',
      complete:  'You found them. Read the inscriptions carefully. The old text says: "The last demons perfected themselves. They called the result: humanity."',
      claimed:   '"We didn\'t defeat the demons. We became them." — Aldus, personal notes',
    },
  },
  {
    id: 'q004',
    name: 'Into the Dungeon',
    npc: 'Captain Vorn',
    npcTileX: 188, npcTileY: 46,    // Dungeon 1 approach campfire
    description: 'The dungeon boss has slaughtered every card-hunter sent to find Roger\'s trail.\nEnd it.',
    objective: { type: 'kill_boss_id', bossId: 'boss_dungeon1' },
    reward: { gold: 1200, card: 'demon_025', xp: 0 },
    prereq: 'q002',
    dialogue: {
      locked:    'This is a restricted area.',
      active:    'Roger entered this dungeon. The boss inside fought him to a draw — and Roger just... smiled. Kill it.',
      complete:  'You did it. Among the boss\'s hoard I found this note: "The card cannot be held by fear. Only by understanding." — R.D.R.',
      claimed:   'What does it mean? I don\'t know. But Roger did.',
    },
  },
  {
    id: 'q005',
    name: 'The Graveyard King',
    npc: 'Grave Warden Mirra',
    npcTileX: 169, npcTileY: 153,   // Graveyard path campfire
    description: 'A cursed king rises every generation in the graveyard mausoleum.\nHe knows where Roger hid something.',
    objective: { type: 'kill_boss_id', bossId: 'boss_graveyard' },
    reward: { gold: 1400, card: 'demon_030', xp: 0 },
    prereq: 'q003',
    dialogue: {
      locked:    'The mausoleum is sealed. You are not ready.',
      active:    'The Graveyard King was present at the First Sealing. He has lived and died a thousand times. He whispers Roger\'s name.',
      complete:  'You bested him. Before fading, he said: "The god card is not a weapon. It is a question. Are you ready for the answer?"',
      claimed:   '"Between living and dying is a door. Roger walked through it." — Mirra',
    },
  },
  {
    id: 'q006',
    name: 'Champion of the Sands',
    npc: 'Arena Master Dusk',
    npcTileX: 250, npcTileY: 92,    // Deep desert outpost campfire
    description: 'The Desert Arena Champion holds one of the last known clues to Roger\'s card.\nDefeat them.',
    objective: { type: 'kill_boss_id', bossId: 'boss_desert' },
    reward: { gold: 2000, card: 'demon_036', xp: 0 },
    prereq: 'q004',
    dialogue: {
      locked:    'This arena is not for the unprepared.',
      active:    'The Champion has a tattoo — a map Roger burned into his skin as payment for a duel. Win. Take the map.',
      complete:  'Remarkable. The tattoo says: "Where the first fire died, before the first wall was built, look down." That\'s... the spawn point.',
      claimed:   '"The answer was always where you started." — Arena Master Dusk',
    },
  },
  {
    id: 'q007',
    name: 'The Card King',
    npc: 'Elder Seraphon',
    npcTileX: 120, npcTileY: 109,   // Main town plaza — same NPC as q001
    description: 'Five bosses. Five sealed truths. Five fragments of a shattered god.\nDefeat all 5 bosses. Then claim your destiny.',
    objective: { type: 'defeat_bosses', count: 5 },
    reward: { gold: 5000, card: 'god_card', xp: 0 },
    prereq: 'q006',
    dialogue: {
      locked:    '...',
      active:    'I know what you seek. I\'ve always known. Five truths remain. Five seals. When they all break — you will understand everything. And you will have to choose.',
      complete:  'It is done. The god\'s fragments remember you. The Card King\'s crown is not gold. It is weight. Infinite, terrible weight.\n\nWhat you hold is not a card. It is a mirror. And what you see in it — that is what you must decide to do with creation itself.\n\n...Are you ready?',
      claimed:   '"Roger found it. Wept for three days. Then sealed it again and set it free into the world. He said: \'It\'s not mine. It\'s everyone\'s.\'" — Seraphon, whispering',
    },
  },
];

// Build quick lookup
window.QUEST_MAP = {};
window.QUESTS.forEach(q => { window.QUEST_MAP[q.id] = q; });

/**
 * Returns the initial quests progress state.
 * q001 is 'active', all others 'locked'.
 */
window.initQuestState = function() {
  const state = {};
  window.QUESTS.forEach((q, i) => {
    state[q.id] = {
      status: i === 0 ? 'active' : 'locked',
      progress: 0,
    };
  });
  return state;
};

/**
 * Check and advance quest progress after a kill/chest event.
 * @param {object} event  { type: 'kill'|'chest', difficulty, isBoss, bossId }
 * @returns {Array} array of quest IDs that changed status (for notifications)
 */
window.advanceQuests = function(event) {
  const qs = window.GameState.questProgress;
  if (!qs) return [];
  const changed = [];

  window.QUESTS.forEach(quest => {
    const state = qs[quest.id];
    if (!state || state.status !== 'active') return;

    const obj = quest.objective;
    let progressed = false;

    if (obj.type === 'kill_any' && event.type === 'kill') {
      state.progress++;
      progressed = true;
    } else if (obj.type === 'kill_hard' && event.type === 'kill' &&
               (event.difficulty === 'hard' || event.difficulty === 'boss')) {
      state.progress++;
      progressed = true;
    } else if (obj.type === 'kill_boss_id' && event.type === 'kill' &&
               event.bossId === obj.bossId) {
      state.progress = obj.count || 1;
      progressed = true;
    } else if (obj.type === 'defeat_bosses' && event.type === 'kill' && event.isBoss) {
      state.progress++;
      progressed = true;
    } else if (obj.type === 'open_chests' && event.type === 'chest') {
      state.progress++;
      progressed = true;
    }

    if (progressed) {
      const needed = obj.count || 1;
      if (state.progress >= needed && state.status === 'active') {
        state.status = 'complete';
        changed.push(quest.id);
        // Auto-give reward and unlock next quests
        window.GameState.playerMoney += quest.reward.gold;
        if (quest.reward.card) {
          window.GameState.playerCollection.push(quest.reward.card);
          if (window.GameState.playerDeck.length < 40) {
            window.GameState.playerDeck.push(quest.reward.card);
          }
        }
        state.status = 'claimed';
        // Unlock quests whose prereq is now met
        window.QUESTS.forEach(q2 => {
          if (q2.prereq === quest.id && qs[q2.id] && qs[q2.id].status === 'locked') {
            qs[q2.id].status = 'active';
            changed.push(q2.id + '_unlocked');
          }
        });
      }
    }
  });

  return changed;
};
