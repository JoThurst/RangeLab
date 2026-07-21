import { useRangeStore } from '../../store/useRangeStore';

export function TopBar() {
  const setUi = useRangeStore((s) => s.setUi);
  const ui = useRangeStore((s) => s.ui);
  const activeSession = useRangeStore((s) => s.activeSession);
  const startSession = useRangeStore((s) => s.startSession);
  const endSession = useRangeStore((s) => s.endSession);
  const measuredLock = useRangeStore((s) => s.measuredLock);
  const comparisonOverlays = useRangeStore((s) => s.comparisonOverlays);

  return (
    <header className="absolute left-0 right-0 top-0 z-30 flex items-center gap-2 border-b border-range-border/80 bg-range-bg/80 px-3 py-2 backdrop-blur-md md:px-4">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-range-accent/40 bg-range-accent/10">
          <span className="font-mono text-xs font-bold text-range-accent">RL</span>
        </div>
        <div>
          <h1 className="font-display text-sm font-semibold leading-none tracking-wide">RangeLab</h1>
          <p className="font-mono text-[10px] text-range-muted">
            {measuredLock?.locked
              ? `${measuredLock.sourceLabel} locked`
              : 'Ball Flight Simulator'}
          </p>
        </div>
      </div>

      <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
        {activeSession ? (
          <>
            <span className="hidden font-mono text-xs text-range-muted sm:inline">
              Session {activeSession.shots.length}/{activeSession.targetShots}
            </span>
            <button
              type="button"
              className="btn text-xs"
              onClick={() => setUi({ sessionPanelOpen: true })}
            >
              Session
            </button>
            <button type="button" className="btn text-xs" onClick={() => endSession()}>
              End
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="btn text-xs"
              onClick={() => setUi({ sessionPanelOpen: true })}
              title="Start a session or load a shared JSON"
            >
              Session
            </button>
            <button type="button" className="btn text-xs" onClick={() => startSession()}>
              10-Ball Session
            </button>
          </>
        )}
        <button
          type="button"
          className={`btn text-xs ${ui.importOpen ? 'border-range-accent/50 text-range-accent' : ''}`}
          onClick={() => setUi({ importOpen: !ui.importOpen, compareOpen: false })}
        >
          Import
        </button>
        <button
          type="button"
          className={`btn text-xs ${ui.compareOpen ? 'border-range-accent/50 text-range-accent' : ''}`}
          onClick={() => setUi({ compareOpen: !ui.compareOpen, importOpen: false })}
        >
          Compare{comparisonOverlays.length ? ` (${comparisonOverlays.length})` : ''}
        </button>
        <button
          type="button"
          className={`btn text-xs ${ui.guidedModeOpen ? 'border-range-accent/50 text-range-accent' : ''}`}
          onClick={() => setUi({ guidedModeOpen: !ui.guidedModeOpen })}
        >
          Guide
        </button>
        <button
          type="button"
          className="btn text-xs"
          onClick={() => setUi({ settingsOpen: !ui.settingsOpen })}
        >
          Settings
        </button>
      </div>
    </header>
  );
}
