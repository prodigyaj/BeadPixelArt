import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header.jsx';
import { ImageUpload } from './components/ImageUpload.jsx';
import { WallCalculator } from './components/WallCalculator.jsx';
import { Adjustments } from './components/Adjustments.jsx';
import { PatternCanvas } from './components/PatternCanvas.jsx';
import { ThreadingGuide } from './components/ThreadingGuide.jsx';
import { ColorBreakdown } from './components/ColorBreakdown.jsx';
import { WallMockupModal } from './components/WallMockupModal.jsx';
import { ManualColorRemapper } from './components/ManualColorRemapper.jsx';
import { PaletteManagerModal } from './components/PaletteManagerModal.jsx';
import { NetworkAccessModal } from './components/NetworkAccessModal.jsx';

import { BEAD_PRESETS } from './core/beadSpecs.js';
import { PONY_BEAD_PALETTE } from './palettes/ponyBeads.js';
import { PERLER_PALETTE } from './palettes/perler.js';
import { SAMPLE_IMAGES } from './data/sampleImages.js';
import {
  loadImage,
  analyzeDetail,
  processImageToBeads,
  processExactMatrixImage
} from './core/imageProcessor.js';
import { generateWordChart, calculateColorStats } from './core/threading.js';
import { deltaE76, rgbToLab, consolidateMinorityColors } from './core/colorLab.js';

