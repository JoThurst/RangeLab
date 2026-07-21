import { useState } from 'react';
import { useRangeStore } from '../../store/useRangeStore';

const STEPS = [
  {
    title: 'Launch Angle',
    body: 'Higher launch sends the ball up sooner. Drivers usually launch lower than wedges. Too high with low speed can cost carry; too low reduces apex and can kill distance into a headwind.',
  },
  {
    title: 'Ball Speed',
    body: 'Ball speed is the primary driver of carry. More speed stretches the trajectory downrange. Club speed is shown for reference — smash factor is roughly ball speed ÷ club speed.',
  },
  {
    title: 'Backspin',
    body: 'Backspin creates lift (Magnus force), raising apex and helping the ball hang. Excess spin can balloon the flight and shorten rollout after landing.',
  },
  {
    title: 'Spin Axis & Aim',
    body: 'A tilted spin axis curves the ball (fade/draw). Horizontal launch starts the ball left or right of the target. Combined, they produce shapes like pull-draw or push-fade — mirrored correctly for left-handed players.',
  },
  {
    title: 'Wind, Elevation & Ground',
    body: 'Headwind cuts carry; tailwind adds it. Higher elevation thins the air (lower density), usually adding carry with a flatter flight. Firmer, drier fairways increase bounce and rollout; soft or wet turf kills roll. Use course presets for famous-venue defaults.',
  },
  {
    title: 'Trackman What-Ifs',
    body: 'Import (top bar) a Trackman CSV/JSON to lock your measured launch. The lock card in Shot Controls shows source, club, and shot index — launch stays locked while wind, elevation, and course presets stay editable. Use "Change environment & compare" or Compare: save a baseline, add course overlays, then re-launch to see carry/total/apex deltas. When the file includes measured carry/apex, Compare also shows Measured vs Simulated once the env differs from the import site.',
  },
];

export function GuidedMode() {
  const open = useRangeStore((s) => s.ui.guidedModeOpen);
  const setUi = useRangeStore((s) => s.setUi);
  const [step, setStep] = useState(0);

  if (!open) return null;
  const current = STEPS[step];

  return (
    <div className="absolute left-1/2 top-14 z-30 w-[min(100%-1.5rem,28rem)] -translate-x-1/2 animate-fade-in">
      <div className="panel p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Guided Mode</h3>
          <button
            type="button"
            className="btn-ghost text-xs text-range-muted"
            onClick={() => setUi({ guidedModeOpen: false })}
          >
            Close
          </button>
        </div>
        <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-range-accent">
          Step {step + 1} / {STEPS.length} — {current.title}
        </p>
        <p className="text-sm leading-relaxed text-range-muted">{current.body}</p>
        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            className="btn text-xs"
            disabled={step === 0}
            onClick={() => setStep((s) => s - 1)}
          >
            Back
          </button>
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${i === step ? 'bg-range-accent' : 'bg-range-border'}`}
              />
            ))}
          </div>
          {step < STEPS.length - 1 ? (
            <button type="button" className="btn text-xs" onClick={() => setStep((s) => s + 1)}>
              Next
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary text-xs"
              onClick={() => setUi({ guidedModeOpen: false })}
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
