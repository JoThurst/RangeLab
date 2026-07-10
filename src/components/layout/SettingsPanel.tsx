import { useRangeStore } from '../../store/useRangeStore';

export function SettingsPanel() {
  const open = useRangeStore((s) => s.ui.settingsOpen);
  const setUi = useRangeStore((s) => s.setUi);
  const performance = useRangeStore((s) => s.performance);
  const setPerformance = useRangeStore((s) => s.setPerformance);

  if (!open) return null;

  return (
    <div className="absolute right-2 top-14 z-40 w-[min(100%-1rem,18rem)] animate-fade-in md:right-4">
      <div className="panel p-3">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Performance</h3>
          <button
            type="button"
            className="btn-ghost text-xs text-range-muted"
            onClick={() => setUi({ settingsOpen: false })}
          >
            Close
          </button>
        </div>
        <div className="space-y-3 text-sm">
          <Toggle
            label="Shadows"
            checked={performance.shadows}
            onChange={(v) => setPerformance({ shadows: v })}
          />
          <Toggle
            label="Wind Indicators"
            checked={performance.showWindIndicators}
            onChange={(v) => setPerformance({ showWindIndicators: v })}
          />
          <Toggle
            label="Landing Grid"
            checked={performance.showLandingGrid}
            onChange={(v) => setPerformance({ showLandingGrid: v })}
          />
          <Toggle
            label="Distance Markers"
            checked={performance.showDistanceMarkers}
            onChange={(v) => setPerformance({ showDistanceMarkers: v })}
          />
          <label className="block space-y-1">
            <span className="text-xs text-range-muted">Pixel Ratio Cap</span>
            <input
              type="range"
              className="input-range"
              min={1}
              max={2}
              step={0.25}
              value={performance.pixelRatioCap}
              onChange={(e) => setPerformance({ pixelRatioCap: Number(e.target.value) })}
            />
            <span className="font-mono text-[10px] text-range-muted">{performance.pixelRatioCap}×</span>
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-range-muted">Tracer Max Points</span>
            <input
              type="range"
              className="input-range"
              min={100}
              max={800}
              step={50}
              value={performance.tracerMaxPoints}
              onChange={(e) => setPerformance({ tracerMaxPoints: Number(e.target.value) })}
            />
            <span className="font-mono text-[10px] text-range-muted">
              {performance.tracerMaxPoints}
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-2">
      <span className="text-xs text-range-muted">{label}</span>
      <input
        type="checkbox"
        className="h-4 w-4 accent-range-accent"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}
