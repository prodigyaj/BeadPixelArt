// High-performance CIELAB Color Space and Perceptual Color Matching

/**
 * Converts Hex string '#RRGGBB' to RGB object {r, g, b}
 */
export function hexToRgb(hex) {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
}

/**
 * Converts RGB [0-255] to CIELAB {L, a, b} using D65 standard illuminant
 */
export function rgbToLab(r, g, b) {
  // sRGB to linear RGB
  let lr = r / 255;
  let lg = g / 255;
  let lb = b / 255;

  lr = lr > 0.04045 ? Math.pow((lr + 0.055) / 1.055, 2.4) : lr / 12.92;
  lg = lg > 0.04045 ? Math.pow((lg + 0.055) / 1.055, 2.4) : lg / 12.92;
  lb = lb > 0.04045 ? Math.pow((lb + 0.055) / 1.055, 2.4) : lb / 12.92;

  // Linear RGB to CIE XYZ (Observer = 2°, Illuminant = D65)
  let x = (lr * 0.4124564 + lg * 0.3575761 + lb * 0.1804375) * 100;
  let y = (lr * 0.2126729 + lg * 0.7151522 + lb * 0.0721750) * 100;
  let z = (lr * 0.0193339 + lg * 0.1191920 + lb * 0.9503041) * 100;

  // Reference white D65
  const refX = 95.047;
  const refY = 100.000;
  const refZ = 108.883;

  x /= refX;
  y /= refY;
  z /= refZ;

  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);

  const fx = f(x);
  const fy = f(y);
  const fz = f(z);

  const L = Math.max(0, 116 * fy - 16);
  const a = 500 * (fx - fy);
  const bVal = 200 * (fy - fz);

  return { L, a, b: bVal };
}

/**
 * CIELAB Delta E (CIE76 / Euclidean in LAB space) - very fast and perceptually uniform
 */
export function deltaE76(lab1, lab2) {
  const dL = lab1.L - lab2.L;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;
  return dL * dL + da * da + db * db; // Squared distance is sufficient for nearest-neighbor
}

/**
 * Pre-computes RGB and LAB coordinates for a list of palette items
 */
export function preparePalette(palette) {
  return palette.map(item => {
    const rgb = hexToRgb(item.hex);
    const lab = rgbToLab(rgb.r, rgb.g, rgb.b);
    return {
      ...item,
      rgb,
      lab
    };
  });
}

/**
 * Finds the nearest bead color in a prepared palette for an input RGB
 */
export function findNearestColor(r, g, b, preparedPalette) {
  const lab = rgbToLab(r, g, b);
  let minDistance = Infinity;
  let bestMatch = preparedPalette[0];

  for (let i = 0; i < preparedPalette.length; i++) {
    const candidate = preparedPalette[i];
    const dist = deltaE76(lab, candidate.lab);
    if (dist < minDistance) {
      minDistance = dist;
      bestMatch = candidate;
    }
  }

  return bestMatch;
}

/**
 * Consolidates minority (low-count) colors into the nearest existing majority colors
 * @param {Array<Array<Object>>} matrix - Current bead matrix
 * @param {string} mode - 'percent' | 'count'
 * @param {number} threshold - e.g. 1.5 (for 1.5%) or 25 (for 25 beads)
 * @returns {{ matrix: Array<Array<Object>>, substitutions: Array<Object>, savedBags: number, majorityCount: number, minorityCount: number }}
 */
export function consolidateMinorityColors(matrix, mode = 'percent', threshold = 1.5) {
  if (!matrix || matrix.length === 0) return { matrix, substitutions: [], savedBags: 0 };

  const height = matrix.length;
  const width = matrix[0].length;
  const totalBeads = width * height;

  // 1. Calculate color counts
  const colorMap = new Map();
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const c = matrix[y][x];
      const entry = colorMap.get(c.id) || { color: c, count: 0 };
      entry.count++;
      colorMap.set(c.id, entry);
    }
  }

  const allColors = Array.from(colorMap.values()).map(entry => ({
    ...entry.color,
    count: entry.count,
    percentage: (entry.count / totalBeads) * 100,
    lab: entry.color.lab || rgbToLab(hexToRgb(entry.color.hex).r, hexToRgb(entry.color.hex).g, hexToRgb(entry.color.hex).b)
  }));

  // 2. Partition into Majority and Minority based on threshold
  const majority = [];
  const minority = [];

  allColors.forEach(item => {
    const isMajority = mode === 'percent'
      ? item.percentage >= threshold
      : item.count >= threshold;

    if (isMajority) {
      majority.push(item);
    } else {
      minority.push(item);
    }
  });

  // If no minority colors or no majority colors, return unmodified
  if (minority.length === 0 || majority.length === 0) {
    return {
      matrix,
      substitutions: [],
      savedBags: 0,
      majorityCount: majority.length,
      minorityCount: 0
    };
  }

  // 3. For each minority color, find the closest color in the MAJORITY pool
  const substitutionMap = new Map();
  const substitutions = [];

  minority.forEach(minItem => {
    let minDistance = Infinity;
    let bestMajority = majority[0];

    majority.forEach(majItem => {
      const dist = deltaE76(minItem.lab, majItem.lab);
      if (dist < minDistance) {
        minDistance = dist;
        bestMajority = majItem;
      }
    });

    substitutionMap.set(minItem.id, bestMajority);
    substitutions.push({
      fromColor: minItem,
      toColor: bestMajority,
      count: minItem.count,
      percentage: Number(minItem.percentage.toFixed(1))
    });
  });

  // 4. Create new matrix with substitutions applied
  const newMatrix = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => {
      const original = matrix[y][x];
      return substitutionMap.has(original.id) ? substitutionMap.get(original.id) : original;
    })
  );

  return {
    matrix: newMatrix,
    substitutions,
    savedBags: minority.length,
    majorityCount: majority.length,
    minorityCount: minority.length
  };
}

