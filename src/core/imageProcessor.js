// Image Processing, Detail Analysis & Aspect-Ratio Corrected Downsampling
import { quantizeAndDither } from './dither.js';
import { preparePalette, findNearestColor } from './colorLab.js';

/**
 * Loads an HTML Image from a file or data URL
 */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Analyzes image complexity (edge energy) to recommend optimal thread columns
 */
export function analyzeDetail(img) {
  const canvas = document.createElement('canvas');
  const sampleW = 120;
  const sampleH = Math.round((sampleW * img.naturalHeight) / img.naturalWidth);
  canvas.width = sampleW;
  canvas.height = sampleH;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, sampleW, sampleH);

  const imgData = ctx.getImageData(0, 0, sampleW, sampleH).data;
  // Compute gradient energy
  let energySum = 0;
  let count = 0;

  for (let y = 1; y < sampleH - 1; y++) {
    for (let x = 1; x < sampleW - 1; x++) {
      const idx = (y * sampleW + x) * 4;
      const leftIdx = (y * sampleW + (x - 1)) * 4;
      const rightIdx = (y * sampleW + (x + 1)) * 4;
      const topIdx = ((y - 1) * sampleW + x) * 4;
      const bottomIdx = ((y + 1) * sampleW + x) * 4;

      const lum = (i) => 0.299 * imgData[i] + 0.587 * imgData[i + 1] + 0.114 * imgData[i + 2];

      const gx = lum(rightIdx) - lum(leftIdx);
      const gy = lum(bottomIdx) - lum(topIdx);
      const grad = Math.sqrt(gx * gx + gy * gy);

      energySum += grad;
      count++;
    }
  }

  const avgEnergy = energySum / count;
  // Energy score 0-100
  const detailScore = Math.min(100, Math.round((avgEnergy / 45) * 100));

  let recommendedCols = 40;
  let recommendationNote = 'Balanced size for wall tapestry';

  if (detailScore < 30) {
    recommendedCols = 30;
    recommendationNote = 'Simple graphics / bold logos look great at 30 threads';
  } else if (detailScore > 65) {
    recommendedCols = 60;
    recommendationNote = 'High detail / portraits need ~60 threads for clear features';
  } else {
    recommendedCols = 45;
    recommendationNote = 'Optimal sweet spot for 6×9mm pony beads on wall';
  }

  return { detailScore, recommendedCols, recommendationNote };
}

/**
 * Applies contrast, brightness, saturation adjustments to pixel data
 */
export function applyAdjustments(data, brightness = 0, contrast = 0, saturation = 0) {
  // brightness: -100 to 100
  // contrast: -100 to 100
  // saturation: -100 to 100
  const b = brightness * 1.28; // -128 to 128
  const cFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  const sFactor = (saturation + 100) / 100;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let bVal = data[i + 2];

    // Brightness
    r += b;
    g += b;
    bVal += b;

    // Contrast
    r = cFactor * (r - 128) + 128;
    g = cFactor * (g - 128) + 128;
    bVal = cFactor * (bVal - 128) + 128;

    // Saturation
    if (sFactor !== 1.0) {
      const gray = 0.2989 * r + 0.5870 * g + 0.1140 * bVal;
      r = gray + (r - gray) * sFactor;
      g = gray + (g - gray) * sFactor;
      bVal = gray + (bVal - gray) * sFactor;
    }

    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, bVal));
  }
}

/**
 * Resamples an image to the bead matrix dimensions and quantizes to palette
 * Accounts for non-square bead geometry (bead.aspectRatio)
 */
export function processImageToBeads({
  image,
  columns,
  rows,
  palette,
  ditherMode = 'floyd-steinberg',
  adjustments = { brightness: 0, contrast: 0, saturation: 0 }
}) {
  const canvas = document.createElement('canvas');
  canvas.width = columns;
  canvas.height = rows;
  const ctx = canvas.getContext('2d');

  // Draw image stretched to exactly [columns x rows]
  // Because the number of rows was already scaled by beadAspectRatio,
  // sampling columns x rows here samples the physical proportions correctly!
  ctx.drawImage(image, 0, 0, columns, rows);

  const imgData = ctx.getImageData(0, 0, columns, rows);
  applyAdjustments(imgData.data, adjustments.brightness, adjustments.contrast, adjustments.saturation);

  const prepared = preparePalette(palette);
  const matrix = quantizeAndDither(imgData.data, columns, rows, prepared, ditherMode);

  return matrix;
}

/**
 * Directly processes an exact matrix image without downsampling or distortion
 * Each pixel in the source image directly corresponds to 1 bead in the matrix
 */
export function processExactMatrixImage({ image, palette }) {
  const width = image.naturalWidth;
  const height = image.naturalHeight;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);

  const imgData = ctx.getImageData(0, 0, width, height).data;
  const prepared = preparePalette(palette);

  const matrix = Array.from({ length: height }, () => new Array(width));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = imgData[idx];
      const g = imgData[idx + 1];
      const b = imgData[idx + 2];
      matrix[y][x] = findNearestColor(r, g, b, prepared);
    }
  }

  return matrix;
}


/**
 * Enlarges a bead matrix so each cell becomes a factor × factor block of beads
 * (used to make small pixel-art designs into bigger wall hangings)
 */
export function scaleMatrix(matrix, factor) {
  if (factor <= 1) return matrix;
  return Array.from({ length: matrix.length * factor }, (_, y) => {
    const sourceRow = matrix[Math.floor(y / factor)];
    return Array.from({ length: sourceRow.length * factor }, (_, x) => sourceRow[Math.floor(x / factor)]);
  });
}
