import React, { useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, Grid, Wand2 } from 'lucide-react';
import { SAMPLE_IMAGES } from '../data/sampleImages.js';

export function ImageUpload({
  activeSampleId,
  onSelectSample,
  onUploadCustom,
  isExactMatrixMode,
  onToggleExactMatrixMode,
  imageDimensions
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      onUploadCustom(event.target.result, file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      onUploadCustom(event.target.result, file.name);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">
          <UploadCloud size={18} />
          <span>Source Artwork</span>
        </h2>
      </div>

      {/* Mode Selector: Standard vs Exact Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
        <button
          type="button"
          className={`btn btn-sm ${!isExactMatrixMode ? 'btn-primary' : ''}`}
          style={{ justifyContent: 'center', fontSize: '0.74rem' }}
          onClick={() => onToggleExactMatrixMode(false)}
        >
          <Wand2 size={13} />
          <span>Standard Art</span>
        </button>

        <button
          type="button"
          className={`btn btn-sm ${isExactMatrixMode ? 'btn-primary' : ''}`}
          style={{ justifyContent: 'center', fontSize: '0.74rem' }}
          onClick={() => onToggleExactMatrixMode(true)}
        >
          <Grid size={13} />
          <span>Exact 1:1 Matrix</span>
        </button>
      </div>

      {/* Exact Matrix Mode Banner */}
      {isExactMatrixMode && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: 'var(--radius-md)',
            padding: '0.65rem 0.8rem',
            fontSize: '0.74rem',
            color: '#A7F3D0',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
            <Grid size={14} color="#10B981" />
            <span>Exact Matrix Mode Active</span>
          </div>
          <p style={{ color: '#CBD5E1', fontSize: '0.7rem', lineHeight: '1.35' }}>
            Each pixel in the picture is mapped directly as <strong>1 bead</strong> ({imageDimensions.width}×{imageDimensions.height}). No downsampling, no blur, zero distortion.
          </p>
        </div>
      )}

      {/* Drag & Drop Area */}
      <div
        className="dropzone"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <UploadCloud className="dropzone-icon" />
        <div>
          <strong style={{ fontSize: '0.9rem', color: '#F8FAFC' }}>
            {isExactMatrixMode ? 'Drop your exact pixel matrix here' : 'Drop your image here'}
          </strong>
          <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
            Supports PNG, JPG, WebP, SVG, BMP
          </p>
        </div>
        <button
          type="button"
          className="btn btn-sm"
          style={{ marginTop: '0.25rem' }}
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          Browse Device
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      {/* Built-in Sample Gallery */}
      <div>
        <div className="control-label" style={{ marginBottom: '0.35rem' }}>
          <span>Or Choose a Sample Art:</span>
        </div>
        <div className="sample-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {SAMPLE_IMAGES.map((sample) => (
            <div
              key={sample.id}
              className={`sample-card ${activeSampleId === sample.id ? 'active' : ''}`}
              onClick={() => onSelectSample(sample)}
              title={`${sample.name} - ${sample.description}`}
            >
              <img src={sample.src} alt={sample.name} />
              {sample.isExactMatrix && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: '2px',
                    left: '2px',
                    right: '2px',
                    background: 'rgba(16, 185, 129, 0.85)',
                    color: 'white',
                    fontSize: '0.58rem',
                    textAlign: 'center',
                    borderRadius: '2px',
                    fontWeight: 700
                  }}
                >
                  1:1 Matrix
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
