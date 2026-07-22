import { useMemo } from 'react';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';

const RANGE_LENGTH = 320; // yards
const FAIRWAY_WIDTH = 42;
const ROUGH_WIDTH = 90;

/**
 * Ground depth layer budget (world Y).
 * Distinct coplanar surfaces keep ≥0.05 separation so top-down views
 * (camera ~Y 220) do not z-fight between rough / fairway / tee / markings.
 *
 * Landing markers (Ball.tsx) use Y ≥ 0.11; tee dressing / decor flats use ~0.10.
 * Centerline 0.14 / greens 0.20 sit above those markings.
 */
export const GROUND_Y = {
  rough: -0.06,
  fairway: 0,
  tee: 0.08,
  teeThickness: 0.05,
  centerline: 0.14,
  greens: 0.2,
  landingGrid: 0.26,
} as const;

const FAIRWAY_RGB = { r: 0.25, g: 0.57, b: 0.42 }; // #40916c
const ROUGH_RGB = { r: 0.106, g: 0.263, b: 0.196 }; // #1b4332

function tintedGeometry(
  width: number,
  length: number,
  widthSegs: number,
  lengthSegs: number,
  base: { r: number; g: number; b: number },
  opts: { edgeDarken?: number; stripeAmp?: number; stripeFreq?: number },
) {
  const geo = new THREE.PlaneGeometry(width, length, widthSegs, lengthSegs);
  const colors = new Float32Array(geo.attributes.position.count * 3);
  const pos = geo.attributes.position;
  const halfW = width / 2;
  const edgeDarken = opts.edgeDarken ?? 0.1;
  const stripeAmp = opts.stripeAmp ?? 0;
  const stripeFreq = opts.stripeFreq ?? 0.07;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const edge = Math.min(1, Math.abs(x) / halfW);
    const stripe = stripeAmp > 0 ? Math.sin(y * stripeFreq) * stripeAmp : 0;
    const shade = 1 - edge * edgeDarken + stripe;
    colors[i * 3] = base.r * shade;
    colors[i * 3 + 1] = base.g * shade;
    colors[i * 3 + 2] = base.b * shade;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

function Tree({ position }: { position: [number, number, number] }) {
  const scale = 0.7 + ((position[0] * 13 + position[2] * 7) % 10) / 20;
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.28, 2.4, 6]} />
        <meshStandardMaterial color="#5c4033" roughness={0.95} metalness={0} />
      </mesh>
      <mesh position={[0, 3.2, 0]} castShadow>
        <coneGeometry args={[1.4, 3.2, 7]} />
        <meshStandardMaterial color="#1b4332" roughness={0.9} metalness={0} />
      </mesh>
      <mesh position={[0, 4.6, 0]} castShadow>
        <coneGeometry args={[1.0, 2.2, 7]} />
        <meshStandardMaterial color="#2d6a4f" roughness={0.85} metalness={0} />
      </mesh>
    </group>
  );
}

function DistanceMarker({ yards }: { yards: number }) {
  return (
    <group position={[FAIRWAY_WIDTH / 2 + 2, GROUND_Y.fairway, yards]}>
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[0.12, 1.8, 0.12]} />
        <meshStandardMaterial color="#c9a227" roughness={0.7} metalness={0.15} />
      </mesh>
      <Billboard position={[0, 2.1, 0]}>
        <Text
          fontSize={1.1}
          color="#e8ecf4"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.04}
          outlineColor="#0c0e12"
        >
          {yards}
        </Text>
      </Billboard>
    </group>
  );
}

function TargetGreen({ position, radius }: { position: [number, number, number]; radius: number }) {
  return (
    <group position={[position[0], 0, position[2]]}>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        position={[0, GROUND_Y.greens, 0]}
      >
        <circleGeometry args={[radius, 32]} />
        <meshStandardMaterial
          color="#52b788"
          roughness={0.88}
          metalness={0}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-2}
        />
      </mesh>
      {/* Soft collar — ≥0.05 below green disc to avoid top-down flicker */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, GROUND_Y.greens - 0.05, 0]}>
        <ringGeometry args={[radius * 0.92, radius * 1.08, 32]} />
        <meshStandardMaterial
          color="#2d6a4f"
          roughness={0.95}
          metalness={0}
          transparent
          opacity={0.45}
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 1.8, 6]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.6} metalness={0.05} />
      </mesh>
      <mesh position={[0.35, 1.5, 0]} rotation={[0, 0, -0.4]}>
        <boxGeometry args={[0.7, 0.45, 0.04]} />
        <meshStandardMaterial color="#ef4444" roughness={0.55} metalness={0.05} />
      </mesh>
    </group>
  );
}

/** Raised yard / lane markings — avoids gridHelper coplanar flicker. */
function LandingGridMarkings() {
  const yardLines = useMemo(() => {
    const zs: number[] = [];
    for (let z = 40; z <= 280; z += 20) zs.push(z);
    return zs;
  }, []);

  const laneXs = useMemo(() => {
    const xs: number[] = [];
    const half = FAIRWAY_WIDTH / 2 - 1;
    for (let x = -half; x <= half; x += 6) xs.push(x);
    return xs;
  }, []);

  return (
    <group>
      {yardLines.map((z) => (
        <mesh
          key={`y-${z}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, GROUND_Y.landingGrid, z]}
        >
          <planeGeometry args={[FAIRWAY_WIDTH - 2, 0.12]} />
          <meshStandardMaterial
            color="#1b4332"
            roughness={1}
            metalness={0}
            transparent
            opacity={0.55}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-3}
          />
        </mesh>
      ))}
      {laneXs.map((x) => (
        <mesh
          key={`x-${x}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[x, GROUND_Y.landingGrid, 160]}
        >
          <planeGeometry args={[0.08, 240]} />
          <meshStandardMaterial
            color="#2d6a4f"
            roughness={1}
            metalness={0}
            transparent
            opacity={0.4}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-3}
          />
        </mesh>
      ))}
    </group>
  );
}

