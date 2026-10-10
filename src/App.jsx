import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
import { ProfileModal } from './components/ProfileModal.jsx';
import { SimpleSetup } from './components/SimpleSetup.jsx';
import { ShoppingList } from './components/ShoppingList.jsx';
import { loadSession, storeSession, saveProject, newProjectId } from './core/profileApi.js';

import { BEAD_PRESETS } from './core/beadSpecs.js';
import { PONY_BEAD_PALETTE } from './palettes/ponyBeads.js';
import { PERLER_PALETTE } from './palettes/perler.js';
import { SAMPLE_IMAGES } from './data/sampleImages.js';
import {
  loadImage,
  analyzeDetail,
  processImageToBeads,
  processExactMatrixImage,
  scaleMatrix
} from './core/imageProcessor.js';
import { generateWordChart, calculateColorStats } from './core/threading.js';
import { consolidateMinorityColors } from './core/colorLab.js';

// Exact 1:1 mode renders one bead per source pixel; beyond this size the grid becomes unusably large
const MAX_EXACT_MATRIX_DIM = 256;
const DEFAULT_COLUMNS = 40;

const ADVANCED_MODE_KEY = 'beadpixel.advancedMode';

const paletteForPreset = (preset) => (preset.id.startsWith('perler') ? PERLER_PALETTE : PONY_BEAD_PALETTE);

// Triggers a browser download for a Blob and releases its object URL afterwards
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

