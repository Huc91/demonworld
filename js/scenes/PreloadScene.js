class PreloadScene extends Phaser.Scene {
  constructor() { super({ key: 'PreloadScene' }); }

  preload() {
    // ── GBA-quality real assets (all gracefully fall back to procedural art) ──
    this.load.image('pk_tileset2',
      'resources/pk_tileset/Game%20Boy%20Advance%20-%20Pokemon%20FireRed%20_%20LeafGreen%20-%20Tilesets%20-%20Tileset%202.png');
    this.load.image('mw_walls',
      'resources/mystic_woods_free_2.2/sprites/tilesets/walls/walls.png');
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
    // Strip white backgrounds from monsty images (base set + island demons)
    for (let i = 1; i <= 30; i++) {
      this._stripWhiteBg('card_art_demon_' + String(i).padStart(3, '0'));
    }
    for (let i = 106; i <= 117; i++) {
      this._stripWhiteBg('card_art_demon_' + String(i).padStart(3, '0'));
    }

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
    // SNES Zelda-style grass with subtle flower accents and varied shading
    this.px('tile_grass', [
      'GGgGGGGGGlGGGGGG',
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
    ], { G: '#3A9228', g: '#1E6010', l: '#5AB840', f: '#F0E870' });

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
    ], { F: '#C8964A', f: '#A87030', L: '#E0B870' });

    // SNES water with classic ripple wave pattern
    this.px('tile_water', [
      'WWwWWWWWWWWWWWWW',
      'WwwwwWWWWWWWWWWW',
      'wwwLwwwWWWWWWWwW',
      'wwLLLwwwWWWWWwww',
      'wwwLwwwwwwwwwwww',
      'Wwwwwwwwwwwwwwww',
      'WWwwwwwwwwwwwwww',
      'WWWwWWwwwwwwwwwW',
      'WWWWWWwwwwWWWWWW',
      'WWWWWWWwwwWWWWWW',
      'WWWWWwwwwwWWWWWW',
      'WWWWwwwwwwwWWWWW',
      'WWwwwwLwwwwwwWWW',
      'Wwwwwwwwwwwwwwww',
      'wwwwwwwwwwwwwwww',
      'WWwwwwwwwwwwwwwW',
    ], { W: '#1848B8', w: '#0828A0', L: '#6098F0', f: '#C0E0FF' });

    // SNES stone brick wall with mortar lines, highlights top-left of bricks
    this.px('tile_wall', [
      'oooooooooooooooo',
      'oLLLLLLosLLLLLo',
      'oLSSSSSSoSSSSSLo',
      'oLSSSSSSoSSSSSLo',
      'oSSSSSSSSSSSSSSo',
      'oSSSSSSSSSSSSSSo',
      'oooooooooooooooo',
      'oLLLLoosLLLLLLo',
      'oLSSSooSSSSSSLo',
      'oLSSSooSSSSSSLo',
      'oSSSSooSSSSSSso',
      'oSSSSooSSSSSSso',
      'oooooooooooooooo',
      'oLLLLLLosLLLLLo',
      'oLSSSSSSoSSSSSLo',
      'oooooooooooooooo',
    ], { S: '#787068', s: '#404038', L: '#A8A090', o: '#181810' });

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

    // SNES top-down tree canopy (circle of dark/medium/light green, brown trunk bottom)
    this.px('tile_tree', [
      'xxxxxxxxGGxxxxxx',
      'xxxxxxGGGGGGxxxx',
      'xxxxxGlGGGGlGxxx',
      'xxxxGGGGGGGGGGxx',
      'xxxGGGGlGGGlGGGx',
      'xxxGGGGGGGGGGGGx',
      'xxxGGlGGGGGGlGGx',
      'xxxxGGGGGGGGGGxx',
      'xxxxxGGGGGGGGxxx',
      'xxxxxxGGGGGGxxxx',
      'xxxxxxxGGGGxxxxx',
      'xxxxxxxttttxxxxx',
      'xxxxxxxttttxxxxx',
      'xxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxx',
      'xxxxxxxxxxxxxxxx',
    ], { G: '#106010', g: '#0A480A', l: '#20A020', t: '#783820', x: null });

    // SNES mountain peak (gray rocks, white snow caps)
    this.px('tile_mountain', [
      'xxxxxxxxxxxxxxxx',
      'xxxxxxxMxxxxxxxx',
      'xxxxxxmMmxxxxxxx',
      'xxxxxmMSMmxxxxxx',
      'xxxxmmMSSMmmxxxx',
      'xxxmmmSSSSMmmxxx',
      'xxmmmmSSSSSMmmxx',
      'xmmmmmSSSSMMmmmx',
      'mmmmmmSSSSMMmmmm',
      'MmmmmMSSSSMmmmmM',
      'MMmmmMSSSSMMmmmM',
      'MMMmmMSSSSMmmmmM',
      'MMMMmMMMMMMmmmmM',
      'MMMMMMMMMMMMmmmM',
      'MMMMMMMMMMMMmmmM',
      'oooooooooooooooo',
    ], { M: '#808888', S: '#D8E0E8', m: '#484848', o: '#181818' });

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
    // ── tile_grass: only tile from the Pokemon FRLG tileset ──────────────
    if (this.textures.exists('pk_tileset2')) {
      const pk = this.textures.get('pk_tileset2').getSourceImage();
      const t = this.textures.get('tile_grass');
      if (t) {
        const c = t.context;
        c.imageSmoothingEnabled = false;
        c.clearRect(0, 0, t.width, t.height);
        // 16×16 tile slot at (0,52); skip 1px separator on each edge → sample 14×14 at (1,53)
        c.drawImage(pk, 1, 53, 14, 14, 0, 0, 32, 32);
        t.refresh();
      }
    }

    // ── Solid color fills for all other tiles ─────────────────────────────
    // (tileset coords to be refined later — solid colors until then)
    const solid = (key, color) => {
      if (!this.textures.exists(key)) return;
      const t = this.textures.get(key);
      const c = t.context;
      c.fillStyle = color;
      c.fillRect(0, 0, t.width, t.height);
      t.refresh();
    };
    solid('tile_grave_grass', '#1e4a1a');  // dark green
    solid('tile_sand',        '#b89018');  // dark yellow
    solid('tile_dirt',        '#5a3010');  // dark brown
    solid('tile_water',       '#1a3aaa');  // blue
    solid('tile_floor',       '#909090');  // light grey
    solid('tile_mountain',    '#4a4848');  // dark brown-grey
    solid('tile_wall',        '#0d0d0d');  // black
    // tile_tree: keep the pixel-art canopy drawn in makeTiles()

    // ── Player animations (char_1, 32×32, 3 cols × 4 rows) ───────────────
    if (this.textures.exists('char_1')) {
      const mk = (s, e) => this.anims.generateFrameNumbers('char_1', { start: s, end: e });
      this.anims.create({ key: 'player_walk_down',  frames: mk(0, 2),  frameRate: 8, repeat: -1 });
      this.anims.create({ key: 'player_walk_left',  frames: mk(3, 5),  frameRate: 8, repeat: -1 });
      this.anims.create({ key: 'player_walk_right', frames: mk(6, 8),  frameRate: 8, repeat: -1 });
      this.anims.create({ key: 'player_walk_up',    frames: mk(9, 11), frameRate: 8, repeat: -1 });
      this.anims.create({ key: 'player_idle', frames: [{ key: 'char_1', frame: 1 }], frameRate: 1, repeat: -1 });
      window.GBA_PLAYER = 'char_1';
    }

    // ── Enemy sprites → character pack ────────────────────────────────────
    for (let i = 0; i < 10; i++) {
      const charKey = 'char_' + (i + 1);
      if (!this.textures.exists(charKey)) continue;
      window.ENEMIES.forEach(e => { if (e.sprite === 'enemy_' + i) e.sprite = charKey; });
      this.anims.create({ key: charKey + '_walk', frames: this.anims.generateFrameNumbers(charKey, { start: 0, end: 2 }), frameRate: 6, repeat: -1 });
      this.anims.create({ key: charKey + '_idle', frames: [{ key: charKey, frame: 1 }], frameRate: 1, repeat: -1 });
    }

    window.ANIMAL_KEYS = []; // animals removed
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
