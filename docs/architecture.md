# Architecture

RangeLab is a Vite + React 18 SPA: full-bleed React Three Fiber range with overlay UI. Simulation is pure TypeScript in `src/physics/`; app state is a single Zustand store.

## Shell

```
App (ErrorBoundary)
 └─ AppShell
     ├─ RangeScene          # absolute full viewport Canvas
     ├─ LoadingScreen
     ├─ TopBar | ControlPanel | ResultsPanel | CameraBar
     └─ GuidedMode | SettingsPanel | SessionPanel
        | TrackmanImportPanel | EnvComparePanel
```

- Panel visibility: `ui.*Open` / `isLoading` in the store.
- Shortcuts (`useKeyboardShortcuts`): Space launch · 1–6 cameras · R replay · G guided.
- Scene ready: `RangeScene` → `onReady` → clear loading after ~400ms.

## Store domains (`useRangeStore.ts`)

| Domain | State | Key actions |
|--------|--------|-------------|
| Clubs / inputs | `clubs`, `selectedClubId`, `inputs`, `selectedCourseId` | `setClub`, `updateInput`, `setElevation`, `applyCoursePreset`, custom club CRUD |
| Presentation | `weather`, `cameraMode`, `performance`, `ui` | setters / `setUi` |
| Measured import | `measuredLock`, `importedBatch`, index | `importMeasuredBatch`, `selectImportedShot`, `stepImportedShot`, lock clear |
| Env compare | `baseline*`, `comparisonOverlays` (max 4) | `saveBaseline`, `compareAgainstCourse/Baseline`, toggles |
| Simulation / playback | `lastResults`, `isPlaying`, `playbackTime`, speed | `launchShot`, playback setters |
| Sessions | `activeSession`, `recentSessions` (≤20), `replayShotId` | start/end/load/delete, tracer toggle, `importPracticeSession` |

Behaviors to preserve:

- `measuredLock.locked` blocks launch-field edits; env stays editable.
- Elevation always syncs `airDensityKgM3` via `airDensityFromElevationFt`.
- Editing wind / firmness / moisture clears `selectedCourseId` (elevation edits also clear it).
- `launchShot` always calls `simulateShot(inputs)`; active session appends a `SessionShot` and persists via `storage.ts`.

## Physics pipeline

```
Club / sliders / import
  → ShotInputs (player-perspective aim & spin axis)
  → simulateShot() [physics/flight.ts]
       1. Init velocity from ballSpeed, launchAngle, horizontalLaunch
          (handedness → world yaw / spin via classify.ts)
       2. Flight: RK4 @ DT=1/240; gravity + drag + Magnus + constant wind
       3. First ground hit → carry; restitution(firmness) + friction
       4. Bounce (≤6) → roll → rest
       5. Classify shape; package ShotResults + ~60 Hz trajectory
  → store lastResults, playback
  → RangeScene samples trajectory for Ball / ShotTracer
```

- World: +Z target line, +X right.
- Atmosphere: ISA-ish density from elevation (`atmosphere.ts`). Course presets set elevation → density + wind/moisture/firmness. Weather (`day|sunset|overcast`) is visual only.

## Import / export

### Import

1. `TrackmanImportPanel` → `parseImportFile` (`sessionImport.ts`)
2. **JSON PracticeSession** (or shot array) → `importPracticeSession`
3. **CSV / Trackman JSON** → launches → single/batch lock **or** `sessionFromMeasuredLaunches` (re-sim) → `importPracticeSession`
4. Batch applies `applyMeasuredLaunch` (env preserved unless file carries wind/elev), locks launch, matches/creates club by name

### Export / persistence

- `sessionToJson` / `sessionToCsv` + download (`sessionStats.ts`)
- CSV headers align with Trackman aliases for reimport
- `localStorage` key `rangelab.sessions.v1` (`storage.ts`), max 20 sessions

## Extension points

| Feature | Where |
|---------|--------|
| Club defaults | `physics/clubs.ts` |
| Course env | `data/coursePresets.ts` |
| Physics model | `physics/flight.ts` (+ tests) |
| Shape thresholds | `physics/classify.ts` |
| Trackman columns | `HEADER_ALIASES` / `objectToLaunch` in `trackmanImport.ts` |
| New panel | `App.tsx` + `AppUiState` + layout component |
| Scene visuals | `components/scene/*` (keep sim out) |
| Compare scenarios | store `compareAgainst*` / overlays |
| Export columns | `sessionStats.ts` |

## Tech debt / fragile areas

1. Monolithic store (~600+ lines) — hard to unit-test in isolation.
2. Bounce/roll yardages are heuristic in places, not always phase-true.
3. Spin magnitude mostly fixed in flight (cut on bounce); limited spin decay.
4. Flat range only — no terrain/lie; wind is a constant vector.
5. CSV headers are exact-alias; renames fail with warnings only.
6. Full trajectories in localStorage — quota risk; silent catch on write failure.
7. CSV re-sim can diverge from originally exported numeric results.
8. Handedness conventions span classify / flight / UI — easy to break.
9. Course preset identity cleared by some env edits but not all (e.g. wind direction).
10. Sessions hard-capped at 10 balls; custom clubs have `updateCustomClub` with no UI.

## Tests

| File | Coverage |
|------|----------|
| `src/physics/flight.test.ts` | Speed / wind / spin / ground / club carry |
| `src/physics/atmosphere.test.ts` | Elevation → density & carry |
| `src/physics/classify.test.ts` | RH / LH shapes |
| `src/utils/trackmanImport.test.ts` | CSV/JSON parse + env-preserving apply |
| `src/utils/sessionImport.test.ts` | Session round-trip + rebuild from launches |

Run: `npm test`. No store / UI / scene tests yet.
