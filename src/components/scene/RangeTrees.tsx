/**
 * Instanced woodland — terrain-anchored, two silhouette families, one draw call each.
 * Placement is jittered (not parallel rows) and skips fairway / steep peaks / buried toes.
 */
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { FAIRWAY_WIDTH, RANGE_LENGTH, ROUGH_WIDTH } from './RangeEnvironment';
import { hash2, hillRise, terrainY } from './terrain';

type TreeSpot = {
  x: number;
  z: number;
  y: number;
  scale: number;
  yaw: number;
  lean: number;
  tint: THREE.Color;
};

const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _e = new THREE.Euler();
const _c = new THREE.Color();

/** Wind-lean pine: offset stacked fronds — not a centered double-cone. */
function makePinePrototype(): THREE.BufferGeometry {
  const trunk = new THREE.CylinderGeometry(0.11, 0.2, 2.2, 6);
  trunk.translate(0, 1.1, 0);

  const frond = (y: number, r: number, h: number, ox: number, oz: number) => {
    const g = new THREE.ConeGeometry(r, h, 7);
    g.translate(ox, y, oz);
    return g;
  };

  const parts = [
    trunk,
    frond(2.35, 1.35, 2.0, 0.18, -0.12),
    frond(3.35, 1.05, 1.7, -0.22, 0.1),
    frond(4.2, 0.72, 1.35, 0.08, 0.18),
    frond(4.85, 0.42, 0.95, -0.05, -0.06),
  ];
  const merged = mergeGeometries(parts, false);
  parts.forEach((p) => p.dispose());
  if (!merged) throw new Error('Failed to merge pine prototype');
  merged.computeVertexNormals();
  return merged;
}

/** Lumpy hardwood: short bole + irregular overlapping canopy blobs. */
function makeHardwoodPrototype(): THREE.BufferGeometry {
  const trunk = new THREE.CylinderGeometry(0.14, 0.26, 1.6, 6);
  trunk.translate(0, 0.8, 0);

  const blob = (x: number, y: number, z: number, sx: number, sy: number, sz: number) => {
    const g = new THREE.SphereGeometry(1, 7, 6);
    g.scale(sx, sy, sz);
    g.translate(x, y, z);
    return g;
  };

  const parts = [
    trunk,
    blob(0.15, 2.35, -0.1, 1.35, 1.05, 1.2),
    blob(-0.55, 2.55, 0.25, 1.05, 0.95, 1.0),
    blob(0.45, 2.75, 0.35, 0.9, 0.85, 0.95),
    blob(-0.1, 3.15, -0.2, 0.85, 0.7, 0.8),
  ];
  const merged = mergeGeometries(parts, false);
  parts.forEach((p) => p.dispose());
  if (!merged) throw new Error('Failed to merge hardwood prototype');
  merged.computeVertexNormals();
  return merged;
}

function pineTint(seed: number): THREE.Color {
  const t = hash2(seed, seed * 1.7);
  return _c.setRGB(0.08 + t * 0.05, 0.28 + t * 0.12, 0.18 + t * 0.08).clone();
}

function hardwoodTint(seed: number): THREE.Color {
  const t = hash2(seed * 0.9, seed + 3);
  return _c.setRGB(0.14 + t * 0.08, 0.36 + t * 0.14, 0.16 + t * 0.06).clone();
}

/**
 * Organic woodland points — belts along the range + mid-slope hill groves.
 * Every Y comes from terrainY() so nothing floats or clips the hills.
 */
