import { useMemo } from 'react';
import { Text, Billboard } from '@react-three/drei';

const RANGE_LENGTH = 320; // yards
const FAIRWAY_WIDTH = 42;
const ROUGH_WIDTH = 90;

function Tree({ position }: { position: [number, number, number] }) {
  const scale = 0.7 + ((position[0] * 13 + position[2] * 7) % 10) / 20;
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.28, 2.4, 6]} />
        <meshStandardMaterial color="#5c4033" />
      </mesh>
      <mesh position={[0, 3.2, 0]} castShadow>
        <coneGeometry args={[1.4, 3.2, 7]} />
        <meshStandardMaterial color="#1b4332" />
      </mesh>
      <mesh position={[0, 4.6, 0]} castShadow>
        <coneGeometry args={[1.0, 2.2, 7]} />
        <meshStandardMaterial color="#2d6a4f" />
      </mesh>
    </group>
  );
}

function DistanceMarker({ yards }: { yards: number }) {
  return (
    <group position={[FAIRWAY_WIDTH / 2 + 2, 0, yards]}>
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[0.12, 1.8, 0.12]} />
        <meshStandardMaterial color="#c9a227" />
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
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0.02, 0]}>
        <circleGeometry args={[radius, 32]} />
        <meshStandardMaterial color="#52b788" />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 1.8, 6]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      <mesh position={[0.35, 1.5, 0]} rotation={[0, 0, -0.4]}>
        <boxGeometry args={[0.7, 0.45, 0.04]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
    </group>
  );
}

interface RangeEnvironmentProps {
  showLandingGrid: boolean;
  showDistanceMarkers: boolean;
}

export function RangeEnvironment({ showLandingGrid, showDistanceMarkers }: RangeEnvironmentProps) {
  const trees = useMemo(() => {
    const list: [number, number, number][] = [];
    for (let z = 20; z < RANGE_LENGTH; z += 18) {
      list.push([-(ROUGH_WIDTH / 2 + 4), 0, z + (z % 11)]);
      list.push([ROUGH_WIDTH / 2 + 5, 0, z + 7]);
      if (z % 36 === 0) {
        list.push([-(ROUGH_WIDTH / 2 + 10), 0, z + 4]);
        list.push([ROUGH_WIDTH / 2 + 12, 0, z + 10]);
      }
    }
    return list;
  }, []);

  const markers = [50, 100, 150, 200, 250, 300];

  return (
    <group>
      {/* Rough */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, RANGE_LENGTH / 2]} receiveShadow>
        <planeGeometry args={[ROUGH_WIDTH * 2.2, RANGE_LENGTH + 40]} />
        <meshStandardMaterial color="#1b4332" />
      </mesh>

      {/* Fairway */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, RANGE_LENGTH / 2]} receiveShadow>
        <planeGeometry args={[FAIRWAY_WIDTH, RANGE_LENGTH]} />
        <meshStandardMaterial color="#40916c" />
      </mesh>

      {/* Tee box */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -2]} receiveShadow>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color="#74c69d" />
      </mesh>

      {/* Landing grid */}
      {showLandingGrid && (
        <gridHelper
          args={[FAIRWAY_WIDTH, 14, '#2d6a4f', '#1b4332']}
          position={[0, 0.03, 160]}
          rotation={[0, 0, 0]}
        />
      )}

      {/* Center line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, RANGE_LENGTH / 2]}>
        <planeGeometry args={[0.15, RANGE_LENGTH]} />
        <meshStandardMaterial color="#d8f3dc" transparent opacity={0.35} />
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

      {/* Back net / fence suggestion */}
      <mesh position={[0, 4, RANGE_LENGTH + 8]}>
        <boxGeometry args={[ROUGH_WIDTH * 1.4, 8, 0.4]} />
        <meshStandardMaterial color="#1a1f28" transparent opacity={0.55} />
      </mesh>
    </group>
  );
}
