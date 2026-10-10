import React, { useMemo } from 'react';
import { ShoppingCart } from 'lucide-react';
import { calculateColorStats } from '../core/threading.js';

// Beginner-friendly right column: which bead colors to buy and how many
export function ShoppingList({ matrix, isolatedColorId, onToggleIsolateColor }) {
  const colorStats = useMemo(() => (matrix ? calculateColorStats(matrix, 1000) : []), [matrix]);
  const totalBeads = colorStats.reduce((acc, c) => acc + c.count, 0);

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">
          <ShoppingCart size={18} />
          <span>3. Beads to Buy</span>
        </h2>
        <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
          {colorStats.length} colors • {totalBeads.toLocaleString()} beads
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {colorStats.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`step-card ${isolatedColorId === item.id ? 'active' : ''}`}
            onClick={() => onToggleIsolateColor(item.id)}
            title="Tap to highlight where this color goes"
            style={{ cursor: 'pointer', textAlign: 'left', color: 'inherit', width: '100%' }}
          >
            <span className="step-card-left">
              <span className="color-swatch-sm" style={{ backgroundColor: item.hex }} />
              <span>{item.name}</span>
            </span>
            <span className="step-count">{item.count}</span>
          </button>
        ))}
      </div>

      <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
        Tap a color to highlight where it goes on the pattern.
      </span>
    </div>
  );
}
