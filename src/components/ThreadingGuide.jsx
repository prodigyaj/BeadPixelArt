import React, { useEffect, useMemo } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronUp, Undo2, Check, Cloud, CloudOff } from 'lucide-react';
import { getColumnRunLength, rowForBead, STRINGING_LABELS } from '../core/threading.js';
import confetti from 'canvas-confetti';

export function ThreadingGuide({
  matrix,
  activeCol,
  onChangeActiveCol,
  beadProgress, // { [col]: beads strung so far, in stringing order }; a thread is done when it equals the height
  onSetThreadProgress, // (col, count) => void
  stringingDirection, // 'top-down' | 'bottom-up'
  onChangeStringingDirection,
  isSignedIn,
  saveStatus // null | 'saving' | 'saved' | 'error'
}) {
  const height = matrix?.length || 0;
  const width = matrix?.[0]?.length || 0;

  const currentGroups = useMemo(
    () => (matrix ? getColumnRunLength(matrix, activeCol, stringingDirection) : []),
    [matrix, activeCol, stringingDirection]
  );

  const strungOf = (col) => Math.min(beadProgress[col] || 0, height);
  const isThreadDone = (col) => height > 0 && strungOf(col) >= height;

  let completedCount = 0;
  let totalStrung = 0;
  for (let col = 0; col < width; col++) {
    const strung = strungOf(col);
    totalStrung += strung;
    if (strung >= height) completedCount++;
  }
  const totalBeads = width * height;
  const percentDone = totalBeads ? Math.round((totalStrung / totalBeads) * 100) : 0;

  const strung = strungOf(activeCol);
  const isCurrentThreadDone = isThreadDone(activeCol);
  const labels = STRINGING_LABELS[stringingDirection];
  const nextBeadNumber = strung + 1; // 1 = first bead strung (top or bottom depending on direction)
  const nextBeadColor = !isCurrentThreadDone
    ? matrix?.[rowForBead(nextBeadNumber, height, stringingDirection)]?.[activeCol]
    : null;

  // Next thread (to the right, wrapping around) that still has beads left to string
  const findNextUnfinished = () => {
    for (let step = 1; step < width; step++) {
      const col = (activeCol + step) % width;
      if (!isThreadDone(col)) return col;
    }
    return null;
  };

  const setProgress = (count) => {
    const clamped = Math.max(0, Math.min(height, count));
    onSetThreadProgress(activeCol, clamped);
    if (clamped === height && !isCurrentThreadDone) {
      if (completedCount + 1 === width) {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      } else {
        const next = findNextUnfinished();
        if (next !== null) onChangeActiveCol(next);
      }
    }
  };

  const handleStringBead = () => {
    if (!isCurrentThreadDone) setProgress(strung + 1);
  };

  const handleUndoBead = () => {
    if (strung > 0) onSetThreadProgress(activeCol, strung - 1);
  };

  const handleToggleThreadDone = () => {
    if (isCurrentThreadDone) {
      onSetThreadProgress(activeCol, 0);
    } else {
      setProgress(height);
    }
  };

  // Tapping a color group strings every bead through the end of that group,
  // or, if the group is already strung, takes the beads back off down to its start
  const handleGroupClick = (grp) => {
    if (strung >= grp.endBead) {
      onSetThreadProgress(activeCol, grp.startBead - 1);
    } else {
      setProgress(grp.endBead);
    }
  };

  const handleNextThread = () => {
    if (activeCol < width - 1) onChangeActiveCol(activeCol + 1);
  };

  const handlePrevThread = () => {
    if (activeCol > 0) onChangeActiveCol(activeCol - 1);
  };

  // Keyboard for hands-free beading: Space = bead done, Backspace = undo, Arrows = switch thread
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in an input
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleStringBead();
      } else if (e.code === 'Backspace') {
        e.preventDefault();
        handleUndoBead();
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

  return (
    <div className="panel threading-stepper">
      <div className="panel-header">
        <h2 className="panel-title">
          <ChevronUp size={18} />
          <span>Threading Progress</span>
        </h2>
        <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>
          {percentDone}% done
        </span>
      </div>

      {/* Overall progress */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${percentDone}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94A3B8' }}>
          <span>
            {totalStrung.toLocaleString()} of {totalBeads.toLocaleString()} beads • {completedCount} / {width} threads done
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            {!isSignedIn ? (
              <>
                <CloudOff size={12} /> Sign in to save progress
              </>
            ) : saveStatus === 'saving' ? (
              <>
                <Cloud size={12} /> Saving…
              </>
            ) : saveStatus === 'error' ? (
              <span style={{ color: '#FCA5A5' }}>Couldn't save progress</span>
            ) : saveStatus === 'saved' ? (
              <>
                <Check size={12} color="#10B981" /> Progress saved
              </>
            ) : null}
          </span>
        </div>
      </div>

      {/* Which end of the thread fills first */}
      <div className="direction-picker" role="radiogroup" aria-label="Stringing direction">
        <span className="control-label" style={{ margin: 0 }}>Beads go on from the:</span>
        <button
          type="button"
          role="radio"
          aria-checked={stringingDirection === 'top-down'}
          className={`btn btn-sm ${stringingDirection === 'top-down' ? 'btn-primary' : ''}`}
          onClick={() => onChangeStringingDirection('top-down')}
          title="Thread tied to the dowel first; each bead is pushed up under the last one"
        >
          Top down (tied to dowel)
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={stringingDirection === 'bottom-up'}
          className={`btn btn-sm ${stringingDirection === 'bottom-up' ? 'btn-primary' : ''}`}
          onClick={() => onChangeStringingDirection('bottom-up')}
          title="Knot or stopper bead at the bottom first; beads drop down onto it"
        >
          Bottom up (knot first)
        </button>
      </div>

      {/* Thread Navigation Header */}
      <div className="thread-nav">
        <button
          className="btn btn-sm"
          onClick={handlePrevThread}
          disabled={activeCol === 0}
          title="Previous thread (←)"
        >
          <ArrowLeft size={14} />
        </button>

        <div className="thread-title">
          <span className="thread-num">
            Thread #{activeCol + 1} of {width} {isCurrentThreadDone && '✓'}
          </span>
          <span className="thread-direction">
            {isCurrentThreadDone
              ? `All ${height} beads strung`
              : `${strung} of ${height} beads strung • ${labels.start} → ${labels.end}`}
          </span>
        </div>

        <button
          className="btn btn-sm"
          onClick={handleNextThread}
          disabled={activeCol === width - 1}
          title="Next thread (→)"
        >
          <ArrowRight size={14} />
        </button>
      </div>

      {/* What to string next */}
      {nextBeadColor ? (
        <div className="next-bead-callout">
          <span className="color-swatch-sm" style={{ backgroundColor: nextBeadColor.hex, width: '28px', height: '28px' }} />
          <div>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Next: bead #{nextBeadNumber} from the {labels.start}</div>
            <div style={{ fontWeight: 600, color: '#F8FAFC' }}>{nextBeadColor.name}</div>
          </div>
        </div>
      ) : (
        <div className="next-bead-callout done">
          <CheckCircle2 size={22} color="#10B981" />
          <span style={{ fontWeight: 600 }}>
            {completedCount === width ? 'All threads done, great work!' : 'This thread is done'}
          </span>
        </div>
      )}

      {/* Action Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.5rem' }}>
        <button
          className="btn btn-primary"
          style={{ justifyContent: 'center' }}
          onClick={handleStringBead}
          disabled={isCurrentThreadDone}
          title="Mark the next bead as strung (Space)"
        >
          <Check size={15} />
          <span>Bead Done</span>
        </button>
        <button
          className="btn btn-sm"
          style={{ justifyContent: 'center' }}
          onClick={handleUndoBead}
          disabled={strung === 0}
          title="Take the last bead back off (Backspace)"
        >
          <Undo2 size={14} />
          <span>Undo</span>
        </button>
        <button
          className={`btn btn-sm ${isCurrentThreadDone ? 'btn-success' : ''}`}
          style={{ justifyContent: 'center' }}
          onClick={handleToggleThreadDone}
          title={isCurrentThreadDone ? 'Mark this whole thread as not done' : 'Mark this whole thread as done'}
        >
          <CheckCircle2 size={14} />
          <span>{isCurrentThreadDone ? 'Not Done' : 'Thread Done'}</span>
        </button>
      </div>

      {/* Run-Length Group Cards, in stringing order */}
      <div className="control-label">
        <span>Thread #{activeCol + 1} sequence ({labels.start} to {labels.end}), tap a group to mark it:</span>
      </div>

      <div className="step-card-list">
        {currentGroups.map((grp, idx) => {
          const groupDone = strung >= grp.endBead;
          const groupStrung = Math.max(0, Math.min(grp.count, strung - grp.startBead + 1));
          const isGroupActive = !groupDone && nextBeadNumber >= grp.startBead && nextBeadNumber <= grp.endBead;

          return (
            <div
              key={idx}
              className={`step-card ${isGroupActive ? 'active' : ''} ${groupDone ? 'done' : ''}`}
              onClick={() => handleGroupClick(grp)}
              style={{ cursor: 'pointer' }}
              title={groupDone ? 'Tap to undo this group' : 'Tap to mark this group as strung'}
            >
              <div className="step-card-left">
                <span className="color-swatch-sm" style={{ backgroundColor: grp.color.hex }} />
                <div>
                  <div style={{ fontWeight: 600, color: '#F8FAFC' }}>
                    <span className="step-count">{grp.count}×</span> {grp.color.name}
                  </div>
                  <div className="step-range">
                    Beads {grp.startBead}–{grp.endBead} (from {labels.start})
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', color: groupDone ? '#10B981' : '#94A3B8', fontWeight: 600 }}>
                {groupDone ? <CheckCircle2 size={16} /> : groupStrung > 0 ? `${groupStrung}/${grp.count}` : ''}
              </span>
            </div>
          );
        })}
      </div>

      {/* Helpful Hint (keyboard version hidden on touch screens via CSS) */}
      <div className="tip-touch" style={{ fontSize: '0.72rem', color: '#64748B', lineHeight: '1.4' }}>
        💡 <strong>Tip:</strong> Tap <strong>Bead Done</strong> after each bead, or tap a bead on the highlighted thread in the pattern to mark everything up to it. Pinch with two fingers to zoom in on the pattern.
      </div>
      <div className="tip-keyboard" style={{ fontSize: '0.72rem', color: '#64748B', lineHeight: '1.4' }}>
        💡 <strong>Tip:</strong> <kbd style={{ background: '#1E293B', padding: '1px 4px', borderRadius: '3px' }}>Space</kbd> = bead done,{' '}
        <kbd style={{ background: '#1E293B', padding: '1px 4px', borderRadius: '3px' }}>Backspace</kbd> = undo,{' '}
        <kbd style={{ background: '#1E293B', padding: '1px 4px', borderRadius: '3px' }}>← / →</kbd> = switch thread. You can also tap beads on the active thread in the pattern.
      </div>
    </div>
  );
}
