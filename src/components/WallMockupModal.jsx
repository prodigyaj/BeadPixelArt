import React, { useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { calculatePhysicalSpecs } from '../core/beadSpecs.js';

// Standard 3-seat sofa used as a size reference (inches)
const SOFA = { width: 84, height: 34, seatHeight: 18 };

export function WallMockupModal({
  isOpen,
  onClose,
  matrix,
  beadPreset,
  columns,
  rows
}) {
  const canvasRef = useRef(null);

  // Size from the rendered pattern so the preview always matches what will be beaded
  const beadCols = matrix?.[0]?.length || columns;
  const beadRows = matrix?.length || rows;
  const specs = calculatePhysicalSpecs(beadCols, beadRows, beadPreset?.widthMm || 9, beadPreset?.heightMm || 6);

  useEffect(() => {
    if (!isOpen || !matrix || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const width = 640;
    const height = 460;
    // Device-pixel backing store keeps the scene sharp on Retina screens
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Everything is drawn to one physical scale (pixels per inch) so the hanging's size
    // reads true against a standard 84" sofa; shrink the scale only if a big hanging won't fit
    const floorY = height - 28;
    const hangW = specs.widthInches;
    const hangH = specs.heightInches;
    // Width budget: sofa plus ~30" on each side for the plant
    const ppi = Math.min(4.5, (floorY - 50) / (hangH + SOFA.height + 10), (width - 20) / Math.max(hangW + 4, SOFA.width + 60));
    const inch = (n) => n * ppi;
    const centerX = width / 2;

    // Wall with soft lighting falloff
    ctx.fillStyle = '#232B3A';
    ctx.fillRect(0, 0, width, height);
    const wallGrad = ctx.createLinearGradient(0, 0, 0, floorY);
    wallGrad.addColorStop(0, 'rgba(255, 255, 255, 0.06)');
    wallGrad.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, width, floorY);

    // Wood floor and baseboard
    ctx.fillStyle = '#4A3728';
    ctx.fillRect(0, floorY, width, height - floorY);
    ctx.fillStyle = '#CBD5E1';
    ctx.fillRect(0, floorY - 3, width, 3);

    const sofaW = inch(SOFA.width);
    const sofaX = centerX - sofaW / 2;

    // Potted plant beside the sofa (scale reference, about 3 ft tall)
    const potW = inch(12);
    const potH = inch(12);
    const potX = sofaX + sofaW + inch(5);
    const potTop = floorY - potH;
    const stemBaseX = potX + potW / 2;
    const leaves = [
      [-0.45, 24, '#2F855A'],
      [-0.2, 30, '#38A169'],
      [0.05, 34, '#2F855A'],
      [0.28, 28, '#48BB78'],
      [0.5, 22, '#38A169'],
      [-0.7, 16, '#48BB78'],
      [0.75, 15, '#2F855A']
    ];
    leaves.forEach(([angle, length, color]) => {
      const tipX = stemBaseX + Math.sin(angle) * inch(length);
      const tipY = potTop - Math.cos(angle) * inch(length);
      ctx.strokeStyle = '#276749';
      ctx.lineWidth = Math.max(1, inch(0.35));
      ctx.beginPath();
      ctx.moveTo(stemBaseX, potTop);
      ctx.quadraticCurveTo(stemBaseX + Math.sin(angle) * inch(length * 0.3), potTop - inch(length * 0.5), tipX, tipY);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(
        (stemBaseX + tipX * 2) / 3 + Math.sin(angle) * inch(length * 0.15),
        (potTop + tipY * 2) / 3 - inch(length * 0.05),
        inch(3.2),
        inch(length * 0.32),
        angle,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });
    ctx.fillStyle = '#C05621'; // terracotta pot
    ctx.beginPath();
    ctx.moveTo(potX, potTop);
    ctx.lineTo(potX + potW, potTop);
    ctx.lineTo(potX + potW * 0.85, floorY);
    ctx.lineTo(potX + potW * 0.15, floorY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#9C4221';
    ctx.fillRect(potX - inch(0.5), potTop, potW + inch(1), inch(2));

    // Sofa (scale reference)
    const sofaTop = floorY - inch(SOFA.height);
    const armW = inch(6);
    const seatY = floorY - inch(SOFA.seatHeight);
    ctx.fillStyle = '#5B6B82';
    ctx.beginPath();
    ctx.roundRect(sofaX + armW * 0.6, sofaTop, sofaW - armW * 1.2, seatY - sofaTop + inch(2), inch(3));
    ctx.fill();
    ctx.fillStyle = '#4C5A6E';
    ctx.beginPath();
    ctx.roundRect(sofaX, seatY - inch(7), armW, inch(SOFA.seatHeight + 7) - inch(4), inch(2.5));
    ctx.roundRect(sofaX + sofaW - armW, seatY - inch(7), armW, inch(SOFA.seatHeight + 7) - inch(4), inch(2.5));
    ctx.fill();
    ctx.fillStyle = '#66778F';
    const cushionW = (sofaW - armW * 2) / 3;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.roundRect(sofaX + armW + i * cushionW + 1, seatY - inch(1), cushionW - 2, inch(6), inch(1.5));
      ctx.fill();
    }
    ctx.fillStyle = '#2A2118';
    ctx.fillRect(sofaX + armW * 0.4, floorY - inch(4), inch(1.2), inch(4));
    ctx.fillRect(sofaX + sofaW - armW * 0.4 - inch(1.2), floorY - inch(4), inch(1.2), inch(4));

    // Hanging: bottom edge 8" above the sofa back, as is typical for art over a sofa
    const tapW = inch(hangW);
    const tapH = inch(hangH);
    const tapX = centerX - tapW / 2;
    const tapY = Math.max(inch(10), sofaTop - inch(8) - tapH);

    // Cord, nail, and dowel rod
    const nailY = Math.max(8, tapY - inch(7));
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(tapX - inch(1), tapY);
    ctx.lineTo(centerX, nailY);
    ctx.lineTo(tapX + tapW + inch(1), tapY);
    ctx.stroke();
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(centerX, nailY, 3, 0, Math.PI * 2);
    ctx.fill();
    const rodH = Math.max(4, inch(0.75));
    ctx.fillStyle = '#A1887F';
    ctx.beginPath();
    ctx.roundRect(tapX - inch(1.5), tapY - rodH / 2, tapW + inch(3), rodH, rodH / 2);
    ctx.fill();

    // Beads with a soft drop shadow
    const mHeight = matrix.length;
    const mWidth = matrix[0].length;
    const cellW = tapW / mWidth;
    const cellH = tapH / mHeight;
    const beadTop = tapY + rodH / 2;
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.01)';
    ctx.fillRect(tapX, beadTop, tapW, tapH);
    ctx.restore();
    const isRound = cellW >= 3;
    for (let y = 0; y < mHeight; y++) {
      for (let x = 0; x < mWidth; x++) {
        ctx.fillStyle = matrix[y][x].hex;
        if (isRound) {
          ctx.beginPath();
          ctx.roundRect(tapX + x * cellW + 0.25, beadTop + y * cellH + 0.25, cellW - 0.5, cellH - 0.5, Math.min(cellW, cellH) * 0.3);
          ctx.fill();
        } else {
          ctx.fillRect(tapX + x * cellW, beadTop + y * cellH, cellW + 0.3, cellH + 0.3);
        }
      }
    }

    // Thread fringe below the last row
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1;
    const fringeStep = Math.max(1, Math.round(3 / cellW));
    for (let x = 0; x < mWidth; x += fringeStep) {
      const fx = tapX + x * cellW + cellW / 2;
      const fy = beadTop + tapH;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx, fy + inch(2.5 + Math.sin(x * 0.5)));
      ctx.stroke();
    }

    // Scale note
    ctx.fillStyle = 'rgba(203, 213, 225, 0.75)';
    ctx.font = '11px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Drawn to scale: ${hangW}″ × ${hangH}″ hanging over an ${SOFA.width}″ sofa`, 12, height - 10);
  }, [isOpen, matrix, specs.widthInches, specs.heightInches]);

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
          <canvas ref={canvasRef} style={{ width: '100%', maxWidth: '640px', height: 'auto', aspectRatio: '640 / 460', borderRadius: '8px' }} />
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
