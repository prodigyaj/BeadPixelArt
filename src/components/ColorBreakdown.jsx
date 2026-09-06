import React, { useState } from 'react';
import { Palette, Sparkles, Filter, Check, ArrowRight, ShieldCheck, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { calculateColorStats } from '../core/threading.js';

export function ColorBreakdown({
  matrix,
  isolatedColorId,
  onToggleIsolateColor,
  activePaletteLimit,
  onSetPaletteLimit,
  consolidationConfig,
  onChangeConsolidationConfig,
  consolidationResult,
  onOpenRemapper,
  activeOverridesCount = 0,
  onResetManualOverrides,
  onOpenPaletteManager,
  allowedColorsCount,
  totalColorsCount
}) {
  const [showSubstitutions, setShowSubstitutions] = useState(false);

  const colorStats = matrix ? calculateColorStats(matrix, 1000) : [];
  const totalBags = colorStats.reduce((acc, c) => acc + c.bagsNeeded, 0);

  const { enabled, mode, threshold } = consolidationConfig;
  const substitutions = consolidationResult?.substitutions || [];
  const savedBags = consolidationResult?.savedBags || 0;

  const handleToggleEnabled = () => {
    onChangeConsolidationConfig({
      ...consolidationConfig,
      enabled: !enabled
    });
  };

  const handleModeChange = (newMode) => {
    onChangeConsolidationConfig({
      ...consolidationConfig,
      mode: newMode,
      threshold: newMode === 'percent' ? 1.5 : 25
    });
  };

  const handleThresholdChange = (val) => {
    onChangeConsolidationConfig({
      ...consolidationConfig,
      threshold: val
    });
  };

  return (
    <div className="panel right-sidebar">
      <div className="panel-header">
        <h2 className="panel-title">
          <Palette size={18} />
          <span>Recommended Colors & Shopping</span>
        </h2>
      </div>

      {/* Allowed Palette / Owned Inventory Selector */}
      <button
        type="button"
        className={`btn btn-sm ${allowedColorsCount < totalColorsCount ? 'btn-primary' : ''}`}
        style={{ width: '100%', justifyContent: 'center' }}
        onClick={onOpenPaletteManager}
        title="Restrict to colors you already own or want to use"
      >
        <Palette size={14} />
        <span>
          {allowedColorsCount < totalColorsCount
            ? `Active Inventory: ${allowedColorsCount}/${totalColorsCount} Allowed`
            : `Set Owned Beads / Allowed Inventory (${totalColorsCount})`}
        </span>
      </button>

      {/* Manual Color Regrouping Launcher */}
      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
        <button
          type="button"
          className="btn btn-sm btn-primary"
          style={{ flex: 1, justifyContent: 'center' }}
          onClick={onOpenRemapper}
          title="Manually swap or regroup colors based on your inventory"
        >
          <RefreshCw size={14} />
          <span>Manually Regroup / Swap Colors</span>
        </button>

        {activeOverridesCount > 0 && (
          <button
            type="button"
            className="btn btn-sm"
            style={{ borderColor: 'rgba(245, 158, 11, 0.4)', color: '#FCD34D' }}
            onClick={onResetManualOverrides}
            title="Reset manual color swaps back to AI recommendation"
          >
            Reset ({activeOverridesCount})
          </button>
        )}
      </div>

      {/* Minority -> Majority Consolidation Optimizer */}
      <div
        style={{
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={15} color="#818CF8" />
            <strong style={{ fontSize: '0.85rem', color: '#F8FAFC' }}>
              Minority → Majority Optimizer
            </strong>
          </div>
          <button
            type="button"
            className={`btn btn-sm ${enabled ? 'btn-success' : ''}`}
            style={{ padding: '0.2rem 0.55rem', fontSize: '0.72rem' }}
            onClick={handleToggleEnabled}
          >
            {enabled ? 'Active' : 'Disabled'}
          </button>
        </div>

        <p style={{ fontSize: '0.72rem', color: '#94A3B8', lineHeight: '1.4' }}>
          Merges low-count colors below your threshold into the closest <strong>existing majority color</strong> you are already buying, eliminating wasted 1,000-bead bags!
        </p>

        {enabled && (
          <>
            {/* Mode & Threshold Controls */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
              <button
                type="button"
                className={`btn btn-sm ${mode === 'percent' ? 'btn-primary' : ''}`}
                style={{ fontSize: '0.72rem', padding: '0.3rem' }}
                onClick={() => handleModeChange('percent')}
              >
                Min % Threshold
              </button>
              <button
                type="button"
                className={`btn btn-sm ${mode === 'count' ? 'btn-primary' : ''}`}
                style={{ fontSize: '0.72rem', padding: '0.3rem' }}
                onClick={() => handleModeChange('count')}
              >
                Min Bead Count
              </button>
            </div>

            {/* Slider */}
            <div className="control-group">
              <div className="control-label" style={{ fontSize: '0.75rem' }}>
                <span>
                  {mode === 'percent' ? 'Minimum Project Share:' : 'Minimum Bead Count:'}
                </span>
                <span className="control-val">
                  {mode === 'percent' ? `${threshold}%` : `${threshold} beads`}
                </span>
              </div>
              <input
                type="range"
                min={mode === 'percent' ? '0.2' : '5'}
                max={mode === 'percent' ? '4.0' : '80'}
                step={mode === 'percent' ? '0.1' : '1'}
                value={threshold}
                onChange={(e) => handleThresholdChange(parseFloat(e.target.value))}
              />
            </div>

            {/* Quick Presets */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.3rem' }}>
              <button
                type="button"
                className={`btn btn-sm ${mode === 'percent' && threshold === 0.8 ? 'btn-primary' : ''}`}
                style={{ fontSize: '0.68rem', padding: '0.25rem' }}
                onClick={() => {
                  onChangeConsolidationConfig({ ...consolidationConfig, mode: 'percent', threshold: 0.8 });
                }}
              >
                Light (0.8%)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${mode === 'percent' && threshold === 1.5 ? 'btn-primary' : ''}`}
                style={{ fontSize: '0.68rem', padding: '0.25rem' }}
                onClick={() => {
                  onChangeConsolidationConfig({ ...consolidationConfig, mode: 'percent', threshold: 1.5 });
                }}
              >
                Balanced (1.5%)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${mode === 'percent' && threshold === 2.5 ? 'btn-primary' : ''}`}
                style={{ fontSize: '0.68rem', padding: '0.25rem' }}
                onClick={() => {
                  onChangeConsolidationConfig({ ...consolidationConfig, mode: 'percent', threshold: 2.5 });
                }}
              >
                Strict (2.5%)
              </button>
            </div>

            {/* Savings & Replacements Summary */}
            {substitutions.length > 0 ? (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.5rem 0.65rem',
                  fontSize: '0.74rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6EE7B7', fontWeight: 600 }}>
                    ✓ Saved {savedBags} whole bags ({substitutions.length} minority colors merged)
                  </span>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: '#A7F3D0', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    onClick={() => setShowSubstitutions(!showSubstitutions)}
                  >
                    {showSubstitutions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                {/* Audit List of Replacements */}
                {showSubstitutions && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '140px', overflowY: 'auto' }}>
                    {substitutions.map((sub, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'rgba(0, 0, 0, 0.25)',
                          padding: '0.3rem 0.45rem',
                          borderRadius: '4px',
                          fontSize: '0.7rem'
                        }}
                      >
                        {/* Minority Color */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: sub.fromColor.hex }} />
                          <span style={{ color: '#CBD5E1' }}>{sub.fromColor.name} ({sub.count} beads)</span>
                        </div>

                        <ArrowRight size={12} color="#94A3B8" />

                        {/* Majority Color */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: sub.toColor.hex }} />
                          <strong style={{ color: '#6EE7B7' }}>{sub.toColor.name}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                All current colors meet the threshold ({threshold}{mode === 'percent' ? '%' : ' beads'}).
              </div>
            )}
          </>
        )}
      </div>

      {/* Shopping List Summary */}
      <div className="stats-grid">
        <div className="stat-box">
          <span className="stat-label">Active Colors</span>
          <span className="stat-value">{colorStats.length}</span>
          <span className="stat-sub">Shades to purchase</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">1,000-Pc Bags</span>
          <span className="stat-value">{totalBags}</span>
          <span className="stat-sub">
            {enabled && savedBags > 0 ? `(Saved ${savedBags} bags!)` : 'Total packs to buy'}
          </span>
        </div>
      </div>

      {/* Interactive Color Inventory Table */}
      <div className="control-label">
        <span>Final Shopping List (Click to Isolate):</span>
        {isolatedColorId && (
          <span
            style={{ color: '#F43F5E', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => onToggleIsolateColor(null)}
          >
            Clear Filter
          </span>
        )}
      </div>

      <div className="color-table-wrap">
        <table className="color-table">
          <thead>
            <tr>
              <th>Color</th>
              <th>Count</th>
              <th>%</th>
              <th>Bags</th>
            </tr>
          </thead>
          <tbody>
            {colorStats.map((item) => {
              const isIsolated = isolatedColorId === item.id;
              return (
                <tr
                  key={item.id}
                  className={`color-row ${isIsolated ? 'isolated' : ''}`}
                  onClick={() => onToggleIsolateColor(item.id)}
                  title={`Click to isolate ${item.name} on the pattern`}
                >
                  <td style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: '14px',
                        height: '14px',
                        borderRadius: '3px',
                        backgroundColor: item.hex,
                        border: '1px solid rgba(255,255,255,0.25)',
                        flexShrink: 0
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 500, color: '#F8FAFC' }}>{item.name}</div>
                      <div style={{ fontSize: '0.68rem', color: '#64748B' }}>{item.id}</div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {item.count.toLocaleString()}
                  </td>
                  <td style={{ color: '#94A3B8' }}>{item.percentage}%</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: '#A5B4FC' }}>
                    {item.bagsNeeded}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
