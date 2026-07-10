import type { CameraMode } from '../../types';
import { useRangeStore } from '../../store/useRangeStore';

const MODES: { id: CameraMode; label: string; key: string }[] = [
  { id: 'behind', label: 'Behind', key: '1' },
  { id: 'follow', label: 'Follow', key: '2' },
  { id: 'side', label: 'Side', key: '3' },
  { id: 'landing', label: 'Landing', key: '4' },
  { id: 'orbit', label: 'Orbit', key: '5' },
  { id: 'topdown', label: 'Top', key: '6' },
];

export function CameraBar() {
  const mode = useRangeStore((s) => s.cameraMode);
  const setCameraMode = useRangeStore((s) => s.setCameraMode);

  return (
    <div className="pointer-events-auto absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1 rounded-xl border border-range-border bg-range-panel/95 p-1 shadow-panel backdrop-blur-md">
      {MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition md:px-3 ${
            mode === m.id
              ? 'bg-range-accent text-range-bg'
              : 'text-range-muted hover:bg-white/5 hover:text-range-text'
          }`}
          onClick={() => setCameraMode(m.id)}
          title={`${m.label} (${m.key})`}
          aria-pressed={mode === m.id}
        >
          <span className="hidden sm:inline">{m.label}</span>
          <span className="sm:hidden">{m.key}</span>
        </button>
      ))}
    </div>
  );
}
