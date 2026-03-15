class PreloadScene extends Phaser.Scene {
  constructor() { super({ key: 'PreloadScene' }); }

  preload() {
    // Load unique pixel art for each demon card from Free Mythic Monsters pack
    // (spaces encoded as %20 for reliable URL loading)
    const BASE = 'Free%20Mythic%20Monsters/Free%20Mythic%20Monsters/Transparent/1x%20Size/';
    const MAP = {
      'demon_001': '003_1', // Imp           — red fire creature
      'demon_002': '021_1', // Hellhound     — fire lion
      'demon_003': '001_1', // Plague Rat    — scarab/spider
      'demon_004': '016_1', // Shadow Hound  — blue slime/shadow
      'demon_005': '004_1', // Bone Knight   — armored warrior
      'demon_006': '006_1', // Specter       — blue ghost
      'demon_007': '005_1', // Succubus      — divine warrior
      'demon_008': '007_1', // Blood Bat     — dark spider
      'demon_009': '023_1', // Golem         — blue troll/golem
      'demon_010': '011_1', // Cerberus      — orange multi-limb beast
      'demon_011': '010_1', // Wraith        — ethereal jellyfish
      'demon_012': '027_1', // Minotaur      — golden beast
      'demon_013': '014_1', // Ember Drake   — orange dragon
      'demon_014': '024_1', // Sand Ghoul    — desert serpent
      'demon_015': '028_1', // Void Crawler  — ice/void cube
      'demon_016': '025_1', // Nightmare     — fire demon
      'demon_017': '031_1', // Iron Djinn    — golden giant
      'demon_018': '030_1', // Dusk Faerie   — golden phoenix
      'demon_019': '017_1', // Pit Fiend     — fire wyvern
      'demon_020': '009_1', // Medusa        — cobra
      'demon_021': '020_1', // Lich King     — skeleton knight
      'demon_022': '008_1', // Beelzebub     — wasp (Lord of Flies)
      'demon_023': '022_1', // Baphomet      — electric dark god
    };
    Object.entries(MAP).forEach(([cardId, file]) => {
      this.load.image('card_art_' + cardId, BASE + file + '.png');
    });
  }

  create() {
    this.makeTiles();
    this.makePlayer();
    this.makeEnemies();
    this.makeCardArt();
    this.makeUI();
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
