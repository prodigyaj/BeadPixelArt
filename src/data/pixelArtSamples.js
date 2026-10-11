// Simple beginner pixel-art designs, each using at most 6 pony bead colors.
// Every character maps to a bead color id from palettes/ponyBeads.js. Most grids are drawn
// with square pixels; because 6×9mm pony beads are 1.5× wider than tall, their rows are
// stretched 1.5× when building the bead image so the finished hanging keeps its shape.
// Designs marked beadSpace are drawn one row per bead row instead (finer vertical detail).
import { PONY_BEAD_PALETTE } from '../palettes/ponyBeads.js';

const PONY_ROW_STRETCH = 1.5;

const DESIGNS = [
  {
    id: 'simple-heart',
    name: 'Red Heart',
    colors: { '.': 'PB-02', D: 'PB-11', R: 'PB-10', P: 'PB-13' },
    grid: [
      '..............',
      '..DDD....DDD..',
      '.DRRRD..DRRRD.',
      'DRPPRRDDRRRRRD',
      'DRPRRRRRRRRRRD',
      'DRRRRRRRRRRRRD',
      'DRRRRRRRRRRRRD',
      '.DRRRRRRRRRRD.',
      '..DRRRRRRRRD..',
      '...DRRRRRRD...',
      '....DRRRRD....',
      '.....DRRD.....',
      '......DD......',
      '..............'
    ]
  },
  {
    id: 'simple-smiley',
    name: 'Happy Face',
    colors: { '.': 'PB-27', K: 'PB-01', Y: 'PB-19', O: 'PB-17' },
    grid: [
      '....KKKKKK....',
      '..KKYYYYYYKK..',
      '.KYYYYYYYYYYK.',
      '.KYYYYYYYYYYK.',
      'KYYYKYYYYKYYYK',
      'KYYYKYYYYKYYYK',
      'KYYYYYYYYYYYYK',
      'KYOYYYYYYYYOYK',
      'KYYKYYYYYYKYYK',
      '.KYYKYYYYKYYK.',
      '.KYYYKKKKYYYK.',
      '..KKYYYYYYKK..',
      '....KKKKKK....'
    ]
  },
  {
    id: 'simple-mushroom',
    name: 'Mushroom',
    colors: { '.': 'PB-03', K: 'PB-01', R: 'PB-10', W: 'PB-02', T: 'PB-04', G: 'PB-22' },
    grid: [
      '.....KKKK.....',
      '...KKRRRRKK...',
      '..KRRWWRRRRK..',
      '.KRRWWWRRWWRK.',
      '.KRRRRRRRWWRK.',
      'KRWWRRRRRRRRRK',
      'KRWWRRRWWRRRRK',
      'KRRRRRRWWRRRRK',
      '.KKKKKKKKKKKK.',
      '...KTTTTTTK...',
      '...KTKTTKTK...',
      '...KTTTTTTK...',
      '....KKKKKK....',
      'GGGGGGGGGGGGGG'
    ]
  },
  {
    id: 'simple-rainbow',
    name: 'Rainbow',
    colors: { '.': 'PB-27', R: 'PB-10', O: 'PB-17', Y: 'PB-19', G: 'PB-22', W: 'PB-02' },
    grid: [
      '..............',
      '.....RRRR.....',
      '...RRRRRRRR...',
      '..RROOOOOORR..',
      '.RROOYYYYOORR.',
      '.ROOYYGGYYOOR.',
      'RROYYG..GYYORR',
      'ROOYG....GYOOR',
      'ROYGG....GGYOR',
      'ROYG......GYOR',
      'WWWW......WWWW',
      'WWWWW....WWWWW'
    ]
  },
  {
    id: 'simple-cat',
    name: 'Orange Cat',
    colors: { '.': 'PB-33', O: 'PB-16', K: 'PB-01', W: 'PB-02', P: 'PB-13', G: 'PB-22' },
    grid: [
      '.O..........O.',
      '.OO........OO.',
      '.OPO......OPO.',
      '.OPOOOOOOOOPO.',
      '.OOOOOOOOOOOO.',
      'OOOOOOOOOOOOOO',
      'OOGKOOOOOOGKOO',
      'OOGGOOOOOOGGOO',
      'OOOOOOPPOOOOOO',
      'OWWWOOKKOOWWWO',
      '.OWWWKOOKWWWO.',
      '..OOOOOOOOOO..',
      '....OOOOOO....'
    ]
  },
  {
    id: 'simple-flower',
    name: 'Pink Flower',
    colors: { '.': 'PB-02', P: 'PB-12', Y: 'PB-19', G: 'PB-23', L: 'PB-22' },
    grid: [
      '......PP......',
      '....PPPPPP....',
      '...PPPPPPPP...',
      '..PPPPYYPPPP..',
      '..PPPYYYYPPP..',
      '..PPPYYYYPPP..',
      '..PPPPYYPPPP..',
      '...PPPPPPPP...',
      '....PPPPPP....',
      '......GG......',
      '..LL..GG......',
      '.LLLL.GG..LL..',
      '..LLLLGG.LLLL.',
      '....LLGGLLL...',
      '......GG......'
    ]
  },

  // Halloween specials
  {
    id: 'halloween-pumpkin',
    name: "Jack-o'-Lantern",
    category: 'Halloween',
    colors: { '.': 'PB-31', B: 'PB-06', G: 'PB-23', O: 'PB-16', M: 'PB-17', Y: 'PB-19' },
    grid: [
      '......BB......',
      '......BBGG....',
      '..OOOOOOOOOO..',
      '.OOMOOOOOOOOO.',
      'OOMOOOOOOOOOOO',
      'OMOYOOOOOOYOOO',
      'OMOYYOOOOYYOOO',
      'OMOOOOYYOOOOOO',
      'OOYOOOOOOOOYOO',
      'OOOYYYYYYYYOOO',
      'OOOOYOYYOYOOOO',
      '.OOOOOOOOOOOO.',
      '..OOOOOOOOOO..'
    ]
  },
  {
    id: 'halloween-ghost',
    name: 'Friendly Ghost',
    category: 'Halloween',
    colors: { '.': 'PB-35', W: 'PB-02', K: 'PB-01', P: 'PB-13' },
    grid: [
      '..............',
      '.....WWWW.....',
      '...WWWWWWWW...',
      '..WWWWWWWWWW..',
      '..WWKKWWKKWW..',
      '.WWWKKWWKKWWW.',
      '.WWWWWWWWWWWW.',
      '.WPWWWKKWWWPW.',
      '.WWWWWKKWWWWW.',
      '.WWWWWWWWWWWW.',
      '.WWWWWWWWWWWW.',
      '.WWWWWWWWWWWW.',
      '.WWW.WWWW.WWW.',
      '.WW...WW...WW.'
    ]
  },
  {
    id: 'halloween-bat',
    name: 'Bat',
    category: 'Halloween',
    colors: { '.': 'PB-17', K: 'PB-01', R: 'PB-10', S: 'PB-08' },
    grid: [
      '...............',
      '......K.K......',
      '......KKK......',
      'K....KRKRK....K',
      'KK...KKKKK...KK',
      'KKK.KKKKKKK.KKK',
      'KKKKKKKKKKKKKKK',
      'KSKKKKKKKKKKKSK',
      'KK.KKKKKKKKK.KK',
      'K...K.KKK.K...K',
      '......K.K......',
      '...............'
    ]
  },
  {
    id: 'halloween-candy-corn',
    name: 'Candy Corn',
    category: 'Halloween',
    colors: { '.': 'PB-35', W: 'PB-02', O: 'PB-16', Y: 'PB-19' },
    grid: [
      '.....WW.....',
      '....WWWW....',
      '....WWWW....',
      '...OOOOOO...',
      '...OOOOOO...',
      '..OOOOOOOO..',
      '..OOOOOOOO..',
      '.YYYYYYYYYY.',
      '.YYYYYYYYYY.',
      'YYYYYYYYYYYY',
      'YYYYYYYYYYYY',
      '.YYYYYYYYYY.'
    ]
  },
  {
    id: 'halloween-skeleton',
    name: 'Meditating Skeleton',
    category: 'Halloween',
    beadSpace: true, // drawn one row per bead row for extra detail (no 1.5× row stretch)
    colors: { '.': 'PB-01', W: 'PB-02' },
    grid: [
      '....................................',
      '....................................',
      '....................................',
      '................WWWW................',
      '..............WWWWWWWW..............',
      '.............WWWWWWWWWW.............',
      '.............WWWWWWWWWW.............',
      '............WWWWWWWWWWWW............',
      '............WW..WWWW..WW............',
      '............W....WW....W............',
      '............W....WW....W............',
      '............WW..WWWW..WW............',
      '.............WWWW..WWWW.............',
      '.............WWWW..WWWW.............',
      '..............WWWWWWWW..............',
      '..............W.WWWW.W..............',
      '..............WW.WW.WW..............',
      '...............WW..WW...............',
      '................WWWW................',
      '....................................',
      '.................WW.................',
      '...........WWWWWWWWWWWWWW...........',
      '..........WW.....WW.....WW..........',
      '..........W...WWWWWWWW...W..........',
      '..........W...W..WW..W...W..........',
      '.........W...WWWWWWWWWW...W.........',
      '.........W...W...WW...W...W.........',
      '.........W..WWWWWWWWWWWW..W.........',
      '.........W..W....WW....W..W.........',
      '........W...WWWWWWWWWWWW...W........',
      '........W...W....WW....W...W........',
      '.......WW....WWWWWWWWWW....WW.......',
      '......WW.....W...WW...W.....WW......',
      '......W.......WWWWWWWW.......W......',
      '.....WW.........WWWW.........WW.....',
      '.....W...........WW...........W.....',
      '....WW..........WWWW..........WW....',
      '.W.WW............WW............WW.W.',
      '.W.W.........WWWWWWWWWW.........W.W.',
      '.WWW........WW..WWWW..WW........WWW.',
      'WWWWW.......WW..W..W..WW.......WWWWW',
      'W..W.........WW.WWWW.WW.........W..W',
      '.WW............WW..WW............WW.',
      '..WWW.WWWWWWWW........WWWWWWWW.WWW..',
      '.WWWWWWWWWWWW..........WWWWWWWWWWWW.',
      '.WWWW..........................WWWW.',
      '....WWWWW..................WWWWW....',
      '........WWWWW..........WWWWW........',
      '............WWWWW..WWWWW............',
      '................WWWW................',
      '............WWWWWWWWWWWW............',
      '.........WWWWWW......WWWWWW.........',
      '........WWWWWW........WWWWWW........',
      '........W.W.W..........W.W.W........',
      '....................................',
      '....................................',
      '....................................'
    ]
  },
  {
    id: 'halloween-monster',
    name: 'Little Monster',
    category: 'Halloween',
    colors: { '.': 'PB-35', K: 'PB-01', G: 'PB-22', W: 'PB-02', S: 'PB-09' },
    grid: [
      '..KKKKKKKKKK..',
      '..KKKKKKKKKK..',
      '..KGKGKKGKGK..',
      '..GGGGGGGGGG..',
      '..GWKGGGGKWG..',
      'SSGGGGGGGGGGSS',
      '..GGGGGGGGGG..',
      '..GGGKKKKGGG..',
      '..GGGGGGGGGG..',
      '...GGGGGGGG...'
    ]
  }
];

