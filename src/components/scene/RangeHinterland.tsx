/**
 * World beyond the playing surface — countryside skirt + framing hills.
 * Trees live in RangeTrees (terrain-anchored instancing).
 */
import { useMemo } from 'react';
import * as THREE from 'three';
import { hash2, HILL_BASE_Y, HILL_PATCHES, makeHillGeometry, SKIRT_Y } from './terrain';

const FIELD_RGB = { r: 0.09, g: 0.22, b: 0.16 };

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
    const rim = Math.max(Math.abs(x) / halfW, Math.abs(y) / halfL);
    const shade = 1 - rim * 0.35;
    const jitter = (hash2(x, y) - 0.5) * 0.04;
    colors[i * 3] = FIELD_RGB.r * shade + jitter;
    colors[i * 3 + 1] = FIELD_RGB.g * shade + jitter;
    colors[i * 3 + 2] = FIELD_RGB.b * shade + jitter;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

interface RangeHinterlandProps {
  shadows?: boolean;
}

export function RangeHinterland({ shadows = false }: RangeHinterlandProps) {
  const skirtGeo = useMemo(() => makeSkirtGeometry(), []);
  const hillGeos = useMemo(
    () => HILL_PATCHES.map((patch) => ({ patch, geo: makeHillGeometry(patch) })),
    [],
  );

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, SKIRT_Y, 160]}
        receiveShadow={shadows}
        geometry={skirtGeo}
      >
        <meshStandardMaterial vertexColors roughness={1} metalness={0} />
      </mesh>

      {hillGeos.map(({ patch, geo }) => (
        <mesh
          key={patch.id}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[patch.origin[0], HILL_BASE_Y, patch.origin[2]]}
          receiveShadow={shadows}
          castShadow={shadows}
          geometry={geo}
        >
          <meshStandardMaterial vertexColors roughness={0.96} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}
