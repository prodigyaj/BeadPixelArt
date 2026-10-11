import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { rowForBead, beadNumberForRow, STRINGING_LABELS } from '../core/threading.js';

/**
 * Renders one realistic 3D pony bead barrel (body, finish shading, hole, thread)
 * into an offscreen canvas sized cellW × cellH at the given pixel scale
 */
function renderBeadSprite(bead, cellW, cellH, scale) {
  const sprite = document.createElement('canvas');
  sprite.width = Math.max(1, Math.ceil(cellW * scale));
  sprite.height = Math.max(1, Math.ceil(cellH * scale));
  const ctx = sprite.getContext('2d');
  ctx.scale(sprite.width / cellW, sprite.height / cellH);

  const padX = 1;
  const padY = 0.8;
  const radius = Math.min(cellW, cellH) * 0.22;
  const bodyPath = () => {
    ctx.beginPath();
    ctx.roundRect(padX, padY, cellW - padX * 2, cellH - padY * 2, radius);
  };

  // Barrel body
  ctx.fillStyle = bead.hex;
  bodyPath();
  ctx.fill();

  // Physical finish shading
  let grad;
  if (bead.finish === 'Matte') {
    // Soft velvet diffuse shading (low contrast, no glossy specular)
    grad = ctx.createLinearGradient(0, 0, 0, cellH);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.0)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
  } else if (bead.finish === 'Pearl') {
    // Pearl iridescent sheen
    grad = ctx.createLinearGradient(0, 0, cellW, cellH);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
    grad.addColorStop(0.35, 'rgba(220, 230, 255, 0.2)');
    grad.addColorStop(0.7, 'rgba(255, 240, 245, 0.15)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
  } else {
    // Opaque Classic Glossy Highlight
    grad = ctx.createLinearGradient(0, 0, 0, cellH);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
    grad.addColorStop(0.25, 'rgba(255, 255, 255, 0.12)');
    grad.addColorStop(0.75, 'rgba(0, 0, 0, 0.0)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
  }
  ctx.fillStyle = grad;
  bodyPath();
  ctx.fill();

  // Center 4mm bead hole (vertical thread passes through)
  const holeW = cellW * 0.38;
  const holeH = cellH * 0.42;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(cellW / 2, cellH / 2, holeW / 2, holeH / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Thread line through hole
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cellW / 2, 0);
  ctx.lineTo(cellW / 2, cellH);
  ctx.stroke();

  return sprite;
}

/**
 * Green check badge stamped on every strung bead, sized for one cell at the given pixel scale
 */
function renderCheckSprite(cellW, cellH, scale) {
  const sprite = document.createElement('canvas');
  sprite.width = Math.max(1, Math.ceil(cellW * scale));
  sprite.height = Math.max(1, Math.ceil(cellH * scale));
  const ctx = sprite.getContext('2d');
  ctx.scale(sprite.width / cellW, sprite.height / cellH);

  // Dim the bead so finished areas recede, then draw a bold check on top
  ctx.fillStyle = 'rgba(2, 6, 23, 0.55)';
  ctx.fillRect(0, 0, cellW, cellH);
  const size = Math.min(cellW, cellH) * 0.6;
  const cx = cellW / 2;
  const cy = cellH / 2;
  ctx.strokeStyle = '#34D399';
  ctx.lineWidth = Math.max(1.5, size * 0.22);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.45, cy);
  ctx.lineTo(cx - size * 0.1, cy + size * 0.32);
  ctx.lineTo(cx + size * 0.48, cy - size * 0.35);
  ctx.stroke();
  return sprite;
}

// How far past "whole pattern fits" users can zoom in
const MAX_ZOOM_FACTOR = 4;