const hexById = new Map(PONY_BEAD_PALETTE.map((c) => [c.id, c.hex]));

// Builds an SVG with one rect per horizontal run of same-colored pixels.
// hexFor maps a color id to a hex (lets suggestions preview a design in substitute colors).
// cellW/cellH set each pixel's aspect (3×2 previews bead-space grids at pony bead proportions).
function gridToSvg(rows, colors, hexFor = (id) => hexById.get(id), cellW = 1, cellH = 1) {
  const width = rows[0].length;
  const height = rows.length;
  const rects = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < width) {
      const ch = row[x];
      let end = x + 1;
      while (end < width && row[end] === ch) end++;
      rects.push(
        `<rect x="${x * cellW}" y="${y * cellH}" width="${(end - x) * cellW}" height="${cellH}" fill="${hexFor(colors[ch])}"/>`
      );
      x = end;
    }
  });
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width * cellW} ${height * cellH}" width="${width * cellW}" height="${height * cellH}" shape-rendering="crispEdges">` +
    rects.join('') +
    `</svg>`
  );
}

// Square-pixel preview of a design, optionally recolored: hexFor(colorId) => hex
export const renderDesignThumb = (design, hexFor) =>
  toDataUri(gridToSvg(design.grid, design.colors, hexFor, ...(design.beadSpace ? [3, 2] : [])));

const toDataUri = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

export const PIXEL_ART_SAMPLES = DESIGNS.map(({ id, name, category = 'Everyday', beadSpace = false, colors, grid }) => {
  const stretchedRows = beadSpace
    ? grid
    : Array.from({ length: Math.round(grid.length * PONY_ROW_STRETCH) }, (_, r) => grid[Math.floor(r / PONY_ROW_STRETCH)]);
  const colorCount = new Set(grid.join('')).size;
  return {
    id,
    name,
    description: `${grid[0].length} × ${stretchedRows.length} beads • ${colorCount} colors`,
    src: toDataUri(gridToSvg(stretchedRows, colors)),
    thumbSrc: renderDesignThumb({ grid, colors, beadSpace }), // true-proportion preview for the gallery
    isExactMatrix: true,
    isSimple: true,
    category,
    design: { grid, colors, beadSpace } // source grid + color ids, used for inventory suggestions
  };
});
