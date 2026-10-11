import React, { useState } from 'react';
import { Palette, X, CheckSquare, Square, Sparkles, ShieldCheck, ExternalLink, Bookmark } from 'lucide-react';
import { REAL_COLLECTIONS } from '../palettes/ponyBeads.js';
import { matchesColorSearch } from '../core/colorSearch.js';

export function PaletteManagerModal({
  isOpen,
  onClose,
  allColors, // all catalog colors in current bead brand (e.g. 42 pony beads)
  enabledColorIds, // Set or Array of active color IDs
  onUpdateEnabledColorIds,
  currentArtColorIds // IDs of colors currently appearing in the artwork
}) {
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [selectedFinish, setSelectedFinish] = useState('All');

  if (!isOpen) return null;

  const enabledSet = new Set(enabledColorIds);

  // Group colors by family & finish
  const groups = ['All', ...new Set(allColors.map((c) => c.group || 'Other'))];
  const finishes = ['All', ...new Set(allColors.map((c) => c.finish || 'Opaque'))];

  const filteredColors = allColors.filter((c) => {
    const matchesGroup = selectedGroup === 'All' || c.group === selectedGroup;
    const matchesFinish = selectedFinish === 'All' || (c.finish || 'Opaque') === selectedFinish;
    const matchesSearch = matchesColorSearch(c, search);
    return matchesGroup && matchesFinish && matchesSearch;
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

  const handleApplyCollection = (collectionKey) => {
    const col = REAL_COLLECTIONS[collectionKey];
    if (col && col.colorIds) {
      onUpdateEnabledColorIds(col.colorIds.filter((id) => allColors.some((c) => c.id === id)));
    }
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
        style={{ maxWidth: '860px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="panel-header" style={{ marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Palette size={18} color="#818CF8" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 className="panel-title" style={{ fontSize: '1.1rem', margin: 0 }}>
                  Real-World Bead Collections &amp; Inventory
                </h2>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.66rem',
                  fontWeight: 600,
                  color: '#10B981',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '9999px'
                }}>
                  <ShieldCheck size={11} />
                  100% Commercial Stock
                </span>
              </div>
              <p style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '0.15rem' }}>
                Every shade corresponds to physically available 6×9mm craft packs. Pick a pre-curated collection or check what you own.
              </p>
            </div>
          </div>
          <button className="btn btn-sm" onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        {/* Real-World Collection Presets */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '0.65rem 0.85rem',
          marginBottom: '0.65rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.3rem' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Bookmark size={13} color="#818CF8" />
              Verified Commercial Collections:
            </span>
            {currentArtColorIds && currentArtColorIds.length > 0 && (
              <button
                type="button"
                className="btn btn-sm"
                onClick={handleSelectOnlyArtColors}
                style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                title="Lock only to colors currently in this piece"
              >
                Keep Current Artwork Colors ({currentArtColorIds.length})
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.4rem' }}>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => handleApplyCollection('ALL_VERIFIED')}
              style={{ justifyContent: 'space-between', fontSize: '0.74rem' }}
            >
              <span>Full Catalog</span>
              <span className="footer-code" style={{ fontSize: '0.68rem' }}>42 Shades</span>
            </button>

            <button
              type="button"
              className="btn btn-sm"
              onClick={() => handleApplyCollection('CLASSIC_OPAQUE')}
              style={{ justifyContent: 'space-between', fontSize: '0.74rem' }}
            >
              <span>Classic Opaque Basics</span>
              <span className="footer-code" style={{ fontSize: '0.68rem' }}>28 Shades</span>
            </button>

            <button
              type="button"
              className="btn btn-sm"
              onClick={() => handleApplyCollection('EARTH_TAPESTRY')}
              style={{ justifyContent: 'space-between', fontSize: '0.74rem' }}
            >
              <span>Earth &amp; Tapestry (Matte)</span>
              <span className="footer-code" style={{ fontSize: '0.68rem' }}>20 Shades</span>
            </button>

            <button
              type="button"
              className="btn btn-sm"
              onClick={() => handleApplyCollection('AUVOAU_AMAZON')}
              style={{ justifyContent: 'space-between', fontSize: '0.74rem' }}
            >
              <span>Auvoau 36-Box (Amazon)</span>
              <span className="footer-code" style={{ fontSize: '0.68rem' }}>36 Shades</span>
            </button>
          </div>
        </div>

        {/* Active Selection Summary */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '0.5rem 0.85rem',
            marginBottom: '0.65rem',
            fontSize: '0.78rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Sparkles size={15} color="#818CF8" />
            <span>
              <strong>Active Palette:</strong> {enabledSet.size} of {allColors.length} colors allowed
            </span>
          </div>
          <span style={{ color: '#94A3B8', fontSize: '0.72rem' }}>
            {enabledSet.size < allColors.length
              ? 'Artwork will dither strictly using your allowed selection.'
              : 'All 42 verified colors active.'}
          </span>
        </div>

        {/* Filters: Group Tabs, Finish Tabs & Search */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '0.65rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* Family Groups */}
            <div style={{ display: 'flex', gap: '0.25rem', overflowX: 'auto', paddingBottom: '2px' }}>
              {groups.map((grp) => (
                <button
                  key={grp}
                  type="button"
                  className={`btn btn-sm ${selectedGroup === grp ? 'btn-primary' : ''}`}
                  style={{ fontSize: '0.7rem', padding: '0.25rem 0.55rem' }}
                  onClick={() => setSelectedGroup(grp)}
                >
                  {grp}
                </button>
              ))}
            </div>

            {/* Search */}
            <input
              type="text"
              placeholder="Search by name, SKU (e.g. TB-008)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '220px', padding: '0.3rem 0.6rem', fontSize: '0.76rem' }}
            />
          </div>

          {/* Finish Filter Pills */}
          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', fontSize: '0.72rem' }}>
            <span style={{ color: '#94A3B8', marginRight: '0.2rem' }}>Finish:</span>
            {finishes.map((f) => (
              <button
                key={f}
                type="button"
                className={`btn btn-sm ${selectedFinish === f ? 'btn-primary' : ''}`}
                style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', borderRadius: '4px' }}
                onClick={() => setSelectedFinish(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Color Checkbox Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '0.45rem',
            overflowY: 'auto',
            paddingRight: '0.3rem',
            flex: 1,
            minHeight: '220px'
          }}
        >
          {filteredColors.map((color) => {
            const isChecked = enabledSet.has(color.id);
            const searchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(
              color.buyQuery || `pony beads 6x9mm ${color.name} 1000`
            )}`;

            return (
              <div
                key={color.id}
                onClick={() => handleToggleColor(color.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.5rem 0.7rem',
                  borderRadius: 'var(--radius-sm)',
                  border: isChecked
                    ? '1px solid rgba(99, 102, 241, 0.5)'
                    : '1px solid var(--border-subtle)',
                  background: isChecked ? 'rgba(30, 41, 59, 0.7)' : 'rgba(15, 23, 42, 0.4)',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'all 0.15s'
                }}
              >
                {/* Checkbox Icon */}
                <div style={{ color: isChecked ? '#818CF8' : '#64748B', display: 'flex', flexShrink: 0 }}>
                  {isChecked ? <CheckSquare size={16} /> : <Square size={16} />}
                </div>

                {/* Color Swatch */}
                <span
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '4px',
                    backgroundColor: color.hex,
                    border: '1px solid rgba(255,255,255,0.25)',
                    boxShadow: color.finish === 'Matte' ? 'none' : 'inset 1px 1px 3px rgba(255,255,255,0.5)',
                    flexShrink: 0
                  }}
                />

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 500,
                      color: isChecked ? '#F8FAFC' : '#94A3B8',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {color.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.66rem', color: '#64748B' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#94A3B8' }}>{color.code || color.id}</span>
                    <span>&bull;</span>
                    <span style={{
                      color: color.finish === 'Matte' ? '#FCD34D' : '#93C5FD'
                    }}>
                      {color.finish || 'Opaque'}
                    </span>
                  </div>
                </div>

                {/* Buy Link */}
                <a
                  href={searchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm"
                  onClick={(e) => e.stopPropagation()}
                  title={`Check price & in-stock on Amazon for ${color.name}`}
                  style={{
                    padding: '0.2rem 0.35rem',
                    fontSize: '0.65rem',
                    color: '#38BDF8',
                    borderColor: 'rgba(56, 189, 248, 0.3)',
                    background: 'rgba(56, 189, 248, 0.08)'
                  }}
                >
                  <ExternalLink size={10} />
                </a>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '0.65rem',
          marginTop: '0.5rem',
          borderTop: '1px solid var(--border-subtle)',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>
            💡 Tip: Select <strong>"Earth &amp; Tapestry"</strong> for cozy wall hangings, or <strong>"Classic Opaque"</strong> for standard craft store beads.
          </span>
          <button className="btn btn-primary" onClick={onClose} style={{ minWidth: '160px', justifyContent: 'center' }}>
            Apply &amp; View Artwork
          </button>
        </div>
      </div>
    </div>
  );
}
