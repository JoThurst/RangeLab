import { useRangeStore } from '../../store/useRangeStore';

function Metric({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="rounded-lg bg-white/[0.03] px-2.5 py-2">
      <div className="metric-label">{label}</div>
      <div className="metric-value text-base">
        {value}
        {unit ? <span className="ml-0.5 text-xs font-normal text-range-muted">{unit}</span> : null}
      </div>
    </div>
  );
}

export function ResultsPanel() {
  const open = useRangeStore((s) => s.ui.resultsPanelOpen);
  const setUi = useRangeStore((s) => s.setUi);
  const results = useRangeStore((s) => s.lastResults);
  const isPlaying = useRangeStore((s) => s.isPlaying);
  const playbackTime = useRangeStore((s) => s.playbackTime);
  const playbackSpeed = useRangeStore((s) => s.playbackSpeed);
  const setIsPlaying = useRangeStore((s) => s.setIsPlaying);
  const setPlaybackTime = useRangeStore((s) => s.setPlaybackTime);
  const setPlaybackSpeed = useRangeStore((s) => s.setPlaybackSpeed);
  const saveBaseline = useRangeStore((s) => s.saveBaseline);
  const inputs = useRangeStore((s) => s.inputs);

  if (!open) {
    return (
      <button
        type="button"
        className="btn absolute right-3 top-16 z-20 md:right-4"
        onClick={() => setUi({ resultsPanelOpen: true })}
      >
        Results
      </button>
    );
  }

  const maxT = results?.trajectory.at(-1)?.t ?? 0;

  return (
    <aside className="panel absolute right-2 top-14 z-20 flex max-h-[calc(100%-4.5rem)] w-[min(100%-1rem,19rem)] flex-col overflow-hidden animate-fade-in md:right-4 md:w-72">
      <div className="panel-header">
        <h2 className="text-sm font-semibold">Shot Results</h2>
        <button
          type="button"
          className="btn-ghost rounded px-2 py-0.5 text-xs text-range-muted"
          onClick={() => setUi({ resultsPanelOpen: false })}
          aria-label="Close results"
        >
          Hide
        </button>
      </div>

      {!results ? (
        <div className="p-4 text-sm text-range-muted">
          Launch a shot to see carry, apex, shape, and rollout metrics.
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto p-3">
          <div className="flex items-center justify-between rounded-lg border border-range-accent/30 bg-range-accent/10 px-3 py-2">
            <span className="text-xs text-range-muted">Shape</span>
            <span className="font-semibold text-range-accent">{results.shotShape}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Metric label="Carry" value={results.carryYards} unit="yd" />
            <Metric label="Total" value={results.totalYards} unit="yd" />
            <Metric label="Apex" value={results.apexHeightYards} unit="yd" />
            <Metric label="Flight" value={results.flightTimeSec} unit="s" />
            <Metric label="Ball Speed" value={results.ballSpeedMph} unit="mph" />
            <Metric label="Launch" value={results.launchAngleDeg} unit="°" />
            <Metric label="Backspin" value={results.backspinRpm} unit="rpm" />
            <Metric label="Spin Axis" value={results.spinAxisDeg} unit="°" />
            <Metric label="Side Spin" value={results.sideSpinRpm} unit="rpm" />
            <Metric label="Offline" value={results.offlineYards} unit="yd" />
            <Metric label="Land Angle" value={results.landingAngleDeg} unit="°" />
            <Metric label="Bounce" value={results.bounceYards} unit="yd" />
            <Metric label="Rollout" value={results.rolloutYards} unit="yd" />
            <Metric label="Elevation" value={Math.round(inputs.elevationFt)} unit="ft" />
          </div>

          <button
            type="button"
            className="btn w-full text-xs"
            onClick={() => {
              saveBaseline();
              setUi({ compareOpen: true });
            }}
          >
            Save as baseline for compare
          </button>

          <div className="space-y-2 border-t border-range-border pt-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn text-xs"
                onClick={() => {
                  if (playbackTime >= maxT) setPlaybackTime(0);
                  setIsPlaying(!isPlaying);
                }}
              >
                {isPlaying ? 'Pause' : 'Replay'}
              </button>
              <select
                className="rounded-lg border border-range-border bg-range-bg px-2 py-1 text-xs"
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                aria-label="Playback speed"
              >
                <option value={0.5}>0.5×</option>
                <option value={1}>1×</option>
                <option value={2}>2×</option>
              </select>
              <span className="ml-auto font-mono text-[10px] text-range-muted">
                {playbackTime.toFixed(2)}s
              </span>
            </div>
            <input
              type="range"
              className="input-range"
              min={0}
              max={maxT || 1}
              step={0.01}
              value={Math.min(playbackTime, maxT)}
              onChange={(e) => {
                setIsPlaying(false);
                setPlaybackTime(Number(e.target.value));
              }}
              aria-label="Playback scrubber"
            />
          </div>
        </div>
      )}
    </aside>
  );
}
