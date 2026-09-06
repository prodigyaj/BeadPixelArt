// Image Dithering Algorithms optimized for Bead Matrices
import { findNearestColor } from './colorLab.js';

// 4x4 Bayer matrix normalized
const BAYER_4X4 = [
  [ 0,  8,  2, 10],
  [12,  4, 14,  6],
  [ 3, 11,  1,  9],
  [15,  7, 13,  5]
].map(row => row.map(v => (v / 16 - 0.5) * 45)); // scaled threshold range

/**
 * Apply Quantization and Dithering to an RGB image buffer
 * @param {Float32Array|Uint8ClampedArray} rgbData - Interleaved [R, G, B, A] per pixel
 * @param {number} width - Number of columns
 * @param {number} height - Number of rows
 * @param {Array} preparedPalette - Precomputed palette with LAB coords
 * @param {string} mode - 'none' | 'floyd-steinberg' | 'atkinson' | 'bayer'
 * @returns {Array<Array<Object>>} matrix - 2D grid matrix[y][x] of matched bead objects
 */
export function quantizeAndDither(rgbData, width, height, preparedPalette, mode = 'floyd-steinberg') {
  // Work with floating point copy to diffuse quantization errors without integer clamp issues
  const currentR = new Float32Array(width * height);
  const currentG = new Float32Array(width * height);
  const currentB = new Float32Array(width * height);

  for (let i = 0; i < width * height; i++) {
    currentR[i] = rgbData[i * 4];
    currentG[i] = rgbData[i * 4 + 1];
    currentB[i] = rgbData[i * 4 + 2];
  }

  // Initialize 2D matrix
  const matrix = Array.from({ length: height }, () => new Array(width));

  // Helper clamp
  const clamp = (v) => Math.max(0, Math.min(255, v));

  if (mode === 'none') {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const matched = findNearestColor(currentR[idx], currentG[idx], currentB[idx], preparedPalette);
        matrix[y][x] = matched;
      }
    }
    return matrix;
  }

  if (mode === 'bayer') {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const offset = BAYER_4X4[y % 4][x % 4];
        const r = clamp(currentR[idx] + offset);
        const g = clamp(currentG[idx] + offset);
        const b = clamp(currentB[idx] + offset);
        matrix[y][x] = findNearestColor(r, g, b, preparedPalette);
      }
    }
    return matrix;
  }

  // Error diffusion routines: Floyd-Steinberg or Atkinson
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const oldR = clamp(currentR[idx]);
      const oldG = clamp(currentG[idx]);
      const oldB = clamp(currentB[idx]);

      const matched = findNearestColor(oldR, oldG, oldB, preparedPalette);
      matrix[y][x] = matched;

      const errR = oldR - matched.rgb.r;
      const errG = oldG - matched.rgb.g;
      const errB = oldB - matched.rgb.b;

      if (mode === 'floyd-steinberg') {
        // Floyd-Steinberg diffusion:
        //      *    7/16
        // 3/16 5/16 1/16
        const diffuse = (dx, dy, weight) => {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nIdx = ny * width + nx;
            currentR[nIdx] += errR * weight;
            currentG[nIdx] += errG * weight;
            currentB[nIdx] += errB * weight;
          }
        };

        diffuse(1, 0, 7 / 16);
        diffuse(-1, 1, 3 / 16);
        diffuse(0, 1, 5 / 16);
        diffuse(1, 1, 1 / 16);
      } else if (mode === 'atkinson') {
        // Atkinson diffusion distributes 1/8 each to 6 neighbors (retaining high contrast):
        //        *   1/8  1/8
        //  1/8  1/8  1/8
        //       1/8
        const diffuse = (dx, dy) => {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nIdx = ny * width + nx;
            currentR[nIdx] += (errR / 8);
            currentG[nIdx] += (errG / 8);
            currentB[nIdx] += (errB / 8);
          }
        };

        diffuse(1, 0);
        diffuse(2, 0);
        diffuse(-1, 1);
        diffuse(0, 1);
        diffuse(1, 1);
        diffuse(0, 2);
      }
    }
  }

  return matrix;
}
