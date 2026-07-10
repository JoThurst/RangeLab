import { COURSE_PRESETS } from '../../data/coursePresets';
import { airDensityFromElevationFt, elevationLabel } from '../../physics/atmosphere';
import { useRangeStore } from '../../store/useRangeStore';
import { SliderControl } from './SliderControl';
import { SelectControl } from './SelectControl';

export function ControlPanel() {
  const open = useRangeStore((s) => s.ui.controlPanelOpen);
  const setUi = useRangeStore((s) => s.setUi);
  const clubs = useRangeStore((s) => s.clubs);
  const selectedClubId = useRangeStore((s) => s.selectedClubId);
  const selectedCourseId = useRangeStore((s) => s.selectedCourseId);
  const setClub = useRangeStore((s) => s.setClub);
  const applyCoursePreset = useRangeStore((s) => s.applyCoursePreset);
  const clearCoursePreset = useRangeStore((s) => s.clearCoursePreset);
  const inputs = useRangeStore((s) => s.inputs);
  const updateInput = useRangeStore((s) => s.updateInput);
  const setElevation = useRangeStore((s) => s.setElevation);
  const setHandedness = useRangeStore((s) => s.setHandedness);
  const weather = useRangeStore((s) => s.weather);
  const setWeather = useRangeStore((s) => s.setWeather);
  const addCustomClub = useRangeStore((s) => s.addCustomClub);
  const launchShot = useRangeStore((s) => s.launchShot);
  const isSimulating = useRangeStore((s) => s.isSimulating);
  const activeSession = useRangeStore((s) => s.activeSession);
  const measuredLock = useRangeStore((s) => s.measuredLock);
  const setMeasuredLock = useRangeStore((s) => s.setMeasuredLock);
  const clearMeasuredLock = useRangeStore((s) => s.clearMeasuredLock);

  if (!open) {
    return (
      <button
        type="button"
        className="btn absolute left-3 top-16 z-20 md:left-4"
        onClick={() => setUi({ controlPanelOpen: true })}
      >
        Controls
      </button>
    );
  }

  const sessionFull =
    !!activeSession && activeSession.shots.length >= activeSession.targetShots;
  const launchLocked = !!measuredLock?.locked;

  return (
    <aside className="panel absolute left-2 top-14 z-20 flex max-h-[calc(100%-4.5rem)] w-[min(100%-1rem,20rem)] flex-col overflow-hidden animate-fade-in md:left-4 md:w-80">
      <div className="panel-header">
        <h2 className="text-sm font-semibold">Shot Controls</h2>
        <button
          type="button"
          className="btn-ghost rounded px-2 py-0.5 text-xs text-range-muted"
          onClick={() => setUi({ controlPanelOpen: false })}
          aria-label="Close controls"
        >
          Hide
        </button>
      </div>

      <div className="space-y-3 overflow-y-auto p-3">
        {measuredLock && (
          <div className="rounded-lg border border-range-accent/30 bg-range-accent/10 px-2.5 py-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-range-accent">
                  {measuredLock.sourceLabel} launch
                </p>
                <p className="font-mono text-[10px] text-range-muted">
                  {measuredLock.clubName ?? 'Measured'} ·{' '}
                  {launchLocked ? 'locked' : 'unlocked'}
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  className="btn text-[10px] px-2 py-1"
                  onClick={() => setMeasuredLock(!launchLocked)}
                >
                  {launchLocked ? 'Unlock' : 'Lock'}
                </button>
                <button
                  type="button"
                  className="btn text-[10px] px-2 py-1"
                  onClick={() => clearMeasuredLock()}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        <SelectControl
          id="club"
          label="Club"
          value={selectedClubId}
          options={clubs.map((c) => ({ value: c.id, label: c.name }))}
          onChange={setClub}
        />

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="btn text-xs"
            onClick={() => addCustomClub()}
            disabled={launchLocked}
          >
            + Custom Club
          </button>
          <SelectControl
            id="handedness"
            label="Handedness"
            value={inputs.handedness}
            options={[
              { value: 'right', label: 'Right' },
              { value: 'left', label: 'Left' },
            ]}
            onChange={(v) => setHandedness(v as 'right' | 'left')}
          />
        </div>

        <fieldset disabled={launchLocked} className="space-y-3 disabled:opacity-60">
          <SliderControl
            id="ballSpeed"
            label="Ball Speed"
            value={inputs.ballSpeedMph}
            min={60}
            max={200}
            step={1}
            unit="mph"
            onChange={(v) => updateInput('ballSpeedMph', v)}
          />
          <SliderControl
            id="clubSpeed"
            label="Club Speed"
            value={inputs.clubSpeedMph}
            min={50}
            max={130}
            step={1}
            unit="mph"
            onChange={(v) => updateInput('clubSpeedMph', v)}
          />
          <SliderControl
            id="launchAngle"
            label="Launch Angle"
            value={inputs.launchAngleDeg}
            min={0}
            max={45}
            step={0.5}
            unit="°"
            onChange={(v) => updateInput('launchAngleDeg', v)}
          />
          <SliderControl
            id="aim"
            label="Horizontal Launch"
            value={inputs.horizontalLaunchDeg}
            min={-15}
            max={15}
            step={0.5}
            unit="°"
            onChange={(v) => updateInput('horizontalLaunchDeg', v)}
            format={(v) => `${v > 0 ? '+' : ''}${v}°`}
          />
          <SliderControl
            id="backspin"
            label="Backspin"
            value={inputs.backspinRpm}
            min={500}
            max={12000}
            step={50}
            unit="rpm"
            onChange={(v) => updateInput('backspinRpm', v)}
          />
          <SliderControl
            id="spinAxis"
            label="Spin Axis"
            value={inputs.spinAxisDeg}
            min={-20}
            max={20}
            step={0.5}
            unit="°"
            onChange={(v) => updateInput('spinAxisDeg', v)}
            format={(v) => `${v > 0 ? '+' : ''}${v}°`}
          />
        </fieldset>

        <div className="border-t border-range-border pt-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-range-muted">
            Environment
          </p>

          <SelectControl
            id="course-preset"
            label="Course Preset"
            value={selectedCourseId ?? ''}
            options={[
              { value: '', label: 'Custom / none' },
              ...COURSE_PRESETS.map((c) => ({
                value: c.id,
                label: `${c.course}`,
              })),
            ]}
            onChange={(v) => {
              if (v) applyCoursePreset(v);
              else clearCoursePreset();
            }}
          />
          {selectedCourseId && (
            <p className="mt-1 font-mono text-[10px] text-range-muted">
              {COURSE_PRESETS.find((c) => c.id === selectedCourseId)?.location} · simulator
              defaults, not live weather
            </p>
          )}

          <div className="mt-2">
            <SelectControl
              id="weather"
              label="Sky Conditions"
              value={weather}
              options={[
                { value: 'day', label: 'Day' },
                { value: 'sunset', label: 'Sunset' },
                { value: 'overcast', label: 'Overcast' },
              ]}
              onChange={(v) => setWeather(v as 'day' | 'sunset' | 'overcast')}
            />
          </div>

          <div className="mt-2 space-y-3">
            <SliderControl
              id="windSpeed"
              label="Wind Speed"
              value={inputs.windSpeedMph}
              min={0}
              max={30}
              step={0.5}
              unit="mph"
              onChange={(v) => updateInput('windSpeedMph', v)}
            />
            <SliderControl
              id="windDir"
              label="Wind Direction"
              value={inputs.windDirectionDeg}
              min={0}
              max={360}
              step={5}
              unit="°"
              onChange={(v) => updateInput('windDirectionDeg', v)}
              format={(v) => {
                if (v === 0 || v === 360) return '0° Head';
                if (v === 180) return '180° Tail';
                if (v === 90) return '90° From R';
                if (v === 270) return '270° From L';
                return `${v}°`;
              }}
            />
            <SliderControl
              id="elevation"
              label="Elevation"
              value={inputs.elevationFt}
              min={0}
              max={8000}
              step={50}
              unit="ft"
              onChange={(v) => setElevation(v)}
              format={(v) =>
                `${Math.round(v)} ft · ${elevationLabel(v)} · ρ ${airDensityFromElevationFt(v)}`
              }
            />
            <SliderControl
              id="airDensity"
              label="Air Density (from elevation)"
              value={inputs.airDensityKgM3}
              min={0.85}
              max={1.35}
              step={0.001}
              unit="kg/m³"
              onChange={(v) => updateInput('airDensityKgM3', v)}
            />
            <SliderControl
              id="firmness"
              label="Ground Firmness"
              value={inputs.groundFirmness}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => updateInput('groundFirmness', v)}
              format={(v) => (v < 0.35 ? 'Soft' : v > 0.7 ? 'Firm' : 'Medium')}
            />
            <SliderControl
              id="moisture"
              label="Fairway Moisture"
              value={inputs.fairwayMoisture}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => updateInput('fairwayMoisture', v)}
              format={(v) => (v < 0.3 ? 'Dry' : v > 0.65 ? 'Wet' : 'Damp')}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-range-border p-3">
        <button
          type="button"
          className="btn btn-primary w-full py-2.5 text-base font-semibold"
          onClick={() => launchShot()}
          disabled={isSimulating || sessionFull}
          aria-keyshortcuts="Space"
        >
          {sessionFull ? 'Session Complete' : isSimulating ? 'Simulating…' : 'Launch Shot'}
        </button>
        <p className="mt-1.5 text-center font-mono text-[10px] text-range-muted">
          Space to launch · 1–6 cameras
        </p>
      </div>
    </aside>
  );
}
