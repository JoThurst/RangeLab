/**
 * World beyond the playing surface — kills the hard ground cliff,
 * frames the range with hills, and fills the horizon with trees.
 * Keeps Y below RangeEnvironment rough (-0.06) so no z-fight.
 */
import { useMemo } from 'react';
import * as THREE from 'three';
import { GROUND_Y } from './RangeEnvironment';

const SKIRT_Y = GROUND_Y.rough - 0.08;
const HILL_BASE_Y = GROUND_Y.rough - 0.04;

const FIELD_RGB = { r: 0.09, g: 0.22, b: 0.16 };
const HILL_RGB = { r: 0.12, g: 0.28, b: 0.2 };
const HILL_DARK = { r: 0.07, g: 0.18, b: 0.13 };

function hash2(x: number, z: number) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Broad countryside underlay so the sky never shows as a white cliff. */
function makeSkirtGeometry() {
  const width = 900;
  const length = 900;
  const geo = new THREE.PlaneGeometry(width, length, 24, 24);
  const colors = new Float32Array(geo.attributes.position.count * 3);
  const pos = geo.attributes.position;
  const halfW = width / 2;
  const halfL = length / 2;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const nx = Math.abs(x) / halfW;
    const nz = Math.abs(y) / halfL;
    const rim = Math.max(nx, nz);
    // Darken toward horizon so fog + ground blend instead of a bright cut
    const shade = 1 - rim * 0.35;
    const jitter = (hash2(x, y) - 0.5) * 0.04;
    colors[i * 3] = FIELD_RGB.r * shade + jitter;
    colors[i * 3 + 1] = FIELD_RGB.g * shade + jitter;
    colors[i * 3 + 2] = FIELD_RGB.b * shade + jitter;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

function makeHillGeometry(opts: {
  width: number;
  length: number;
  segsW: number;
  segsL: number;
  peak: number;
  ridgeAxis: 'x' | 'z';
  noise: number;
}) {
  const geo = new THREE.PlaneGeometry(opts.width, opts.length, opts.segsW, opts.segsL);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i); // plane local Y → world Z after rotation
    const nx = x / (opts.width / 2);
    const ny = y / (opts.length / 2);
    const along = opts.ridgeAxis === 'x' ? nx : ny;
    const across = opts.ridgeAxis === 'x' ? ny : nx;
    // Soft mound: tall along the middle ridge, falling off at the ends
    const mound =
      Math.cos(across * Math.PI * 0.5) *
      Math.max(0, 1 - Math.abs(along) * 0.55) *
      opts.peak;
    const ripples =
      Math.sin(x * 0.045 + y * 0.03) * opts.noise +
      Math.sin(x * 0.09 - y * 0.07) * opts.noise * 0.45;
    // PlaneGeometry is XY; after rotX(-PI/2), local Z becomes world Y
    pos.setZ(i, Math.max(0, mound + ripples));

    const elev = pos.getZ(i) / Math.max(opts.peak, 0.001);
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

function HillTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const s = scale;
  return (
    <group position={position} scale={s}>
      <mesh position={[0, 1.0, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.22, 2.0, 5]} />
        <meshStandardMaterial color="#4a3728" roughness={0.95} />
      </mesh>
      <mesh position={[0, 2.7, 0]} castShadow>
        <coneGeometry args={[1.15, 2.6, 6]} />
        <meshStandardMaterial color="#1a3d2e" roughness={0.92} />
      </mesh>
      <mesh position={[0, 3.9, 0]} castShadow>
        <coneGeometry args={[0.8, 1.8, 6]} />
        <meshStandardMaterial color="#245c43" roughness={0.88} />
      </mesh>
    </group>
  );
}

function sampleHillSurface(
  geo: THREE.BufferGeometry,
  localX: number,
  localY: number,
  width: number,
  length: number,
): number {
  // Approximate height from nearest vertex (good enough for tree placement)
  const pos = geo.attributes.position;
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < pos.count; i++) {
    const dx = pos.getX(i) - localX;
    const dy = pos.getY(i) - localY;
    const d = dx * dx + dy * dy;
    if (d < bestD) {
      bestD = d;
      best = pos.getZ(i);
    }
  }
  // Clamp samples to hill footprint
  if (Math.abs(localX) > width / 2 || Math.abs(localY) > length / 2) return 0;
  return best;
}

