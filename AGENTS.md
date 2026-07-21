# RangeLab — agent guide

Interactive 3D golf ball-flight simulator (`C:\Code\GolfLauncher`). React + TypeScript + Vite + R3F/drei + Tailwind + Zustand + Recharts + Vitest.

Use this file plus `docs/` when spinning parallel agents. Prefer **one workstream per branch**; do not mix physics, coach-share, and measured-what-if UX in the same PR unless coordinating a store merge.

## Commands

```bash
npm install
npm run dev      # usually http://localhost:5173
npm test
npm run build
npm run lint
```

## Architecture (read first)

| Path | Owns |
|------|------|
| `src/physics/` | Pure flight model (RK4, drag/lift/wind/bounce). Unit-tested. **No React/Three.** |
| `src/store/useRangeStore.ts` | Single Zustand hub — **merge hotspot**. Touch only your action group. |
| `src/types/index.ts` | Domain types (`ShotInputs`, `ShotResults`, sessions, locks, overlays) |
| `src/utils/` | Trackman/session import, export, localStorage, stats |
| `src/data/coursePresets.ts` | Named course env defaults (not live weather) |
| `src/components/scene/` | R3F rendering + playback; do not put physics here |
| `src/components/controls/` | Launch / env UI |
| `src/components/layout/` | Panels (session, import, compare, results, guide, settings) |
| `src/components/charts/` | Dispersion / trajectory charts |

Full detail: [docs/architecture.md](docs/architecture.md).

## Parallel workstreams (3 branches)

| Branch | Focus | Own these files | Avoid |
|--------|--------|-----------------|-------|
| `feat/physics-apex-tuning` | Driver apex / lift-drag calibration | `src/physics/**`, related tests, club defaults in `physics/clubs.ts` | Layout panels (Results apex label only if needed) |
| `feat/coach-share-replay` | Coach share + richer session replay | `SessionPanel`, `SessionCharts`, `sessionStats`, `sessionImport`(+test), `storage`, TopBar session bits | Physics, EnvCompare |
| `feat/measured-what-if-ux` | Measured fingerprint → env what-if UX | `ControlPanel` lock card, `TrackmanImportPanel`, `EnvComparePanel`, `GuidedMode`, measured/compare types + store actions | `physics/`, charts |

Details and acceptance notes: [docs/workstreams.md](docs/workstreams.md). Product open questions: [docs/roadmap.md](docs/roadmap.md).

### Store conflict rule

If you must change `useRangeStore.ts`:

1. Add or edit **only** actions in your domain (sessions / measured+compare / launch helpers).
2. Prefer new small helpers in `src/utils/` over growing the store.
3. Rebase onto `master` often; resolve store conflicts carefully — do not silently drop another workstream’s actions.
4. Do not rename shared state keys without updating all three workstreams.

## Non-negotiables

- Keep physics pure and tested (`npm test` must pass).
- Handedness conventions live in `physics/classify.ts` — do not invent a second mapping in UI.
- Elevation drives air density via `setElevation` / `airDensityFromElevationFt`; do not desync them without UX intent.
- No drive-by refactors outside your owned files.
- Do not commit secrets. Do not push `--force` to `main`/`master` unless the user explicitly asks.
- Only commit when the user asks (or the task explicitly includes committing).

## Quick data flows

**Hit a shot:** UI / Space → `launchShot()` → `simulateShot(inputs)` → `lastResults` + playback → scene samples trajectory.

**Import:** file → `parseImportFile` (`sessionImport.ts`) → session JSON **or** Trackman launches → store `importPracticeSession` / `importMeasuredBatch`.

**Export:** `sessionToJson` / `sessionToCsv` (`sessionStats.ts`); JSON round-trips; CSV reimports as launches or re-simulated session.

## Docs index

- [docs/architecture.md](docs/architecture.md) — system map, flows, tech debt
- [docs/workstreams.md](docs/workstreams.md) — branch ownership + agent briefs
- [docs/roadmap.md](docs/roadmap.md) — open product/design questions
- [README.md](README.md) — user-facing overview
