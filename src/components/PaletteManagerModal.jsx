import React, { useState } from 'react';
import { Palette, Check, X, CheckSquare, Square, Sparkles, Filter, RefreshCw, Layers } from 'lucide-react';

export function PaletteManagerModal({
  isOpen,
  onClose,
  allColors, // all catalog colors in current bead brand (e.g. 36 pony beads)
  enabledColorIds, // Set or Array of active color IDs
  onUpdateEnabledColorIds,
  currentArtColorIds // IDs of colors currently appearing in the artwork
}) {
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');

  if (!isOpen) return null;

  const enabledSet = new Set(enabledColorIds);

  // Group colors by family
  const groups = ['All', ...new Set(allColors.map((c) => c.group || 'Other'))];

  const filteredColors = allColors.filter((c) => {
    const matchesGroup = selectedGroup === 'All' || c.group === selectedGroup;
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  const handleToggleColor = (id) => {
    const next = new Set(enabledSet);
    if (next.has(id)) {
      if (next.size > 2) { // ensure at least 2 colors remain
        next.delete(id);
      }
    } else {
      next.add(id);
    }
    onUpdateEnabledColorIds(Array.from(next));
  };

  const handleSelectAll = () => {
    onUpdateEnabledColorIds(allColors.map((c) => c.id));
  };

  const handleSelectStarterPack = () => {
    // 10 versatile basic colors (Neutrals + Primary + Green)
    const starterIds = ['PB-01', 'PB-02', 'PB-03', 'PB-06', 'PB-10', 'PB-16', 'PB-19', 'PB-23', 'PB-30'];
    onUpdateEnabledColorIds(starterIds.filter(id => allColors.some(c => c.id === id)));
  };

  const handleSelectOnlyArtColors = () => {
    if (currentArtColorIds && currentArtColorIds.length >= 2) {
      onUpdateEnabledColorIds(currentArtColorIds);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '820px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Palette size={20} color="#6366F1" />
            <div>
              <h2 className="panel-title" style={{ fontSize: '1.15rem' }}>
                My Bead Inventory & Allowed Colors
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                Restrict the artwork strictly to colors you own or want to buy. The app will optimally dither and quantize using only these shades.
              </p>
            </div>
          </div>
          <button className="btn btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Quick Presets & Status Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            flexWrap: 'wrap',
            gap: '0.6rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} color="#818CF8" />
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#F8FAFC' }}>
                Active Inventory: {enabledSet.size} of {allColors.length} Colors Allowed
              </span>
              <p style={{ fontSize: '0.72rem', color: '#CBD5E1' }}>
                {enabledSet.size < allColors.length
                  ? 'Custom restricted palette active. Unchecked colors will never be used.'
                  : 'Full catalog active. All shades available for optimal depiction.'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-sm"
              onClick={handleSelectAll}
              title="Enable all catalog shades"
            >
              Select All ({allColors.length})
            </button>
            <button
              type="button"
              className="btn btn-sm"
              onClick={handleSelectStarterPack}
              title="Use 9 standard starter craft shades"
            >
              Starter Pack (9)
            </button>
            {currentArtColorIds && currentArtColorIds.length > 0 && (
              <button
                type="button"
                className="btn btn-sm"
                onClick={handleSelectOnlyArtColors}
                title="Lock to only colors currently in the recommended piece"
              >
                Keep Current ({currentArtColorIds.length})
              </button>
            )}
          </div>
        </div>

        {/* Filters: Group Tabs + Search */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '2px' }}>
            {groups.map((grp) => (
              <button
                key={grp}
                type="button"
                className={`btn btn-sm ${selectedGroup === grp ? 'btn-primary' : ''}`}
                style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}
                onClick={() => setSelectedGroup(grp)}
              >
                {grp}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Search color name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '220px', padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
          />
        </div>

        {/* Color Checkbox Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '0.5rem',
            maxHeight: '380px',
            overflowY: 'auto',
            paddingRight: '0.3rem'
          }}
        >
          {filteredColors.map((color) => {
            const isChecked = enabledSet.has(color.id);

            return (
              <div
                key={color.id}
                onClick={() => handleToggleColor(color.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: isChecked
                    ? '1px solid rgba(99, 102, 241, 0.45)'
                    : '1px solid var(--border-subtle)',
                  background: isChecked ? 'rgba(30, 41, 59, 0.7)' : 'rgba(15, 23, 42, 0.4)',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'all 0.15s'
                }}
              >
                {/* Checkbox Icon */}
                <div style={{ color: isChecked ? '#818CF8' : '#64748B', display: 'flex' }}>
                  {isChecked ? <CheckSquare size={16} /> : <Square size={16} />}
                </div>

                {/* Color Swatch */}
                <span
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '4px',
                    backgroundColor: color.hex,
                    border: '1px solid rgba(255,255,255,0.25)',
                    flexShrink: 0
                  }}
                />

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      color: isChecked ? '#F8FAFC' : '#94A3B8',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {color.name}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                    {color.id}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
            Tip: Unchecking colors forces the generator to dither and blend intermediate tones using only your owned beads!
          </span>
          <button className="btn btn-primary" onClick={onClose}>
            Apply & View Artwork
          </button>
        </div>
      </div>
    </div>
  );
}
