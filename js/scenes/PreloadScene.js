class PreloadScene extends Phaser.Scene {
  constructor() { super({ key: 'PreloadScene' }); }

  preload() {
    // ── GBA-quality real assets (all gracefully fall back to procedural art) ──
    this.load.image('pk_tileset2',
      'resources/pk_tileset/Game%20Boy%20Advance%20-%20Pokemon%20FireRed%20_%20LeafGreen%20-%20Tilesets%20-%20Tileset%202.png');
    this.load.image('mw_walls',
      'resources/mystic_woods_free_2.2/sprites/tilesets/walls/walls.png');
    this.load.image('mw_grass',
      'resources/mystic_woods_free_2.2/sprites/tilesets/grass.png');
    this.load.image('mw_plains',
      'resources/mystic_woods_free_2.2/sprites/tilesets/plains.png');
    this.load.image('mw_decor',
      'resources/mystic_woods_free_2.2/sprites/tilesets/decor_16x16.png');
    this.load.image('mw_chest',
      'resources/mystic_woods_free_2.2/sprites/objects/chest_01.png');
    // Mystic Woods characters (48×48 frames)
    this.load.spritesheet('mw_player',
      'resources/mystic_woods_free_2.2/sprites/characters/player.png',
      { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('mw_skeleton',
      'resources/mystic_woods_free_2.2/sprites/characters/skeleton.png',
      { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('mw_slime',
      'resources/mystic_woods_free_2.2/sprites/characters/slime.png',
      { frameWidth: 48, frameHeight: 48 });
    for (let i = 1; i <= 10; i++) {
      this.load.spritesheet('char_' + i,
        'resources/character-pack-full_version/sprite_split/character_' + i +
        '/character_' + i + '_frame32x32.png',
        { frameWidth: 32, frameHeight: 32 });
    }

    // Monsty art — matched by visual to card name/subtype
    const MONSTY = {
      'demon_001': 'NB_13', // Imp            — red spiky demon
      'demon_002': 'NB_30', // Hellhound      — red/gold lion fire mane
      'demon_003': 'NB_03', // Plague Rat     — spiky hedgehog/beast
      'demon_004': 'NB_04', // Shadow Hound   — blue wolf/dark
      'demon_005': 'NB_23', // Bone Knight    — dark blue armored beast
      'demon_006': 'NB_10', // Specter        — pink ghost blob
      'demon_007': 'NB_16', // Succubus       — butterfly/barbed wings demon
      'demon_008': 'NB_17', // Blood Bat      — chubby horned dark creature
      'demon_009': 'NB_02', // Golem          — gray armored golem
      'demon_010': 'NB_09', // Cerberus       — orange scorpion/fire beast
      'demon_011': 'NB_08', // Wraith         — purple ghost with hat
      'demon_012': 'NB_01', // Minotaur       — bear-like hulking beast
      'demon_013': 'NB_12', // Ember Drake    — gold dragon with spikes
      'demon_014': 'NB_14', // Sand Ghoul     — green reptilian beast
      'demon_015': 'NB_25', // Void Crawler   — black void diamond shapes
      'demon_016': 'NB_28', // Nightmare      — purple demon snake/coil
      'demon_017': 'NB_21', // Iron Djinn     — white/blue ghost light form
      'demon_018': 'NB_24', // Dusk Faerie    — fluffy creature with tail
      'demon_019': 'NB_26', // Pit Fiend      — red/orange blob spikes fire
      'demon_020': 'NB_07', // Medusa         — green serpent beast
      'demon_021': 'NB_15', // Lich King      — red/blue demonic dark creature
      'demon_022': 'NB_18', // Beelzebub      — green spiky dark creature
      'demon_023': 'NB_13', // Baphomet       — already used, fallback NB_11
      'demon_024': 'NB_05', // Mana Wisp      — white/green blob light
      'demon_025': 'NB_20', // Mana Wraith    — white/blue snowman ice
      'demon_026': 'NB_19', // Mana Titan     — blue/white cloud light
      'demon_027': 'NB_27', // Blood Banner   — sturdy beast figure
      'demon_028': 'NB_29', // Iron Sigil     — white/tan light creature
      'demon_029': 'NB_11', // Warlord        — armored turtle/rock beast
      'demon_030': 'NB_06', // Death Knell    — green slime primordial
    };
    // Fix duplicate: Baphomet gets NB_11 (armored), Warlord gets NB_22
    MONSTY['demon_023'] = 'NB_22'; // Baphomet — blue octopus with horns dark
    MONSTY['demon_029'] = 'NB_11'; // Warlord  — armored shell beast

    // ── Extended demon set (demon_031–105) ───────────────────────────────
    // Osiris parts (legendary gold forms)
    MONSTY['demon_031'] = 'NB_28'; MONSTY['demon_032'] = 'NB_21';
    MONSTY['demon_033'] = 'NB_19'; MONSTY['demon_034'] = 'NB_20';
    MONSTY['demon_035'] = 'NB_27';
    // Shop / boss / special cards
    MONSTY['demon_036'] = 'NB_29'; // Tactician
    MONSTY['demon_037'] = 'NB_11'; // Mind Bender
    MONSTY['demon_038'] = 'NB_16'; // Sniper Fiend
    MONSTY['demon_039'] = 'NB_21'; // Hollow Mirror
    MONSTY['demon_040'] = 'NB_13'; // Imp Matron
    MONSTY['demon_041'] = 'NB_22'; // Equalizer
    MONSTY['demon_042'] = 'NB_30'; // Arch Demon
    MONSTY['demon_043'] = 'NB_01'; // Demon Overlord
    MONSTY['demon_044'] = 'NB_12'; // Chaos King Dragon
    MONSTY['demon_045'] = 'NB_16'; // Twin Fury
    // Dark subtype
    MONSTY['demon_046'] = 'NB_06'; // Grave Glutton
    MONSTY['demon_047'] = 'NB_07'; // Carrion Beetle
    MONSTY['demon_048'] = 'NB_05'; // Echo Scholar
    MONSTY['demon_049'] = 'NB_04'; // Shadow Raider
    MONSTY['demon_050'] = 'NB_08'; // Soul Collector
    MONSTY['demon_051'] = 'NB_10'; // Necrotic Wisp
    MONSTY['demon_052'] = 'NB_13'; // Blood Cultist
    MONSTY['demon_053'] = 'NB_15'; // Night Stalker
    MONSTY['demon_054'] = 'NB_08'; // Lich's Familiar
    MONSTY['demon_055'] = 'NB_03'; // Plague Bearer
    MONSTY['demon_056'] = 'NB_16'; // Specter Assassin
    MONSTY['demon_057'] = 'NB_22'; // Mind Shredder
    MONSTY['demon_058'] = 'NB_04'; // Dusk Predator
    MONSTY['demon_059'] = 'NB_26'; // Undying Fiend
    MONSTY['demon_060'] = 'NB_10'; // Larcenous Shade
    // Light subtype
    MONSTY['demon_061'] = 'NB_11'; // Iron Warden
    MONSTY['demon_062'] = 'NB_20'; // Celestial Healer
    MONSTY['demon_063'] = 'NB_12'; // Thunder Drake
    MONSTY['demon_064'] = 'NB_29'; // Radiant Sentinel
    MONSTY['demon_065'] = 'NB_05'; // Star Prophet
    MONSTY['demon_066'] = 'NB_29'; // Holy Knight
    MONSTY['demon_067'] = 'NB_21'; // Lightning Herald
    MONSTY['demon_068'] = 'NB_19'; // Gleaming Drake
    MONSTY['demon_069'] = 'NB_28'; // Angelic Guardian
    MONSTY['demon_070'] = 'NB_24'; // Seraph
    // Fire subtype
    MONSTY['demon_071'] = 'NB_13'; // Ember Thief
    MONSTY['demon_072'] = 'NB_13'; // Blaze Imp
    MONSTY['demon_073'] = 'NB_02'; // Lava Golem
    MONSTY['demon_074'] = 'NB_12'; // Infernal Drake
    MONSTY['demon_075'] = 'NB_26'; // Pyromancer
    MONSTY['demon_076'] = 'NB_01'; // Magma Titan
    MONSTY['demon_077'] = 'NB_13'; // Hellfire Imp
    MONSTY['demon_078'] = 'NB_05'; // Cinder Scholar
    MONSTY['demon_079'] = 'NB_30'; // Phoenix
    MONSTY['demon_080'] = 'NB_09'; // Lava Drake
    MONSTY['demon_081'] = 'NB_26'; // Fire Elemental
    MONSTY['demon_082'] = 'NB_01'; // Molten Giant
    // Water subtype
    MONSTY['demon_083'] = 'NB_07'; // Tidal Terror
    MONSTY['demon_084'] = 'NB_20'; // Frost Mage
    MONSTY['demon_085'] = 'NB_29'; // Ice Barrier
    MONSTY['demon_086'] = 'NB_07'; // Sea Serpent
    MONSTY['demon_087'] = 'NB_06'; // Arcane Leech
    MONSTY['demon_088'] = 'NB_19'; // Glacial Colossus
    MONSTY['demon_089'] = 'NB_05'; // River Sprite
    MONSTY['demon_090'] = 'NB_21'; // Storm Surge
    MONSTY['demon_091'] = 'NB_22'; // Kraken Spawn
    MONSTY['demon_092'] = 'NB_15'; // Deep Lurker
    // Beast subtype
    MONSTY['demon_093'] = 'NB_24'; // Mana Dryad
    MONSTY['demon_094'] = 'NB_03'; // Elder Treant
    MONSTY['demon_095'] = 'NB_01'; // Stampeding Bull
    MONSTY['demon_096'] = 'NB_07'; // Giant Spider
    MONSTY['demon_097'] = 'NB_04'; // Sabertooth
    MONSTY['demon_098'] = 'NB_02'; // Pack Alpha
    MONSTY['demon_099'] = 'NB_01'; // Thunderous Rex
    MONSTY['demon_100'] = 'NB_12'; // Elder Dragon
    MONSTY['demon_101'] = 'NB_04'; // Dire Wolf
    MONSTY['demon_102'] = 'NB_11'; // Ancient Tortoise
    MONSTY['demon_103'] = 'NB_12'; // Primal Dragon
    MONSTY['demon_104'] = 'NB_01'; // Forest Colossus
    MONSTY['demon_105'] = 'NB_03'; // Nest Warden

    // ── Inferno Island demons (demon_106–111) ─────────────────────────────
    MONSTY['demon_106'] = 'NB_13'; // Lava Imp         — red spiky demon
    MONSTY['demon_107'] = 'NB_09'; // Cinder Hound     — orange scorpion fire beast
    MONSTY['demon_108'] = 'NB_02'; // Magma Golem      — gray armored golem
    MONSTY['demon_109'] = 'NB_12'; // Inferno Drake    — gold dragon spikes
    MONSTY['demon_110'] = 'NB_26'; // Ember Phoenix    — red/orange blob fire
    MONSTY['demon_111'] = 'NB_30'; // Volcano Lord     — red/gold lion fire mane

    // ── Frost Wastes demons (demon_112–117) ──────────────────────────────
    MONSTY['demon_112'] = 'NB_03'; // Frost Rat        — spiky beast
    MONSTY['demon_113'] = 'NB_10'; // Blizzard Imp     — ghostly ethereal
    MONSTY['demon_114'] = 'NB_04'; // Glacier Drake    — blue dark wolf
    MONSTY['demon_115'] = 'NB_08'; // Frost Wraith     — purple ghost wraith
    MONSTY['demon_116'] = 'NB_29'; // Permafrost Titan — massive white titan
    MONSTY['demon_117'] = 'NB_20'; // Glacial Sovereign — white/blue ice form

    // ── Thunder Peak demons (demon_118–123) ───────────────────────────────
    MONSTY['demon_118'] = 'NB_13'; // Spark Imp        — red spiky demon
    MONSTY['demon_119'] = 'NB_09'; // Storm Hound      — orange scorpion
    MONSTY['demon_120'] = 'NB_02'; // Tempest Knight   — gray armored golem
    MONSTY['demon_121'] = 'NB_12'; // Thunder Drake    — gold dragon
    MONSTY['demon_122'] = 'NB_26'; // Stormcaller      — red/orange fire blob
    MONSTY['demon_123'] = 'NB_30'; // Thunder Sovereign — red/gold lion

    Object.entries(MONSTY).forEach(([cardId, file]) => {
      this.load.image('card_art_' + cardId, 'resources/monsty/' + file + '.png');
    });
  }

  // Remove near-white pixels from a loaded image texture (makes white bg transparent)
  _stripWhiteBg(key, threshold = 220) {
    if (!this.textures.exists(key)) return;
    const src = this.textures.get(key).getSourceImage();
    const canvas = document.createElement('canvas');
    canvas.width  = src.width;
    canvas.height = src.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(src, 0, 0);
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i] > threshold && d[i+1] > threshold && d[i+2] > threshold) d[i+3] = 0;
    }
    ctx.putImageData(img, 0, 0);
    this.textures.remove(key);
    this.textures.addCanvas(key, canvas);
  }

  create() {
    // Strip white backgrounds from monsty images (all demon card arts)
    const stripRanges = [
      [1, 30], [31, 105], [106, 123]
    ];
    stripRanges.forEach(([a, b]) => {
      for (let i = a; i <= b; i++) {
        this._stripWhiteBg('card_art_demon_' + String(i).padStart(3, '0'));
      }
    });

    this.makeTiles();
    this.makePlayer();
    this.makeEnemies();
    this.makeCardArt();
    this.makeUI();
    this.upgradeToGBAGraphics();
    this.scene.start('WorldScene');
    this.scene.launch('HUDScene');
  }

  // ── Core pixel-art helper ─────────────────────────────────────────────
  // rows: array of strings, each char = one macro-pixel (2x2 on canvas)
  // pal:  { char: '#rrggbb' }  (space or missing = transparent)
  // Uses rows[0].length as canonical width; extra chars in other rows are ignored.
  px(key, rows, pal) {
    const cols = rows[0].length, rlen = rows.length;
    const sw = cols * 2, sh = rlen * 2;
    const tex = this.textures.createCanvas(key, sw, sh);
    const ctx = tex.context;
    ctx.imageSmoothingEnabled = false;
    rows.forEach((row, y) => {
      const w = Math.min(row.length, cols);
      for (let x = 0; x < w; x++) {
        const c = pal[row[x]];
        if (!c) continue;
        ctx.fillStyle = c;
        ctx.fillRect(x * 2, y * 2, 2, 2);
      }
    });
    tex.refresh();
  }

  // ── TILES ─────────────────────────────────────────────────────────────

  makeTiles() {
    // GBA FireRed/Emerald-style grass — base green with darker patches and bright highlights
    this.px('tile_grass', [
      'BBhBBBBBBBBBhBBB',
      'BBBBBhBBBBBBBBBB',
      'BhBBBBBBBBBBBBhB',
      'BBBhBBBBBhBBBBBB',
      'BBBBBBBBBBBBhBBB',
      'hBBBBBBhBBBBBBBB',
      'BBBBBBBBBBBBBBBh',
      'BBBBhBBBBBBhBBBB',
      'BBBBBBBBBBBBBBBB',
      'BBBBBBBhBBBBBBBB',
      'hBBBBBBBBBBBBhBB',
      'BBBBBhBBBBBBBBBB',
      'BBhBBBBBBBBBBBBh',
      'BBBBBBBBhBBBBBBB',
      'BBBBBBBBBBBBBBBB',
      'BBBBBBBhBBBBhBBB',
    ], { B: '#58a832', h: '#72c840', s: '#3a8020', d: '#286018' });

    // SNES Zelda dirt path with pebble texture
    this.px('tile_dirt', [
      'FFFFFFFFFFFFFFfF',
      'FFfFFFFFFFFFFFFf',
      'FFFFFFFFFFFfFFFF',
      'FFFFFFFFFFFFFFFF',
      'FFFFfFFFFFFFFFFF',
      'FFFFFFFFFFFFFFFf',
      'FFFFFFFFFFfFFFFF',
      'FFFFFFFFFFFFFFFf',
      'FFFFFFfFFFFFFFFF',
      'FFFFFFFFFFFFFFFF',
      'FFFFFFFFFFFFFfFF',
      'FFFFfFFFFFFFFFFF',
      'FFFFFFFFFFFFFFFF',
      'FFFFFFFFFfFFFFFF',
      'FFFFFFFFFFFFfFFF',
      'FFFFFfFFFFFFFFFf',
    ], { F: '#c87820', f: '#9a5810', L: '#E0B870' });

    // GBA-style deep water with wave streaks and foam flecks
    this.px('tile_water', [
      'DDdDDDDDDDDDDDDD',
      'DdddwDDDDDDDDDDD',
      'dddwwddDDDDDDdDD',
      'ddwwwdddDDDDDddd',
      'dddwdddddddddddd',
      'DDdddddddddddDDD',
      'DDDdddddddddDDDD',
      'DDDDDdddddddDDDD',
      'DDDDDDdddDDDDDDD',
      'DDDDDDDddDDDDDDD',
      'DDDDDdddddDDDDDD',
      'DDDDdddddddDDDDD',
      'DDddddFdddddddDD',
      'Dddddddddddddddd',
      'ddddddddFddddddd',
      'DDdddddddddddddD',
    ], { D: '#1a3a5c', d: '#2a5a8c', w: '#3a78b8', F: '#aaccee' });

    // GBA-style stone brick wall — dark mortar, brick faces with highlights and shadows
    this.px('tile_wall', [
      'mmmmmmmmmmmmmmmm',
      'mHBBBBBBmBBBBBBm',
      'mHBBssBBmBBssBBm',
      'mBBBBBBBmBBBBBBm',
      'mBBBBBBBmBBBBBBm',
      'mBBBBBBsmBBBBBBs',
      'mmmmmmmmmmmmmmmm',
      'mHBBBBmmBBBBBBBm',
      'mHBBBBmmBBBBBBHm',
      'mBBssmmmmBBssBBm',
      'mBBBBmmmmBBBBBBm',
      'mBBBBmmmmBBBBBBs',
      'mmmmmmmmmmmmmmmm',
      'mHBBBBBBmBBBBBBm',
      'mBBBBBBBmBBBBBHm',
      'mmmmmmmmmmmmmmmm',
    ], { B: '#484848', s: '#2e2e2e', H: '#5e5e5e', m: '#222222' });

    // SNES dungeon floor tiles (dark with seam lines)
    this.px('tile_floor', [
      'FFFFFFFFFFFFFFfF',
      'FFFFFFFFFFFFFFFf',
      'FFFFFFFFFFFFFFff',
      'FFFFFFFFFFFFFfff',
      'FFFFFFFFFFFFFFfF',
      'FFFFFFFFFFFFFFFf',
      'FFFFFFFFFFFFFFff',
      'ffffffffffffffffL',
      'FFFFFFFFFFFFFFfF',
      'FFFFFFFFFFFFFFFf',
      'FFFFFFFFFFFFFFff',
      'FFFFFFFfFFFFFFff',
      'FFFFFFFFFFFFFFfF',
      'FFFFFFFFFFFFFFFf',
      'FFFFFFFFFFFFFFff',
      'ffffffffffffffffL',
    ], { F: '#302820', f: '#181010', L: '#504038' });

    // GBA-style dense forest tile — rich canopy, brown trunk, grass base
    this.px('tile_tree', [
      'GGGGGGDDDDGGGGGG',
      'GGGGDDDMDDDDGGGG',
      'GGGDDMMMDDMMDGGG',
      'GGDDMMhDDDhMMDGG',
      'GDDMMhMMMMMhMDDG',
      'GDDMMMMMMMMMMDDG',
      'GDDMhMMMMMMMhDDG',
      'GGDDMMMMMMMMMDGG',
      'GGGDDMMMMMMMDGGG',
      'GGGGDDDMDDDDGGGG',
      'GGGGGGDDDDGGGGGG',
      'GGGGGGGTTTGGGGGG',
      'GGGGGGGTTTGGGGGG',
      'GGGGGGbGGGGGGGGG',
      'GGGGGGGGGGGGGGGG',
      'GGGGGGGGGGGGGGGG',
    ], { D: '#0e3a05', M: '#1a5c0a', h: '#2a7c14', T: '#5a3010', G: '#4a8c3f', b: '#386030' });

    // GBA-style rocky mountain — dark peaks, gray rock faces, snow cap, crevice details
    this.px('tile_mountain', [
      'RRRRRRRRRRRRRRRR',
      'RRRRRRRPRRRRRRrR',
      'RRRRRRPPPRRRRRRr',
      'RRRRRPPsPPRRRRRR',
      'RRRRPPPssPPPRRRR',
      'RRRPPPSSSSPPPRRR',
      'RRPPPPSSSSsPPPRR',
      'RPPPPcSSSSPPPPPR',
      'PPPPPcSSSSPPPPPP',
      'RPPPPPSSSSPPPPRP',
      'RRPPPPSSSsPPPRRP',
      'RRRPPcPPPPcPPRRP',
      'RRRRPPPPPPPcPRRP',
      'RRRRRRRRRRRRPccR',
      'RRRRRRRRRRRRRccR',
      'RRRRRRRRRRRRRRRR',
    ], { P: '#3d3535', S: '#e8e8f0', s: '#c0c0d0', R: '#2a2a2a', r: '#303030', c: '#1a1a1a' });

    // SNES desert sand with subtle ripple texture
    this.px('tile_sand', [
      'SSSSSSSSSSSSSSSl',
      'SSsSSSSSSSSSSSSl',
      'SSSSSSSSSSSSSSSl',
      'SSSSSSSSSSSSSSSl',
      'sSSSSSSSSSSSSSSl',
      'SSSSSSSSSSSSSSSl',
      'SSSSSSSSSSSSSSSl',
      'SSSSSSSsSSSSSSsl',
      'SSSSSSSSSSSSSSSl',
      'SSSSSSSSSSSSSSSl',
      'sSSSSSSSSSSSSSsl',
      'SSSSSSSSSSSSSSSl',
      'SSSSSSSSSSSSSSSl',
      'SSSSSSSSSSSSSSsl',
      'SSSSSSSSSSSSSSSl',
      'SSSSSsSSSSSSSSsl',
    ], { S: '#D0A830', s: '#A87820', l: '#E8C850' });

    // Graveyard darker dead grass
    this.px('tile_grave_grass', [
      'GGgGGGGGGGGGGGGG',
      'GGGGGGGgGGGGGGGG',
      'GlGGGGGGGGGGgGGG',
      'GGGGgGGGGGGGGGGG',
      'GGGGGGGGGGlGGGGg',
      'GGGGGGgGGGGGGGGG',
      'GGGGGGGGGGGGGGGl',
      'gGGGGGGGGGgGGGGG',
      'GGGGlGGGGGGGGGGG',
      'GGGGGGGGgGGGGGGG',
      'GGGGGGGGGGGGlGGG',
      'GGGgGGGGGGGGGGGG',
      'GGGGGGGGGGGGGGgG',
      'GGGGGlGGGgGGGGGG',
      'GGGGGGGGGGGGGGGG',
      'GGGGGGGGGGGGGGGg',
    ], { G: '#244A18', g: '#143008', l: '#2E6020' });

    // Cliff face — solid warm brown (south-face of elevated platform)
    this.px('tile_cliff', [
      'DDDDDDDDDDDDDDDD',
      'BBBBBBBBBBBBBBBB',
      'BBBBBBBBBBBBBBBB',
      'BBBBBBBBBBBBBBBB',
      'BBbBBBBbBBBBbBBB',
      'BBBBBBBBBBBBBBBB',
      'BBBBBBBBBBBBBBBB',
      'BBBBBbBBBBBbBBBB',
      'BBBBBBBBBBBBBBBB',
      'BBBBBBBBBBBBBBBB',
      'BBbBBBBBBBBbBBBB',
      'BBBBBBBBBBBBBBBB',
      'BBBBBBBBBBBBBBBB',
      'BBBBBBBBBBBBBBBB',
      'SSSSSSSSSSSSSSSS',
      'ssssssssssssssss',
    ], { B: '#a0622a', b: '#7a4818', D: '#3a1a08', S: '#6a3c10', s: '#3a2008' });

    // Ledge — same brown but with grass strip at top (climbable step)
    this.px('tile_ledge', [
      'GGGGGGGGGGGGGGGG',
      'GGGGGGGGGGGGGGGG',
      'GgGGGGGGGGGGGGGG',
      'DDDDDDDDDDDDDDDD',
      'BBBBBBBBBBBBBBBB',
      'BBBBBBBBBBBBBBBB',
      'BBbBBBBbBBBBbBBB',
      'BBBBBBBBBBBBBBBB',
      'BBBBBBBBBBBBBBBB',
      'BBBBBbBBBBBbBBBB',
      'BBBBBBBBBBBBBBBB',
      'BBBBBBBBBBBBBBBB',
      'BBBBBBBBBBBBBBBB',
      'SSSSSSSSSSSSSSSS',
      'ssssssssssssssss',
      'GGGGGGGGGGGGGGGG',
    ], { G: '#4a8c3f', g: '#386030', B: '#a0622a', b: '#7a4818', D: '#3a1a08', S: '#6a3c10', s: '#3a2008' });
  }

  // ── PLAYER ────────────────────────────────────────────────────────────

  makePlayer() {
    // SNES Link/hero style (green tunic, brown hair, 3/4 view from above)
    this.px('player', [
      'xxxxxxxxxxxxxxxxx',
      'xxxxxxhhhhhxxxxxx',
      'xxxxxhhddhhhxxxxx',
      'xxxxhhdkkkdhhxxxx',
      'xxxxhhkkkkkkhxxxx',
      'xxxxhkEkkkEkkxxxx',
      'xxxxhkkkkkkkhhxxx',
      'xxxxxhkkkkhHxxxxx',
      'xxxxxxGGGGGGxxxxx',
      'xxxxxGGGGGGGGxxxx',
      'xxxxxGGGGGGGGxxxx',
      'xxxxGGgGGGGgGGxxx',
      'xxxxGGGGGGGGGGxxx',
      'xxxxPPxxxxPPxxxxx',
      'xxxxPPxxxxPPxxxxx',
      'xxxxOOxxxxOOxxxxx',
    ], {
      h: '#783820', d: '#C07830', k: '#E8B870', E: '#101010',
      H: '#A06828', G: '#409030', g: '#205820', P: '#2A1808', O: '#101010', x: null
    });
  }

  // ── ENEMIES ───────────────────────────────────────────────────────────

  makeEnemies() {
    // enemy_0: SNES street thug — orange jacket, dark hair
    this.px('enemy_0', [
      'xxxxxxxxxxxxxxxxx',
      'xxxxxxHHHHHxxxxxx',
      'xxxxxHHdddHHxxxxx',
      'xxxxHHdkkkdHHxxxx',
      'xxxxHkkEkkEkkHxxx',
      'xxxxHkkkkkkkHxxxx',
      'xxxxxHkkkkkHxxxxx',
      'xxxxxxHHHHHHxxxxx',
      'xxxxxxRRRRRRxxxxx',
      'xxxxxRRRRRRRRxxxx',
      'xxxxxRRrrRrrRxxxx',
      'xxxxRRRRRRRRRRxxx',
      'xxxxRRRRRRRRRRxxx',
      'xxxxPPxxxxPPxxxxx',
      'xxxxPPxxxxPPxxxxx',
      'xxxxbbxxxxbbxxxxx',
    ], { H: '#553300', d: '#C07830', k: '#E8B870', E: '#101010', R: '#CC5500', r: '#882200', P: '#332200', b: '#110A00', x: null });

    // enemy_1: SNES witch — purple robes, pointy hat tip visible
    this.px('enemy_1', [
      'xxxxxxxWxxxxxxxxx',
      'xxxxxxWWWxxxxxxxx',
      'xxxxxWWWWWxxxxxxx',
      'xxxxWWHHHHHWxxxxx',
      'xxxxWHkkkkkHWxxxx',
      'xxxxHkEkkEkkHxxxx',
      'xxxxxHkkkkkHxxxxx',
      'xxxxxxHHHHHHxxxxx',
      'xxxxxxPPPPPPxxxxx',
      'xxxxxPPPPPPPPxxxx',
      'xxxxxPPppPppPxxxx',
      'xxxxPPPPPPPPPPxxx',
      'xxxxPPPPPPPPPPxxx',
      'xxxxppxxxxppxxxxx',
      'xxxxppxxxxppxxxxx',
      'xxxxbbxxxxbbxxxxx',
    ], { W: '#4400AA', H: '#220055', k: '#E8B870', E: '#CC00FF', P: '#8800CC', p: '#550088', b: '#1A0033', x: null });

    // enemy_2: SNES blue-armored fighter
    this.px('enemy_2', [
      'xxxxxxxxxxxxxxxxx',
      'xxxxxxAAAAHxxxxxx',
      'xxxxxAAAAAAAAHxxx',
      'xxxxAAkkkkkAAHxx',
      'xxxxAkEkkkEkAHxx',
      'xxxxAkkkkkkkAHxx',
      'xxxxxAkkkkkAHxxxx',
      'xxxxxxAAAAAAAAxx',
      'xxxxxxBBBBBBxxxxx',
      'xxxxxBBBBBBBBxxxx',
      'xxxxxBBbbBbbBxxxx',
      'xxxxBBBBBBBBBBxxx',
      'xxxxBBBBBBBBBBxxx',
      'xxxxPPxxxxPPxxxxx',
      'xxxxPPxxxxPPxxxxx',
      'xxxxSSxxxxSSxxxxx',
    ], { A: '#3366CC', H: '#224488', k: '#E8B870', E: '#0055FF', B: '#1144AA', b: '#002288', P: '#0A2244', S: '#080E22', x: null });

    // enemy_3: SNES red-coated gang leader
    this.px('enemy_3', [
      'xxxxxxxHHxxxxxxxx',
      'xxxxxxHHHHxxxxxxx',
      'xxxxxHHdddHHxxxxx',
      'xxxxHHdkkkdHHxxxx',
      'xxxxHkkEkkEkkHxxx',
      'xxxxHkkkkkkkHxxxx',
      'xxxxxHkkkkkHxxxxx',
      'xxxxxxHHHHHHxxxxx',
      'xxxxxxRRRRRRxxxxx',
      'xxxxxRRRRRRRRxxxx',
      'xxxxxRRrrRrrRxxxx',
      'xxxxRRRRRRRRRRxxx',
      'xxxxRRRRRRRRRRxxx',
      'xxxxPPxxxxPPxxxxx',
      'xxxxPPxxxxPPxxxxx',
      'xxxxbbxxxxbbxxxxx',
    ], { H: '#331111', d: '#C07830', k: '#E8B870', E: '#FF0000', R: '#880000', r: '#550000', P: '#220000', b: '#110000', x: null });

    // enemy_4: SNES dark-robed priest
    this.px('enemy_4', [
      'xxxxxxxCCxxxxxxxx',
      'xxxxxxCCCCxxxxxxx',
      'xxxxxCCCCCCCxxxxx',
      'xxxxCHHkkkHHCxxxx',
      'xxxxCHkEkkEkHCxxx',
      'xxxxCHkkkkkkkHxxx',
      'xxxxxHkkkkkHHxxxx',
      'xxxxxxHHHHHHxxxxx',
      'xxxxxxDDDDDDxxxxx',
      'xxxxxDDDDDDDDxxxx',
      'xxxxxDDddDddDxxxx',
      'xxxxDDDDDDDDDDxxx',
      'xxxxDDDDDDDDDDxxx',
      'xxxxppxxxxppxxxxx',
      'xxxxppxxxxppxxxxx',
      'xxxxbbxxxxbbxxxxx',
    ], { C: '#1A0044', H: '#220066', k: '#E8B870', E: '#AA00FF', D: '#330088', d: '#220066', p: '#1A0044', b: '#0A0022', x: null });

    // enemy_5: SNES skeleton — white bones, dark eye sockets
    this.px('enemy_5', [
      'xxxxxxxxxxxxxxxxx',
      'xxxxxxBBBBBxxxxxx',
      'xxxxxBBBBBBBxxxxx',
      'xxxxBBbbBBBBBxxxx',
      'xxxxBbEBBbEBBxxxx',
      'xxxxBBBBBBBBBxxxx',
      'xxxxxBBBBBBBxxxxx',
      'xxxxxxBBBBBBxxxxx',
      'xxxxxxbbbbbbxxxxx',
      'xxxxxbbbbbbbbxxxx',
      'xxxxxbbBBbBBbxxxx',
      'xxxxbbbbbbbbbbxxx',
      'xxxxbbbbbbbbbbxxx',
      'xxxxBBxxxxBBxxxxx',
      'xxxxBBxxxxBBxxxxx',
      'xxxxbbxxxxbbxxxxx',
    ], { B: '#E8E4D0', b: '#B0AC90', E: '#000000', x: null });

    // enemy_6: SNES dark mage — black/red robes
    this.px('enemy_6', [
      'xxxxxxxMMxxxxxxxx',
      'xxxxxxMMMMxxxxxxx',
      'xxxxxMMdddMMxxxxx',
      'xxxxMMdkkkdMMxxxx',
      'xxxxMkEkkkEkMxxxx',
      'xxxxMkkkkkkkMxxxx',
      'xxxxxMkkkkkMxxxxx',
      'xxxxxxMMMMMMxxxxx',
      'xxxxxxRRRRRRxxxxx',
      'xxxxxRRRRRRRRxxxx',
      'xxxxxRRrrRrrRxxxx',
      'xxxxRRRRRRRRRRxxx',
      'xxxxRRRRRRRRRRxxx',
      'xxxxrrxxxxrrxxxxx',
      'xxxxrrxxxxrrxxxxx',
      'xxxxbbxxxxbbxxxxx',
    ], { M: '#220022', d: '#C07830', k: '#E8B870', E: '#FF00AA', R: '#660022', r: '#330011', b: '#110008', x: null });

    // enemy_7: Shadow Boss — larger imposing silhouette, glowing elements
    this.px('enemy_7', [
      'xxxxxCCCCCCCxxxxx',
      'xxxxCCCCCCCCCxxxx',
      'xxxCCCHHHHHCCCxxx',
      'xxCCCHHkkkHHCCCxx',
      'xxCCHkkEkkEkkHCCx',
      'xxCCHkkkkkkkHCCxx',
      'xxxCCHkkkkkHCCxxx',
      'xxxxCCHHHHHCCxxxx',
      'xxxxxCDDDDDCxxxxx',
      'xxxxCDDDDDDDCxxxx',
      'xxxCDDDDDDDDDCxxx',
      'xxxCDDDDDDDDDCxxx',
      'xxCDDDDDDDDDDDCxx',
      'xxCPPxxxxPPCCCCxx',
      'xxCPPxxxxPPCxxxxx',
      'xxCBBxxxxBBCxxxxx',
    ], { C: '#110033', H: '#220055', k: '#DDA0CC', E: '#FF00FF', D: '#440088', P: '#220055', B: '#110033', x: null });

    // enemy_8: Arena Champion Boss — gold/orange armor
    this.px('enemy_8', [
      'xxxxxGGGGGGGxxxxx',
      'xxxxGGGGGGGGGxxxx',
      'xxxGGHHHHHHHGGxxx',
      'xxxGHHdkkkdHHGxxx',
      'xxxGHkGkkkGkkHGxx',
      'xxxGHkkkkkkkHGxxx',
      'xxxxGHHkkkHHGxxxx',
      'xxxxxGHHHHHGxxxxx',
      'xxxxxxOOOOOOxxxxx',
      'xxxxxOOOOOOOOxxxx',
      'xxxxxOOooOooOxxxx',
      'xxxxOOOOOOOOOOxxx',
      'xxxOOOOOOOOOOOxxx',
      'xxxxPPxxxxPPxxxxx',
      'xxxxPPxxxxPPxxxxx',
      'xxxxBBxxxxBBxxxxx',
    ], { G: '#CC8800', H: '#AA6600', d: '#C07830', k: '#E8B870', O: '#DD9900', o: '#AA6600', P: '#664400', B: '#332200', x: null });

    // enemy_9: Devil King Boss — crimson/black with horns visible from above
    this.px('enemy_9', [
      'xxxxhRRRRRRRhxxxx',
      'xxxhRRRRRRRRRhxxx',
      'xxhRRHHHHHHHRRhxx',
      'xxhRHHdkkkdHHRhxx',
      'xxhRHkRkkkRkkHhxx',
      'xxhRHkkkkkkkHRhxx',
      'xxxhRHHkkkHHRhxxx',
      'xxxxhRHHHHHRhxxxx',
      'xxxxxxRRRRRRxxxxx',
      'xxxxxRRRRRRRRxxxx',
      'xxxxxRRrrRrrRxxxx',
      'xxxxRRRRRRRRRRxxx',
      'xxxRRRRRRRRRRRxxx',
      'xxxxPPxxxxPPxxxxx',
      'xxxxPPxxxxPPxxxxx',
      'xxxxBBxxxxBBxxxxx',
    ], { h: '#880000', R: '#CC0000', H: '#AA0000', d: '#C07830', k: '#E8B870', r: '#660000', P: '#440000', B: '#220000', x: null });
  }

  // ── CARD ART ──────────────────────────────────────────────────────────

  makeCardArt() {
    // card_art_demon_common: tiny red imp with horns and tail (24x24)
    this.px('card_art_demon_common', [
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxrxxxxxxxrxxxxxxx',
      'xxxxxxxrrxxxxxxxrrxxxxxx',
      'xxxxxxrrrRRRRRRRrrrxxxxx',
      'xxxxxrrRRkkkkkRRrrxxxxxx',
      'xxxxxrRRkkEkkEkRRrxxxxxx',
      'xxxxxrRRkkkkkkkRRrxxxxxx',
      'xxxxxrRRkxkxkxxRRrxxxxxx',
      'xxxxxxrRRRkkkRRRrxxxxxxx',
      'xxxxxxxrRRRRRRrxxxxxxxxx',
      'xxxxxxrRRRRRRRRrxxxxxxxx',
      'xxxxxrRRRRRRRRRRrxxxxxxx',
      'xxxxxrRRRRRRRRRRrxxxxxxx',
      'xxxxrRRRRRRRRRRRRrxxxxxx',
      'xxxrrRRxxxxxxxxxxxxRRrxx',
      'xxxrrRRxxxxxxxxxxxxRRrxx',
      'xxxxrRRxxxxxxxxxxxxxxxxx',
      'xxxxxrRrxxxxxxxxxxxxxxxx',
      'xxxxxxrxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
    ], { R: '#C82020', r: '#801010', k: '#E8B870', E: '#FF0000', h: '#E05050', x: null });

    // card_art_demon_uncommon: purple demon creature, medium size (24x24)
    this.px('card_art_demon_uncommon', [
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxDDDDDDxxxxxxxxx',
      'xxxxxxxDDDDDDDDDxxxxxxxx',
      'xxxxxxDDDHHHHHHDDDxxxxxx',
      'xxxxxDDHHdkkkdHHDDxxxxx',
      'xxxxxDDHkEkkkEkHDDxxxxx',
      'xxxxxDDHkkkkkkkHDDxxxxx',
      'xxxxxxDDHkkkkkHDDxxxxxx',
      'xxxxxxxDDHHHHHDDxxxxxxx',
      'xxxxxxxxDDDDDDDDxxxxxxx',
      'xxxxxxxDDDDDDDDDxxxxxxx',
      'xxxxxxDDDDDDDDDDDxxxxxx',
      'xxxxxxDDDDDDDDDDDxxxxxx',
      'xxxxxDDDDDDDDDDDDDxxxxx',
      'xxxxDDDxxxxxxDDDDDxxxxxx',
      'xxxxDDxxxxxxxxxDDxxxxxxx',
      'xxxxxDxxxxxxxxDDxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
    ], { D: '#6600CC', H: '#4400AA', k: '#E8B870', d: '#C07830', E: '#CC00FF', x: null });

    // card_art_demon_rare: large orange/red demon, imposing (24x24)
    this.px('card_art_demon_rare', [
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxRRxxxxxxxxxRRxxxxxx',
      'xxxxRRRxxxxxxxxxRRRxxxxx',
      'xxxxRRRRRRRRRRRRRRRxxxxx',
      'xxxRRGGGGGGGGGGGGRRRxxxx',
      'xxxRGGGdkkkkkdGGGRRxxxxx',
      'xxxRGGdkEkkkEkkGGRRxxxxx',
      'xxxRGGGkkkkkkkGGGRRxxxxx',
      'xxxRGGGkxkxkxxGGGRRxxxxx',
      'xxxxRGGGGkkkGGGGRRxxxxxx',
      'xxxxxRGGGGGGGGGRRxxxxxxx',
      'xxxxRRRGGGGGGGRRRRxxxxxx',
      'xxxRRRRRRRRRRRRRRRRxxxxx',
      'xxxRRRRRRRRRRRRRRRRxxxxx',
      'xxRRRRRRRRRRRRRRRRRRxxxx',
      'xxRRRRxxxxxxxxxxxxxxxRxx',
      'xxxRRxxxxxxxxxxxxxxxxRxx',
      'xxxxRRxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
    ], { R: '#C82020', G: '#FF8800', k: '#E8B870', d: '#C07830', E: '#FFCC00', x: null });

    // card_art_demon_legendary: epic golden demon, fills frame (24x24)
    this.px('card_art_demon_legendary', [
      'xxxxxxGGGGGGGGGxxxxxxxxx',
      'xxxxxGGGRRRRRRGGGxxxxxxx',
      'xxxxGGGRRRRRRRRGGGxxxxxx',
      'xxxGGRRRdkkkdRRRGGGxxxxx',
      'xxxGRRRdkEkkkEkdRRGGxxxx',
      'xxxGRRdkkGGGGGkkdRRGxxxx',
      'xxxGRRdkGGGGGGkdRRGGxxxx',
      'xxxGGRRdkkkkkdRRGGGxxxxx',
      'xxxxGGRRRRRRRRRGGGxxxxxx',
      'xxxxxGGGRRRRRGGGGxxxxxxx',
      'xxxxGGGGGGGGGGGGGGxxxxxx',
      'xxxGGGGGGGGGGGGGGGGxxxxx',
      'xxxGGGGGGGGGGGGGGGGxxxxx',
      'xxGGGGGGGGGGGGGGGGGGxxxx',
      'xxGGGGGGGGGGGGGGGGGGxxxx',
      'xxGGGGGGGGGGGGGGGGGGxxxx',
      'xxxGGGGGxxxxxxxGGGGGxxxx',
      'xxxxGGGxxxxxxxxxGGGxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
    ], { G: '#FFCC00', R: '#FF4400', k: '#FFFFFF', d: '#FFE880', E: '#FF0000', x: null });

    // card_art_demon_mythic: silver/purple transcendent demon, ornate (24x24)
    this.px('card_art_demon_mythic', [
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxSSxxxxxxxSSxxxxxx',
      'xxxxxxSSSxxxxxxxSSSxxxxx',
      'xxxxxxSSSSSSSSSSSSSSxxxx',
      'xxxxxSSPPPPPPPPPPPSSxxxx',
      'xxxxxSPPPpkkkpPPPPSxxxxx',
      'xxxxxSPPpkEkkkEkPPSxxxxx',
      'xxxxxSPPpkkkkkkkPPSxxxxx',
      'xxxxxxSPPkxkxkxxPPSxxxxx',
      'xxxxxxxSPPPkkkPPSxxxxxxx',
      'xxxxxxxxSPPPPPPSxxxxxxxx',
      'xxxxxxxSPPPPPPPPSxxxxxxx',
      'xxxxxxxSPPPPPPPPSxxxxxxx',
      'xxxxxxSPPPPPPPPPPSxxxxxx',
      'xxxxxSPPSSxxxxxxxxSSPSxx',
      'xxxxxSPPSSxxxxxxxxSSPSxx',
      'xxxxxxSPSxxxxxxxxxxxxxxxxx',
      'xxxxxxxSSxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
    ], { S: '#AAAACC', P: '#9933CC', k: '#EEDDFF', p: '#CC88FF', E: '#FF44FF', x: null });

    // card_art_spell_damage: orange fireball with yellow core (24x24)
    this.px('card_art_spell_damage', [
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxFxxxxxxxx',
      'xxxxxxxxxxxxxxFFFxxxxxxx',
      'xxxxxxxxxxxxxFFFFFxxxxxx',
      'xxxxxxxxxxxxFFFfFFFxxxxx',
      'xxxxxxxxxxxFFFfffFFFxxxx',
      'xxxxxxxxxxFFFFFfffFFFFxx',
      'xxxxxxxxxFFFFFFFFFFFFFFx',
      'xxxxxxxxFFFFFFFfFFFFFFFx',
      'xxxxxxxFFFFFFfffFFFFFFxx',
      'xxxxxxxxFFFFFFFFFFFFFFF',
      'xxxxxxxxxFFFFFFFFFFFFFx',
      'xxxxxxxxxxFFFFFFFFFFFxx',
      'xxxxxxxxxFFFFFFFFFFFFxx',
      'xxxxxxxxFFFFFFFFFFFFFxx',
      'xxxxxxxFFFFFFFFFFFFFFxx',
      'xxxxxxxxFFFFFfFFFFFxxxx',
      'xxxxxxxxxFFFFffFFFFxxxxx',
      'xxxxxxxxxxFFFfFFFFxxxxxx',
      'xxxxxxxxxxxFFFFFxxxxxxxx',
      'xxxxxxxxxxxxFFFxxxxxxxxx',
      'xxxxxxxxxxxxxFxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
    ], { F: '#FF4400', f: '#FFCC00', x: null });

    // card_art_spell_heal: green healing cross with light rays (24x24)
    this.px('card_art_spell_heal', [
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxGGGGGxxxxxxxxxx',
      'xxxxxxxxGGGGGGGxxxxxxxxx',
      'xxxxxxxGGGhhhGGGxxxxxxxx',
      'xxxxxxGGGhhhhhGGGxxxxxxx',
      'xxxxxGGGhhhhhhGGGGxxxxxx',
      'xxxxxGGhhhhhhhGGGGGxxxxx',
      'xxxxGGGhhhhhhhGGGGGGxxxx',
      'xxxxGGGhhhhhhhGGGGGGxxxx',
      'xxxxGGGhhhhhhhGGGGGGxxxx',
      'xxxxxGGGhhhhhGGGGGGxxxxx',
      'xxxxxGGGGhhhGGGGGGxxxxxx',
      'xxxxxxGGGGhGGGGGGxxxxxxx',
      'xxxxxxxGGGGGGGGxxxxxxxxx',
      'xxxxxxxxGGGGGGxxxxxxxxxx',
      'xxxxxxxxxGGGGxxxxxxxxxxx',
      'xxxxxxxxxxGGxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
    ], { G: '#00AA44', h: '#AAFFAA', x: null });

    // card_art_spell_utility: blue arcane rune circle (24x24)
    this.px('card_art_spell_utility', [
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxBBBBBxxxxxxxxxx',
      'xxxxxxxBBBBBBBBBxxxxxxxx',
      'xxxxxxBBBBBBBBBBBxxxxxxx',
      'xxxxxBBBBBbBBBbBBBBxxxxx',
      'xxxxBBBBbBBBBBBBbBBBBxxx',
      'xxxxBBBbBBBBBBBBBbBBBxxx',
      'xxxBBBBBBBBBBBBBBBBBBBxx',
      'xxxBBBBBBBBbBBBBBBBBBBxx',
      'xxxBBBBBBBbBBbBBBBBBBBxx',
      'xxxBBBBBBBBBBBBBBBBBBBxx',
      'xxxBBBBBBBBBBBBBBBBBBBxx',
      'xxxBBBbBBBBBBBBBBbBBBBxx',
      'xxxxBBBbBBBBBBBBbBBBBxxx',
      'xxxxBBBBbBBBBBBbBBBBBxxx',
      'xxxxxBBBBBbBBbBBBBBBxxxx',
      'xxxxxxBBBBBBBBBBBBBxxxxx',
      'xxxxxxxBBBBBBBBBBxxxxxxx',
      'xxxxxxxxxBBBBBxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxxxxxxxxxx',
    ], { B: '#1155CC', b: '#88CCFF', x: null });
  }

  // ── GBA GRAPHICS UPGRADE ─────────────────────────────────────────────
  // Overrides procedural canvas tiles/sprites with real GBA-quality assets.
  // Every override is guarded — if an asset failed to load, the procedural
  // fallback from makeTiles()/makeEnemies() etc. is kept as-is.

  upgradeToGBAGraphics() {
    const copyTile = (srcKey, destKey, sx, sy, sw, sh) => {
      if (!this.textures.exists(srcKey) || !this.textures.exists(destKey)) return;
      const src  = this.textures.get(srcKey).getSourceImage();
      const dest = this.textures.get(destKey);
      const ctx  = dest.getContext();
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, 32, 32);
      ctx.drawImage(src, sx, sy, sw, sh, 0, 0, 32, 32);
      dest.refresh();
    };

    // NOTE: ground tile art is handled by makeTiles() procedural pixel art —
    // Mystic Woods tilesheet pixel offsets are version-dependent, so we leave
    // all tile_* textures as drawn by makeTiles() and only upgrade characters.
    // The canvas overrides below were removed — px() art in makeTiles() is more detailed.

    if (false && this.textures.exists('tile_water')) {
      const t = this.textures.get('tile_water');
      const ctx = t.getContext();
      ctx.clearRect(0, 0, 32, 32);
      // Deep base
      ctx.fillStyle = '#1a3a5c'; ctx.fillRect(0, 0, 32, 32);
      // Mid-tone wave bands
      ctx.fillStyle = '#2a5a8c';
      ctx.fillRect(0, 2, 32, 4);
      ctx.fillRect(0, 10, 32, 4);
      ctx.fillRect(0, 18, 32, 4);
      ctx.fillRect(0, 26, 32, 4);
      // Lighter wave streaks
      ctx.fillStyle = '#3a78b8';
      ctx.fillRect(2, 3, 6, 2);  ctx.fillRect(14, 3, 8, 2);
      ctx.fillRect(6, 11, 10, 2); ctx.fillRect(22, 11, 6, 2);
      ctx.fillRect(0, 19, 4, 2);  ctx.fillRect(12, 19, 12, 2);
      ctx.fillRect(4, 27, 8, 2);  ctx.fillRect(20, 27, 6, 2);
      // Foam flecks (1x1 bright spots)
      ctx.fillStyle = '#aaccee';
      [[4,4],[10,12],[18,6],[26,20],[8,28],[22,14],[16,24],[2,16]].forEach(([x,y]) => ctx.fillRect(x, y, 2, 2));
      t.refresh();
    }

    // ── GBA-style dense forest tree tile ───────────────────────────────────
    if (false && this.textures.exists('tile_tree')) {
      const t = this.textures.get('tile_tree');
      const ctx = t.getContext();
      ctx.clearRect(0, 0, 32, 32);
      // Shadow base — darkest outer ring
      ctx.fillStyle = '#0e3a05'; ctx.fillRect(8, 2, 16, 18);
      ctx.fillRect(4, 6, 24, 10);
      ctx.fillRect(6, 4, 20, 14);
      // Mid-tone canopy fill
      ctx.fillStyle = '#1a5c0a';
      ctx.fillRect(6, 4, 20, 14);
      ctx.fillRect(8, 2, 16, 2);
      ctx.fillRect(4, 8, 24, 8);
      // Highlight clusters (bright patches, top-left light source)
      ctx.fillStyle = '#2a7c14';
      ctx.fillRect(8, 4, 6, 4);
      ctx.fillRect(16, 6, 6, 4);
      ctx.fillRect(10, 10, 4, 4);
      ctx.fillRect(20, 10, 4, 4);
      ctx.fillRect(14, 8, 4, 2);
      // Bright specular dot
      ctx.fillStyle = '#3a9c1a';
      ctx.fillRect(10, 5, 2, 2);
      ctx.fillRect(18, 7, 2, 2);
      // Shadow crevices
      ctx.fillStyle = '#072804';
      ctx.fillRect(14, 12, 2, 4);
      ctx.fillRect(8, 10, 2, 2);
      ctx.fillRect(22, 12, 2, 2);
      // Brown trunk
      ctx.fillStyle = '#5a3010'; ctx.fillRect(13, 20, 6, 12);
      ctx.fillStyle = '#3d1e08'; ctx.fillRect(15, 20, 2, 12);
      ctx.fillStyle = '#7a4820'; ctx.fillRect(13, 20, 2, 4);
      t.refresh();
    }

    // ── GBA-style rocky mountain tile ──────────────────────────────────────
    if (!this.textures.exists('mw_walls') && this.textures.exists('tile_mountain')) {
      const t = this.textures.get('tile_mountain');
      const ctx = t.getContext();
      ctx.clearRect(0, 0, 32, 32);
      // Dark base (shadow/background rock)
      ctx.fillStyle = '#2a2a2a'; ctx.fillRect(0, 0, 32, 32);
      // Medium gray rock face — main peak
      ctx.fillStyle = '#3d3535';
      ctx.fillRect(14, 2, 4, 4);
      ctx.fillRect(12, 6, 8, 4);
      ctx.fillRect(10, 10, 12, 4);
      ctx.fillRect(8, 14, 16, 6);
      ctx.fillRect(6, 20, 20, 8);
      ctx.fillRect(4, 28, 24, 4);
      // Secondary rock face (offset peak, left side)
      ctx.fillStyle = '#342e2e';
      ctx.fillRect(2, 14, 8, 4);
      ctx.fillRect(0, 18, 10, 6);
      ctx.fillRect(0, 24, 14, 8);
      // Highlight face (right-center catches light)
      ctx.fillStyle = '#504848';
      ctx.fillRect(16, 8, 6, 6);
      ctx.fillRect(18, 14, 8, 6);
      ctx.fillRect(20, 20, 8, 8);
      // Crevice lines (dark vertical cracks)
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(14, 10, 2, 6);
      ctx.fillRect(20, 16, 2, 8);
      ctx.fillRect(8, 22, 2, 6);
      ctx.fillRect(24, 20, 2, 4);
      // Snow cap
      ctx.fillStyle = '#e8e8f0';
      ctx.fillRect(14, 2, 4, 2);
      ctx.fillRect(13, 4, 6, 2);
      ctx.fillRect(12, 6, 8, 2);
      // Snow shadow edge
      ctx.fillStyle = '#c0c0d0';
      ctx.fillRect(12, 8, 4, 2);
      ctx.fillRect(19, 8, 2, 2);
      t.refresh();
    }

    // ── Mystic Woods player (48×48 spritesheet) ────────────────────────────
    if (this.textures.exists('mw_player')) {
      const mk = (s, e) => this.anims.generateFrameNumbers('mw_player', { start: s, end: e });
      this.anims.create({ key: 'player_walk_down',  frames: mk(0, 5),  frameRate: 8, repeat: -1 });
      this.anims.create({ key: 'player_walk_right', frames: mk(6, 11), frameRate: 8, repeat: -1 });
      this.anims.create({ key: 'player_walk_up',    frames: mk(12,17), frameRate: 8, repeat: -1 });
      // Left walk uses right-walk frames; WorldScene sets flipX(true) when walking left
      this.anims.create({ key: 'player_walk_left',  frames: mk(6, 11), frameRate: 8, repeat: -1 });
      this.anims.create({ key: 'player_idle', frames: [{ key: 'mw_player', frame: 0 }], frameRate: 1, repeat: -1 });
      window.GBA_PLAYER = 'mw_player';
    } else if (this.textures.exists('char_1')) {
      // Fallback: character pack
      const mk = (s, e) => this.anims.generateFrameNumbers('char_1', { start: s, end: e });
      this.anims.create({ key: 'player_walk_down',  frames: mk(0, 2),  frameRate: 8, repeat: -1 });
      this.anims.create({ key: 'player_walk_left',  frames: mk(3, 5),  frameRate: 8, repeat: -1 });
      this.anims.create({ key: 'player_walk_right', frames: mk(6, 8),  frameRate: 8, repeat: -1 });
      this.anims.create({ key: 'player_walk_up',    frames: mk(9, 11), frameRate: 8, repeat: -1 });
      this.anims.create({ key: 'player_idle', frames: [{ key: 'char_1', frame: 1 }], frameRate: 1, repeat: -1 });
      window.GBA_PLAYER = 'char_1';
    }

    // ── Mystic Woods enemy sprites (skeleton, slime) ───────────────────────
    if (this.textures.exists('mw_skeleton')) {
      this.anims.create({ key: 'mw_skeleton_walk', frames: this.anims.generateFrameNumbers('mw_skeleton', { start: 0, end: 5 }), frameRate: 6, repeat: -1 });
      this.anims.create({ key: 'mw_skeleton_idle', frames: [{ key: 'mw_skeleton', frame: 0 }], frameRate: 1, repeat: -1 });
      // Remap hard enemies to skeleton
      window.ENEMIES.forEach(e => { if (e.sprite === 'enemy_7' || e.sprite === 'enemy_8') e.sprite = 'mw_skeleton'; });
    }
    if (this.textures.exists('mw_slime')) {
      this.anims.create({ key: 'mw_slime_walk', frames: this.anims.generateFrameNumbers('mw_slime', { start: 0, end: 5 }), frameRate: 6, repeat: -1 });
      this.anims.create({ key: 'mw_slime_idle', frames: [{ key: 'mw_slime', frame: 0 }], frameRate: 1, repeat: -1 });
      window.ENEMIES.forEach(e => { if (e.sprite === 'enemy_5') e.sprite = 'mw_slime'; });
    }

    // ── Remaining enemies → character pack ────────────────────────────────
    for (let i = 0; i < 10; i++) {
      const charKey = 'char_' + (i + 1);
      if (!this.textures.exists(charKey)) continue;
      window.ENEMIES.forEach(e => { if (e.sprite === 'enemy_' + i) e.sprite = charKey; });
      if (!this.anims.exists(charKey + '_walk'))
        this.anims.create({ key: charKey + '_walk', frames: this.anims.generateFrameNumbers(charKey, { start: 0, end: 2 }), frameRate: 6, repeat: -1 });
      if (!this.anims.exists(charKey + '_idle'))
        this.anims.create({ key: charKey + '_idle', frames: [{ key: charKey, frame: 1 }], frameRate: 1, repeat: -1 });
    }

    window.ANIMAL_KEYS = [];
  }

  // ── UI ELEMENTS ───────────────────────────────────────────────────────

  makeUI() {
    // Battle background
    const bg = this.make.graphics({ add: false });
    bg.fillStyle(0x080810); bg.fillRect(0,0,960,640);
    bg.generateTexture('battle_bg', 960, 640); bg.destroy();

    // Card frame (for board display)
    const cf = this.make.graphics({ add: false });
    cf.fillStyle(0x0e0e1e); cf.fillRoundedRect(0,0,90,115,5);
    cf.lineStyle(2, 0x444444); cf.strokeRoundedRect(0,0,90,115,5);
    cf.generateTexture('card_frame', 90, 115); cf.destroy();
  }
}
