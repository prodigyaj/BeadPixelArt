import React, { useMemo } from 'react';
import { X, Sparkles, Check } from 'lucide-react';
import { suggestDesigns } from '../core/suggestions.js';

const STATUS_BADGES = {
  ready: { label: 'Ready to make', color: '#10B981', background: 'rgba(16, 185, 129, 0.15)' },
  close: { label: 'Close match', color: '#60A5FA', background: 'rgba(59, 130, 246, 0.15)' },
  swaps: { label: 'Needs swaps', color: '#FBBF24', background: 'rgba(217, 119, 6, 0.15)' }
};

// "What can I make with my beads?" — pick owned colors, get designs ranked by how well they fit
export function MyBeadsModal({ onClose, catalog, ownedIds, onChangeOwnedIds, samples, activeSampleId, onPickDesign }) {
  const ownedSet = useMemo(() => new Set(ownedIds), [ownedIds]);
  const ownedColors = useMemo(() => catalog.filter((c) => ownedSet.has(c.id)), [catalog, ownedSet]);
  const isEverything = ownedColors.length === catalog.length;

  const suggestions = useMemo(
    () => (ownedColors.length >= 2 ? suggestDesigns(samples, catalog, ownedColors) : []),
    [samples, catalog, ownedColors]
  );

  const toggleColor = (id) => {
    onChangeOwnedIds(ownedSet.has(id) ? ownedIds.filter((x) => x !== id) : [...ownedIds, id]);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '760px' }} onClick={(e) => e.stopPropagation()}>
        <div className="panel-header" style={{ justifyContent: 'space-between' }}>
          <h2 className="panel-title" style={{ fontSize: '1.05rem', margin: 0 }}>
            <Sparkles size={18} />
            <span>What Can I Make With My Beads?</span>
          </h2>
          <button className="btn btn-sm" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Step 1: owned colors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="control-label" style={{ margin: 0 }}>
              1. Tap the colors you have ({ownedColors.length} selected)
            </span>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button className="btn btn-sm" onClick={() => onChangeOwnedIds(catalog.map((c) => c.id))}>
                All
              </button>
              <button className="btn btn-sm" onClick={() => onChangeOwnedIds([])}>
                None
              </button>
            </div>
          </div>
          {isEverything && (
            <span style={{ fontSize: '0.76rem', color: '#94A3B8' }}>
              Every color is selected. Tap <strong>None</strong>, then tap just the bead colors you own.
            </span>
          )}
          <div className="bead-color-picker">
            {catalog.map((color) => {
              const isOwned = ownedSet.has(color.id);
              return (
                <button
                  key={color.id}
                  type="button"
                  className={`bead-color-option ${isOwned ? 'owned' : ''}`}
                  onClick={() => toggleColor(color.id)}
                  title={color.name}
                  aria-pressed={isOwned}
                  aria-label={color.name}
                >
                  <span className="bead-color-dot" style={{ backgroundColor: color.hex }}>
                    {isOwned && <Check size={14} strokeWidth={3} />}
                  </span>
                  <span className="bead-color-name">{color.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: suggestions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span className="control-label" style={{ margin: 0 }}>2. Designs you can make</span>
          {ownedColors.length < 2 ? (
            <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Pick at least 2 colors to see suggestions.</span>
          ) : (
            suggestions.map(({ sample, status, swaps, previewSrc }) => {
              const badge = STATUS_BADGES[status];
              return (
                <div
                  key={sample.id}
                  className="suggestion-card"
                  style={{ borderColor: activeSampleId === sample.id ? 'var(--accent-primary)' : undefined }}
                >
                  <img src={previewSrc} alt={`${sample.name} in your colors`} className="pixel-thumb suggestion-thumb" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <strong style={{ color: '#F8FAFC' }}>{sample.name}</strong>
                      <span className="suggestion-badge" style={{ color: badge.color, background: badge.background }}>
                        {badge.label}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                      {swaps.length === 0
                        ? 'You have every color in this design.'
                        : swaps.map((s) => (
                            <div key={s.from.id}>
                              {s.from.name} → <span style={{ color: '#CBD5E1' }}>{s.to.name}</span>
                              {s.merges && <span style={{ color: '#FBBF24' }}> (blends with another color)</span>}
                            </div>
                          ))}
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => onPickDesign(sample)}>
                    Make This
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
