# BloodDungeon — Developer Diary

## 2026-03-15 — Day 1: Project Birth

**What we built today:**
Started from a single `game.md` spec file and built the entire game skeleton in one session.

### Stack decision
Pure HTML5 + Phaser 3 (CDN). No build tools, no bundler, no npm. Open `index.html` and play. Zero friction.

### Architecture
```
index.html
js/
  cards.js          — 37 card definitions (demons + spells)
  enemies.js        — 10 enemy types (level 1–10, 3 bosses)
  scenes/
    PreloadScene.js — generates ALL assets programmatically (no image files)
    WorldScene.js   — tile map, player, enemy wander AI, battle trigger
    BattleScene.js  — full card game engine
    HUDScene.js     — persistent overlay (money, deck count)
  main.js           — Phaser config + GameState global
```

### Biggest design challenge: the mana system
The card game in `game.md` says *"every card can be played to generate 1/2/3 mana, OR be played for its effect"*. This means every card in hand is a binary choice:
- Sacrifice it as fuel (always available)
- Pay its cost to trigger its power

This creates constant interesting decisions — do you hold your Legendary for when you can afford it, or burn it for 3 mana now? Implemented via `manaValue` field on each card and a two-button action popup (MANA / PLAY) that appears on click.

### Map generation
80×60 tile grid (2560×1920 world). Generated entirely in JS — no Tiled, no JSON tilemaps. Zone logic builds:
- A walled town at center
- A river with a bridge crossing
- A dungeon area to the north-east
- A swamp to the south-west
- Dirt path network connecting zones

### Programmatic art
Every sprite — player, all 10 enemy types, tile textures, card frames — drawn with Phaser `Graphics.generateTexture()`. The game has zero external image dependencies.

### Enemy AI (battle)
Greedy: plays the most expensive demon it can afford first, then spells. Attacks the weakest player demon (to trade efficiently), or hits face when board is empty. Simple but creates decent games.

### What's missing / next session:
- [ ] Shop: buy booster packs with gold
- [ ] Deck builder UI (view collection, edit deck)
- [ ] Quest system (NPCs in town)
- [ ] Boss intro cutscenes / special boss abilities
- [ ] Card animations (draw, summon, attack)
- [ ] Sound effects (Phaser Web Audio)
- [ ] Save/load (localStorage)
- [ ] Area-locked content (Metroidvania gates needing boss rewards)
- [ ] More cards (60+ target)
- [ ] Rare card spawns hidden in map corners

---

## 2026-03-15 — Day 1 continued: Bug fixes + Menu

### BattleScene rewrite (second pass)
**Root cause of invisible cards:** `cg.getAll()` extracts children from a sub-container but strips their parent's position — all 5 hand cards rendered at world (0,0) in the top-left corner behind the background. Fixed by switching to direct scene rendering: every graphic object gets its coordinates in screen-space at creation, stored in `_handObjs[]`/`_pbObjs[]`/`_ebObjs[]` arrays, cleared and rebuilt on each render pass.

**Root cause of hover crash:** `statTxt`/`spellTxt` declared inside `if/else` blocks with `const` — the hover closure couldn't access them (block scope). Fixed by using a single `infoLine` variable in the outer function scope.

**Root cause of stat clipping:** Cards centered at `cy=582` with height 108 → bottom at y=636, 4px below screen. Fixed `cy=568` and hand zone starting at `y=505`.

**Root cause of `Graphics.setY()` not working:** Graphics drawing commands use absolute world coordinates. Moving the object origin doesn't move the drawn content. Removed the Y-shift hover animation entirely — hover now just changes border color.

### MenuScene added
Press `M` or `ESC` in the overworld to open the menu. Three tabs:
- **COLLECTION**: grid view of all owned cards with counts
- **DECK BUILDER**: left = collection, click to add; right = current deck, click `[-]` to remove
- **SHOP**: 4 pack types (Basic 30G → Devil 200G) with weighted rarity rolls. Shows cards from last opened pack.

---

## 2026-03-15 — Day 1 continued: Real pixel art + bigger world

### Pixel art sprites (PreloadScene complete rewrite)
- Replaced all `generateTexture()` geometric shapes with a `px(key, rows, pal)` canvas pixel-art helper
- Each char in a row = one 2×2 macro-pixel on a 32px canvas → 16×16 effective resolution, NES-style
- **Tiles**: grass, dirt, water, stone wall, dungeon floor, top-down tree, mountain, sand, graveyard grass
- **Characters**: player (blue shirt, brown hair, top-down), 10 enemy types each with distinct shape/color
- **Card art**: 7 base artworks keyed by type+rarity (demon:common/uncommon/rare/legendary, spell:damage/heal/utility)
- BattleScene now uses `artKey(card)` to resolve to the correct pixel art texture; `this.add.image()` replaces all geometry in hand/board/zoom/drag-ghost rendering

### Open world expansion (WorldScene rewrite)
- Map: **160×100 tiles** (5120×3200 px world — 4× bigger than before)
- New zones added:
  - **Mountain range** (north, rows 10-12) with a narrow mountain pass at cols 65-70
  - **Desert ruins** (east, cols 100-155) — two ruined fortresses in the sand
  - **Graveyard** (south-east, cols 72-100) — walled, with central mausoleum
  - **Second village** (north-east, near desert edge)
  - Swamp path (raised dirt through swamp), expanded dungeon complex
