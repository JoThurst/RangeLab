/**
 * Shared countryside terrain: hill patches + analytical height sampling.
 * Trees and hill meshes must use the same formula so trunks sit on the ground.
 */
import * as THREE from 'three';
import { GROUND_Y } from './RangeEnvironment';

export const SKIRT_Y = GROUND_Y.rough - 0.08;
export const HILL_BASE_Y = GROUND_Y.rough - 0.04;

export type HillPatch = {
  id: string;
  /** World-space center (Y ignored — always HILL_BASE_Y). */
  origin: [number, number, number];
  width: number;
  length: number;
  segsW: number;
  segsL: number;
  peak: number;
  ridgeAxis: 'x' | 'z';
  noise: number;
};

/** Left / right / behind-tee / beyond-net ridges framing the range. */
export const HILL_PATCHES: readonly HillPatch[] = [
  {
    id: 'left',
    origin: [-120, 0, 140],
    width: 140,
    length: 380,
    segsW: 18,
    segsL: 28,
    peak: 18,
    ridgeAxis: 'z',
    noise: 2.2,
  },
  {
    id: 'right',
    origin: [125, 0, 150],
    width: 150,
    length: 400,
    segsW: 18,
    segsL: 28,
    peak: 22,
    ridgeAxis: 'z',
    noise: 2.6,
  },
  {
    id: 'rear',
    origin: [0, 0, -90],
    width: 420,
    length: 160,
    segsW: 32,
    segsL: 16,
    peak: 14,
    ridgeAxis: 'x',
    noise: 1.8,
  },
  {
    id: 'back',
    origin: [0, 0, 400],
    width: 380,
    length: 180,
    segsW: 28,
    segsL: 16,
    peak: 16,
    ridgeAxis: 'x',
    noise: 2.0,
  },
] as const;

export function hash2(x: number, z: number) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Local height above HILL_BASE_Y for a point in a patch's plane (local X/Y). */
export function hillLocalHeight(lx: number, ly: number, patch: HillPatch): number {
  const halfW = patch.width / 2;
  const halfL = patch.length / 2;
  if (Math.abs(lx) > halfW || Math.abs(ly) > halfL) return 0;

  const nx = lx / halfW;
  const ny = ly / halfL;
  const along = patch.ridgeAxis === 'x' ? nx : ny;
  const across = patch.ridgeAxis === 'x' ? ny : nx;
  const mound =
    Math.cos(across * Math.PI * 0.5) *
    Math.max(0, 1 - Math.abs(along) * 0.55) *
    patch.peak;
  const ripples =
    Math.sin(lx * 0.045 + ly * 0.03) * patch.noise +
    Math.sin(lx * 0.09 - ly * 0.07) * patch.noise * 0.45;
  return Math.max(0, mound + ripples);
}

/** World Y of the highest surface at (x, z) — flat rough or any hill. */
export function terrainY(worldX: number, worldZ: number): number {
  let y: number = GROUND_Y.rough;
  for (const patch of HILL_PATCHES) {
    const lx = worldX - patch.origin[0];
    const ly = worldZ - patch.origin[2];
    const h = hillLocalHeight(lx, ly, patch);
    if (h > 0) y = Math.max(y, HILL_BASE_Y + h);
  }
  return y;
}

/** Hill rise above flat rough — used to prefer mid-slope planting. */
export function hillRise(worldX: number, worldZ: number): number {
  return Math.max(0, terrainY(worldX, worldZ) - GROUND_Y.rough);
}

const HILL_RGB = { r: 0.12, g: 0.28, b: 0.2 };
const HILL_DARK = { r: 0.07, g: 0.18, b: 0.13 };

export function makeHillGeometry(patch: HillPatch): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(patch.width, patch.length, patch.segsW, patch.segsL);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const h = hillLocalHeight(x, y, patch);
    pos.setZ(i, h);

    const elev = h / Math.max(patch.peak, 0.001);
    const shade = 0.85 + elev * 0.2 + (hash2(x, y) - 0.5) * 0.06;
    const base = elev > 0.55 ? HILL_RGB : HILL_DARK;
    colors[i * 3] = base.r * shade;
    colors[i * 3 + 1] = base.g * shade;
    colors[i * 3 + 2] = base.b * shade;
  }

  pos.needsUpdate = true;
  geo.computeVertexNormals();
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}
