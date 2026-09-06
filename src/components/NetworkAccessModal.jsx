import React, { useState } from 'react';
import { Wifi, X, Copy, Check, Lock, Globe, ShieldCheck, Heart, Share2, Mail } from 'lucide-react';

export function NetworkAccessModal({
  isOpen,
  onClose,
  dnsUrl = 'https://beadstudio.local:5173/',
  hostUrl = 'https://aj.local:5173/',
  ipUrl = 'https://10.0.0.22:5173/'
}) {
  const [activeUrlType, setActiveUrlType] = useState('dns'); // 'dns' | 'host' | 'ip'
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentUrl =
    activeUrlType === 'dns'
      ? dnsUrl
      : activeUrlType === 'host'
      ? hostUrl
      : ipUrl;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    currentUrl
  )}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '540px', textAlign: 'center' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-header" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Wifi size={18} color="#10B981" />
            </div>
            <div style={{ textAlign: 'left' }}>
              <h2 className="panel-title" style={{ fontSize: '1.05rem', margin: 0 }}>Wi-Fi &amp; Mobile Access</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.68rem',
                  color: '#10B981',
                  background: 'rgba(16, 185, 129, 0.12)',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '9999px',
                  fontWeight: 600
                }}>
                  <Lock size={10} /> HTTPS Active
                </span>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.68rem',
                  color: '#60A5FA',
                  background: 'rgba(59, 130, 246, 0.12)',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '9999px',
                  fontWeight: 600
                }}>
                  <Globe size={10} /> Local mDNS Active
                </span>
              </div>
            </div>
          </div>
          <button className="btn btn-sm" onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        <p style={{ fontSize: '0.82rem', color: '#94A3B8', marginTop: '0.5rem', marginBottom: '0.75rem' }}>
          No more typing cryptic IP addresses! Connect your phone or tablet on this Wi-Fi using the friendly local domain or scan the QR code.
        </p>

        {/* Address Selection Pills */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.35rem',
          background: 'rgba(15, 23, 42, 0.6)',
          padding: '0.25rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '0.75rem'
        }}>
          <button
            type="button"
            className={`btn btn-sm ${activeUrlType === 'dns' ? 'btn-primary' : ''}`}
            onClick={() => setActiveUrlType('dns')}
            style={{ fontSize: '0.74rem', padding: '0.4rem 0.3rem', justifyContent: 'center' }}
          >
            beadstudio.local
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeUrlType === 'host' ? 'btn-primary' : ''}`}
            onClick={() => setActiveUrlType('host')}
            style={{ fontSize: '0.74rem', padding: '0.4rem 0.3rem', justifyContent: 'center' }}
          >
            aj.local
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeUrlType === 'ip' ? 'btn-primary' : ''}`}
            onClick={() => setActiveUrlType('ip')}
            style={{ fontSize: '0.74rem', padding: '0.4rem 0.3rem', justifyContent: 'center' }}
          >
            10.0.0.22 (IP)
          </button>
        </div>

        {/* QR Code Card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'white',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            margin: '0 auto 0.75rem',
            width: 'fit-content',
            boxShadow: '0 12px 28px rgba(0,0,0,0.5)'
          }}
        >
          <img
            src={qrImageUrl}
            alt="Scan QR Code to open BeadPixel Art on your device"
            style={{ width: '190px', height: '190px', display: 'block' }}
          />
          <span style={{ color: '#1E293B', fontSize: '0.74rem', fontWeight: 700, marginTop: '0.45rem' }}>
            Point Camera to Open {activeUrlType === 'dns' ? 'beadstudio.local' : activeUrlType === 'host' ? 'aj.local' : 'IP'}
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
            padding: '0.55rem 0.8rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.86rem',
            color: '#A7F3D0',
            marginBottom: '0.75rem'
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '0.5rem' }}>
            {currentUrl}
          </span>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => handleCopy(currentUrl)}
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.74rem', flexShrink: 0 }}
          >
            {copied ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Quick Send Options for Clickable Links */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.45rem', marginBottom: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'BeadPixel Art Studio',
                  text: 'Open BeadPixel Art Studio on this Wi-Fi:\n',
                  url: currentUrl
                }).catch(() => {});
              } else {
                handleCopy(currentUrl);
              }
            }}
            title="Open Windows Share or Copy"
            style={{ justifyContent: 'center', fontSize: '0.75rem' }}
          >
            <Share2 size={13} color="#60A5FA" />
            <span>Share Link</span>
          </button>

          <a
            href={`mailto:?subject=${encodeURIComponent('BeadPixel Art Studio Link')}&body=${encodeURIComponent('Open BeadPixel Art Studio on this Wi-Fi:\n\n' + currentUrl + '\n\n(Tip: If asked, tap Advanced -> Proceed to open the local HTTPS certificate)')}`}
            className="btn btn-sm"
            style={{ justifyContent: 'center', fontSize: '0.75rem', textDecoration: 'none' }}
            title="Send an email to yourself to open on your phone"
          >
            <Mail size={13} color="#F59E0B" />
            <span>Email to Phone</span>
          </a>
        </div>

        {/* HTTPS Notice */}
        <div style={{
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '0.6rem 0.75rem',
          fontSize: '0.72rem',
          color: '#93C5FD',
          textAlign: 'left',
          lineHeight: '1.45',
          marginBottom: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: '#BFDBFE', marginBottom: '0.2rem' }}>
            <ShieldCheck size={14} color="#60A5FA" />
            <span>HTTPS Security Note for Mobile Browsers</span>
          </div>
          Because this is a local development SSL certificate, Safari/Chrome on your phone will display an initial security note. Simply tap <strong>Advanced &rarr; Proceed / Accept</strong> once to view the app.
        </div>

        {/* Creator Attribution */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.35rem',
          fontSize: '0.72rem',
          color: '#94A3B8',
          marginBottom: '0.75rem'
        }}>
          <span>Created with</span>
          <Heart size={12} fill="#EC4899" color="#EC4899" />
          <span>by <strong style={{ color: '#F8FAFC' }}>Ajay &amp; Moss</strong></span>
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