export default function App() {
  // 1. Bead Specifications (Default: 6x9mm Pony Beads from Amazon listing)
  const [activeBeadPreset, setActiveBeadPreset] = useState(BEAD_PRESETS[0]);
  const [customBeadSpecs, setCustomBeadSpecs] = useState({ widthMm: 9.0, heightMm: 6.0 });

  // 2. Sizing and Grid
  const [columns, setColumns] = useState(40);
  const [rows, setRows] = useState(50);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);

  // 3. Image and Recommendation
  const [activeSampleId, setActiveSampleId] = useState('sunset');
  const [currentImageSrc, setCurrentImageSrc] = useState(SAMPLE_IMAGES[0].src);
  const [loadedImage, setLoadedImage] = useState(null);
  const [imageRatio, setImageRatio] = useState(1.0);
  const [recommendation, setRecommendation] = useState(null);
  const [isExactMatrixMode, setIsExactMatrixMode] = useState(false);

  // 4. Adjustments and Dithering
  const [ditherMode, setDitherMode] = useState('floyd-steinberg');
  const [adjustments, setAdjustments] = useState({ brightness: 0, contrast: 0, saturation: 0 });

  // 5. Active Assembly and Interactive Guides
  const [activeCol, setActiveCol] = useState(0); // 0 to width-1
  const [activeBeadIndex, setActiveBeadIndex] = useState(0); // 0 is bottom, height-1 is top
  const [isolatedColorId, setIsolatedColorId] = useState(null);
  const [activePaletteLimit, setActivePaletteLimit] = useState(null);
  const [renderMode, setRenderMode] = useState('beads');
  const [isWallMockupOpen, setIsWallMockupOpen] = useState(false);
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);

  // Active bead geometry
  const beadWidthMm = activeBeadPreset.id === 'custom' ? customBeadSpecs.widthMm : activeBeadPreset.widthMm;
  const beadHeightMm = activeBeadPreset.id === 'custom' ? customBeadSpecs.heightMm : activeBeadPreset.heightMm;
  const beadAspectRatio = beadWidthMm / beadHeightMm;

  // Active palette and User-Owned Inventory Whitelist
  const [isPaletteManagerOpen, setIsPaletteManagerOpen] = useState(false);
  const basePalette = useMemo(() => {
    return activeBeadPreset.id.startsWith('perler') ? PERLER_PALETTE : PONY_BEAD_PALETTE;
  }, [activeBeadPreset]);

  // Allowed / owned colors within the active bead catalog (default all enabled)
  const [enabledColorIds, setEnabledColorIds] = useState(PONY_BEAD_PALETTE.map((c) => c.id));

  // Keep enabledColorIds synchronized when bead brand changes
  useEffect(() => {
    setEnabledColorIds(basePalette.map((c) => c.id));
  }, [basePalette]);

  // Load Image instance when currentImageSrc changes
  useEffect(() => {
    let isCancelled = false;
    loadImage(currentImageSrc).then((img) => {
      if (isCancelled) return;
      setLoadedImage(img);
      const ratio = img.naturalWidth / img.naturalHeight;
      setImageRatio(ratio);

      // Detail analysis & recommendation
      const rec = analyzeDetail(img);
      setRecommendation(rec);

      // Check if image is an exact small pixel matrix (<= 128x128) or if sample is marked as exact
      const isSmallPixelMatrix = img.naturalWidth <= 128 && img.naturalHeight <= 128;
      const matchedSample = SAMPLE_IMAGES.find((s) => s.id === activeSampleId);
      const shouldBeExact = matchedSample?.isExactMatrix || (activeSampleId === null && isSmallPixelMatrix);

      if (shouldBeExact) {
        setIsExactMatrixMode(true);
        setColumns(img.naturalWidth);
        setRows(img.naturalHeight);
      } else if (!isExactMatrixMode) {
        const calculatedRows = Math.max(15, Math.round((columns * beadAspectRatio) / ratio));
        setRows(calculatedRows);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [currentImageSrc]);

  // Handler for toggling exact matrix mode
  const handleToggleExactMatrixMode = (enableExact) => {
    setIsExactMatrixMode(enableExact);
    if (enableExact && loadedImage) {
      setColumns(loadedImage.naturalWidth);
      setRows(loadedImage.naturalHeight);
    } else if (!enableExact && loadedImage) {
      const defaultCols = 40;
      setColumns(defaultCols);
      const calculatedRows = Math.max(15, Math.round((defaultCols * beadAspectRatio) / imageRatio));
      setRows(calculatedRows);
    }
  };

  // When columns change and aspect ratio is locked, recalculate rows
  const handleColumnsChange = (newCols) => {
    if (isExactMatrixMode) return; // locked to image pixels
    setColumns(newCols);
    if (lockAspectRatio && imageRatio) {
      const calculatedRows = Math.max(15, Math.round((newCols * beadAspectRatio) / imageRatio));
      setRows(calculatedRows);
    }
  };

  // When bead preset changes, update rows if locked
  useEffect(() => {
    if (!isExactMatrixMode && lockAspectRatio && imageRatio) {
      const calculatedRows = Math.max(15, Math.round((columns * beadAspectRatio) / imageRatio));
      setRows(calculatedRows);
    }
  }, [beadAspectRatio, lockAspectRatio, imageRatio, columns, isExactMatrixMode]);

  // Palette Filtering: Constrain strictly to user-owned / allowed inventory
  const effectivePalette = useMemo(() => {
    const allowed = basePalette.filter((c) => enabledColorIds.includes(c.id));
    const pool = allowed.length >= 2 ? allowed : basePalette;
    if (!activePaletteLimit) return pool;
    return pool.slice(0, activePaletteLimit);
  }, [basePalette, enabledColorIds, activePaletteLimit]);

  // Generate Matrix (Exact 1:1 or Downsampled)
  const [matrix, setMatrix] = useState(null);

  useEffect(() => {
    if (!loadedImage) return;

    if (isExactMatrixMode) {
      const result = processExactMatrixImage({
        image: loadedImage,
        palette: effectivePalette
      });
      setMatrix(result);
      if (activeCol >= loadedImage.naturalWidth) {
        setActiveCol(0);
        setActiveBeadIndex(0);
      }
    } else {
      if (columns <= 0 || rows <= 0) return;
      const result = processImageToBeads({
        image: loadedImage,
        columns,
        rows,
        palette: effectivePalette,
        ditherMode,
        adjustments
      });
      setMatrix(result);
      if (activeCol >= columns) {
        setActiveCol(0);
        setActiveBeadIndex(0);
      }
    }
  }, [loadedImage, columns, rows, effectivePalette, ditherMode, adjustments, isExactMatrixMode]);

  // 6. Minority -> Majority Consolidation Config & Result
  const [consolidationConfig, setConsolidationConfig] = useState({
    enabled: true,
    mode: 'percent', // 'percent' | 'count'
    threshold: 1.5 // default 1.5%
  });

  // 7. Manual Color Overrides & Live Preview State
  const [isRemapperOpen, setIsRemapperOpen] = useState(false);
  const [activeManualOverrides, setActiveManualOverrides] = useState({}); // { [colorId]: targetColorObj }
  const [previewManualOverrides, setPreviewManualOverrides] = useState(null); // null when not previewing

  // Base consolidated matrix (before manual user overrides)
  const { baseConsolidatedMatrix, consolidationResult } = useMemo(() => {
    if (!matrix) return { baseConsolidatedMatrix: null, consolidationResult: null };
    if (!consolidationConfig.enabled) {
      return {
        baseConsolidatedMatrix: matrix,
        consolidationResult: { substitutions: [], savedBags: 0, majorityCount: 0, minorityCount: 0 }
      };
    }
    const res = consolidateMinorityColors(matrix, consolidationConfig.mode, consolidationConfig.threshold);
    return { baseConsolidatedMatrix: res.matrix, consolidationResult: res };
  }, [matrix, consolidationConfig]);

  // Final Matrix: Applies manual color overrides (or live preview overrides if previewing)
  const finalMatrix = useMemo(() => {
    if (!baseConsolidatedMatrix) return null;
    const effectiveOverrides = previewManualOverrides !== null ? previewManualOverrides : activeManualOverrides;
    const overrideKeys = Object.keys(effectiveOverrides);
    if (overrideKeys.length === 0) return baseConsolidatedMatrix;

    const height = baseConsolidatedMatrix.length;
    const width = baseConsolidatedMatrix[0].length;

    return Array.from({ length: height }, (_, y) =>
      Array.from({ length: width }, (_, x) => {
        const cell = baseConsolidatedMatrix[y][x];
        return effectiveOverrides[cell.id] ? effectiveOverrides[cell.id] : cell;
      })
    );
  }, [baseConsolidatedMatrix, activeManualOverrides, previewManualOverrides]);

  // List of active colors in the current artwork (for the remapper)
  const activeColorsList = useMemo(() => {
    return baseConsolidatedMatrix ? calculateColorStats(baseConsolidatedMatrix, 1000) : [];
  }, [baseConsolidatedMatrix]);

  // Switch to custom uploaded image
  const handleUploadCustom = (dataUri, filename) => {
    setActiveSampleId(null);
    setCurrentImageSrc(dataUri);
  };

  // Switch to sample
  const handleSelectSample = (sample) => {
    setActiveSampleId(sample.id);
    setCurrentImageSrc(sample.src);
  };

  // Export 1: High-Res PNG
  const handleExportPng = () => {
    if (!finalMatrix) return;
    const exportCanvas = document.createElement('canvas');
    const scale = 20; // 20px per bead for high-res output
    const pad = 60;
    const width = columns * scale;
    const height = rows * scale;

    exportCanvas.width = width + pad * 2;
    exportCanvas.height = height + pad * 2;
    const ctx = exportCanvas.getContext('2d');

    // Background
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Beads
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const bead = finalMatrix[y][x];
        const px = pad + x * scale;
        const py = pad + y * scale;

        ctx.fillStyle = bead.hex;
        ctx.beginPath();
        ctx.roundRect(px + 1, py + 1, scale - 2, scale - 2, 4);
        ctx.fill();

        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.arc(px + scale / 2, py + scale / 2, scale * 0.18, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Header label
    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 18px Outfit, sans-serif';
    ctx.fillText(`BeadPixel Art Pattern (${columns} Threads × ${rows} Beads)`, pad, 28);
    ctx.fillStyle = '#F472B6';
    ctx.font = '500 12px Outfit, sans-serif';
    ctx.fillText(`Created with ❤️ by Ajay & Moss • BeadPixel Art Studio`, pad, 46);

    // Trigger download
    const link = document.createElement('a');
    link.download = `bead-pattern-${columns}x${rows}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  };

  // Export 2: Word Chart (.txt)
  const handleExportWordChart = () => {
    if (!finalMatrix) return;
    const chart = generateWordChart(finalMatrix, activeBeadPreset);
    const blob = new Blob([chart], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.download = `bead-word-chart-${columns}x${rows}.txt`;
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  // Export 3: CSV Matrix
  const handleExportCsv = () => {
    if (!finalMatrix) return;
    const csvRows = [];
    csvRows.push(['Row (from Bottom)', ...Array.from({ length: columns }, (_, i) => `Thread ${i + 1}`)]);

    for (let y = rows - 1; y >= 0; y--) {
      const rowNumFromBottom = rows - y;
      const rowData = [rowNumFromBottom];
      for (let x = 0; x < columns; x++) {
        rowData.push(finalMatrix[y][x].name);
      }
      csvRows.push(rowData);
    }

    const csvContent = csvRows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.download = `bead-matrix-${columns}x${rows}.csv`;
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  // Currently appearing colors in the artwork
  const currentArtColorIds = useMemo(() => {
    if (!finalMatrix) return [];
    const set = new Set();
    for (let y = 0; y < finalMatrix.length; y++) {
      for (let x = 0; x < finalMatrix[0].length; x++) {
        set.add(finalMatrix[y][x].id);
      }
    }
    return Array.from(set);
  }, [finalMatrix]);

  return (
    <div className="app-container">
      <Header
        activeBeadPreset={activeBeadPreset}
        columns={columns}
        rows={rows}
        totalBeads={columns * rows}
        onExportPng={handleExportPng}
        onExportWordChart={handleExportWordChart}
        onExportCsv={handleExportCsv}
        onOpenWallMockup={() => setIsWallMockupOpen(true)}
        onOpenPaletteManager={() => setIsPaletteManagerOpen(true)}
        onOpenNetworkAccess={() => setIsNetworkModalOpen(true)}
        allowedColorsCount={effectivePalette.length}
        totalColorsCount={basePalette.length}
      />

      <main className="main-workspace">
        {/* Left Sidebar: Controls & Sizing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <ImageUpload
            activeSampleId={activeSampleId}
            onSelectSample={handleSelectSample}
            onUploadCustom={handleUploadCustom}
            isExactMatrixMode={isExactMatrixMode}
            onToggleExactMatrixMode={handleToggleExactMatrixMode}
            imageDimensions={{
              width: loadedImage?.naturalWidth || 0,
              height: loadedImage?.naturalHeight || 0
            }}
          />

          <WallCalculator
            activeBeadPreset={activeBeadPreset}
            onSelectBeadPreset={setActiveBeadPreset}
            customBeadSpecs={customBeadSpecs}
            onUpdateCustomBeadSpecs={setCustomBeadSpecs}
            columns={columns}
            onChangeColumns={handleColumnsChange}
            rows={rows}
            onChangeRows={setRows}
            lockAspectRatio={lockAspectRatio}
            onToggleLockAspectRatio={() => setLockAspectRatio(!lockAspectRatio)}
            recommendation={recommendation}
            sourceImageRatio={imageRatio}
            isExactMatrixMode={isExactMatrixMode}
          />

          <Adjustments
            ditherMode={ditherMode}
            onChangeDitherMode={setDitherMode}
            adjustments={adjustments}
            onChangeAdjustments={setAdjustments}
            onResetAdjustments={() => setAdjustments({ brightness: 0, contrast: 0, saturation: 0 })}
          />
        </div>

        {/* Center: Interactive Bead Tapestry Canvas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <PatternCanvas
            matrix={finalMatrix}
            beadPreset={activeBeadPreset}
            activeCol={activeCol}
            activeBeadIndex={activeBeadIndex}
            onSelectThread={(col) => {
              setActiveCol(col);
              setActiveBeadIndex(0);
            }}
            isolatedColorId={isolatedColorId}
            renderMode={renderMode}
          />

          {/* Bottom-to-Top Threading Assistant (Key User Requirement) */}
          <ThreadingGuide
            matrix={finalMatrix}
            activeCol={activeCol}
            onChangeActiveCol={setActiveCol}
            activeBeadIndex={activeBeadIndex}
            onChangeActiveBeadIndex={setActiveBeadIndex}
          />
        </div>

        {/* Right Sidebar: Color Breakdown & Shopping List */}
        <div>
          <ColorBreakdown
            matrix={finalMatrix}
            isolatedColorId={isolatedColorId}
            onToggleIsolateColor={(id) => setIsolatedColorId(isolatedColorId === id ? null : id)}
            activePaletteLimit={activePaletteLimit}
            onSetPaletteLimit={setActivePaletteLimit}
            consolidationConfig={consolidationConfig}
            onChangeConsolidationConfig={setConsolidationConfig}
            consolidationResult={consolidationResult}
            onOpenRemapper={() => setIsRemapperOpen(true)}
            activeOverridesCount={Object.keys(activeManualOverrides).length}
            onResetManualOverrides={() => {
              setActiveManualOverrides({});
              setPreviewManualOverrides(null);
            }}
            onOpenPaletteManager={() => setIsPaletteManagerOpen(true)}
            allowedColorsCount={effectivePalette.length}
            totalColorsCount={basePalette.length}
          />
        </div>
      </main>

      {/* App Footer: Credits & System Info */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-creators">
            <span>Created with <span style={{ color: '#EC4899' }}>❤️</span> by <strong>Ajay &amp; Moss</strong></span>
            <span className="footer-dot">•</span>
            <span>BeadPixel Art Studio</span>
            <span className="footer-dot">•</span>
            <span className="badge-craft">Pony Bead Tapestry Generator</span>
          </div>
          <div className="footer-meta">
            <span>Local DNS: <code className="footer-code">https://beadstudio.local:5173/</code> &bull; <code className="footer-code">https://aj.local:5173/</code></span>
            <span className="footer-dot">•</span>
            <span>Zero-Distortion 1.5:1 Aspect Ratio</span>
          </div>
        </div>
      </footer>

      {/* Allowed Bead Inventory & Whitelist Modal */}
      <PaletteManagerModal
        isOpen={isPaletteManagerOpen}
        onClose={() => setIsPaletteManagerOpen(false)}
        allColors={basePalette}
        enabledColorIds={enabledColorIds}
        onUpdateEnabledColorIds={setEnabledColorIds}
        currentArtColorIds={currentArtColorIds}
      />

      {/* Manual Color Remapping Modal with Live Canvas Preview */}
      <ManualColorRemapper
        isOpen={isRemapperOpen}
        onClose={() => {
          setIsRemapperOpen(false);
          setPreviewManualOverrides(null);
        }}
        activeColors={activeColorsList}
        allPalette={basePalette}
        activeOverrides={activeManualOverrides}
        onApplyOverrides={(confirmedOverrides) => {
          setActiveManualOverrides(confirmedOverrides);
          setPreviewManualOverrides(null);
        }}
        onPreviewOverrides={(draftOverrides) => {
          setPreviewManualOverrides(draftOverrides);
        }}
      />

      {/* Network / Mobile Wi-Fi Access Modal (HTTPS + Local DNS) */}
      <NetworkAccessModal
        isOpen={isNetworkModalOpen}
        onClose={() => setIsNetworkModalOpen(false)}
        dnsUrl="https://beadstudio.local:5173/"
        hostUrl="https://aj.local:5173/"
        ipUrl="https://10.0.0.22:5173/"
      />

      {/* Wall Hanging Mockup Modal */}
      <WallMockupModal
        isOpen={isWallMockupOpen}
        onClose={() => setIsWallMockupOpen(false)}
        matrix={finalMatrix}
        beadPreset={activeBeadPreset}
        columns={columns}
        rows={rows}
      />
    </div>
  );
}