export function PatternCanvas({
  matrix,
  beadPreset,
  activeCol,
  beadProgress = {}, // { [col]: beads strung so far, in stringing order }
  stringingDirection = 'top-down', // 'top-down' | 'bottom-up'
  onSelectThread,
  onSetThreadProgress, // (col, count) => void
  isolatedColorId,
  renderMode = 'beads' // 'beads' | 'flat' | 'loom'
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  // Bead sprites reused across redraws (pan, thread stepping) until size or zoom changes
  const spriteCacheRef = useRef({ key: null, sprites: new Map() });

  const [zoom, setZoom] = useState(1);
  // Zoom that fits the whole pattern; zooming is limited to between this and MAX_ZOOM_FACTOR × closer
  const [fitZoom, setFitZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoverInfo, setHoverInfo] = useState(null);
  // Distinguishes a tap on a bead from the end of a drag-to-pan
  const dragDistanceRef = useRef(0);

  const strungOf = (col) => Math.min(beadProgress[col] || 0, matrix?.length || 0);

  const height = matrix?.length || 0;
  const width = matrix?.[0]?.length || 0;

  // Fit canvas to screen on initial load or matrix dimension change
  const fitToScreen = useCallback(() => {
    if (!containerRef.current || width === 0 || height === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const availableW = rect.width - 60;
    const availableH = rect.height - 100; // room for the column numbers and done-thread checks

    const beadW = beadPreset?.widthMm || 9;
    const beadH = beadPreset?.heightMm || 6;
    const scaleFactor = 3; // base pixels per mm

    const totalW = width * beadW * scaleFactor;
    const totalH = height * beadH * scaleFactor;

    const scale = Math.max(0.2, Math.min(availableW / totalW, availableH / totalH, 1.8));
    setZoom(scale);
    setFitZoom(scale);
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

    // Back the canvas with device pixels so beads stay sharp on Retina screens (iPad, Mac).
    // Resizing reallocates the backing store, so only do it when the size changes.
    const dpr = window.devicePixelRatio || 1;
    const pixelW = Math.round(cWidth * dpr);
    const pixelH = Math.round(cHeight * dpr);
    if (canvas.width !== pixelW) canvas.width = pixelW;
    if (canvas.height !== pixelH) canvas.height = pixelH;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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

    // Only draw beads inside the visible viewport (matters when zoomed in)
    const viewLeft = (-cWidth / 2 - offset.x) / zoom;
    const viewRight = (cWidth / 2 - offset.x) / zoom;
    const viewTop = (-cHeight / 2 - offset.y) / zoom;
    const viewBottom = (cHeight / 2 - offset.y) / zoom;
    const xStart = Math.max(0, Math.floor((viewLeft - originX) / cellW));
    const xEnd = Math.min(width, Math.ceil((viewRight - originX) / cellW));
    const yStart = Math.max(0, Math.floor((viewTop - originY) / cellH));
    const yEnd = Math.min(height, Math.ceil((viewBottom - originY) / cellH));

    // Each distinct bead color is rendered once into a sprite at the current on-screen
    // resolution, then stamped per cell, instead of rebuilding paths and gradients per bead
    const spriteScale = Math.min(zoom * dpr, 24);
    const spriteKey = `${cellW}|${cellH}|${spriteScale}`;
    if (spriteCacheRef.current.key !== spriteKey) {
      spriteCacheRef.current = { key: spriteKey, sprites: new Map() };
    }
    const { sprites } = spriteCacheRef.current;
    const getSprite = (bead, isCheck = false) => {
      const key = `${bead.hex}|${bead.finish}`;
      let sprite = sprites.get(key);
      if (!sprite) {
        sprite = isCheck
          ? renderCheckSprite(cellW, cellH, spriteScale)
          : renderBeadSprite(bead, cellW, cellH, spriteScale);
        sprites.set(key, sprite);
      }
      return sprite;
    };

    // Draw Beads
    for (let y = yStart; y < yEnd; y++) {
      for (let x = xStart; x < xEnd; x++) {
        const bead = matrix[y][x];
        const px = originX + x * cellW;
        const py = originY + y * cellH;

        const isIsolated = isolatedColorId && bead.id !== isolatedColorId;
        ctx.globalAlpha = isIsolated ? 0.18 : 1.0;

        if (renderMode === 'flat') {
          // Flat pixel rectangle
          ctx.fillStyle = bead.hex;
          ctx.fillRect(px, py, cellW, cellH);
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(px, py, cellW, cellH);
        } else {
          ctx.drawImage(getSprite(bead), px, py, cellW, cellH);
        }
      }
    }
    ctx.globalAlpha = 1.0;

    // Strung beads: dimmed with a green check (threads fill from the starting end)
    const checkSprite = getSprite({ hex: 'check', finish: 'check' }, true);
    for (let x = xStart; x < xEnd; x++) {
      const count = Math.min(beadProgress[x] || 0, height);
      const strungFrom = stringingDirection === 'bottom-up' ? height - count : 0;
      const strungTo = stringingDirection === 'bottom-up' ? height : count;
      for (let y = Math.max(yStart, strungFrom); y < Math.min(yEnd, strungTo); y++) {
        ctx.drawImage(checkSprite, originX + x * cellW, originY + y * cellH, cellW, cellH);
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

      // Highlight the next bead to string on this thread
      const strungOnActive = Math.min(beadProgress[activeCol] || 0, height);
      if (strungOnActive < height) {
        const beadY = rowForBead(strungOnActive + 1, height, stringingDirection);
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

    // Finished threads get a green check above the column numbers
    ctx.fillStyle = '#34D399';
    ctx.font = 'bold 13px JetBrains Mono';
    for (let x = 0; x < width; x++) {
      if ((beadProgress[x] || 0) >= height) {
        ctx.fillText('✓', originX + x * cellW + cellW / 2, originY - 24);
      }
    }
    ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
    ctx.font = '10px JetBrains Mono';

    // Top Column Numbers (1, 5, 10, ...)
    for (let x = 0; x < width; x++) {
      if ((x + 1) === 1 || (x + 1) % 5 === 0 || (x + 1) === width) {
        const tx = originX + x * cellW + cellW / 2;
        ctx.fillText(`${x + 1}`, tx, originY - 10);
        ctx.fillText(`${x + 1}`, tx, originY + totalH + 10);
      }
    }

    // Row numbers in stringing order (bead 1 is at the end the thread starts from)
    ctx.textAlign = 'right';
    for (let y = 0; y < height; y++) {
      const beadNumber = beadNumberForRow(y, height, stringingDirection);
      if (beadNumber === 1 || beadNumber % 5 === 0 || beadNumber === height) {
        const ty = originY + y * cellH + cellH / 2;
        ctx.fillText(`${beadNumber}`, originX - 6, ty);
      }
    }

    ctx.restore();
  }, [matrix, width, height, beadPreset, zoom, offset, activeCol, beadProgress, stringingDirection, isolatedColorId, renderMode]);

  // Zoom stays between "whole pattern fits" and MAX_ZOOM_FACTOR × closer; back at the fit level
  // the pattern re-centers so it can't be left stranded off to one side
  const maxZoom = fitZoom * MAX_ZOOM_FACTOR;
  const zoomBy = useCallback(
    (factor) => {
      setZoom((prev) => {
        const next = Math.max(fitZoom, Math.min(fitZoom * MAX_ZOOM_FACTOR, prev * factor));
        if (next <= fitZoom) setOffset({ x: 0, y: 0 });
        return next;
      });
    },
    [fitZoom]
  );

  // A plain scroll wheel / two-finger trackpad scroll scrolls the page as usual. Only a deliberate
  // zoom gesture (trackpad pinch, which browsers report as ctrl + wheel, or Ctrl/⌘ + wheel) zooms.
  // Attached natively because React's wheel listener is passive and can't stop the browser's page zoom.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      zoomBy(Math.exp(-e.deltaY * 0.01));
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [zoomBy]);

  // Drag pan
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    dragDistanceRef.current = 0;
    if (zoom <= fitZoom) return; // nothing to pan when the whole pattern is visible
    setIsPanning(true);
    dragDistanceRef.current = 0;
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      dragDistanceRef.current += Math.abs(e.movementX) + Math.abs(e.movementY);
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }

    // Only update state when the hovered bead actually changes, so mouse moves within
    // a single bead don't re-render the component
    const hit = hitTest(e);
    setHoverInfo((prev) =>
      prev && hit && prev.col === hit.col && prev.beadNumber === hit.beadNumber && prev.bead === hit.bead
        ? prev
        : hit
    );
  };

  // Maps a pointer position to the bead under it: { col (1-based), beadNumber (stringing order), bead } or null
  const hitTest = (e) => {
    if (!canvasRef.current || width === 0 || height === 0) return null;
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

    if (col < 0 || col >= width || row < 0 || row >= height) return null;
    return { col: col + 1, beadNumber: beadNumberForRow(row, height, stringingDirection), bead: matrix[row][col] };
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Tap a thread to make it active; tap a bead on the active thread to mark it (and every bead
  // strung before it) as done, or tap a strung bead to take it and the beads after it back off
  const handleClick = (e) => {
    const hit = hitTest(e);
    if (!hit || dragDistanceRef.current > 5) return;
    const col = hit.col - 1;
    if (col !== activeCol) {
      onSelectThread(col);
      return;
    }
    const strung = strungOf(col);
    onSetThreadProgress(col, hit.beadNumber <= strung ? hit.beadNumber - 1 : hit.beadNumber);
  };

  // Touch (iPad / phones): one finger scrolls the page like anywhere else (touch-action below);
  // two fingers pinch to zoom and drag to move around the pattern
  const touchRef = useRef({ lastDist: 0, lastMid: null });

  const twoFingerState = (touches) => ({
    dist: Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY),
    mid: { x: (touches[0].clientX + touches[1].clientX) / 2, y: (touches[0].clientY + touches[1].clientY) / 2 }
  });

  const handleTouchStart = (e) => {
    dragDistanceRef.current = 0;
    if (e.touches.length === 2) {
      const { dist, mid } = twoFingerState(e.touches);
      touchRef.current = { lastDist: dist, lastMid: mid };
    }
  };

  const handleTouchMove = (e) => {
    dragDistanceRef.current += 10; // any touch movement is a scroll or pinch, not a tap
    if (e.touches.length !== 2) return;
    const { dist, mid } = twoFingerState(e.touches);
    const { lastDist, lastMid } = touchRef.current;
    if (lastDist > 0) zoomBy(dist / lastDist);
    if (lastMid) setOffset((prev) => ({ x: prev.x + mid.x - lastMid.x, y: prev.y + mid.y - lastMid.y }));
    touchRef.current = { lastDist: dist, lastMid: mid };
  };

  const handleTouchEnd = () => {
    touchRef.current = { lastDist: 0, lastMid: null };
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
            onClick={() => zoomBy(1 / 1.4)}
            disabled={zoom <= fitZoom}
            title="Zoom out (or pinch / Ctrl + scroll)"
          >
            <ZoomOut size={14} />
          </button>
          <button
            className="btn btn-sm"
            onClick={() => zoomBy(1.4)}
            disabled={zoom >= maxZoom}
            title="Zoom in (or pinch / Ctrl + scroll)"
          >
            <ZoomIn size={14} />
          </button>
          <button
            className="btn btn-sm"
            onClick={fitToScreen}
            disabled={zoom <= fitZoom && offset.x === 0 && offset.y === 0}
            title="Show the whole pattern"
          >
            <Maximize size={14} />
            <span>Fit</span>
          </button>
        </div>
      </div>

      {/* Viewport Canvas */}
      <div
        ref={containerRef}
        className="canvas-viewport"
        style={{ touchAction: 'pan-x pan-y', cursor: zoom > fitZoom ? undefined : 'default' }}
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
              <strong>Thread #{hoverInfo.col}</strong> | <strong>Bead #{hoverInfo.beadNumber}</strong> (from {STRINGING_LABELS[stringingDirection].start}):
            </span>
            <span style={{ color: '#F8FAFC', fontWeight: 500 }}>
              {hoverInfo.bead.name}
            </span>
            <span style={{
              fontSize: '0.66rem',
              color: hoverInfo.bead.finish === 'Matte' ? '#FCD34D' : '#93C5FD',
              background: hoverInfo.bead.finish === 'Matte' ? 'rgba(217, 119, 6, 0.2)' : 'rgba(59, 130, 246, 0.2)',
              padding: '0.1rem 0.35rem',
              borderRadius: '3px',
              fontWeight: 600
            }}>
              {hoverInfo.bead.finish || 'Opaque'} &bull; {hoverInfo.bead.code || hoverInfo.bead.id}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
