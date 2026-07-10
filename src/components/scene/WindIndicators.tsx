import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { degToRad, mphToMs } from '../../physics/constants';

interface WindIndicatorsProps {
  windSpeedMph: number;
  windDirectionDeg: number;
  visible: boolean;
}

function Windsock({
  position,
  directionRad,
  strength,
}: {
  position: [number, number, number];
  directionRad: number;
  strength: number;
}) {
  const sock = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!sock.current) return;
    const flutter = Math.sin(clock.elapsedTime * (2 + strength)) * 0.08 * strength;
    sock.current.rotation.y = directionRad + Math.PI + flutter;
    sock.current.rotation.x = -0.15 - strength * 0.2;
  });

  return (
    <group position={position}>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 2.4, 6]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      <group ref={sock} position={[0, 2.2, 0]}>
        <mesh position={[0.55, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.22, 1.1, 8, 1, true]} />
          <meshStandardMaterial color="#f59e0b" side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

export function WindIndicators({ windSpeedMph, windDirectionDeg, visible }: WindIndicatorsProps) {
  const strength = Math.min(windSpeedMph / 20, 1.5);
  // Wind direction: 0 = headwind (from +Z), meteorological from-direction
  // Windsock points where wind is going = opposite of from-direction
  const goRad = degToRad(windDirectionDeg + 180);

  const particles = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i < 24; i++) {
      pts.push([
        ((i * 17) % 40) - 20,
        2 + (i % 5),
        30 + ((i * 29) % 200),
      ]);
    }
    return pts;
  }, []);

  const group = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!group.current || !visible || windSpeedMph < 0.5) return;
    const speed = mphToMs(windSpeedMph) * 0.15;
    group.current.children.forEach((child, i) => {
      child.position.x += Math.sin(goRad) * speed * dt * 8;
      child.position.z += -Math.cos(goRad) * speed * dt * 8;
      if (child.position.z < 10 || child.position.z > 280) {
        child.position.z = 30 + ((i * 29) % 200);
        child.position.x = ((i * 17) % 40) - 20;
      }
    });
  });

  if (!visible) return null;

  return (
    <group>
      <Windsock position={[-18, 0, 25]} directionRad={goRad} strength={strength} />
      <Windsock position={[18, 0, 80]} directionRad={goRad} strength={strength} />
      <Windsock position={[-16, 0, 160]} directionRad={goRad} strength={strength} />
      {windSpeedMph > 0.5 && (
        <group ref={group}>
          {particles.map((p, i) => (
            <mesh key={i} position={p}>
              <sphereGeometry args={[0.08, 6, 6]} />
              <meshBasicMaterial color="#94a3b8" transparent opacity={0.35} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}
