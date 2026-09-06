import React, { useState } from 'react';
import { Wifi, X, Copy, Check, Smartphone, Tablet, ExternalLink } from 'lucide-react';

export function NetworkAccessModal({ isOpen, onClose, networkUrl = 'http://10.0.0.22:5173/' }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(networkUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    networkUrl
  )}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '500px', textAlign: 'center' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-header" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wifi size={20} color="#10B981" />
            <h2 className="panel-title">Open on Phones & Tablets</h2>
          </div>
          <button className="btn btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <p style={{ fontSize: '0.82rem', color: '#94A3B8', marginTop: '0.25rem' }}>
          Your server is live on your local Wi-Fi network. Any device connected to this Wi-Fi can open the app!
        </p>

        {/* QR Code */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'white',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            margin: '0.5rem auto',
            width: 'fit-content',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
          }}
        >
          <img
            src={qrImageUrl}
            alt="Scan QR Code to open BeadPixel Art on your device"
            style={{ width: '200px', height: '200px', display: 'block' }}
          />
          <span style={{ color: '#1E293B', fontSize: '0.75rem', fontWeight: 600, marginTop: '0.5rem' }}>
            Scan with your Phone Camera
          </span>
        </div>

        {/* Direct Link Box */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.6rem 0.85rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.9rem',
            color: '#A7F3D0'
          }}
        >
          <span>{networkUrl}</span>
          <button
            type="button"
            className="btn btn-sm"
            onClick={handleCopy}
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
          >
            {copied ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <div style={{ fontSize: '0.72rem', color: '#64748B', lineHeight: '1.4' }}>
          💡 Perfect for having the <strong>Bottom-to-Top Threading Guide</strong> open on an iPad or phone next to your beading board while you thread!
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={onClose} style={{ width: '100%', justifyContent: 'center' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