function plantForest(): { pines: TreeSpot[]; hardwoods: TreeSpot[] } {
  const pines: TreeSpot[] = [];
  const hardwoods: TreeSpot[] = [];
  const fairClear = FAIRWAY_WIDTH / 2 + 3.5;

  const push = (list: TreeSpot[], x: number, z: number, seed: number, kind: 'pine' | 'oak') => {
    if (Math.abs(x) < fairClear && z > -12 && z < RANGE_LENGTH + 12) return;

    const rise = hillRise(x, z);
    // Keep toes of hills clear (looks buried) and peaks sparse (looks stuck on a knife edge)
    if (rise > 0 && rise < 2.2) return;
    if (rise > 14) return;

    const y = terrainY(x, z);
    const scale =
      kind === 'pine' ? 0.72 + hash2(seed, z) * 0.55 : 0.65 + hash2(z, seed) * 0.5;
    const yaw = hash2(x, seed) * Math.PI * 2;
    const lean = (hash2(seed, x) - 0.5) * (kind === 'pine' ? 0.18 : 0.1);
    list.push({
      x,
      z,
      y,
      scale,
      yaw,
      lean,
      tint: kind === 'pine' ? pineTint(seed) : hardwoodTint(seed),
    });
  };

  // Sideline groves — staggered cells, not mirrored rows
  for (let z = -15; z < RANGE_LENGTH + 40; z += 7) {
    for (const side of [-1, 1] as const) {
      const cell = hash2(z * 0.13, side + 2);
      if (cell < 0.18) continue; // natural gaps in the belt
      const band = ROUGH_WIDTH / 2 + 4 + hash2(z, side) * 22;
      const x = side * band + (hash2(side * 9, z) - 0.5) * 6;
      const zz = z + (hash2(z, side * 4) - 0.5) * 5.5;
      const kind = hash2(x, zz) > 0.42 ? 'pine' : 'oak';
      push(kind === 'pine' ? pines : hardwoods, x, zz, z * 10 + side * 3, kind);
    }
  }

  // Tee-flank clumps
  for (let i = 0; i < 14; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const x = side * (18 + hash2(i, 2) * 16);
    const z = -14 + hash2(i, 5) * 18;
    push(hash2(i, 1) > 0.4 ? pines : hardwoods, x, z, 200 + i, hash2(i, 1) > 0.4 ? 'pine' : 'oak');
  }

  // Hill mid-slope plantings (sample a coarse grid, keep mid elevations)
  for (let gx = -220; gx <= 220; gx += 11) {
    for (let gz = -160; gz <= 470; gz += 11) {
      const jx = gx + (hash2(gx, gz) - 0.5) * 9;
      const jz = gz + (hash2(gz, gx) - 0.5) * 9;
      const rise = hillRise(jx, jz);
      if (rise < 3.5 || rise > 12.5) continue;
      // Prefer mid-slopes away from the fairway corridor
      if (Math.abs(jx) < fairClear + 8 && jz > 0 && jz < RANGE_LENGTH) continue;
      const gate = hash2(jx * 0.2, jz * 0.17);
      if (gate < 0.55) continue;
      const kind = gate > 0.78 ? 'oak' : 'pine';
      push(kind === 'pine' ? pines : hardwoods, jx, jz, gx * 31 + gz, kind);
    }
  }

  return { pines, hardwoods };
}

function fillInstances(
  mesh: THREE.InstancedMesh,
  spots: TreeSpot[],
  castShadow: boolean,
) {
  mesh.castShadow = castShadow;
  mesh.receiveShadow = false;
  mesh.frustumCulled = true;

  for (let i = 0; i < spots.length; i++) {
    const t = spots[i];
    _e.set(t.lean, t.yaw, t.lean * 0.35);
    _q.setFromEuler(_e);
    _p.set(t.x, t.y, t.z);
    _s.set(t.scale, t.scale, t.scale);
    _m.compose(_p, _q, _s);
    mesh.setMatrixAt(i, _m);
    mesh.setColorAt(i, t.tint);
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.count = spots.length;
}

interface RangeTreesProps {
  shadows?: boolean;
}

export function RangeTrees({ shadows = false }: RangeTreesProps) {
  const pineRef = useRef<THREE.InstancedMesh>(null);
  const oakRef = useRef<THREE.InstancedMesh>(null);

  const { pines, hardwoods, pineGeo, oakGeo } = useMemo(() => {
    const planted = plantForest();
    return {
      ...planted,
      pineGeo: makePinePrototype(),
      oakGeo: makeHardwoodPrototype(),
    };
  }, []);

  useLayoutEffect(() => {
    if (pineRef.current) fillInstances(pineRef.current, pines, shadows);
    if (oakRef.current) fillInstances(oakRef.current, hardwoods, shadows);
  }, [pines, hardwoods, shadows]);

  useLayoutEffect(() => {
    return () => {
      pineGeo.dispose();
      oakGeo.dispose();
    };
  }, [pineGeo, oakGeo]);

  const pineCount = Math.max(pines.length, 1);
  const oakCount = Math.max(hardwoods.length, 1);

  return (
    <group>
      <instancedMesh
        ref={pineRef}
        args={[pineGeo, undefined, pineCount]}
        frustumCulled
      >
        <meshStandardMaterial color="#ffffff" roughness={0.9} metalness={0} />
      </instancedMesh>
      <instancedMesh
        ref={oakRef}
        args={[oakGeo, undefined, oakCount]}
        frustumCulled
      >
        <meshStandardMaterial color="#ffffff" roughness={0.88} metalness={0} />
      </instancedMesh>
    </group>
  );
}
