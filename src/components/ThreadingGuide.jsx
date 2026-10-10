import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronUp } from 'lucide-react';
import { getColumnRunLength } from '../core/threading.js';
import confetti from 'canvas-confetti';

export function ThreadingGuide({
  matrix,
  activeCol,
  onChangeActiveCol,
  activeBeadIndex,
  onChangeActiveBeadIndex
}) {
  const [completedThreads, setCompletedThreads] = useState(new Set());

  const height = matrix?.length || 0;
  const width = matrix?.[0]?.length || 0;

  const currentGroups = useMemo(
    () => (matrix ? getColumnRunLength(matrix, activeCol) : []),
    [matrix, activeCol]
  );

  // Toggle thread completed
  const toggleCompleted = (col) => {
    const next = new Set(completedThreads);
    if (next.has(col)) {
      next.delete(col);
    } else {
      next.add(col);
      // If all threads completed, fire celebratory confetti!
      if (next.size === width) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
    }
    setCompletedThreads(next);
  };

  const handleNextThread = () => {
    if (activeCol < width - 1) {
      onChangeActiveCol(activeCol + 1);
      onChangeActiveBeadIndex(0); // reset to bottom bead of new thread
    }
  };

  const handlePrevThread = () => {
    if (activeCol > 0) {
      onChangeActiveCol(activeCol - 1);
      onChangeActiveBeadIndex(0);
    }
  };

  const handleStepUp = () => {
    if (activeBeadIndex === null || activeBeadIndex < height - 1) {
      onChangeActiveBeadIndex((activeBeadIndex ?? -1) + 1);
    } else {
      // Completed thread!
      toggleCompleted(activeCol);
      handleNextThread();
    }
  };

  // Keyboard navigation for hands-free beading: Space = Step Up, Arrows = Next/Prev thread
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in an input
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleStepUp();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNextThread();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrevThread();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const isCurrentThreadDone = completedThreads.has(activeCol);

  // Active bead number (1 to height, where 1 is bottom)
  const currentBeadNumber = activeBeadIndex !== null ? activeBeadIndex + 1 : 1;

  return (
    <div className="panel threading-stepper">
      <div className="panel-header">
        <h2 className="panel-title">
          <ChevronUp size={18} />
          <span>Column Threading Assistant</span>
        </h2>
        <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>
          {completedThreads.size} / {width} Threads Done
        </span>
      </div>

      {/* Thread Navigation Header */}
      <div className="thread-nav">
        <button
          className="btn btn-sm"
          onClick={handlePrevThread}
          disabled={activeCol === 0}
          title="Previous thread"
        >
          <ArrowLeft size={14} />
        </button>

        <div className="thread-title">
          <span className="thread-num">
            Thread #{activeCol + 1} of {width}
          </span>
          <span className="thread-direction">
            Push Beads: BOTTOM → TOP ({height} beads)
          </span>
        </div>

        <button
          className="btn btn-sm"
          onClick={handleNextThread}
          disabled={activeCol === width - 1}
          title="Next thread"
        >
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Action Bar */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          className={`btn btn-sm ${isCurrentThreadDone ? 'btn-success' : 'btn-primary'}`}
          style={{ flex: 1 }}
          onClick={() => toggleCompleted(activeCol)}
        >
          <CheckCircle2 size={14} />
          <span>{isCurrentThreadDone ? 'Thread Completed' : 'Mark Thread Done'}</span>
        </button>

        <button
          className="btn btn-sm"
          onClick={handleStepUp}
          title="Push next bead upwards (or press Spacebar)"
        >
          <ChevronUp size={14} />
          <span>Next Bead (Space)</span>
        </button>
      </div>

      {/* Run-Length Group Cards (Ordered strictly Bottom to Top) */}
      <div className="control-label">
        <span>Thread #{activeCol + 1} Stringing Sequence (Bottom to Top):</span>
      </div>

      <div className="step-card-list">
        {currentGroups.map((grp, idx) => {
          const isGroupActive =
            activeBeadIndex !== null &&
            currentBeadNumber >= grp.startBead &&
            currentBeadNumber <= grp.endBead;

          return (
            <div
              key={idx}
              className={`step-card ${isGroupActive ? 'active' : ''}`}
              onClick={() => onChangeActiveBeadIndex(grp.startBead - 1)}
              style={{ cursor: 'pointer' }}
            >
              <div className="step-card-left">
                <span
                  className="color-swatch-sm"
                  style={{ backgroundColor: grp.color.hex }}
                />
                <div>
                  <div style={{ fontWeight: 600, color: '#F8FAFC' }}>
                    <span className="step-count">{grp.count}×</span> {grp.color.name}
                  </div>
                  <div className="step-range">
                    Beads {grp.startBead}–{grp.endBead} (from bottom)
                  </div>
                </div>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#94A3B8' }}>
                {grp.color.id}
              </span>
            </div>
          );
        })}
      </div>

      {/* Helpful Hint */}
      <div style={{ fontSize: '0.72rem', color: '#64748B', lineHeight: '1.4' }}>
        💡 <strong>Tip:</strong> Press <kbd style={{ background: '#1E293B', padding: '1px 4px', borderRadius: '3px' }}>Space</kbd> to step to the next bead, or <kbd style={{ background: '#1E293B', padding: '1px 4px', borderRadius: '3px' }}>← / →</kbd> to switch threads hands-free while beading!
      </div>
    </div>
  );
}
