import { useRef, useState } from 'react';
import { useRangeStore } from '../../store/useRangeStore';
import {
  parseImportFile,
  sessionFromMeasuredLaunches,
  type ImportFileResult,
} from '../../utils/sessionImport';
import type { MeasuredLaunch } from '../../utils/trackmanImport';

export function TrackmanImportPanel() {
  const open = useRangeStore((s) => s.ui.importOpen);
  const setUi = useRangeStore((s) => s.setUi);
  const inputs = useRangeStore((s) => s.inputs);
  const importMeasuredBatch = useRangeStore((s) => s.importMeasuredBatch);
  const importPracticeSession = useRangeStore((s) => s.importPracticeSession);
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ImportFileResult | null>(null);
  const [selected, setSelected] = useState(0);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const onFile = async (file: File) => {
    setError(null);
    setParsed(null);
    try {
      const text = await file.text();
      const result = parseImportFile(text, file.name);
      if (result.kind === 'session') {
        setParsed(result);
        return;
      }
      if (!result.shots.length) {
        setError(result.warnings[0] ?? 'No shots found in file.');
        setParsed(result);
        return;
      }
      setParsed(result);
      setSelected(0);
    } catch {
      setError('Failed to read file.');
    }
  };

  const launchShots: MeasuredLaunch[] =
    parsed?.kind === 'launches' ? parsed.shots : [];

  return (
    <div className="absolute inset-x-2 top-14 z-40 flex justify-center animate-fade-in md:inset-x-8">
      <div className="panel w-full max-w-lg p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Import Shots / Session</h3>
            <p className="font-mono text-[10px] text-range-muted">
              Trackman JSON/CSV · or RangeLab session export
            </p>
          </div>
          <button
            type="button"
            className="btn text-xs"
            onClick={() => setUi({ importOpen: false })}
          >
            Close
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".csv,.json,text/csv,application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onFile(f);
            e.target.value = '';
          }}
        />

        <button type="button" className="btn w-full" onClick={() => fileRef.current?.click()}>
          Choose CSV or JSON file
        </button>

        <p className="mt-2 text-[11px] leading-relaxed text-range-muted">
          Import measured launch data, or re-open a RangeLab session JSON/CSV export to replay and
          share with a coach.
        </p>

        {error && <p className="mt-2 text-xs text-range-danger">{error}</p>}
        {parsed?.kind === 'launches' && parsed.warnings.length > 0 && !error && (
          <ul className="mt-2 space-y-0.5 text-[11px] text-range-warn">
            {parsed.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        )}

        {parsed?.kind === 'session' && (
          <div className="mt-3 space-y-2">
            <div className="rounded-lg border border-range-accent/30 bg-range-accent/10 px-3 py-2">
              <p className="text-xs font-semibold text-range-accent">RangeLab session detected</p>
              <p className="font-mono text-[11px] text-range-muted">
                {parsed.session.name} · {parsed.session.shots.length} shots
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary w-full"
              onClick={() => importPracticeSession(parsed.session)}
            >
              Load Session
            </button>
          </div>
        )}

        {launchShots.length > 0 && (
          <div className="mt-3 space-y-2">
            <label className="block text-xs text-range-muted" htmlFor="import-shot">
              Preview shot ({launchShots.length} found)
            </label>
            <select
              id="import-shot"
              className="w-full rounded-lg border border-range-border bg-range-bg px-2.5 py-1.5 text-sm"
              value={selected}
              onChange={(e) => setSelected(Number(e.target.value))}
            >
              {launchShots.map((s, i) => (
                <option key={i} value={i}>
                  #{i + 1}
                  {s.clubName ? ` · ${s.clubName}` : ''} · {s.ballSpeedMph} mph
                  {s.launchAngleDeg != null ? ` · ${s.launchAngleDeg}°` : ''}
                  {s.backspinRpm != null ? ` · ${s.backspinRpm} rpm` : ''}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-2 rounded-lg bg-white/[0.03] p-2 font-mono text-[11px]">
              <span>Ball {launchShots[selected].ballSpeedMph} mph</span>
              <span>Club {launchShots[selected].clubSpeedMph ?? '—'} mph</span>
              <span>Launch {launchShots[selected].launchAngleDeg ?? '—'}°</span>
              <span>Spin {launchShots[selected].backspinRpm ?? '—'} rpm</span>
              <span>Axis {launchShots[selected].spinAxisDeg ?? '—'}°</span>
              <span>Dir {launchShots[selected].horizontalLaunchDeg ?? '—'}°</span>
            </div>

            <button
              type="button"
              className="btn btn-primary w-full"
              onClick={() => importMeasuredBatch(launchShots, selected)}
            >
              {launchShots.length > 1
                ? `Import ${launchShots.length} Shots (start at #${selected + 1})`
                : 'Apply & Lock Launch'}
            </button>

            {launchShots.length > 1 && (
              <button
                type="button"
                className="btn w-full text-xs"
                onClick={() => {
                  const session = sessionFromMeasuredLaunches(
                    launchShots,
                    inputs,
                    `Imported ${launchShots.length} shots`,
                  );
                  importPracticeSession(session);
                }}
              >
                Load as practice session (re-simulate all)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
