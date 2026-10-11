// Bead color search: matches names, SKUs, finishes, and plain color families ("red", "blue", "brown"),
// so searching "red" also finds Burgundy and Coral Rose even though their names don't say "red"
import { hexToRgb } from './colorLab.js';

function rgbToHsl({ r, g, b }) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
  else if (max === gn) h = ((bn - rn) / d + 2) * 60;
  else h = ((rn - gn) / d + 4) * 60;
  return { h, s, l };
}

/** Plain-language color families for a hex color, e.g. '#800A1C' -> ['red'] */
export function colorFamilies(hex) {
  const { h, s, l } = rgbToHsl(hexToRgb(hex));
  // Very dark but clearly tinted colors (navy, eggplant) keep their hue instead of reading as black
  if (l < 0.13 && s < 0.5) return ['black'];
  if (l > 0.9 && s < 0.5) return ['white'];
  if (s < 0.25) return l > 0.75 ? ['white', 'grey', 'gray', 'light'] : ['grey', 'gray'];

  const families = [];
  if (l < 0.3) families.push('dark', 'deep');
  if (l > 0.7) families.push('light');
  // Muted warm darks read as brown; light muted warms as tan/beige
  if (h >= 10 && h < 50 && l < 0.45 && s < 0.75) families.push('brown');
  if (h >= 20 && h < 55 && l > 0.6 && s < 0.65) families.push('tan', 'beige', 'brown');

  if (h < 15 || h >= 345) families.push(l > 0.7 ? 'pink' : 'red');
  else if (h < 40) families.push('orange');
  else if (h < 65) families.push('yellow');
  else if (h < 170) families.push('green');
  else if (h < 200) families.push('teal', 'cyan', 'blue', 'green');
  else if (h < 255) families.push('blue');
  else if (h < 290) families.push('purple', 'violet');
  else if (h < 330) families.push('pink', 'purple', 'magenta');
  else families.push('pink');
  return [...new Set(families)];
}

/** True when every word of the query matches some property of the color */
export function matchesColorSearch(color, query) {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  // Group names ("Reds & Pinks") are left out on purpose: they'd make "red" match every pink
  const haystack = [color.name, color.id, color.code, color.finish, ...colorFamilies(color.hex)]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return words.every((word) => haystack.includes(word));
}
