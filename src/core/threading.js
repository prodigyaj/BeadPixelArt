// Threading and Stringing Pattern Utilities
// Columns are vertical threads (Left to Right)
// Beads along each thread are threaded strictly from BOTTOM to TOP

/**
 * Extracts a column's beads ordered from BOTTOM to TOP
 * @param {Array<Array<Object>>} matrix - matrix[y][x] where y=0 is top, y=height-1 is bottom
 * @param {number} colIndex - 0-indexed column (thread)
 * @returns {Array<{ beadIndex: number, rowY: number, color: Object }>}
 */
export function getColumnBottomToTop(matrix, colIndex) {
  const height = matrix.length;
  const columnBeads = [];

  // Start at bottom row (height - 1) and move upwards to top row (0)
  let beadNumber = 1;
  for (let y = height - 1; y >= 0; y--) {
    columnBeads.push({
      beadNumber, // 1 to height
      beadIndex: beadNumber - 1, // 0 to height-1
      rowY: y, // corresponding matrix row (0 = visual top)
      colX: colIndex,
      color: matrix[y][colIndex]
    });
    beadNumber++;
  }

  return columnBeads;
}

/**
 * Computes run-length encoded groups for a column from BOTTOM to TOP
 * Example: "8x Matte Beige (Beads 1-8)", "3x Jet Black (Beads 9-11)"
 */
export function getColumnRunLength(matrix, colIndex) {
  const columnBeads = getColumnBottomToTop(matrix, colIndex);
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
export function generateWordChart(matrix, beadSpecs) {
  const height = matrix.length;
  const width = matrix[0].length;
  const lines = [];

  lines.push(`=======================================================`);
  lines.push(`BEAD PIXEL ART - THREAD-BY-THREAD STRINGING GUIDE`);
  lines.push(`=======================================================`);
  lines.push(`Bead Type: ${beadSpecs.name}`);
  lines.push(`Matrix: ${width} Columns (Threads) × ${height} Rows (Beads per thread)`);
  lines.push(`Assembly Rule: Thread Column by Column, strictly from BOTTOM to TOP`);
  lines.push(`=======================================================\n`);

  for (let x = 0; x < width; x++) {
    const threadNum = x + 1;
    lines.push(`--- THREAD #${threadNum} (of ${width}) --- [BOTTOM → TOP]`);
    const groups = getColumnRunLength(matrix, x);
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
