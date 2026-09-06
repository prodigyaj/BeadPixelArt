// Physical specifications of beads
export const BEAD_PRESETS = [
  {
    id: 'pony-6x9',
    name: '6×9 mm Pony Bead (Default)',
    description: 'Standard barrel craft bead (e.g., Auvoau B0BKS8HJWX) strung on thread',
    widthMm: 9.0, // horizontal outer diameter across columns
    heightMm: 6.0, // vertical height / drop along the thread
    holeMm: 4.0,  // center vertical hole
    aspectRatio: 1.5, // 9.0 / 6.0 (wider than tall)
    beadsPerBag: 1000,
    isBarrel: true,
    defaultThreads: 40,
    defaultRows: 50
  },
  {
    id: 'perler-midi-5mm',
    name: '5 mm Midi Bead (Perler / Hama)',
    description: 'Square aspect fuse / pegboard bead',
    widthMm: 5.0,
    heightMm: 5.0,
    holeMm: 2.5,
    aspectRatio: 1.0,
    beadsPerBag: 1000,
    isBarrel: false,
    defaultThreads: 58,
    defaultRows: 58
  },
  {
    id: 'perler-mini-2.6mm',
    name: '2.6 mm Mini Bead (Artkal / Perler)',
    description: 'Ultra-fine detailed miniature fuse bead',
    widthMm: 2.6,
    heightMm: 2.6,
    holeMm: 1.3,
    aspectRatio: 1.0,
    beadsPerBag: 1000,
    isBarrel: false,
    defaultThreads: 80,
    defaultRows: 80
  },
  {
    id: 'delica-11-0',
    name: 'Miyuki Delica 11/0 Seed Bead',
    description: 'Precision cylinder bead for fine bead-weaving',
    widthMm: 1.6,
    heightMm: 1.3,
    holeMm: 0.8,
    aspectRatio: 1.23,
    beadsPerBag: 1000,
    isBarrel: true,
    defaultThreads: 90,
    defaultRows: 110
  }
];

export const DEFAULT_BEAD_ID = 'pony-6x9';

/**
 * Calculates physical wall hanging dimensions in cm and inches
 * @param {number} columns - Number of vertical threads
 * @param {number} rows - Number of beads per thread
 * @param {number} widthMm - Bead width in mm
 * @param {number} heightMm - Bead height in mm
 * @param {number} fringeAllowanceCm - Extra hanging thread top/bottom (default 15cm each)
 */
export function calculatePhysicalSpecs(columns, rows, widthMm, heightMm, fringeAllowanceCm = 15) {
  const widthCm = (columns * widthMm) / 10;
  const heightCm = (rows * heightMm) / 10;
  const widthInches = widthCm / 2.54;
  const heightInches = heightCm / 2.54;

  const totalBeads = columns * rows;
  // Each warp thread needs the tapestry height + top dowel loop + bottom fringe/knot
  const threadLengthPerColCm = heightCm + (fringeAllowanceCm * 2);
  const totalThreadMeters = (columns * threadLengthPerColCm) / 100;
  const totalThreadYards = totalThreadMeters * 1.09361;

  return {
    columns,
    rows,
    widthCm: Number(widthCm.toFixed(1)),
    heightCm: Number(heightCm.toFixed(1)),
    widthInches: Number(widthInches.toFixed(1)),
    heightInches: Number(heightInches.toFixed(1)),
    totalBeads,
    threadLengthPerColCm: Math.round(threadLengthPerColCm),
    totalThreadMeters: Number(totalThreadMeters.toFixed(1)),
    totalThreadYards: Number(totalThreadYards.toFixed(1))
  };
}
