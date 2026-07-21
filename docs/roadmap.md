# Roadmap & open design questions

Captured for product decisions and agent planning. Not commitments.

## Shipped (baseline)

- Procedural 3D range, 6 cameras, clubs, RH/LH shapes
- Physics: RK4, drag/lift/wind/bounce/roll (unit tested)
- 10-ball sessions, charts, replay, tracers, localStorage
- Elevation → air density; 15 course presets
- Trackman import + measured lock + batch ←→ navigation
- Env compare overlays
- Session export round-trip (JSON full reload; CSV → launches or re-sim session)

## Active parallel tracks

See [workstreams.md](workstreams.md):

1. Physics / apex tuning  
2. Coach-share / session replay  
3. Measured fingerprint → what-if UX  

## Open questions

Answer these before over-building share or calibration systems.

### Coach-share

1. Is share **file download only**, or also pasteable JSON / URL hash?
2. Should coach mode be **read-only replay** (no launch edits), or allow what-if env on the shared session?
3. Any need for auth / cloud later, or keep 100% local?

### Measured → what-if

4. Keep “lock launch, scrub env,” or add an explicit **Measured vs Simulated** dual readout (carry/apex side-by-side)?
5. Should import site environment (if present in file) become the **baseline** automatically?
6. Max overlays stay at 4, or grow with session size?

### Physics / apex

7. Calibrate against **Trackman carry/apex pairs**, or tune lift coefficients globally by feel?
8. Prefer fixing **driver only** first, or keep iron relationships in the same PR?
9. Are bounce/roll heuristics in scope, or air-phase apex only for v1 of tuning?

### Audience & session model

10. Primary user: **personal practice** vs **coach-facing** product? (drives UI density)
11. Stay at **10-ball** local sessions, or multi-club bags / uncapped soon?
12. When CSV reimports: always **re-simulate**, or trust exported trajectories when present? (JSON already prefers stored trajectories)

### Platform (later)

13. Terrain / uneven lies?
14. Units toggle (metric) and shortcut help in Settings?
15. Store split / tests for Zustand domains?

## Known UX gaps (non-blocking)

- Custom clubs: add works; `updateCustomClub` has no UI
- Elevation + manual air-density can confuse if both exposed without clear primary
- Guided + Compare both use bottom-center space
- Trajectory chart shows last 6 visible tracers only
- Settings are performance-focused (no units / shortcuts panel)

## Decision log

| Date | Decision | Notes |
|------|----------|-------|
| 2026-07-21 | Parallelize handoff trio on 3 branches | See workstreams.md |
| 2026-07-21 | Commit session import WIP before docs | Shared base for multitask |
