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
    const t = clock.elapsedTime;
    const flutter = Math.sin(t * (2.4 + strength * 1.2)) * 0.1 * Math.max(strength, 0.2);
    const bob = Math.sin(t * (3.1 + strength)) * 0.04 * strength;
    sock.current.rotation.y = directionRad + Math.PI + flutter;
    sock.current.rotation.x = -0.12 - strength * 0.22 + bob;
  });

  return (
    <group position={position}>
      {/* Pole */}
      <mesh position={[0, 1.25, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.045, 2.5, 8]} />
        <meshStandardMaterial color="#64748b" metalness={0.45} roughness={0.4} />
      </mesh>
      {/* Pole base */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.14, 0.16, 0.12, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.3} roughness={0.55} />
      </mesh>
      {/* Swivel ring */}
      <mesh position={[0, 2.35, 0]}>
        <torusGeometry args={[0.07, 0.02, 6, 12]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Sock — striped cone segments for readable wind direction */}
      <group ref={sock} position={[0, 2.35, 0]}>
        <mesh position={[0.35, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.26, 0.7, 10, 1, true]} />
          <meshStandardMaterial color="#f59e0b" side={THREE.DoubleSide} roughness={0.55} />
        </mesh>
        <mesh position={[0.85, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.16, 0.55, 10, 1, true]} />
          <meshStandardMaterial color="#f8fafc" side={THREE.DoubleSide} roughness={0.55} />
        </mesh>
        <mesh position={[1.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.08, 0.4, 8, 1, true]} />
          <meshStandardMaterial color="#f59e0b" side={THREE.DoubleSide} roughness={0.55} />
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
    const pts: { pos: [number, number, number]; scale: number }[] = [];
    for (let i = 0; i < 20; i++) {
      pts.push({
        pos: [((i * 17) % 40) - 20, 2.2 + (i % 5) * 0.35, 30 + ((i * 29) % 200)],
        scale: 0.06 + (i % 4) * 0.025,
      });
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
      // Soft vertical drift
      child.position.y += Math.sin((i + 1) * 0.7) * 0.15 * dt;
      if (child.position.y < 1.5 || child.position.y > 5) {
        child.position.y = 2.2 + (i % 5) * 0.35;
      }
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
            <mesh key={i} position={p.pos}>
              <sphereGeometry args={[p.scale, 5, 5]} />
              <meshBasicMaterial color="#cbd5e1" transparent opacity={0.28} depthWrite={false} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}
