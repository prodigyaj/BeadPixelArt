import React from 'react';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';

export function Adjustments({
  ditherMode,
  onChangeDitherMode,
  adjustments,
  onChangeAdjustments,
  onResetAdjustments
}) {
  const updateAdjustment = (key, value) => {
    onChangeAdjustments({
      ...adjustments,
      [key]: value
    });
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">
          <SlidersHorizontal size={18} />
          <span>Color & Dithering Tuning</span>
        </h2>
        <button
          className="btn btn-sm"
          onClick={onResetAdjustments}
          title="Reset adjustments to zero"
        >
          <RotateCcw size={12} />
          <span>Reset</span>
        </button>
      </div>

      {/* Dithering Mode */}
      <div className="control-group">
        <div className="control-label">
          <span>Dithering Style:</span>
        </div>
        <select
          value={ditherMode}
          onChange={(e) => onChangeDitherMode(e.target.value)}
        >
          <option value="floyd-steinberg">Floyd-Steinberg (Smooth gradients, photographic)</option>
          <option value="atkinson">Atkinson (High-contrast retro pixel art)</option>
          <option value="bayer">Bayer 4×4 (Textured hatching)</option>
          <option value="none">No Dither (Clean, flat posterized blocks)</option>
        </select>
      </div>

      {/* Brightness */}
      <div className="control-group">
        <div className="control-label">
          <span>Brightness:</span>
          <span className="control-val">{adjustments.brightness > 0 ? `+${adjustments.brightness}` : adjustments.brightness}</span>
        </div>
        <input
          type="range"
          min="-60"
          max="60"
          value={adjustments.brightness}
          onChange={(e) => updateAdjustment('brightness', parseInt(e.target.value, 10))}
        />
      </div>

      {/* Contrast */}
      <div className="control-group">
        <div className="control-label">
          <span>Contrast:</span>
          <span className="control-val">{adjustments.contrast > 0 ? `+${adjustments.contrast}` : adjustments.contrast}</span>
        </div>
        <input
          type="range"
          min="-60"
          max="60"
          value={adjustments.contrast}
          onChange={(e) => updateAdjustment('contrast', parseInt(e.target.value, 10))}
        />
      </div>

      {/* Saturation */}
      <div className="control-group">
        <div className="control-label">
          <span>Color Saturation:</span>
          <span className="control-val">{adjustments.saturation > 0 ? `+${adjustments.saturation}` : adjustments.saturation}</span>
        </div>
        <input
          type="range"
          min="-60"
          max="60"
          value={adjustments.saturation}
          onChange={(e) => updateAdjustment('saturation', parseInt(e.target.value, 10))}
        />
      </div>
    </div>
  );
}
