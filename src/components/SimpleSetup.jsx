import React, { useRef } from 'react';
import { Image as ImageIcon, UploadCloud, Ruler, Sparkles } from 'lucide-react';
import { SAMPLE_IMAGES } from '../data/sampleImages.js';
import { calculatePhysicalSpecs } from '../core/beadSpecs.js';

// Pictures size by thread count; pixel designs by enlarging each pixel into a block of beads
const SIZE_OPTIONS = [
  { label: 'Mini', columns: 20, pixelScale: 1 },
  { label: 'Small', columns: 30, pixelScale: 2 },
  { label: 'Medium', columns: 45, pixelScale: 3 },
  { label: 'Large', columns: 65, pixelScale: 4 },
  { label: 'Extra Large', columns: 90, pixelScale: 5 }
];

const CATEGORY_LABELS = { Everyday: 'Everyday', Halloween: '🎃 Halloween Specials' };

// Beginner-friendly left column: pick a design, pick a size, see the finished size
export function SimpleSetup({
  activeSampleId,
  onSelectSample,
  onUploadCustom,
  onOpenMyBeads,
  isExactMatrixMode,
  columns,
  rows,
  onChangeColumns,
  pixelScale,
  onChangePixelScale,
  beadWidthMm,
  beadHeightMm
}) {
  const fileInputRef = useRef(null);
  const simpleSamples = SAMPLE_IMAGES.filter((s) => s.isSimple);
  const activeSample = simpleSamples.find((s) => s.id === activeSampleId);
  const categories = [...new Set(simpleSamples.map((s) => s.category))];
  const specs = calculatePhysicalSpecs(columns, rows, beadWidthMm, beadHeightMm);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => onUploadCustom(event.target.result, file.name);
    reader.readAsDataURL(file);
    e.target.value = ''; // allow re-selecting the same file
  };

  return (
    <>
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">
            <ImageIcon size={18} />
            <span>1. Pick a Design</span>
          </h2>
        </div>

        {categories.map((category) => (
          <div key={category}>
            <span className="control-label">{CATEGORY_LABELS[category] || category}</span>
            <div className="sample-grid">
              {simpleSamples
                .filter((s) => s.category === category)
                .map((sample) => (
                  <div
                    key={sample.id}
                    className={`sample-card ${activeSampleId === sample.id ? 'active' : ''}`}
                    onClick={() => onSelectSample(sample)}
                    title={`${sample.name} • ${sample.description}`}
                  >
                    <img src={sample.thumbSrc || sample.src} alt={sample.name} className="pixel-thumb" />
                  </div>
                ))}
            </div>
          </div>
        ))}
        <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
          {activeSample ? activeSample.name : 'Your picture'} • {columns} × {rows} beads
        </span>

        <button type="button" className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={onOpenMyBeads}>
          <Sparkles size={15} />
          <span>What Can I Make With My Beads?</span>
        </button>
        <button type="button" className="btn" style={{ justifyContent: 'center' }} onClick={() => fileInputRef.current?.click()}>
          <UploadCloud size={15} />
          <span>Use My Own Picture</span>
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">
            <Ruler size={18} />
            <span>2. Size</span>
          </h2>
        </div>

        <div className="size-options">
          {SIZE_OPTIONS.map((opt) => {
            const isActive = isExactMatrixMode ? pixelScale === opt.pixelScale : columns === opt.columns;
            const optionColumns = isExactMatrixMode ? (columns / pixelScale) * opt.pixelScale : opt.columns;
            const widthInches = Math.round((optionColumns * beadWidthMm) / 25.4);
            return (
              <button
                key={opt.label}
                type="button"
                className={`btn btn-sm size-option ${isActive ? 'btn-primary' : ''}`}
                onClick={() =>
                  isExactMatrixMode ? onChangePixelScale(opt.pixelScale) : onChangeColumns(opt.columns)
                }
              >
                <span>{opt.label}</span>
                <span className="size-option-sub">≈ {widthInches}″ wide</span>
              </button>
            );
          })}
        </div>
        <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
          Changing the size starts the threading progress over.
        </span>

        <div className="stats-grid">
          <div className="stat-box">
            <span className="stat-label">Finished Size</span>
            <span className="stat-value">{specs.widthInches}″ × {specs.heightInches}″</span>
            <span className="stat-sub">{specs.widthCm} × {specs.heightCm} cm</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Beads</span>
            <span className="stat-value">{specs.totalBeads.toLocaleString()}</span>
            <span className="stat-sub">{columns} threads × {rows} beads</span>
          </div>
        </div>
      </div>
    </>
  );
}
