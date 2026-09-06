import React, { useRef, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { calculatePhysicalSpecs } from '../core/beadSpecs.js';

export function WallMockupModal({
  isOpen,
  onClose,
  matrix,
  beadPreset,
  columns,
  rows
}) {
  const canvasRef = useRef(null);

  const specs = calculatePhysicalSpecs(
    columns,
    rows,
    beadPreset?.widthMm || 9,
    beadPreset?.heightMm || 6
  );

  useEffect(() => {
    if (!isOpen || !matrix || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = 600;
    const height = 480;
    canvas.width = width;
    canvas.height = height;

    // Room wall background (Warm Nordic / Slate Minimalist)
    ctx.fillStyle = '#1A2130';
    ctx.fillRect(0, 0, width, height);

    // Subtle wall wainscoting / lighting gradient
    const wallGrad = ctx.createLinearGradient(0, 0, 0, height);
    wallGrad.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
    wallGrad.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, width, height);

    // Floor baseboard & floor
    ctx.fillStyle = '#0F131C';
    ctx.fillRect(0, height - 50, width, 50);
    ctx.fillStyle = '#2D3748';
    ctx.fillRect(0, height - 52, width, 2);

    // Calculate tapestry size on wall mockup (proportional to physical size)
    const baseScale = 2.4;
    const tapW = Math.min(260, specs.widthInches * baseScale * 4.5);
    const tapH = (tapW / (columns * (beadPreset?.widthMm || 9))) * (rows * (beadPreset?.heightMm || 6));

    const tapX = (width - tapW) / 2;
    const tapY = 120;

    // Wall Hanging Nail and Cord
    const nailX = width / 2;
    const nailY = 65;

    ctx.strokeStyle = '#D4AF37'; // Golden braided cord
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tapX - 10, tapY);
    ctx.lineTo(nailX, nailY);
    ctx.lineTo(tapX + tapW + 10, tapY);
    ctx.stroke();

    // Brass wall nail
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(nailX, nailY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Wooden Dowel Rod
    ctx.fillStyle = '#8D6E63'; // Natural wood
    ctx.beginPath();
    ctx.roundRect(tapX - 22, tapY - 7, tapW + 44, 14, 7);
    ctx.fill();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(tapX - 22, tapY + 2, tapW + 44, 5);

    // Tapestry Drop Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 12;

    // Render Tapestry Beads scaled
    const mHeight = matrix.length;
    const mWidth = matrix[0].length;
    const cellW = tapW / mWidth;
    const cellH = tapH / mHeight;

    for (let y = 0; y < mHeight; y++) {
      for (let x = 0; x < mWidth; x++) {
        const bead = matrix[y][x];
        ctx.fillStyle = bead.hex;
        ctx.fillRect(tapX + x * cellW, tapY + 7 + y * cellH, cellW + 0.3, cellH + 0.3);
      }
    }

    ctx.shadowColor = 'transparent';

    // Hanging Bottom Fringe Strings
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    for (let x = 0; x < mWidth; x += 2) {
      const fx = tapX + x * cellW + cellW / 2;
      const fy = tapY + 7 + tapH;
      const fringeLen = 16 + (Math.sin(x * 0.5) * 6);
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx, fy + fringeLen);
      ctx.stroke();
    }

    // Side plant or shelf decoration for home staging feel
    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.ellipse(65, height - 80, 25, 45, -0.2, 0, Math.PI * 2);
    ctx.ellipse(85, height - 90, 20, 50, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4B5563';
    ctx.fillRect(60, height - 70, 30, 20); // ceramic pot
  }, [isOpen, matrix, beadPreset, columns, rows, specs]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h2 className="panel-title">
            <span>In-Room Wall Hanging Scale Preview</span>
          </h2>
          <button className="btn btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', background: '#090D16', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
          <canvas ref={canvasRef} style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }} />
        </div>

        <div className="stats-grid">
          <div className="stat-box">
            <span className="stat-label">Hanging Size</span>
            <span className="stat-value">{specs.widthInches}″ W × {specs.heightInches}″ H</span>
            <span className="stat-sub">{specs.widthCm} × {specs.heightCm} cm</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Recommended Dowel</span>
            <span className="stat-value">{Math.ceil(specs.widthInches + 3)}″ Dowel Rod</span>
            <span className="stat-sub">Wood or bamboo craft rod</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
