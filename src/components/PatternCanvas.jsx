import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize, RotateCcw, Eye, Layers, Compass } from 'lucide-react';

export function PatternCanvas({
  matrix,
  beadPreset,
  activeCol,
  activeBeadIndex, // 0 is bottom, height-1 is top
  onSelectThread,
  isolatedColorId,
  renderMode = 'beads' // 'beads' | 'flat' | 'loom'
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoverInfo, setHoverInfo] = useState(null);

  const height = matrix?.length || 0;
  const width = matrix?.[0]?.length || 0;

  // Fit canvas to screen on initial load or matrix dimension change
  const fitToScreen = useCallback(() => {
    if (!containerRef.current || width === 0 || height === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const availableW = rect.width - 60;
    const availableH = rect.height - 60;

    const beadW = beadPreset?.widthMm || 9;
    const beadH = beadPreset?.heightMm || 6;
    const scaleFactor = 3; // base pixels per mm

    const totalW = width * beadW * scaleFactor;
    const totalH = height * beadH * scaleFactor;

    const scale = Math.min(availableW / totalW, availableH / totalH, 1.8);
    setZoom(Math.max(0.2, scale));
    setOffset({ x: 0, y: 0 });
  }, [width, height, beadPreset]);

  useEffect(() => {
    fitToScreen();
  }, [width, height, fitToScreen]);

  // Main canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !matrix || width === 0 || height === 0) return;
    const ctx = canvas.getContext('2d');

    const container = containerRef.current;
    const cWidth = container.clientWidth;
    const cHeight = container.clientHeight;

    canvas.width = cWidth;
    canvas.height = cHeight;

    ctx.clearRect(0, 0, cWidth, cHeight);

    ctx.save();
    // Center translation + pan + zoom
    ctx.translate(cWidth / 2 + offset.x, cHeight / 2 + offset.y);
    ctx.scale(zoom, zoom);

    // Bead pixel sizing based on physical mm
    const baseScale = 3;
    const cellW = (beadPreset?.widthMm || 9) * baseScale;
    const cellH = (beadPreset?.heightMm || 6) * baseScale;

    const totalW = width * cellW;
    const totalH = height * cellH;

    // Draw from top-left origin (-totalW/2, -totalH/2)
    const originX = -totalW / 2;
    const originY = -totalH / 2;

    // Draw loom warp thread lines in background
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1.5;
    for (let x = 0; x < width; x++) {
      const threadX = originX + x * cellW + cellW / 2;
      ctx.beginPath();
      ctx.moveTo(threadX, originY - 18);
      ctx.lineTo(threadX, originY + totalH + 18);
      ctx.stroke();
    }

    // Draw Beads
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const bead = matrix[y][x];
        const px = originX + x * cellW;
        const py = originY + y * cellH;

        const isIsolated = isolatedColorId && bead.id !== isolatedColorId;
        const opacity = isIsolated ? 0.18 : 1.0;

        ctx.globalAlpha = opacity;

        if (renderMode === 'flat') {
          // Flat pixel rectangle
          ctx.fillStyle = bead.hex;
          ctx.fillRect(px, py, cellW, cellH);
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(px, py, cellW, cellH);
        } else {
          // Realistic 3D Pony Bead Barrel
          const padX = 1;
          const padY = 0.8;
          const radius = Math.min(cellW, cellH) * 0.22;

          // Barrel body
          ctx.fillStyle = bead.hex;
          ctx.beginPath();
          ctx.roundRect(px + padX, py + padY, cellW - padX * 2, cellH - padY * 2, radius);
          ctx.fill();

          // Subtle glossy top specular highlight
          const grad = ctx.createLinearGradient(px, py, px, py + cellH);
          grad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
          grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.1)');
          grad.addColorStop(0.8, 'rgba(0, 0, 0, 0.0)');
          grad.addColorStop(1, 'rgba(0, 0, 0, 0.35)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(px + padX, py + padY, cellW - padX * 2, cellH - padY * 2, radius);
          ctx.fill();

          // Center 4mm bead hole (vertical thread passes through)
          const holeW = cellW * 0.38;
          const holeH = cellH * 0.42;
          const holeX = px + (cellW - holeW) / 2;
          const holeY = py + (cellH - holeH) / 2;

          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.beginPath();
          ctx.ellipse(holeX + holeW / 2, holeY + holeH / 2, holeW / 2, holeH / 2, 0, 0, Math.PI * 2);
          ctx.fill();

          // Thread line through hole
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(holeX + holeW / 2, py);
          ctx.lineTo(holeX + holeW / 2, py + cellH);
          ctx.stroke();
        }

        ctx.globalAlpha = 1.0;
      }
    }

    // Highlight Active Column (Thread)
    if (activeCol >= 0 && activeCol < width) {
      const activeX = originX + activeCol * cellW;
      ctx.strokeStyle = '#6366F1';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = 'rgba(99, 102, 241, 0.8)';
      ctx.shadowBlur = 10;
      ctx.strokeRect(activeX - 1, originY - 4, cellW + 2, totalH + 8);
      ctx.shadowBlur = 0;

      // Highlight Active Bead along this thread (Bottom to Top)
      // activeBeadIndex: 0 is bottom (y = height - 1), height-1 is top (y = 0)
      if (activeBeadIndex !== null && activeBeadIndex >= 0 && activeBeadIndex < height) {
        const beadY = height - 1 - activeBeadIndex;
        const beadPy = originY + beadY * cellH;

        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#10B981';
        ctx.shadowBlur = 12;
        ctx.strokeRect(activeX - 2, beadPy - 2, cellW + 4, cellH + 4);
        ctx.shadowBlur = 0;
      }
    }

    // Draw Column & Row Rulers
    ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
    ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Top Column Numbers (1, 5, 10, ...)
    for (let x = 0; x < width; x++) {
      if ((x + 1) === 1 || (x + 1) % 5 === 0 || (x + 1) === width) {
        const tx = originX + x * cellW + cellW / 2;
        ctx.fillText(`${x + 1}`, tx, originY - 10);
        ctx.fillText(`${x + 1}`, tx, originY + totalH + 10);
      }
    }

    // Left & Right Row Numbers from BOTTOM to TOP (1 at bottom, height at top)
    ctx.textAlign = 'right';
    for (let y = 0; y < height; y++) {
      const rowFromBottom = height - y; // 1 at bottom, height at top
      if (rowFromBottom === 1 || rowFromBottom % 5 === 0 || rowFromBottom === height) {
        const ty = originY + y * cellH + cellH / 2;
        ctx.fillText(`${rowFromBottom}`, originX - 6, ty);
      }
    }

    ctx.restore();
  }, [matrix, width, height, beadPreset, zoom, offset, activeCol, activeBeadIndex, isolatedColorId, renderMode]);

  // Mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoom((prev) => Math.max(0.15, Math.min(12, prev * factor)));
  };

  // Drag pan
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }

    // Calculate hover bead
    if (!canvasRef.current || width === 0 || height === 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const cWidth = rect.width;
    const cHeight = rect.height;

    const baseScale = 3;
    const cellW = (beadPreset?.widthMm || 9) * baseScale;
    const cellH = (beadPreset?.heightMm || 6) * baseScale;
    const totalW = width * cellW;
    const totalH = height * cellH;

    // Invert translation and scale
    const worldX = (mouseX - (cWidth / 2 + offset.x)) / zoom;
    const worldY = (mouseY - (cHeight / 2 + offset.y)) / zoom;

    const col = Math.floor((worldX + totalW / 2) / cellW);
    const row = Math.floor((worldY + totalH / 2) / cellH);

    if (col >= 0 && col < width && row >= 0 && row < height) {
      const bead = matrix[row][col];
      const rowFromBottom = height - row;
      setHoverInfo({
        col: col + 1,
        rowFromBottom,
        bead
      });
    } else {
      setHoverInfo(null);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleClick = (e) => {
    if (hoverInfo) {
      onSelectThread(hoverInfo.col - 1);
    }
  };

  // Touch handlers for mobile (iOS Safari & Android Chrome)
  const touchRef = useRef({ lastDist: 0, lastPos: { x: 0, y: 0 } });

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      touchRef.current.lastPos = { x: t.clientX - offset.x, y: t.clientY - offset.y };
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      touchRef.current.lastDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      setOffset({
        x: t.clientX - touchRef.current.lastPos.x,
        y: t.clientY - touchRef.current.lastPos.y
      });
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const newDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      if (touchRef.current.lastDist > 0) {
        const factor = newDist / touchRef.current.lastDist;
        setZoom((prev) => Math.max(0.15, Math.min(12, prev * factor)));
      }
      touchRef.current.lastDist = newDist;
    }
  };

  const handleTouchEnd = () => {
    touchRef.current.lastDist = 0;
  };

  return (
    <div className="canvas-wrapper">
      {/* Top Canvas Toolbar */}
      <div className="canvas-toolbar">
        <div className="toolbar-group">
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#F8FAFC' }}>
            Interactive Bead Matrix
          </span>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
            ({width} Columns × {height} Rows)
          </span>
        </div>

        <div className="toolbar-group">
          <button
            className="btn btn-sm"
            onClick={() => setZoom((z) => Math.min(12, z * 1.25))}
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          <button
            className="btn btn-sm"
            onClick={() => setZoom((z) => Math.max(0.15, z * 0.8))}
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            className="btn btn-sm"
            onClick={fitToScreen}
            title="Fit Tapestry to Viewport"
          >
            <Maximize size={14} />
            <span>Fit</span>
          </button>
          <button
            className="btn btn-sm"
            onClick={() => {
              setZoom(1);
              setOffset({ x: 0, y: 0 });
            }}
            title="Reset Zoom & Pan"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Viewport Canvas */}
      <div
        ref={containerRef}
        className="canvas-viewport"
        style={{ touchAction: 'none' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
      >
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

        {/* Hover Bead Info Badge */}
        {hoverInfo && (
          <div className="canvas-status">
            <span
              style={{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                borderRadius: '3px',
                backgroundColor: hoverInfo.bead.hex,
                border: '1px solid rgba(255,255,255,0.4)'
              }}
            />
            <span>
              <strong>Thread #{hoverInfo.col}</strong> | <strong>Bead #{hoverInfo.rowFromBottom}</strong> (from bottom):
            </span>
            <span style={{ color: '#F8FAFC' }}>
              {hoverInfo.bead.name} ({hoverInfo.bead.id})
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
