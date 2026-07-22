import { useEffect, useRef, useState, type RefObject } from 'react';
import { useRangeStore } from '../../store/useRangeStore';
import { parseImportFile } from '../../utils/sessionImport';
import {
  computeSessionStats,
  downloadText,
  sessionShareSummary,
  sessionToCsv,
  sessionToJson,
} from '../../utils/sessionStats';
import { DispersionPlot, TrajectoryComparison } from '../charts/SessionCharts';

const BALL_COUNT_OPTIONS = [5, 10, 15, 20, 30] as const;

export function SessionPanel() {
  const open = useRangeStore((s) => s.ui.sessionPanelOpen);
  const setUi = useRangeStore((s) => s.setUi);
  const activeSession = useRangeStore((s) => s.activeSession);
  const recentSessions = useRangeStore((s) => s.recentSessions);
  const replayShotId = useRangeStore((s) => s.replayShotId);
  const toggleTracer = useRangeStore((s) => s.toggleTracer);
  const setReplayShot = useRangeStore((s) => s.setReplayShot);
  const setSessionNote = useRangeStore((s) => s.setSessionNote);
  const loadSession = useRangeStore((s) => s.loadSession);
  const deleteSession = useRangeStore((s) => s.deleteSession);
  const startSession = useRangeStore((s) => s.startSession);
  const importPracticeSession = useRangeStore((s) => s.importPracticeSession);

  const [targetBalls, setTargetBalls] = useState<number>(10);
  const [pasteText, setPasteText] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadStatus, setLoadStatus] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [coachReplay, setCoachReplay] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const advanceTimer = useRef<number | null>(null);

  useEffect(() => {
    setNoteDraft(activeSession?.note ?? '');
  }, [activeSession?.id, activeSession?.note]);

  useEffect(() => {
    if (!coachReplay || !activeSession?.shots.length) {
      if (advanceTimer.current != null) {
        window.clearInterval(advanceTimer.current);
        advanceTimer.current = null;
      }
      return;
    }

    const shots = activeSession.shots;
    const tick = () => {
      const { replayShotId: currentId, setReplayShot: replay } = useRangeStore.getState();
      const idx = shots.findIndex((s) => s.id === currentId);
      const nextIdx = idx < 0 || idx >= shots.length - 1 ? 0 : idx + 1;
      replay(shots[nextIdx].id);
    };

    // Start on first shot if none selected
    const { replayShotId: currentId } = useRangeStore.getState();
    if (!currentId || !shots.some((s) => s.id === currentId)) {
      setReplayShot(shots[0].id);
    }

    advanceTimer.current = window.setInterval(tick, 4500);
    return () => {
      if (advanceTimer.current != null) {
        window.clearInterval(advanceTimer.current);
        advanceTimer.current = null;
      }
    };
  }, [coachReplay, activeSession?.id, activeSession?.shots, setReplayShot]);

  if (!open) return null;

  const stats = computeSessionStats(activeSession?.shots ?? []);
  const replayIndex =
    activeSession && replayShotId
      ? activeSession.shots.findIndex((s) => s.id === replayShotId)
      : -1;

  const loadFromText = (text: string, filename?: string) => {
    setLoadError(null);
    setLoadStatus(null);
    const trimmed = text.trim();
    if (!trimmed) {
      setLoadError('Paste a RangeLab session JSON (or choose a .json file).');
      return;
    }
    try {
      const result = parseImportFile(trimmed, filename ?? 'paste.json');
      if (result.kind !== 'session') {
        setLoadError(
          'That looks like launch-monitor data, not a full session. Use Import for Trackman CSV/JSON, or share Export JSON for full tracers.',
        );
        return;
      }
      importPracticeSession(result.session);
      setPasteText('');
      setLoadStatus(
        `Loaded “${result.session.name}” · ${result.session.shots.length} shots with tracers.`,
      );
      setCoachReplay(false);
    } catch {
      setLoadError('Could not parse session JSON.');
    }
  };

  const onPickFile = async (file: File) => {
    setLoadError(null);
    setLoadStatus(null);
    try {
      const text = await file.text();
      loadFromText(text, file.name);
    } catch {
      setLoadError('Failed to read file.');
    }
  };

  const copyText = async (label: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopyStatus(`${label} copied`);
      window.setTimeout(() => setCopyStatus(null), 2000);
    } catch {
      setCopyStatus('Copy failed — use Export instead');
      window.setTimeout(() => setCopyStatus(null), 2500);
    }
  };

  const stepReplay = (delta: number) => {
    if (!activeSession?.shots.length) return;
    const shots = activeSession.shots;
    const idx = shots.findIndex((s) => s.id === replayShotId);
    const base = idx < 0 ? 0 : idx;
    const next = (base + delta + shots.length) % shots.length;
    setReplayShot(shots[next].id);
  };

  return (
    <div className="absolute inset-x-2 bottom-14 top-14 z-40 flex items-stretch justify-center animate-fade-in md:inset-x-8">
      <div className="panel flex w-full max-w-4xl flex-col overflow-hidden">
        <div className="panel-header">
          <div>
            <h2 className="text-sm font-semibold">Practice Session</h2>
            <p className="font-mono text-[10px] text-range-muted">
              {activeSession
                ? `${activeSession.shots.length}/${activeSession.targetShots} shots · ${activeSession.name}`
                : 'No active session'}
            </p>
          </div>
          <button
            type="button"
            className="btn text-xs"
            onClick={() => setUi({ sessionPanelOpen: false })}
          >
            Close
          </button>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-0 overflow-y-auto lg:grid-cols-[1fr_1.1fr]">
          <div className="space-y-3 border-b border-range-border p-3 lg:border-b-0 lg:border-r">
            {!activeSession ? (
              <div className="space-y-3">
                <p className="text-sm text-range-muted">
                  Start a session to track dispersion and share full tracers with a coach via JSON.
                </p>

                <div className="flex flex-wrap items-end gap-2">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-range-muted">
                    Balls
                    <select
                      className="mt-1 block rounded-lg border border-range-border bg-range-bg px-2.5 py-1.5 text-sm"
                      value={targetBalls}
                      onChange={(e) => setTargetBalls(Number(e.target.value))}
                    >
                      {BALL_COUNT_OPTIONS.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => startSession(undefined, targetBalls)}
                  >
                    Start {targetBalls}-Ball Session
                  </button>
                </div>

                <CoachLoadBlock
                  fileRef={fileRef}
                  pasteText={pasteText}
                  setPasteText={setPasteText}
                  loadError={loadError}
                  loadStatus={loadStatus}
                  onPickFile={onPickFile}
                  onLoadPaste={() => loadFromText(pasteText)}
                />

                {recentSessions.length > 0 && (
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-range-muted">
                      Recent Sessions
                    </p>
                    <ul className="space-y-1">
                      {recentSessions.slice(0, 8).map((s) => (
                        <li
                          key={s.id}
                          className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-2 py-1.5"
                        >
                          <button
                            type="button"
                            className="flex-1 text-left text-xs hover:text-range-accent"
                            onClick={() => loadSession(s.id)}
                          >
                            {s.name} · {s.shots.length} shots
                          </button>
                          <button
                            type="button"
                            className="text-[10px] text-range-danger"
                            onClick={() => deleteSession(s.id)}
                          >
                            Del
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Stat label="Avg Carry" value={`${stats.avgCarry} yd`} />
                  <Stat label="Avg Total" value={`${stats.avgTotal} yd`} />
                  <Stat label="Longest" value={`${stats.longestTotal} yd`} />
                  <Stat label="Consistency" value={`${stats.carryConsistency}`} />
                  <Stat label="Avg |Offline|" value={`${stats.avgOffline} yd`} />
                  <Stat label="Offline σ" value={`${stats.offlineStdDev} yd`} />
                  <Stat label="L-R Spread" value={`${stats.leftRightDispersion} yd`} />
                  <Stat label="Shots" value={`${stats.shotCount}`} />
                </div>

                <div>
                  <label
                    className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-range-muted"
                    htmlFor="session-note"
                  >
                    Coach note
                  </label>
                  <textarea
                    id="session-note"
                    className="w-full resize-y rounded-lg border border-range-border bg-range-bg px-2.5 py-1.5 text-xs leading-relaxed"
                    rows={2}
                    placeholder="Context for whoever reviews this session…"
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    onBlur={() => {
                      if ((activeSession.note ?? '') !== noteDraft.trim()) {
                        setSessionNote(noteDraft);
                      }
                    }}
                  />
                </div>

                {activeSession.shots.length > 0 && (
                  <div className="rounded-lg border border-range-border/80 bg-white/[0.02] p-2.5">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-range-muted">
                        Coach replay
                      </p>
                      <span className="font-mono text-[10px] text-range-muted">
                        {replayIndex >= 0
                          ? `Shot ${replayIndex + 1}/${activeSession.shots.length}`
                          : 'Pick a shot'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        className="btn text-xs"
                        disabled={!activeSession.shots.length}
                        onClick={() => stepReplay(-1)}
                      >
                        Prev
                      </button>
                      <button
                        type="button"
                        className={`btn text-xs ${coachReplay ? 'border-range-accent/50 text-range-accent' : ''}`}
                        disabled={!activeSession.shots.length}
                        onClick={() => {
                          if (coachReplay) {
                            setCoachReplay(false);
                          } else {
                            setCoachReplay(true);
                            setUi({ sessionPanelOpen: false, resultsPanelOpen: true });
                          }
                        }}
                      >
                        {coachReplay ? 'Playing…' : 'Play all'}
                      </button>
                      <button
                        type="button"
                        className="btn text-xs"
                        disabled={!activeSession.shots.length}
                        onClick={() => stepReplay(1)}
                      >
                        Next
                      </button>
                      <button
                        type="button"
                        className="btn text-xs"
                        disabled={!coachReplay && !replayShotId}
                        onClick={() => {
                          setCoachReplay(false);
                          setReplayShot(null);
                        }}
                      >
                        Stop
                      </button>
                    </div>
                    <p className="mt-1.5 text-[10px] text-range-muted">
                      Play all auto-advances every ~4.5s with tracers on the range. Scrub timing in
                      Results.
                    </p>
                  </div>
                )}

                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-range-muted">
                    Shot List
                  </p>
                  <ul className="max-h-48 space-y-1 overflow-y-auto">
                    {activeSession.shots.map((shot) => (
                      <li
                        key={shot.id}
                        className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${
                          shot.id === replayShotId
                            ? 'bg-range-accent/15 ring-1 ring-range-accent/40'
                            : 'bg-white/[0.03]'
                        }`}
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ background: shot.tracerColor }}
                        />
                        <span className="font-mono text-range-muted">#{shot.index}</span>
                        <span className="truncate">{shot.clubName}</span>
                        <span className="ml-auto font-mono tabular-nums">
                          {shot.results.carryYards} / {shot.results.totalYards}
                        </span>
                        <span className="hidden text-range-muted sm:inline">
                          {shot.results.shotShape}
                        </span>
                        <button
                          type="button"
                          className="text-range-accent"
                          onClick={() => {
                            setCoachReplay(false);
                            setReplayShot(shot.id);
                            setUi({ sessionPanelOpen: false, resultsPanelOpen: true });
                          }}
                        >
                          Replay
                        </button>
                        <button
                          type="button"
                          className={shot.tracerVisible ? 'text-range-text' : 'text-range-muted'}
                          onClick={() => toggleTracer(shot.id)}
                          aria-pressed={shot.tracerVisible}
                          title="Toggle tracer"
                        >
                          {shot.tracerVisible ? '◉' : '○'}
                        </button>
                      </li>
                    ))}
                    {activeSession.shots.length === 0 && (
                      <li className="text-sm text-range-muted">
                        No shots yet — launch from the range.
                      </li>
                    )}
                  </ul>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn text-xs"
                    disabled={!activeSession.shots.length}
                    onClick={() =>
                      downloadText(
                        `${activeSession.id}.json`,
                        sessionToJson(activeSession),
                        'application/json',
                      )
                    }
                    title="Full session with trajectories — coach reloads via Load shared session"
                  >
                    Export JSON
                  </button>
                  <button
                    type="button"
                    className="btn text-xs"
                    disabled={!activeSession.shots.length}
                    onClick={() =>
                      void copyText('JSON', sessionToJson(activeSession))
                    }
                    title="Copy full session JSON to clipboard"
                  >
                    Copy JSON
                  </button>
                  <button
                    type="button"
                    className="btn text-xs"
                    disabled={!activeSession.shots.length}
                    onClick={() =>
                      void copyText('Summary', sessionShareSummary(activeSession))
                    }
                    title="Copy a text summary for chat/email"
                  >
                    Copy Summary
                  </button>
                  <button
                    type="button"
                    className="btn text-xs"
                    disabled={!activeSession.shots.length}
                    onClick={() =>
                      downloadText(
                        `${activeSession.id}.csv`,
                        sessionToCsv(activeSession),
                        'text/csv',
                      )
                    }
                    title="Spreadsheet of launch + results — re-import via Import (re-simulates)"
                  >
                    Export CSV
                  </button>
                </div>
                {copyStatus && (
                  <p className="font-mono text-[10px] text-range-accent">{copyStatus}</p>
                )}
                <p className="text-[10px] leading-relaxed text-range-muted">
                  <strong className="font-semibold text-range-text">JSON</strong> keeps full
                  tracers and metrics — share the file or paste Copy JSON; coach loads it below
                  (or via Import).{' '}
                  <strong className="font-semibold text-range-text">CSV</strong> is for
                  spreadsheets and re-simulates on import. Summary is text-only for chat.
                </p>

                <CoachLoadBlock
                  fileRef={fileRef}
                  pasteText={pasteText}
                  setPasteText={setPasteText}
                  loadError={loadError}
                  loadStatus={loadStatus}
                  onPickFile={onPickFile}
                  onLoadPaste={() => loadFromText(pasteText)}
                  compact
                />
              </>
            )}
          </div>

          <div className="space-y-4 p-3">
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-range-muted">
                Top-Down Dispersion
              </p>
              {activeSession && activeSession.shots.length > 0 ? (
                <DispersionPlot shots={activeSession.shots} />
              ) : (
                <EmptyChart />
              )}
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-range-muted">
                Side-View Trajectories
              </p>
              {activeSession && activeSession.shots.some((s) => s.tracerVisible) ? (
                <TrajectoryComparison shots={activeSession.shots} />
              ) : (
                <EmptyChart />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CoachLoadBlock({
  fileRef,
  pasteText,
  setPasteText,
  loadError,
  loadStatus,
  onPickFile,
  onLoadPaste,
  compact,
}: {
  fileRef: RefObject<HTMLInputElement>;
  pasteText: string;
  setPasteText: (v: string) => void;
  loadError: string | null;
  loadStatus: string | null;
  onPickFile: (file: File) => void;
  onLoadPaste: () => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`space-y-2 rounded-lg border border-dashed border-range-border p-2.5 ${
        compact ? 'mt-1' : ''
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-range-muted">
        Load shared session
      </p>
      <p className="text-[11px] leading-relaxed text-range-muted">
        Open a RangeLab <span className="text-range-text">Export JSON</span> file or paste its
        contents to reload tracers and metrics — no re-entering launches.
      </p>
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onPickFile(f);
          e.target.value = '';
        }}
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn text-xs" onClick={() => fileRef.current?.click()}>
          Choose JSON file
        </button>
        <button
          type="button"
          className="btn btn-primary text-xs"
          disabled={!pasteText.trim()}
          onClick={onLoadPaste}
        >
          Load pasted JSON
        </button>
      </div>
      <textarea
        className="w-full resize-y rounded-lg border border-range-border bg-range-bg px-2.5 py-1.5 font-mono text-[11px] leading-relaxed"
        rows={compact ? 3 : 4}
        placeholder='{"id":"session-…","shots":[…]}'
        value={pasteText}
        onChange={(e) => setPasteText(e.target.value)}
        spellCheck={false}
      />
      {loadError && <p className="text-xs text-range-danger">{loadError}</p>}
      {loadStatus && !loadError && (
        <p className="text-xs text-range-accent">{loadStatus}</p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/[0.03] px-2 py-1.5">
      <div className="metric-label">{label}</div>
      <div className="font-mono text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-44 items-center justify-center rounded-lg border border-dashed border-range-border text-xs text-range-muted">
      Launch shots to populate
    </div>
  );
}
