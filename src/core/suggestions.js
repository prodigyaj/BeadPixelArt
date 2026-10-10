// "What can I make with my beads?" — ranks pixel-art designs against the colors a user owns
import { hexToRgb, rgbToLab, deltaE76 } from './colorLab.js';
import { renderDesignThumb } from '../data/pixelArtSamples.js';

// CIE76 color distance bands (perceptual; ~2.3 is a just-noticeable difference)
const CLOSE_MATCH_MAX_DISTANCE = 20;
// Extra score when two of a design's colors would become the same bead (shapes blur together)
const MERGE_PENALTY = 60;

const labOf = (hex) => {
  const { r, g, b } = hexToRgb(hex);
  return rgbToLab(r, g, b);
};

/**
 * @param {Array} samples - pixel-art samples carrying `design: { grid, colors }`
 * @param {Array} catalog - full bead palette (to look up a design's original colors)
 * @param {Array} ownedColors - palette entries the user owns
 * @returns {Array<{ sample, status: 'ready'|'close'|'swaps', swaps, mergedCount, previewSrc }>} best first
 */
export function suggestDesigns(samples, catalog, ownedColors) {
  if (ownedColors.length === 0) return [];
  const catalogById = new Map(catalog.map((c) => [c.id, c]));
  const owned = ownedColors.map((c) => ({ ...c, lab: labOf(c.hex) }));
  const ownedIds = new Set(owned.map((c) => c.id));

  const nearestOwned = (color) => {
    if (ownedIds.has(color.id)) return { match: color, distance: 0 };
    const lab = labOf(color.hex);
    let best = owned[0];
    let bestDist = Infinity;
    for (const candidate of owned) {
      const dist = deltaE76(lab, candidate.lab);
      if (dist < bestDist) {
        bestDist = dist;
        best = candidate;
      }
    }
    return { match: best, distance: Math.sqrt(bestDist) };
  };

  return samples
    .filter((s) => s.design)
    .map((sample) => {
      const { grid, colors } = sample.design;
      const pixels = grid.join('');
      const shareOf = (ch) => pixels.split(ch).length - 1;

      const mapping = Object.entries(colors).map(([ch, colorId]) => {
        const original = catalogById.get(colorId);
        const { match, distance } = nearestOwned(original);
        return { ch, original, match, distance, share: shareOf(ch) / pixels.length };
      });

      // Design colors that land on the same owned bead lose the contrast between them
      const usage = new Map();
      mapping.forEach((m) => usage.set(m.match.id, (usage.get(m.match.id) || 0) + 1));
      const mergedCount = [...usage.values()].reduce((acc, n) => acc + (n - 1), 0);

      const swaps = mapping
        .filter((m) => m.distance > 0)
        .map((m) => ({ from: m.original, to: m.match, merges: usage.get(m.match.id) > 1 }));
      const maxDistance = Math.max(0, ...mapping.map((m) => m.distance));
      const score =
        mapping.reduce((acc, m) => acc + m.distance * (0.5 + m.share), 0) + mergedCount * MERGE_PENALTY;

      const status =
        swaps.length === 0 ? 'ready' : mergedCount === 0 && maxDistance <= CLOSE_MATCH_MAX_DISTANCE ? 'close' : 'swaps';

      const hexById = new Map(mapping.map((m) => [m.original.id, m.match.hex]));
      return {
        sample,
        status,
        swaps,
        mergedCount,
        score,
        previewSrc: renderDesignThumb(sample.design, (id) => hexById.get(id))
      };
    })
    .sort((a, b) => a.score - b.score);
}