interface RangeEnvironmentProps {
  showLandingGrid: boolean;
  showDistanceMarkers: boolean;
}

export function RangeEnvironment({ showLandingGrid, showDistanceMarkers }: RangeEnvironmentProps) {
  // Wider / longer rough so the playing surface feathers into the hinterland skirt
  const roughGeo = useMemo(
    () => tintedGeometry(ROUGH_WIDTH * 3.2, RANGE_LENGTH + 120, 14, 28, ROUGH_RGB, { edgeDarken: 0.18 }),
    [],
  );
  const fairwayGeo = useMemo(
    () =>
      tintedGeometry(FAIRWAY_WIDTH, RANGE_LENGTH, 8, 40, FAIRWAY_RGB, {
        edgeDarken: 0.14,
        stripeAmp: 0.045,
        stripeFreq: 0.09,
      }),
    [],
  );

  const trees = useMemo(() => {
    const list: [number, number, number][] = [];
    // Dense sideline belts + outer rings so the range feels wooded, not sparse
    for (let z = 8; z < RANGE_LENGTH + 30; z += 10) {
      const jitter = (z * 7) % 9;
      list.push([-(ROUGH_WIDTH / 2 + 3), GROUND_Y.rough, z + (jitter % 5)]);
      list.push([ROUGH_WIDTH / 2 + 4, GROUND_Y.rough, z + 3 + (jitter % 4)]);
      list.push([-(ROUGH_WIDTH / 2 + 9), GROUND_Y.rough, z + 5]);
      list.push([ROUGH_WIDTH / 2 + 10, GROUND_Y.rough, z + 1]);
      if (z % 20 === 0) {
        list.push([-(ROUGH_WIDTH / 2 + 16), GROUND_Y.rough, z + 6]);
        list.push([ROUGH_WIDTH / 2 + 18, GROUND_Y.rough, z + 8]);
        list.push([-(ROUGH_WIDTH / 2 + 22), GROUND_Y.rough, z + 2]);
        list.push([ROUGH_WIDTH / 2 + 24, GROUND_Y.rough, z + 11]);
      }
      if (z % 30 === 0) {
        list.push([-(ROUGH_WIDTH / 2 + 28), GROUND_Y.rough, z + 4]);
        list.push([ROUGH_WIDTH / 2 + 30, GROUND_Y.rough, z + 7]);
      }
    }
    // Clusters near the tee sides
    for (let i = 0; i < 8; i++) {
      list.push([-(22 + i * 3), GROUND_Y.rough, -8 + (i % 4) * 3]);
      list.push([22 + i * 3, GROUND_Y.rough, -6 + (i % 3) * 4]);
    }
    return list;
  }, []);

  const markers = [50, 100, 150, 200, 250, 300];
  // Tee pad top sits at GROUND_Y.tee; box extends downward by teeThickness.
  const teeCenterY = GROUND_Y.tee - GROUND_Y.teeThickness / 2;

  return (
    <group>
      {/* Rough — darkest base layer */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, GROUND_Y.rough, RANGE_LENGTH / 2]}
        receiveShadow
        geometry={roughGeo}
      >
        <meshStandardMaterial
          vertexColors
          roughness={0.98}
          metalness={0}
          flatShading={false}
        />
      </mesh>

      {/* Fairway — subtle stripe + edge falloff via vertex colors */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, GROUND_Y.fairway, RANGE_LENGTH / 2]}
        receiveShadow
        geometry={fairwayGeo}
      >
        <meshStandardMaterial vertexColors roughness={0.92} metalness={0} />
      </mesh>

      {/* Tee box — thickened pad (not a coplanar paint layer) */}
      <mesh position={[0, teeCenterY, -2]} receiveShadow castShadow>
        <boxGeometry args={[10, GROUND_Y.teeThickness, 8]} />
        <meshStandardMaterial color="#74c69d" roughness={0.86} metalness={0} />
      </mesh>
      {/* Tee surface highlight */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, GROUND_Y.tee + 0.002, -2]}>
        <planeGeometry args={[9.2, 7.2]} />
        <meshStandardMaterial
          color="#95d5b2"
          roughness={0.82}
          metalness={0}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>

      {showLandingGrid && <LandingGridMarkings />}

      {/* Center line */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, GROUND_Y.centerline, RANGE_LENGTH / 2]}
      >
        <planeGeometry args={[0.18, RANGE_LENGTH]} />
        <meshStandardMaterial
          color="#d8f3dc"
          transparent
          opacity={0.4}
          roughness={1}
          metalness={0}
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-2}
        />
      </mesh>

      {showDistanceMarkers &&
        markers.map((yd) => <DistanceMarker key={yd} yards={yd} />)}

      <TargetGreen position={[-8, 0, 120]} radius={6} />
      <TargetGreen position={[10, 0, 180]} radius={7} />
      <TargetGreen position={[-4, 0, 240]} radius={8} />
      <TargetGreen position={[6, 0, 300]} radius={9} />

      {trees.map((pos, i) => (
        <Tree key={i} position={pos} />
      ))}

      {/* Back fence mass — keep low opacity; RangeDecor owns posts/cables/mesh detail */}
      <mesh position={[0, 4, RANGE_LENGTH + 8]}>
        <boxGeometry args={[ROUGH_WIDTH * 1.4, 8, 0.4]} />
        <meshStandardMaterial color="#1a1f28" transparent opacity={0.22} roughness={0.9} depthWrite={false} />
      </mesh>
    </group>
  );
}
