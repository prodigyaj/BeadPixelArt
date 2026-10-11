// Threading and Stringing Pattern Utilities
// Columns are vertical threads (Left to Right). Beads go onto each thread in one of two orders:
//   'top-down'  - thread tied to the dowel first, each new bead pushed up under the last (first bead = top)
//   'bottom-up' - knot / stopper bead at the bottom, beads drop down onto it (first bead = bottom)

export const DEFAULT_STRINGING_DIRECTION = 'top-down';

export const STRINGING_LABELS = {
  'top-down': { start: 'top', end: 'bottom', arrow: 'TOP → BOTTOM' },
  'bottom-up': { start: 'bottom', end: 'top', arrow: 'BOTTOM → TOP' }
};

/**
 * Matrix row (0 = visual top) for the Nth bead strung on a thread (1-based)
 */
export function rowForBead(beadNumber, height, direction = DEFAULT_STRINGING_DIRECTION) {
  return direction === 'bottom-up' ? height - beadNumber : beadNumber - 1;
}

/**
 * Stringing position (1-based) of the bead at a matrix row
 */
export function beadNumberForRow(row, height, direction = DEFAULT_STRINGING_DIRECTION) {
  return direction === 'bottom-up' ? height - row : row + 1;
}

/**
 * Extracts a column's beads in the order they are strung
 * @param {Array<Array<Object>>} matrix - matrix[y][x] where y=0 is top, y=height-1 is bottom
 * @param {number} colIndex - 0-indexed column (thread)
 * @returns {Array<{ beadNumber: number, rowY: number, colX: number, color: Object }>}
 */
export function getColumnSequence(matrix, colIndex, direction = DEFAULT_STRINGING_DIRECTION) {
  const height = matrix.length;
  return Array.from({ length: height }, (_, i) => {
    const rowY = rowForBead(i + 1, height, direction);
    return { beadNumber: i + 1, rowY, colX: colIndex, color: matrix[rowY][colIndex] };
  });
}

/**
 * Computes run-length encoded groups for a column in stringing order
 * Example: "8x Matte Beige (Beads 1-8)", "3x Jet Black (Beads 9-11)"
 */
export function getColumnRunLength(matrix, colIndex, direction = DEFAULT_STRINGING_DIRECTION) {
  const columnBeads = getColumnSequence(matrix, colIndex, direction);
  if (columnBeads.length === 0) return [];

  const groups = [];
  let currentColor = columnBeads[0].color;
  let currentCount = 0;
  let startBead = 1;

  for (let i = 0; i < columnBeads.length; i++) {
    const bead = columnBeads[i];
    if (bead.color.id === currentColor.id) {
      currentCount++;
    } else {
      groups.push({
        color: currentColor,
        count: currentCount,
        startBead,
        endBead: startBead + currentCount - 1
      });
      currentColor = bead.color;
      currentCount = 1;
      startBead = bead.beadNumber;
    }
  }

  // Push final group
  if (currentCount > 0) {
    groups.push({
      color: currentColor,
      count: currentCount,
      startBead,
      endBead: startBead + currentCount - 1
    });
  }

  return groups;
}

/**
 * Generates a complete printable / readable "Word Chart" for all threads
 */
export function generateWordChart(matrix, beadSpecs, direction = DEFAULT_STRINGING_DIRECTION) {
  const labels = STRINGING_LABELS[direction];
  const height = matrix.length;
  const width = matrix[0].length;
  const lines = [];

  lines.push(`=======================================================`);
  lines.push(`BEAD PIXEL ART - THREAD-BY-THREAD STRINGING GUIDE`);
  lines.push(`Created with ❤️ by Ajay & Moss`);
  lines.push(`=======================================================`);
  lines.push(`Bead Type: ${beadSpecs.name}`);
  lines.push(`Matrix: ${width} Columns (Threads) × ${height} Rows (Beads per thread)`);
  lines.push(`Assembly Rule: Thread Column by Column, strictly from ${labels.arrow}`);
  lines.push(
    direction === 'bottom-up'
      ? `(Knot or stopper bead at the bottom first; bead 1 sits at the bottom)`
      : `(Tie the thread to the dowel first; bead 1 sits at the top)`
  );
  lines.push(`=======================================================\n`);

  for (let x = 0; x < width; x++) {
    const threadNum = x + 1;
    lines.push(`--- THREAD #${threadNum} (of ${width}) --- [${labels.arrow}]`);
    const groups = getColumnRunLength(matrix, x, direction);
    groups.forEach((grp, idx) => {
      lines.push(
        `  ${idx + 1}. [Beads ${grp.startBead.toString().padStart(3, ' ')}-${grp.endBead.toString().padStart(3, ' ')}]  ` +
        `${grp.count.toString().padStart(2, ' ')}× ${grp.color.name} (${grp.color.id})`
      );
    });
    lines.push(``);
  }

  return lines.join('\n');
}

/**
 * Calculates color statistics, shopping list & 1000-bead bags
 */
export function calculateColorStats(matrix, beadsPerBag = 1000) {
  const height = matrix.length;
  const width = matrix[0].length;
  const totalBeads = width * height;
  const counts = new Map();

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const color = matrix[y][x];
      const existing = counts.get(color.id) || { color, count: 0 };
      existing.count++;
      counts.set(color.id, existing);
    }
  }

  // Sort descending by count
  const sorted = Array.from(counts.values()).sort((a, b) => b.count - a.count);

  return sorted.map(item => ({
    ...item.color,
    count: item.count,
    percentage: Number(((item.count / totalBeads) * 100).toFixed(1)),
    bagsNeeded: Math.ceil(item.count / beadsPerBag)
  }));
}
