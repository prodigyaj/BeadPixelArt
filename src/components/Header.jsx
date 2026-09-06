import React from 'react';
import { Sparkles, Download, FileText, Image as ImageIcon, Eye, Layers, Palette, Wifi } from 'lucide-react';

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
          <h1 className="brand-title">BeadPixel Art Studio</h1>
          <div className="brand-subtitle">
            <span>Thread Tapestry & Wall Hanging Engine</span>
            <span className="badge-default">
              <Sparkles size={11} />
              Default: {activeBeadPreset.widthMm}×{activeBeadPreset.heightMm}mm Pony Beads
            </span>
          </div>
        </div>
      </div>

      <div className="header-actions">
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

        <button
          className="btn"
          onClick={onExportWordChart}
          title="Download printable column-by-column Word Chart (Bottom to Top)"
        >
          <FileText size={15} />
          <span>Word Chart Guide</span>
        </button>

        <button
          className="btn"
          onClick={onExportCsv}
          title="Download Matrix CSV data"
        >
          <FileText size={15} />
          <span>CSV Matrix</span>
        </button>

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
