import { COURSE_PRESETS } from '../../data/coursePresets';
import { useRangeStore } from '../../store/useRangeStore';

export function EnvComparePanel() {
  const open = useRangeStore((s) => s.ui.compareOpen);
  const setUi = useRangeStore((s) => s.setUi);
  const lastResults = useRangeStore((s) => s.lastResults);
  const baselineResults = useRangeStore((s) => s.baselineResults);
  const overlays = useRangeStore((s) => s.comparisonOverlays);
  const saveBaseline = useRangeStore((s) => s.saveBaseline);
  const clearBaseline = useRangeStore((s) => s.clearBaseline);
  const compareAgainstCourse = useRangeStore((s) => s.compareAgainstCourse);
  const compareAgainstBaseline = useRangeStore((s) => s.compareAgainstBaseline);
  const toggleComparisonOverlay = useRangeStore((s) => s.toggleComparisonOverlay);
  const clearComparisons = useRangeStore((s) => s.clearComparisons);

  if (!open) return null;

  const delta =
    lastResults && baselineResults
      ? {
          carry: round1(lastResults.carryYards - baselineResults.carryYards),
          total: round1(lastResults.totalYards - baselineResults.totalYards),
          apex: round1(lastResults.apexHeightYards - baselineResults.apexHeightYards),
        }
      : null;

  return (
    <div className="absolute bottom-16 left-1/2 z-30 w-[min(100%-1rem,26rem)] -translate-x-1/2 animate-fade-in">
      <div className="panel p-3">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Environment Compare</h3>
            <p className="font-mono text-[10px] text-range-muted">
              Same launch · different wind / elevation / turf
            </p>
          </div>
          <button
            type="button"
            className="btn-ghost text-xs text-range-muted"
            onClick={() => setUi({ compareOpen: false })}
          >
            Close
          </button>
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5">
          <button
            type="button"
            className="btn text-xs"
            disabled={!lastResults}
            onClick={() => saveBaseline()}
          >
            Save current as baseline
          </button>
          <button
            type="button"
            className="btn text-xs"
            disabled={!baselineResults}
            onClick={() => compareAgainstBaseline()}
          >
            Show baseline tracer
          </button>
          <button
            type="button"
            className="btn text-xs"
            disabled={!baselineResults}
            onClick={() => clearBaseline()}
          >
            Clear baseline
          </button>
        </div>

        {delta && (
          <div className="mb-3 grid grid-cols-3 gap-2 rounded-lg border border-range-accent/20 bg-range-accent/5 p-2 text-center">
            <Delta label="Carry Δ" value={delta.carry} />
            <Delta label="Total Δ" value={delta.total} />
            <Delta label="Apex Δ" value={delta.apex} />
          </div>
        )}

        <label className="mb-1 block text-xs text-range-muted" htmlFor="cmp-course">
          Overlay course environment
        </label>
        <div className="flex gap-2">
          <select
            id="cmp-course"
            className="min-w-0 flex-1 rounded-lg border border-range-border bg-range-bg px-2 py-1.5 text-xs"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                compareAgainstCourse(e.target.value);
                e.target.value = '';
              }
            }}
          >
            <option value="" disabled>
              Add course overlay…
            </option>
            {COURSE_PRESETS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.course}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn text-xs"
            disabled={!overlays.length}
            onClick={() => clearComparisons()}
          >
            Clear
          </button>
        </div>

        {overlays.length > 0 && (
          <ul className="mt-2 max-h-36 space-y-1 overflow-y-auto">
            {overlays.map((o) => (
              <li
                key={o.id}
                className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-2 py-1.5 text-xs"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: o.color }}
                />
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                <span className="font-mono tabular-nums text-range-muted">
                  {o.results.carryYards} yd
                </span>
                <button
                  type="button"
                  className={o.visible ? 'text-range-accent' : 'text-range-muted'}
                  onClick={() => toggleComparisonOverlay(o.id)}
                  aria-pressed={o.visible}
                >
                  {o.visible ? '◉' : '○'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Delta({ label, value }: { label: string; value: number }) {
  const sign = value > 0 ? '+' : '';
  const color =
    value > 0 ? 'text-range-accent' : value < 0 ? 'text-range-warn' : 'text-range-muted';
  return (
    <div>
      <div className="metric-label">{label}</div>
      <div className={`font-mono text-sm font-semibold tabular-nums ${color}`}>
        {sign}
        {value} yd
      </div>
    </div>
  );
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
