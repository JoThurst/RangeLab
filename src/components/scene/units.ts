import { metersToYards, YARDS_PER_METER } from '../../physics/constants';
import type { FlightSample } from '../../types';

/** Convert physics meters → Three.js scene units (1 unit = 1 yard for readable scale). */
export function mToScene(meters: number): number {
  return meters * YARDS_PER_METER;
}

export function sceneToYards(sceneUnits: number): number {
  return sceneUnits;
}

export function sampleAtTime(trajectory: FlightSample[], time: number): FlightSample {
  if (!trajectory.length) {
    return { t: 0, position: { x: 0, y: 0.05, z: 0 }, velocity: { x: 0, y: 0, z: 0 }, phase: 'rest' };
  }
  if (time <= trajectory[0].t) return trajectory[0];
  if (time >= trajectory[trajectory.length - 1].t) return trajectory[trajectory.length - 1];

  let lo = 0;
  let hi = trajectory.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (trajectory[mid].t <= time) lo = mid;
    else hi = mid;
  }
  const a = trajectory[lo];
  const b = trajectory[hi];
  const span = b.t - a.t || 1;
  const u = (time - a.t) / span;
  return {
    t: time,
    position: {
      x: a.position.x + (b.position.x - a.position.x) * u,
      y: a.position.y + (b.position.y - a.position.y) * u,
      z: a.position.z + (b.position.z - a.position.z) * u,
    },
    velocity: {
      x: a.velocity.x + (b.velocity.x - a.velocity.x) * u,
      y: a.velocity.y + (b.velocity.y - a.velocity.y) * u,
      z: a.velocity.z + (b.velocity.z - a.velocity.z) * u,
    },
    phase: u < 0.5 ? a.phase : b.phase,
  };
}

export function trajectoryToScenePoints(trajectory: FlightSample[], maxPoints: number): Float32Array {
  const step = Math.max(1, Math.ceil(trajectory.length / maxPoints));
  const pts: number[] = [];
  for (let i = 0; i < trajectory.length; i += step) {
    const p = trajectory[i].position;
    pts.push(mToScene(p.x), mToScene(p.y), mToScene(p.z));
  }
  const last = trajectory[trajectory.length - 1]?.position;
  if (last) {
    const lx = mToScene(last.x);
    const ly = mToScene(last.y);
    const lz = mToScene(last.z);
    const n = pts.length;
    if (n < 3 || pts[n - 3] !== lx || pts[n - 2] !== ly || pts[n - 1] !== lz) {
      pts.push(lx, ly, lz);
    }
  }
  return new Float32Array(pts);
}

export { metersToYards };