interface RangeHinterlandProps {
  shadows?: boolean;
}

export function RangeHinterland({ shadows = false }: RangeHinterlandProps) {
  const skirtGeo = useMemo(() => makeSkirtGeometry(), []);

  const leftHill = useMemo(
    () =>
      makeHillGeometry({
        width: 140,
        length: 380,
        segsW: 18,
        segsL: 28,
        peak: 18,
        ridgeAxis: 'z',
        noise: 2.2,
      }),
    [],
  );
  const rightHill = useMemo(
    () =>
      makeHillGeometry({
        width: 150,
        length: 400,
        segsW: 18,
        segsL: 28,
        peak: 22,
        ridgeAxis: 'z',
        noise: 2.6,
      }),
    [],
  );
  const rearHill = useMemo(
    () =>
      makeHillGeometry({
        width: 420,
        length: 160,
        segsW: 32,
        segsL: 16,
        peak: 14,
        ridgeAxis: 'x',
        noise: 1.8,
      }),
    [],
  );
  const backHill = useMemo(
    () =>
      makeHillGeometry({
        width: 380,
        length: 180,
        segsW: 28,
        segsL: 16,
        peak: 16,
        ridgeAxis: 'x',
        noise: 2.0,
      }),
    [],
  );

  const hillTrees = useMemo(() => {
    type Spot = { pos: [number, number, number]; scale: number };
    const spots: Spot[] = [];

    const scatter = (
      geo: THREE.BufferGeometry,
      origin: [number, number, number],
      width: number,
      length: number,
      count: number,
      seed: number,
    ) => {
      for (let i = 0; i < count; i++) {
        const u = hash2(seed + i * 3.1, seed * 0.7);
        const v = hash2(seed * 1.3, i * 5.7 + seed);
        const lx = (u - 0.5) * width * 0.85;
        const ly = (v - 0.5) * length * 0.85;
        const h = sampleHillSurface(geo, lx, ly, width, length);
        if (h < 1.5) continue;
        spots.push({
          pos: [origin[0] + lx, origin[1] + h, origin[2] + ly],
          scale: 0.65 + hash2(i, seed) * 0.7,
        });
      }
    };

    // Left / right hills sit beside the rough; rear behind tee; back beyond net
    scatter(leftHill, [-120, HILL_BASE_Y, 140], 140, 380, 55, 11);
    scatter(rightHill, [125, HILL_BASE_Y, 150], 150, 400, 60, 29);
    scatter(rearHill, [0, HILL_BASE_Y, -90], 420, 160, 40, 47);
    scatter(backHill, [0, HILL_BASE_Y, 400], 380, 180, 45, 63);

    return spots;
  }, [leftHill, rightHill, rearHill, backHill]);

  return (
    <group>
      {/* Countryside skirt — extends past fog far so edges dissolve, not cliff */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, SKIRT_Y, 160]}
        receiveShadow={shadows}
        geometry={skirtGeo}
      >
        <meshStandardMaterial vertexColors roughness={1} metalness={0} />
      </mesh>

      {/* Left ridge */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[-120, HILL_BASE_Y, 140]}
        receiveShadow={shadows}
        castShadow={shadows}
        geometry={leftHill}
      >
        <meshStandardMaterial vertexColors roughness={0.96} metalness={0} />
      </mesh>

      {/* Right ridge */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[125, HILL_BASE_Y, 150]}
        receiveShadow={shadows}
        castShadow={shadows}
        geometry={rightHill}
      >
        <meshStandardMaterial vertexColors roughness={0.96} metalness={0} />
      </mesh>

      {/* Behind the tee */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, HILL_BASE_Y, -90]}
        receiveShadow={shadows}
        castShadow={shadows}
        geometry={rearHill}
      >
        <meshStandardMaterial vertexColors roughness={0.96} metalness={0} />
      </mesh>

      {/* Beyond the back net */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, HILL_BASE_Y, 400]}
        receiveShadow={shadows}
        castShadow={shadows}
        geometry={backHill}
      >
        <meshStandardMaterial vertexColors roughness={0.96} metalness={0} />
      </mesh>

      {hillTrees.map((t, i) => (
        <HillTree key={i} position={t.pos} scale={t.scale} />
      ))}
    </group>
  );
}
