import React from 'react';
import { Download, FileText, Eye, Layers, Palette, Wifi, Heart, User, SlidersHorizontal } from 'lucide-react';

export function Header({
  activeBeadPreset,
  columns,
  rows,
  totalBeads,
  onExportPng,
  onExportWordChart,
  onExportCsv,
  onOpenWallMockup,
  onOpenPaletteManager,
  onOpenNetworkAccess,
  onOpenProfile,
  currentProfileName,
  isGuest,
  isAdvancedMode,
  onToggleAdvancedMode,
  currentProjectName,
  allowedColorsCount,
  totalColorsCount
}) {
  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-logo">
          <Layers size={24} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <h1 className="brand-title">BeadPixel Art Studio</h1>
            <span className="creator-badge" title="Created by Ajay and Moss">
              <Heart size={11} fill="#EC4899" color="#EC4899" />
              <span>Created by Ajay &amp; Moss</span>
            </span>
          </div>
          <div className="brand-subtitle">
            <span>Thread Tapestry &amp; Wall Hanging Engine</span>
          </div>
        </div>
      </div>

      <div className="header-actions">
        <button
          className={`btn ${currentProfileName ? '' : 'btn-primary'}`}
          onClick={onOpenProfile}
          title={currentProfileName ? 'Save or open your projects' : 'Sign in or create a profile to save your projects'}
        >
          <User size={15} />
          <span>
            {currentProfileName
              ? currentProjectName
                ? `${currentProfileName} • ${currentProjectName}`
                : currentProfileName
              : isGuest
                ? 'Guest • Sign In'
                : 'Sign In'}
          </span>
        </button>

        <button
          className={`btn ${isAdvancedMode ? 'btn-primary' : ''}`}
          onClick={onToggleAdvancedMode}
          title={isAdvancedMode ? 'Back to the simple view' : 'Show all tuning tools (dithering, color optimizer, inventory, sharing)'}
        >
          <SlidersHorizontal size={15} />
          <span>{isAdvancedMode ? 'Simple View' : 'Advanced'}</span>
        </button>

        {isAdvancedMode && (
          <>
            <button
              className="btn"
              onClick={onOpenNetworkAccess}
              title="Open on phone or tablet via Wi-Fi"
            >
              <Wifi size={15} color="#10B981" />
              <span>Wi-Fi Access</span>
            </button>

            <button
              className={`btn ${allowedColorsCount < totalColorsCount ? 'btn-primary' : ''}`}
              onClick={onOpenPaletteManager}
              title="Configure which bead colors you own or want to use"
            >
              <Palette size={15} />
              <span>My Inventory ({allowedColorsCount}/{totalColorsCount})</span>
            </button>

            <button
              className="btn"
              onClick={onOpenWallMockup}
              title="Preview hanging on a living room wall"
            >
              <Eye size={15} />
              <span>Wall Preview</span>
            </button>
          </>
        )}

        <button
          className="btn"
          onClick={onExportWordChart}
          title="Download printable column-by-column Word Chart (Bottom to Top)"
        >
          <FileText size={15} />
          <span>Word Chart Guide</span>
        </button>

        {isAdvancedMode && (
          <button
            className="btn"
            onClick={onExportCsv}
            title="Download Matrix CSV data"
          >
            <FileText size={15} />
            <span>CSV Matrix</span>
          </button>
        )}

        <button
          className="btn btn-primary"
          onClick={onExportPng}
          title="Download high-resolution bead pattern PNG"
        >
          <Download size={15} />
          <span>Export Pattern</span>
        </button>
      </div>
    </header>
  );
}