- More enemy spawn points spread across all zones (32 total vs 21 before)
- Bosses: Shadow Lord in dungeon, Arena Champ in deep desert, Devil King near graveyard
- Camera zoom 1.2× for tighter retro feel; boss sprites pulse red/orange via tween
- Boss AI occasionally charges toward player within 800px

### Architecture notes
- `px()` is robust: uses `rows[0].length` as canonical width, truncates longer rows safely
- Sprite textures are 34×32 (17 chars × 2px) vs tile textures 32×32 (16 chars × 2px) — fine for Phaser

---

## Session notes / decisions log

**Why no build tools?** The spec says open-world RPG — the priority was getting something playable. CDN Phaser + `<script>` tags gets there in minutes. Can always migrate to Vite later.

**Why 4 board slots?** Fits cleanly at 960px width (4 × ~90px with gaps). Can expand to 5 if needed.

**Why tiles are 32px?** Standard. 80×60 tiles @ 32px = 2560×1920 world — big enough to feel open, small enough to render fine with Phaser's sprite batching.

**Player starts with a starter deck** because `GameState.playerDeck` comes from `STARTER_DECK` — a balanced 30-card set of cheap demons and utility spells. The player upgrades it by winning cards in battles.


---

## 2026-03-23 — Milestone 1: Core Infrastructure

### Features Added

**Title Screen (TitleScene.js)**
- Animated starfield background (220 twinkling stars)
- Blood moon top-right with multi-layer glow
- Castle/dungeon silhouette with lit windows
- "DEVIL SUMMONER" pulsing title, "BLOODDUNGEON" subtitle
- NEW GAME / CONTINUE buttons (CONTINUE auto-detects localStorage save)
- Lore teaser: "Twenty years ago, Roger hid the most powerful card ever made..."

**Save/Load System (main.js)**
- window.saveGame() — serializes GameState to localStorage (blooddungeon_save)
- window.loadGame() — deserializes and restores all state gracefully
- window.resetGameState() — fresh GameState factory
- Auto-save after every battle win and chest open

**Quest System (quests.js + WorldScene + MenuScene + HUDScene)**
- 7 quests with chain prereqs and escalating rewards
- Types: kill_any, kill_hard, kill_boss_id, defeat_bosses, open_chests
- window.initQuestState() / window.advanceQuests(event) — clean API
- Pop-up notifications on completion, unlock notifications for new quests
- QUESTS tab in MenuScene with progress bars, status badges, NPC names, rewards
- Active quest tracker in HUD bottom-left

**NPC System (WorldScene.js)**
- buildNPCs() — spawns at all quest-giver positions from QUESTS data
- Procedural purple-mage NPC texture (32x32)
- Bobbing animation + yellow ! marker for active quests
- _talkToNPC() — context-aware dialogue box based on quest status
- _dialogueActive guard prevents re-triggering

**Story / Lore: One Piece + Dark Souls tone**
- Osiris piece flavor texts: cryptic Poneglyph-style inscriptions hinting at the war
- God Card added (god_card) — Roger D. Richard's legendary card, final quest reward
- Central mystery: "Humans ARE demons. The last perfected form. They killed god."
- Becoming Card King = becoming god. Final choice: destroy world or rebuild.
- Quest dialogues build the mystery across 7 conversations

**Bugs Fixed**
- buildAnimals() never called in create() — now called
- Enemy spawnId not tracked — now set on sprite, stored in GameState.currentEnemySpawnId
- Quest progress not initialized on startup — fixed
- F key guard during dialogue — won't re-trigger interact while dialog open
- Screen shake added on battle encounter (cameras.main.shake)
- BattleScene passes enemyDef + bossId in battleWon event


---

## 2026-03-23 — Milestone 4: Visual Polish + God Card Ending

### BattleScene: Death Particles
- Added `_spawnDeathParticles(cx, cy, color)` — 14 circular fragments + central white flash, all tween-animated and auto-destroyed
- Integrated into `killFrom()` and `killFromPlayer()` — particles spawn at the exact card position before removal
- Purple burst for player demons, red burst for enemy demons
- Added `_boardDemonX(board, idx)` helper to calculate card center X from board layout constants
- Added `_flashScreen(color, alpha)` — full-screen color flash that fades in 280ms
- Red screen flash when player takes face damage (enemy attacks directly)
- Gold/orange flash when player's demon attacks enemy face
- Victory burst on win screen: 20 particles (40 for boss kills) in gold/white/green
- "BOSS SLAIN!" label instead of "VICTORY!" when killing a boss

### WorldScene: God Card Ending Sequence
- `_triggerGodCardEnding()` — checks `_godCardShown` flag to prevent double-trigger; pauses physics, dims world to near-black with 1.8s fade
- `_showGodCardText()` — radiating gold burst lines; staggered text reveal: "YOU FOUND IT." → "R O G E R'S CARD" → "THE GOD CARD" → cryptic quote → "CARD KING" title
- `_showGodCardChoice()` — two buttons after 5.5s: "REBUILD THE WORLD" (green) and "UNMAKE IT ALL" (red)
- `_godCardOutcome(choice)` — each choice triggers a unique ending text sequence (rebuild = hope, unmake = cosmic silence); auto-fades to title screen after 9s and clears save

### Architecture Notes
- Ending sequences use delayedCall chaining instead of complex state machines — clean and easy to iterate
- `_boardDemonX()` mirrors the render logic so particle position matches card visually even when board is partially filled
- `_flashScreen()` lives at depth 97, below particles (99) and popups — won't interfere with UI
