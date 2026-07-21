# RangeLab

Interactive 3D golf ball-flight simulator and virtual driving-range analysis tool.

Built with React, TypeScript, Vite, Three.js (`@react-three/fiber` + `@react-three/drei`), Tailwind CSS, Zustand, Recharts, and Vitest.

## Features

- Procedural driving range with tee box, fairway, rough, markers, greens, trees, sky, and weather
- Credible ball-flight physics: gravity, drag, Magnus lift, wind, bounce, and rollout
- Club presets (Driver → PW) plus custom clubs
- Adjustable launch conditions, wind, air density, ground firmness, and moisture
- Shot tracers, landing markers, and six camera modes
- Full shot metrics and shape classification (RH / LH aware)
- 10-ball practice sessions with dispersion charts, replay, tracer toggles, and JSON/CSV export
- Guided mode, keyboard shortcuts, performance settings, error boundary, and loading state

## Quick start

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start development server |
| `npm run build` | Typecheck and production build |
| `npm run preview` | Preview production build |
| `npm test` | Run unit tests |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## Trackman / launch-monitor import

Use **Import** in the top bar to load a Trackman-style CSV or JSON export.

Expected columns (flexible aliases): Ball Speed, Club Speed, Launch Angle, Launch Direction, Spin Rate, Spin Axis, Club.

Imported launch values can be **locked** so you only change environment (wind, elevation, course presets, turf) for what-if comparisons.

## Course presets & elevation

Famous-course presets apply suggested wind, elevation, moisture, and firmness (simulator defaults — not live weather). Elevation drives air density in the flight model.

Use **Compare** to save a baseline shot and overlay alternate course environments with carry deltas.

| Key | Action |
| --- | --- |
| `Space` | Launch shot |
| `1`–`6` | Camera modes (Behind, Follow, Side, Landing, Orbit, Top) |
| `R` | Replay last shot |
| `G` | Toggle guided mode |

## Physics

Flight simulation lives in `src/physics/` and is independent of Three.js so it can be unit tested.

- Fixed timestep RK4 integration during flight
- Quadratic drag + spin-dependent lift
- Wind as relative air velocity
- Bounce restitution from ground firmness
- Friction rollout modulated by moisture and residual spin

## Deploy

### Vercel

The repo includes `vercel.json` (SPA rewrite).

```bash
npx vercel
```

Or connect the GitHub repo in the Vercel dashboard — build command `npm run build`, output `dist`.

### Netlify

The repo includes `netlify.toml`.

```bash
npx netlify deploy --prod
```

Or connect the repo in Netlify — build `npm run build`, publish `dist`.

## Project layout

```
src/
  physics/     # Flight model, clubs, classification (tested)
  store/       # Zustand app state
  components/
    scene/     # R3F range, ball, tracers, cameras
    controls/  # Launch parameter UI
    layout/    # Panels, session, guide, settings
    charts/    # Dispersion & trajectory charts
  hooks/       # Keyboard shortcuts
  utils/       # Storage, export, session stats
```

Agent / multitask handoff: see [AGENTS.md](AGENTS.md) and [docs/](docs/).

## License

MIT