// Quotes a CSV field when it contains a delimiter, quote, or newline
function csvField(value) {
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export default function App() {
  // Simple view by default; Advanced reveals every tuning tool
  const [isAdvancedMode, setIsAdvancedMode] = useState(() => localStorage.getItem(ADVANCED_MODE_KEY) === 'true');
  const handleToggleAdvancedMode = () => {
    setIsAdvancedMode((prev) => {
      localStorage.setItem(ADVANCED_MODE_KEY, String(!prev));
      return !prev;
    });
  };

  // 1. Bead Specifications (Default: 6x9mm Pony Beads from Amazon listing)
  const [activeBeadPreset, setActiveBeadPreset] = useState(BEAD_PRESETS[0]);
  const [customBeadSpecs, setCustomBeadSpecs] = useState({ widthMm: 9.0, heightMm: 6.0 });

  // 2. Sizing and Grid
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [rows, setRows] = useState(50);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);

  // 3. Image and Recommendation
  const [activeSampleId, setActiveSampleId] = useState(SAMPLE_IMAGES[0].id);
  const [currentImageSrc, setCurrentImageSrc] = useState(SAMPLE_IMAGES[0].src);
  const [loadedImage, setLoadedImage] = useState(null);
  const [imageRatio, setImageRatio] = useState(1.0);
  const [recommendation, setRecommendation] = useState(null);
  const [isExactMatrixMode, setIsExactMatrixMode] = useState(false);
  // Exact mode only: each source pixel becomes a pixelScale × pixelScale block of beads
  const [pixelScale, setPixelScale] = useState(1);

  // 4. Adjustments and Dithering
  const [ditherMode, setDitherMode] = useState('floyd-steinberg');
  const [adjustments, setAdjustments] = useState({ brightness: 0, contrast: 0, saturation: 0 });

  // 5. Active Assembly and Interactive Guides
  const [activeCol, setActiveCol] = useState(0); // thread being strung, 0 to width-1
  // Beads strung on each thread, counted from the bottom: { [col]: count }.
  // Threads are strung bottom to top, so a count fully describes a thread; it's done at count === rows.
  const [beadProgress, setBeadProgress] = useState({});
  // Bumped on every progress change the user makes; drives auto-save
  const [progressVersion, setProgressVersion] = useState(0);
  const [isolatedColorId, setIsolatedColorId] = useState(null);
  const [activePaletteLimit, setActivePaletteLimit] = useState(null);
  const [renderMode] = useState('beads');
  const [isWallMockupOpen, setIsWallMockupOpen] = useState(false);
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);

  // Active bead geometry
  const beadWidthMm = activeBeadPreset.id === 'custom' ? customBeadSpecs.widthMm : activeBeadPreset.widthMm;
  const beadHeightMm = activeBeadPreset.id === 'custom' ? customBeadSpecs.heightMm : activeBeadPreset.heightMm;
  const beadAspectRatio = beadWidthMm / beadHeightMm;

  // Active palette and User-Owned Inventory Whitelist
  const [isPaletteManagerOpen, setIsPaletteManagerOpen] = useState(false);
  const basePalette = useMemo(() => paletteForPreset(activeBeadPreset), [activeBeadPreset]);

  // Allowed / owned colors within the active bead catalog (default all enabled)
  const [enabledColorIds, setEnabledColorIds] = useState(PONY_BEAD_PALETTE.map((c) => c.id));

  // Switching bead brand resets the allowed colors to that brand's full catalog
  const handleSelectBeadPreset = (preset) => {
    const nextPalette = paletteForPreset(preset);
    if (nextPalette !== basePalette) setEnabledColorIds(nextPalette.map((c) => c.id));
    setActiveBeadPreset(preset);
  };

  // Saved-project restore: sizing to apply once the project's image finishes loading
  const pendingRestoreRef = useRef(null);
  // Forces an image reload when restoring a project that uses the already-loaded image
  const [imageLoadNonce, setImageLoadNonce] = useState(0);

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

      // Restoring a saved project: keep its exact sizing instead of auto-detecting
      const restore = pendingRestoreRef.current;
      if (restore) {
        pendingRestoreRef.current = null;
        setIsExactMatrixMode(restore.isExactMatrixMode);
        setColumns(restore.columns);
        setRows(restore.rows);
        return;
      }

      // Check if image is an exact small pixel matrix (<= 128x128) or if sample is marked as exact
      const isSmallPixelMatrix = img.naturalWidth <= 128 && img.naturalHeight <= 128;
      const matchedSample = SAMPLE_IMAGES.find((s) => s.id === activeSampleId);
      const shouldBeExact = matchedSample?.isExactMatrix || (activeSampleId === null && isSmallPixelMatrix);

      if (shouldBeExact) {
        setIsExactMatrixMode(true);
        setColumns(img.naturalWidth * pixelScale);
        setRows(img.naturalHeight * pixelScale);
      } else if (!isExactMatrixMode) {
        const calculatedRows = Math.max(15, Math.round((columns * beadAspectRatio) / ratio));
        setRows(calculatedRows);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [currentImageSrc, imageLoadNonce]);

  // Handler for toggling exact matrix mode
  const handleToggleExactMatrixMode = (enableExact) => {
    if (
      enableExact &&
      loadedImage &&
      (loadedImage.naturalWidth > MAX_EXACT_MATRIX_DIM || loadedImage.naturalHeight > MAX_EXACT_MATRIX_DIM)
    ) {
      return;
    }
    setIsExactMatrixMode(enableExact);
    resetProgress();
    if (enableExact && loadedImage) {
      setColumns(loadedImage.naturalWidth * pixelScale);
      setRows(loadedImage.naturalHeight * pixelScale);
    } else if (!enableExact && loadedImage) {
      const defaultCols = DEFAULT_COLUMNS;
      setColumns(defaultCols);
      const calculatedRows = Math.max(15, Math.round((defaultCols * beadAspectRatio) / imageRatio));
      setRows(calculatedRows);
    }
  };

  // When columns change and aspect ratio is locked, recalculate rows
  const handleColumnsChange = (newCols) => {
    if (isExactMatrixMode) return; // locked to image pixels
    if (newCols !== columns) resetProgress();
    setColumns(newCols);
    if (lockAspectRatio && imageRatio) {
      const calculatedRows = Math.max(15, Math.round((newCols * beadAspectRatio) / imageRatio));
      setRows(calculatedRows);
    }
  };

  // Small / Medium / Large for pixel-art designs: enlarge every pixel into a block of beads
  const handleChangePixelScale = (scale) => {
    if (!loadedImage || scale === pixelScale) return;
    setPixelScale(scale);
    setColumns(loadedImage.naturalWidth * scale);
    setRows(loadedImage.naturalHeight * scale);
    resetProgress();
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
      const result = scaleMatrix(
        processExactMatrixImage({ image: loadedImage, palette: effectivePalette }),
        pixelScale
      );
      setMatrix(result);
      if (activeCol >= result[0].length) setActiveCol(0);
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
      if (activeCol >= columns) setActiveCol(0);
    }
  }, [loadedImage, columns, rows, effectivePalette, ditherMode, adjustments, isExactMatrixMode, pixelScale]);

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
    if (!consolidationConfig.enabled || isExactMatrixMode) {
      return {
        baseConsolidatedMatrix: matrix,
        consolidationResult: { substitutions: [], savedBags: 0, majorityCount: 0, minorityCount: 0 }
      };
    }
    const res = consolidateMinorityColors(matrix, consolidationConfig.mode, consolidationConfig.threshold);
    return { baseConsolidatedMatrix: res.matrix, consolidationResult: res };
  }, [matrix, consolidationConfig, isExactMatrixMode]);

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
  const handleUploadCustom = (dataUri) => {
    leaveExactMatrixMode();
    startNewDesign();
    setActiveSampleId(null);
    setCurrentImageSrc(dataUri);
  };

  // Switch to sample
  const handleSelectSample = (sample) => {
    if (!sample.isExactMatrix) leaveExactMatrixMode();
    if (sample.id !== activeSampleId) startNewDesign();
    setActiveSampleId(sample.id);
    setCurrentImageSrc(sample.src);
  };

  // Reset to standard mode before loading a new image; the image loader re-enables
  // exact mode for pixel-art sources. Without this, a photo picked after the pixel
  // sample would be rendered 1:1 (hundreds of thousands of beads) with stale dimensions.
  const leaveExactMatrixMode = () => {
    if (!isExactMatrixMode) return;
    setIsExactMatrixMode(false);
    setColumns(DEFAULT_COLUMNS);
  };

  // Threading progress (bead-by-bead, bottom to top)
  const resetProgress = () => {
    setActiveCol(0);
    setBeadProgress({});
  };

  const handleSetThreadProgress = (col, count) => {
    setBeadProgress((prev) => {
      const next = { ...prev };
      if (count > 0) next[col] = count;
      else delete next[col];
      return next;
    });
    setProgressVersion((v) => v + 1);
  };

  const handleChangeActiveCol = (col) => {
    setActiveCol(col);
    setProgressVersion((v) => v + 1);
  };

  // A different picture is a different project: start with fresh progress, unlinked from any saved project
  const startNewDesign = () => {
    resetProgress();
    setCurrentProject(null);
    autoProjectIdRef.current = null;
  };

  // 8. Profiles & Saved Projects (honor system, stored on the machine running the server)
  const [session, setSession] = useState(loadSession); // null until the welcome screen is answered
  const currentProfile = session?.type === 'profile' ? session.profile : null;
  const isGuest = session?.type === 'guest';
  const [currentProject, setCurrentProject] = useState(null); // { id, name } of the open saved project
  // Id reserved for the project auto-created on first progress (reset when the design changes)
  const autoProjectIdRef = useRef(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const updateSession = useCallback((next) => {
    setSession(next);
    storeSession(next);
  }, []);

  // Stable identity: the profile modal refetches whenever this callback changes.
  // Signing out (null) returns to the welcome screen; keepOpen shows the user's saved projects.
  const handleChangeProfile = useCallback(
    (profile, { keepOpen = true } = {}) => {
      updateSession(profile ? { type: 'profile', profile } : null);
      autoProjectIdRef.current = null;
      setIsProfileModalOpen(Boolean(profile) && keepOpen);
    },
    [updateSession]
  );

  const handleContinueAsGuest = () => {
    updateSession({ type: 'guest' });
    setCurrentProject(null);
    autoProjectIdRef.current = null;
    setIsProfileModalOpen(false);
  };

  // Snapshot of everything needed to reopen the design exactly, plus threading progress
  const getProjectData = () => ({
    version: 2,
    image: { sampleId: activeSampleId, src: activeSampleId ? null : currentImageSrc },
    beadPresetId: activeBeadPreset.id,
    customBeadSpecs,
    columns,
    rows,
    lockAspectRatio,
    isExactMatrixMode,
    pixelScale,
    ditherMode,
    adjustments,
    enabledColorIds,
    consolidationConfig,
    manualOverrides: activeManualOverrides,
    threading: { activeCol, beadProgress }
  });

  // Auto-save: signed-in users' progress is saved shortly after each change. The first
  // progress on an unsaved design creates a project named after it.
  const getProjectDataRef = useRef(getProjectData);
  useEffect(() => {
    getProjectDataRef.current = getProjectData;
  });
  const [saveStatus, setSaveStatus] = useState(null); // null | 'saving' | 'saved' | 'error'

  useEffect(() => {
    if (progressVersion === 0 || !currentProfile) return;
    const timer = setTimeout(async () => {
      const target = currentProject || {
        id: (autoProjectIdRef.current ??= newProjectId()),
        name: SAMPLE_IMAGES.find((s) => s.id === activeSampleId)?.name || 'My Picture'
      };
      setSaveStatus('saving');
      try {
        const saved = await saveProject(currentProfile.id, target.id, {
          ...getProjectDataRef.current(),
          name: target.name
        });
        // Skip linking if the user moved on to another design while this was saving
        if (!currentProject && autoProjectIdRef.current === saved.id) {
          setCurrentProject({ id: saved.id, name: saved.name });
        }
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [progressVersion]);

  const handleLoadProject = (project) => {
    const sample = project.image?.sampleId && SAMPLE_IMAGES.find((s) => s.id === project.image.sampleId);
    const src = sample ? sample.src : project.image?.src || SAMPLE_IMAGES[0].src;
    pendingRestoreRef.current = {
      isExactMatrixMode: Boolean(project.isExactMatrixMode),
      columns: project.columns,
      rows: project.rows
    };
    // Drop the old image so the matrix isn't regenerated against stale dimensions mid-restore
    setLoadedImage(null);
    setActiveSampleId(sample ? sample.id : null);
    setCurrentImageSrc(src);
    setImageLoadNonce((n) => n + 1);

    const preset = BEAD_PRESETS.find((p) => p.id === project.beadPresetId) || BEAD_PRESETS[0];
    setActiveBeadPreset(preset);
    if (project.customBeadSpecs) setCustomBeadSpecs(project.customBeadSpecs);
    setIsExactMatrixMode(Boolean(project.isExactMatrixMode));
    setPixelScale(project.pixelScale || 1);
    setColumns(project.columns);
    setRows(project.rows);
    setLockAspectRatio(project.lockAspectRatio ?? true);
    setDitherMode(project.ditherMode || 'floyd-steinberg');
    setAdjustments(project.adjustments || { brightness: 0, contrast: 0, saturation: 0 });
    setEnabledColorIds(project.enabledColorIds || paletteForPreset(preset).map((c) => c.id));
    if (project.consolidationConfig) setConsolidationConfig(project.consolidationConfig);
    setActiveManualOverrides(project.manualOverrides || {});
    setPreviewManualOverrides(null);
    setIsolatedColorId(null);

    const threading = project.threading || {};
    let progress = threading.beadProgress;
    if (!progress) {
      // Projects saved before bead-by-bead tracking stored done threads + the current bead
      progress = {};
      (threading.completedThreads || []).forEach((col) => {
        progress[col] = project.rows;
      });
      const col = threading.activeCol ?? 0;
      if (threading.activeBeadIndex > 0 && !(col in progress)) progress[col] = threading.activeBeadIndex;
    }
    setActiveCol(threading.activeCol ?? 0);
    setBeadProgress(progress);
    setSaveStatus(null);
  };

  // Export 1: High-Res PNG
  const handleExportPng = () => {
    if (!finalMatrix) return;
    const rows = finalMatrix.length;
    const columns = finalMatrix[0].length;
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
    downloadBlob(blob, `bead-word-chart-${finalMatrix[0].length}x${finalMatrix.length}.txt`);
  };

  // Export 3: CSV Matrix
  const handleExportCsv = () => {
    if (!finalMatrix) return;
    const rows = finalMatrix.length;
    const columns = finalMatrix[0].length;
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

    const csvContent = csvRows.map((r) => r.map(csvField).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, `bead-matrix-${columns}x${rows}.csv`);
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
        onOpenProfile={() => setIsProfileModalOpen(true)}
        currentProfileName={currentProfile?.name}
        isGuest={isGuest}
        currentProjectName={currentProject?.name}
        isAdvancedMode={isAdvancedMode}
        onToggleAdvancedMode={handleToggleAdvancedMode}
        allowedColorsCount={effectivePalette.length}
        totalColorsCount={basePalette.length}
      />

      <main className="main-workspace">
        {/* Left Sidebar: Controls & Sizing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {isAdvancedMode ? (
            <>
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
                maxExactMatrixDim={MAX_EXACT_MATRIX_DIM}
              />

              <WallCalculator
                activeBeadPreset={activeBeadPreset}
                onSelectBeadPreset={handleSelectBeadPreset}
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
            </>
          ) : (
            <SimpleSetup
              activeSampleId={activeSampleId}
              onSelectSample={handleSelectSample}
              onUploadCustom={handleUploadCustom}
              isExactMatrixMode={isExactMatrixMode}
              columns={columns}
              rows={rows}
              onChangeColumns={handleColumnsChange}
              pixelScale={pixelScale}
              onChangePixelScale={handleChangePixelScale}
              beadWidthMm={beadWidthMm}
              beadHeightMm={beadHeightMm}
            />
          )}
        </div>

        {/* Center: Interactive Bead Tapestry Canvas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <PatternCanvas
            matrix={finalMatrix}
            beadPreset={activeBeadPreset}
            activeCol={activeCol}
            beadProgress={beadProgress}
            onSelectThread={handleChangeActiveCol}
            onSetThreadProgress={handleSetThreadProgress}
            isolatedColorId={isolatedColorId}
            renderMode={renderMode}
          />

          {/* Bottom-to-Top Threading Assistant (Key User Requirement) */}
          <ThreadingGuide
            matrix={finalMatrix}
            activeCol={activeCol}
            onChangeActiveCol={handleChangeActiveCol}
            beadProgress={beadProgress}
            onSetThreadProgress={handleSetThreadProgress}
            isSignedIn={Boolean(currentProfile)}
            saveStatus={saveStatus}
          />
        </div>

        {/* Right Sidebar: Color Breakdown & Shopping List */}
        <div className="right-sidebar">
          {isAdvancedMode ? (
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
          ) : (
            <ShoppingList
              matrix={finalMatrix}
              isolatedColorId={isolatedColorId}
              onToggleIsolateColor={(id) => setIsolatedColorId(isolatedColorId === id ? null : id)}
            />
          )}
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
        ipUrl={`https://${__LAN_IP__}:5173/`}
      />

      {/* Profiles & Saved Projects */}
      {(isProfileModalOpen || !session) && (
        <ProfileModal
          isWelcome={!session}
          onContinueAsGuest={handleContinueAsGuest}
          onClose={() => setIsProfileModalOpen(false)}
          currentProfile={currentProfile}
          onChangeProfile={handleChangeProfile}
          currentProject={currentProject}
          onChangeCurrentProject={setCurrentProject}
          getProjectData={getProjectData}
          onLoadProject={handleLoadProject}
        />
      )}

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


