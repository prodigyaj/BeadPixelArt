import React, { useState } from 'react';
import { Ruler, Sparkles, Lock, Unlock } from 'lucide-react';
import { BEAD_PRESETS, calculatePhysicalSpecs } from '../core/beadSpecs.js';

export function WallCalculator({
  activeBeadPreset,
  onSelectBeadPreset,
  customBeadSpecs,
  onUpdateCustomBeadSpecs,
  columns,
  onChangeColumns,
  rows,
  onChangeRows,
  lockAspectRatio,
  onToggleLockAspectRatio,
  recommendation,
  sourceImageRatio,
  isExactMatrixMode = false
}) {
  const [isCustomBead, setIsCustomBead] = useState(false);

  const currentWidthMm = isCustomBead ? customBeadSpecs.widthMm : activeBeadPreset.widthMm;
  const currentHeightMm = isCustomBead ? customBeadSpecs.heightMm : activeBeadPreset.heightMm;

  const specs = calculatePhysicalSpecs(columns, rows, currentWidthMm, currentHeightMm);

  const handlePresetSelect = (presetId) => {
    if (presetId === 'custom') {
      setIsCustomBead(true);
    } else {
      setIsCustomBead(false);
      const found = BEAD_PRESETS.find((p) => p.id === presetId);
      if (found) {
        onSelectBeadPreset(found);
      }
    }
  };

  const handlePresetSize = (targetCols) => {
    onChangeColumns(targetCols);
  };

  const handleTargetWidthChange = (valInches) => {
    const num = parseFloat(valInches);
    if (!isNaN(num) && num > 0) {
      const widthMm = num * 25.4;
      const targetCols = Math.max(10, Math.min(150, Math.round(widthMm / currentWidthMm)));
      onChangeColumns(targetCols);
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">
          <Ruler size={18} />
          <span>Wall Sizing & Bead Specs</span>
        </h2>
      </div>

      {/* Bead Selection */}
      <div className="control-group">
        <label className="control-label">
          <span>Bead Specification:</span>
          {activeBeadPreset.id === 'pony-6x9' && !isCustomBead && (
            <span className="badge-default">Default Amazon Size</span>
          )}
        </label>
        <select
          value={isCustomBead ? 'custom' : activeBeadPreset.id}
          onChange={(e) => handlePresetSelect(e.target.value)}
        >
          {BEAD_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name} ({preset.widthMm}×{preset.heightMm}mm)
            </option>
          ))}
          <option value="custom">Custom Dimensions (mm)...</option>
        </select>
      </div>

      {/* Custom Bead Dimensions if active */}
      {isCustomBead && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <div className="control-group">
            <span className="control-label">Width (mm):</span>
            <input
              type="number"
              step="0.1"
              min="1"
              max="25"
              value={customBeadSpecs.widthMm}
              onChange={(e) =>
                onUpdateCustomBeadSpecs({
                  ...customBeadSpecs,
                  widthMm: parseFloat(e.target.value) || 9.0
                })
              }
            />
          </div>
          <div className="control-group">
            <span className="control-label">Height (mm):</span>
            <input
              type="number"
              step="0.1"
              min="1"
              max="25"
              value={customBeadSpecs.heightMm}
              onChange={(e) =>
                onUpdateCustomBeadSpecs({
                  ...customBeadSpecs,
                  heightMm: parseFloat(e.target.value) || 6.0
                })
              }
            />
          </div>
        </div>
      )}

      {/* Sizing Controls or Exact Matrix Indicator */}
      {isExactMatrixMode ? (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#A7F3D0' }}>
              🎯 Exact Image Matrix Dimensions
            </span>
            <span className="control-val">{columns} × {rows}</span>
          </div>
          <p style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
            Size is permanently locked 1:1 to your source image pixels ({columns} warp threads × {rows} bead rows). Wall dimensions below are calculated from this exact count.
          </p>
        </div>
      ) : (
        <>
          {/* Sizing Tiers / Quick Presets */}
          <div>
            <div className="control-label" style={{ marginBottom: '0.35rem' }}>
              <span>Wall Project Size:</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
              <button
                type="button"
                className={`btn btn-sm ${columns === 30 ? 'btn-primary' : ''}`}
                onClick={() => handlePresetSize(30)}
              >
                Compact (30)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${columns === 45 ? 'btn-primary' : ''}`}
                onClick={() => handlePresetSize(45)}
              >
                Standard (45)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${columns === 65 ? 'btn-primary' : ''}`}
                onClick={() => handlePresetSize(65)}
              >
                Detailed (65)
              </button>
            </div>
          </div>

          {/* Direct Thread & Row Controls */}
          <div className="control-group">
            <div className="control-label">
              <span>Columns (Vertical Threads):</span>
              <span className="control-val">{columns} threads</span>
            </div>
            <input
              type="range"
              min="15"
              max="120"
              value={columns}
              onChange={(e) => onChangeColumns(parseInt(e.target.value, 10))}
            />
          </div>

          <div className="control-group">
            <div className="control-label">
              <span>Rows (Beads per Thread):</span>
              <span className="control-val">{rows} beads</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="range"
                min="15"
                max="140"
                value={rows}
                disabled={lockAspectRatio}
                onChange={(e) => onChangeRows(parseInt(e.target.value, 10))}
                style={{ flex: 1, opacity: lockAspectRatio ? 0.6 : 1 }}
              />
              <button
                type="button"
                className="btn btn-sm"
                onClick={onToggleLockAspectRatio}
                title={lockAspectRatio ? 'Aspect ratio locked' : 'Aspect ratio free'}
                style={{ padding: '0.35rem' }}
              >
                {lockAspectRatio ? <Lock size={14} color="#6366F1" /> : <Unlock size={14} />}
              </button>
            </div>
          </div>

          {/* Target Width Input (Inches) */}
          <div className="control-group">
            <label className="control-label">
              <span>Target Hanging Width (Inches):</span>
              <span className="control-val">{specs.widthInches}″</span>
            </label>
            <input
              type="number"
              step="0.5"
              min="4"
              max="60"
              value={specs.widthInches}
              onChange={(e) => handleTargetWidthChange(e.target.value)}
            />
          </div>
        </>
      )}

      {/* AI Detail Recommendation Note */}
      {recommendation && (
        <div
          style={{
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.6rem 0.8rem',
            fontSize: '0.75rem',
            color: '#CBD5E1',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Sparkles size={16} color="#818CF8" style={{ flexShrink: 0 }} />
          <span>
            <strong>AI Sizing Suggestion:</strong> {recommendation.recommendationNote}
          </span>
        </div>
      )}

      {/* Physical Finished Dimensions Grid */}
      <div className="stats-grid">
        <div className="stat-box">
          <span className="stat-label">Physical Dimensions</span>
          <span className="stat-value">{specs.widthInches}″ × {specs.heightInches}″</span>
          <span className="stat-sub">{specs.widthCm} × {specs.heightCm} cm</span>
        </div>

        <div className="stat-box">
          <span className="stat-label">Total Beads</span>
          <span className="stat-value">{specs.totalBeads.toLocaleString()}</span>
          <span className="stat-sub">{columns} threads × {rows} rows</span>
        </div>

        <div className="stat-box">
          <span className="stat-label">Warp Threads</span>
          <span className="stat-value">{columns}</span>
          <span className="stat-sub">Spaced {currentWidthMm}mm apart</span>
        </div>

        <div className="stat-box">
          <span className="stat-label">Thread Yardage</span>
          <span className="stat-value">{specs.totalThreadYards} yds</span>
          <span className="stat-sub">~{specs.totalThreadMeters}m (w/ loops)</span>
        </div>
      </div>
    </div>
  );
}
