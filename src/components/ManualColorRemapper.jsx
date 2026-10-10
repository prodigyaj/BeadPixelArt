import React, { useState } from 'react';
import { ArrowRight, Check, X, RefreshCw, Eye } from 'lucide-react';

export function ManualColorRemapper({
  isOpen,
  onClose,
  activeColors, // list of colors currently in the matrix { id, name, hex, count }
  allPalette, // full bead catalog
  activeOverrides, // current confirmed overrides { fromId: toColorObj }
  onApplyOverrides,
  onPreviewOverrides // callback to temporarily preview changes on the canvas
}) {
  // Working draft of overrides during this editing session
  const [draftOverrides, setDraftOverrides] = useState({ ...activeOverrides });
  const [isPreviewing, setIsPreviewing] = useState(true);

  if (!isOpen) return null;

  const handleSelectReplacement = (fromColorId, toColorId) => {
    const updated = { ...draftOverrides };
    if (!toColorId || toColorId === fromColorId) {
      delete updated[fromColorId];
    } else {
      const targetColor = allPalette.find((c) => c.id === toColorId);
      if (targetColor) {
        updated[fromColorId] = targetColor;
      }
    }
    setDraftOverrides(updated);
    if (isPreviewing) {
      onPreviewOverrides(updated);
    }
  };

  const handleTogglePreview = () => {
    const next = !isPreviewing;
    setIsPreviewing(next);
    onPreviewOverrides(next ? draftOverrides : activeOverrides);
  };

  const handleConfirm = () => {
    onApplyOverrides(draftOverrides);
    onClose();
  };

  const handleDiscard = () => {
    onPreviewOverrides(activeOverrides); // revert canvas preview
    onClose();
  };

  const handleResetAll = () => {
    setDraftOverrides({});
    if (isPreviewing) {
      onPreviewOverrides({});
    }
  };

  const overrideCount = Object.keys(draftOverrides).length;

  return (
    <div className="modal-overlay" onClick={handleDiscard}>
      <div
        className="modal-content"
        style={{ maxWidth: '750px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <RefreshCw size={20} color="#6366F1" />
            <div>
              <h2 className="panel-title" style={{ fontSize: '1.15rem' }}>
                Manual Color Regrouping & Substitution
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                Regroup bead colors based on what you already own or plan to buy. Preview live before confirming.
              </p>
            </div>
          </div>
          <button className="btn btn-sm" onClick={handleDiscard}>
            <X size={16} />
          </button>
        </div>

        {/* Live Preview Bar & Status */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Eye size={18} color="#818CF8" />
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#F8FAFC' }}>
                Live Canvas Preview: {isPreviewing ? 'ACTIVE' : 'PAUSED'}
              </span>
              <p style={{ fontSize: '0.72rem', color: '#CBD5E1' }}>
                Changes are simulated on the background canvas in real-time. Nothing is committed until you confirm below.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className={`btn btn-sm ${isPreviewing ? 'btn-primary' : ''}`}
              onClick={handleTogglePreview}
            >
              <Eye size={13} />
              <span>{isPreviewing ? 'Previewing On' : 'Turn Preview On'}</span>
            </button>

            {overrideCount > 0 && (
              <button
                type="button"
                className="btn btn-sm"
                onClick={handleResetAll}
                title="Clear all manual replacements"
              >
                Reset All
              </button>
            )}
          </div>
        </div>

        {/* Color Mapping Table */}
        <div style={{ maxHeight: '360px', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
          <table className="color-table">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Current Recommended Color</th>
                <th style={{ width: '10%', textAlign: 'center' }}></th>
                <th style={{ width: '50%' }}>Replace With (Your Choice)</th>
              </tr>
            </thead>
            <tbody>
              {activeColors.map((color) => {
                const currentReplacement = draftOverrides[color.id];
                const isOverridden = !!currentReplacement;

                return (
                  <tr
                    key={color.id}
                    style={{
                      background: isOverridden ? 'rgba(99, 102, 241, 0.14)' : 'transparent',
                      transition: 'background 0.15s'
                    }}
                  >
                    {/* Source Color */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '3px',
                            backgroundColor: color.hex,
                            border: '1px solid rgba(255,255,255,0.3)',
                            flexShrink: 0
                          }}
                        />
                        <div>
                          <strong style={{ color: '#F8FAFC', fontSize: '0.82rem' }}>{color.name}</strong>
                          <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                            {color.id} • {color.count.toLocaleString()} beads
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Arrow */}
                    <td style={{ textAlign: 'center' }}>
                      <ArrowRight size={14} color={isOverridden ? '#818CF8' : '#64748B'} />
                    </td>

                    {/* Target Replacement Selector */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {isOverridden && (
                          <span
                            style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '3px',
                              backgroundColor: currentReplacement.hex,
                              border: '1px solid rgba(255,255,255,0.3)',
                              flexShrink: 0
                            }}
                          />
                        )}
                        <select
                          value={currentReplacement ? currentReplacement.id : color.id}
                          onChange={(e) => handleSelectReplacement(color.id, e.target.value)}
                          style={{
                            flex: 1,
                            borderColor: isOverridden ? 'var(--accent-primary)' : 'var(--border-subtle)',
                            color: isOverridden ? '#A5B4FC' : '#F8FAFC'
                          }}
                        >
                          <option value={color.id}>Keep Original ({color.name})</option>
                          <optgroup label="-- Colors Already In Your Artwork --">
                            {activeColors
                              .filter((c) => c.id !== color.id)
                              .map((c) => (
                                <option key={`active-${c.id}`} value={c.id}>
                                  Use Existing: {c.name} ({c.id})
                                </option>
                              ))}
                          </optgroup>
                          <optgroup label="-- Full Bead Catalog --">
                            {allPalette
                              .filter((c) => c.id !== color.id && !activeColors.some((ac) => ac.id === c.id))
                              .map((c) => (
                                <option key={`all-${c.id}`} value={c.id}>
                                  {c.name} ({c.id})
                                </option>
                              ))}
                          </optgroup>
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Actions: Cancel vs Confirm */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
            {overrideCount === 0 ? (
              <span>No custom substitutions selected.</span>
            ) : (
              <span style={{ color: '#F8FAFC' }}>
                <strong style={{ color: '#818CF8' }}>{overrideCount}</strong> color{overrideCount === 1 ? '' : 's'} staged to be replaced.
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn" onClick={handleDiscard}>
              <X size={15} />
              <span>Discard Changes</span>
            </button>

            <button className="btn btn-primary" onClick={handleConfirm}>
              <Check size={15} />
              <span>Confirm & Apply Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
