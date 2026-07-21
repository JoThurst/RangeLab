import { useRangeStore } from '../../store/useRangeStore';
import {
  computeSessionStats,
  downloadText,
  sessionToCsv,
  sessionToJson,
} from '../../utils/sessionStats';
import { DispersionPlot, TrajectoryComparison } from '../charts/SessionCharts';

export function SessionPanel() {
  const open = useRangeStore((s) => s.ui.sessionPanelOpen);
  const setUi = useRangeStore((s) => s.setUi);
  const activeSession = useRangeStore((s) => s.activeSession);
  const recentSessions = useRangeStore((s) => s.recentSessions);
  const toggleTracer = useRangeStore((s) => s.toggleTracer);
  const setReplayShot = useRangeStore((s) => s.setReplayShot);
  const loadSession = useRangeStore((s) => s.loadSession);
  const deleteSession = useRangeStore((s) => s.deleteSession);
  const startSession = useRangeStore((s) => s.startSession);

  if (!open) return null;

  const stats = computeSessionStats(activeSession?.shots ?? []);

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
                  Start a 10-ball session to track dispersion, consistency, and replay shots.
                </p>
                <button type="button" className="btn btn-primary" onClick={() => startSession()}>
                  Start 10-Ball Session
                </button>
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
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-range-muted">
                    Shot List
                  </p>
                  <ul className="max-h-48 space-y-1 overflow-y-auto">
                    {activeSession.shots.map((shot) => (
                      <li
                        key={shot.id}
                        className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-2 py-1.5 text-xs"
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
                        <span className="hidden text-range-muted sm:inline">{shot.results.shotShape}</span>
                        <button
                          type="button"
                          className="text-range-accent"
                          onClick={() => {
                            setReplayShot(shot.id);
                            setUi({ sessionPanelOpen: false });
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
                      <li className="text-sm text-range-muted">No shots yet — launch from the range.</li>
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
                    title="Full session with trajectories — re-import via Import to reload"
                  >
                    Export JSON
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
                    title="Spreadsheet of launch + results — re-import via Import"
                  >
                    Export CSV
                  </button>
                </div>
                <p className="text-[10px] text-range-muted">
                  Exports are for sharing, coaching, or reloading later — use Import to bring them
                  back in.
                </p>
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
