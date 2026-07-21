# Workstreams — three parallel branches

Base tip after docs land: commit on `master` that includes session import round-trip + this docs pack. Create or check out each branch from that tip. Multitask agents should stay on **one** branch each.

## Branch map

| Branch | Product goal | Primary owners |
|--------|--------------|----------------|
| `feat/physics-apex-tuning` | Credible apex (esp. driver) vs Trackman / feel | Physics + tests |
| `feat/coach-share-replay` | Share a session so a coach can replay the virtual range | Sessions / export / charts |
| `feat/measured-what-if-ux` | Clear “this is measured launch; only env changes” flow | Import lock + compare + guided |

---

## 1. `feat/physics-apex-tuning`

### Problem

Driver apex can run high; lift/drag balance may need calibration against measured carry/apex pairs.

### Own

- `src/physics/flight.ts`
- `src/physics/constants.ts`
- `src/physics/atmosphere.ts` (only if density coupling is required)
- `src/physics/clubs.ts` (default launch/spin if part of calibration)
- `src/physics/*.test.ts`

### Avoid

- Layout panels, import/export, store session/compare domains
- Touch `ResultsPanel` only if labeling units or showing a debug delta is required

### Suggested approach

1. Add regression fixtures: known launch → expected apex/carry bands (even rough Trackman pairs).
2. Tune `liftCoefficient` / drag / spin–lift coupling; keep RH/LH classify unchanged unless tests force it.
3. Document chosen calibration targets in the PR body (sources, clubs, env).

### Done when

- `npm test` green; new apex/carry assertions cover the regression
- Driver apex directionally improved without wrecking iron carry relationships already tested

---

## 2. `feat/coach-share-replay`

### Problem

Export exists, but “share with a coach” is still file copy. Session UX is capped at 10 balls; replay is local-only.

### Own

- `src/components/layout/SessionPanel.tsx`
- `src/components/charts/SessionCharts.tsx`
- `src/utils/sessionStats.ts`
- `src/utils/sessionImport.ts` (+ `sessionImport.test.ts`)
- `src/utils/storage.ts`
- TopBar session open/close bits if needed
- Store **session** actions only (prefer utils helpers first)

### Avoid

- `physics/`
- `EnvComparePanel`, measured-lock ControlPanel card (coordinate if share needs lock metadata)

### Suggested approach

1. Clarify share payload (JSON session is already round-trippable — build UX around that).
2. Optional: read-only “coach replay” UI mode (hide launch edits; show tracers + scrub).
3. Optional later: pasteable blob / URL hash — only if product decides (see roadmap). Avoid auth unless asked.

### Done when

- Coach can receive a file (or paste) and reload full tracers/metrics without re-entering launches
- Session export/import copy in UI matches behavior; tests cover any new format fields

---

## 3. `feat/measured-what-if-ux`

### Problem

Lock + batch nav + compare exist, but the “measured fingerprint → change only environment” story can be clearer (dual readout, compare entry points, guided copy).

### Own

- `src/components/controls/ControlPanel.tsx` (measured lock card + batch ←→)
- `src/components/layout/TrackmanImportPanel.tsx`
- `src/components/layout/EnvComparePanel.tsx`
- `src/components/layout/GuidedMode.tsx`
- Measured / compare types in `src/types/index.ts`
- Store **measured*** / **compare*** actions only
- Light touch `trackmanImport.ts` if aliases/UX need it

### Avoid

- `physics/`
- Session charts / session persistence (unless compare needs a single metric from stats)

### Suggested approach

1. Strengthen lock banner: source label, club, shot index, “env editable / launch locked”.
2. Tighten compare flow: save baseline → course overlays → clear; reduce overlap with GuidedMode placement if both fight the bottom center.
3. Consider Measured vs Simulated dual metrics (carry/apex) when env differs from import site.

### Done when

- New user can import → lock → change elevation/course → see deltas without unlocking launch
- Guided step for Trackman what-ifs matches actual UI

---

## Multitask checklist

Before launching three agents:

1. Confirm clean `master` with import WIP + docs commits.
2. `git checkout -b feat/physics-apex-tuning` (and the other two) from that tip — or let each agent create its branch.
3. Point each agent at **this file** + `AGENTS.md` + its section only.
4. Remind: rebase often; store conflicts are expected — merge by **union of action groups**, never by taking one side wholesale.
5. Land physics first if compare/UX will assert numeric apex targets; otherwise land UX branches independently.

## Merge order suggestion

1. `feat/physics-apex-tuning` (behavior change; others may need to re-baseline expectations)
2. `feat/measured-what-if-ux` and `feat/coach-share-replay` (either order if store edits stayed in their domains)
