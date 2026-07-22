import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { FlightSample } from '../../types';
import { mToScene, sampleAtTime, trajectoryToScenePoints } from './units';

interface BallProps {
  trajectory: FlightSample[] | null;
  playbackTime: number;
  visible: boolean;
}

export function Ball({ trajectory, playbackTime, visible }: BallProps) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!ref.current || !trajectory?.length) {
      if (ref.current) {
        ref.current.position.set(0, 0.1, 0);
        ref.current.visible = visible;
      }
      return;
    }
    const s = sampleAtTime(trajectory, playbackTime);
    ref.current.position.set(mToScene(s.position.x), mToScene(s.position.y), mToScene(s.position.z));
    ref.current.visible = visible;
  });

  return (
    <mesh ref={ref} castShadow>
      <sphereGeometry args={[0.058, 24, 24]} />
      <meshStandardMaterial
        color="#f8fafc"
        roughness={0.22}
        metalness={0.08}
        envMapIntensity={0.6}
      />
    </mesh>
  );
}

interface ShotTracerProps {
  trajectory: FlightSample[];
  color?: string;
  maxPoints?: number;
  opacity?: number;
  visible?: boolean;
}

export function ShotTracer({
  trajectory,
  color = '#00e5ff',
  maxPoints = 400,
  opacity = 0.95,
  visible = true,
}: ShotTracerProps) {
  const line = useMemo(() => {
    const positions = trajectoryToScenePoints(trajectory, maxPoints);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    // Slightly brighter + thicker feel via linewidth where supported; opacity polish for depth
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      linewidth: 2,
    });
    return new THREE.Line(geo, mat);
  }, [trajectory, maxPoints, color, opacity]);

  if (!visible || trajectory.length < 2) return null;

  return <primitive object={line} />;
}

interface LandingMarkerProps {
  position: { x: number; y: number; z: number } | null;
  finalPosition?: { x: number; y: number; z: number } | null;
  visible: boolean;
}

/**
 * Carry (cyan) vs finish/roll (green). Flat rings sit at Y ≥ 0.1 to avoid fairway z-fight.
 * Layer: carry ring 0.12 / fill 0.11; finish ring 0.14 / fill 0.13.
 */
export function LandingMarker({ position, finalPosition, visible }: LandingMarkerProps) {
  if (!visible || !position) return null;

  const sameSpot =
    finalPosition &&
    Math.hypot(finalPosition.x - position.x, finalPosition.z - position.z) < 0.35;

  return (
    <group>
      {/* Carry landing */}
      <mesh position={[position.x, 0.12, position.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.7, 1.0, 36]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.92} depthWrite={false} />
      </mesh>
      <mesh position={[position.x, 0.11, position.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.28, 20]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.45} depthWrite={false} />
      </mesh>
      {/* Thin crosshair for carry readability under top-down */}
      <mesh position={[position.x, 0.125, position.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.8, 0.06]} />
        <meshBasicMaterial color="#67e8f9" transparent opacity={0.55} depthWrite={false} />
      </mesh>
      <mesh position={[position.x, 0.125, position.z]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[1.8, 0.06]} />
        <meshBasicMaterial color="#67e8f9" transparent opacity={0.55} depthWrite={false} />
      </mesh>

      {/* Finish / roll — distinct green, only when it moved */}
      {finalPosition && !sameSpot && (
        <group>
          <mesh
            position={[finalPosition.x, 0.14, finalPosition.z]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.4, 0.62, 28]} />
            <meshBasicMaterial color="#3dd68c" transparent opacity={0.9} depthWrite={false} />
          </mesh>
          <mesh
            position={[finalPosition.x, 0.13, finalPosition.z]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <circleGeometry args={[0.18, 16]} />
            <meshBasicMaterial color="#3dd68c" transparent opacity={0.5} depthWrite={false} />
          </mesh>
          {/* Roll path hint between carry and finish */}
          <mesh
            position={[
              (position.x + finalPosition.x) / 2,
              0.115,
              (position.z + finalPosition.z) / 2,
            ]}
            rotation={[
              -Math.PI / 2,
              0,
              Math.atan2(finalPosition.x - position.x, finalPosition.z - position.z),
            ]}
          >
            <planeGeometry
              args={[
                0.08,
                Math.hypot(finalPosition.x - position.x, finalPosition.z - position.z),
              ]}
            />
            <meshBasicMaterial color="#3dd68c" transparent opacity={0.35} depthWrite={false} />
          </mesh>
        </group>
      )}
      {finalPosition && sameSpot && (
        <mesh position={[position.x, 0.14, position.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.05, 1.2, 36]} />
          <meshBasicMaterial color="#3dd68c" transparent opacity={0.7} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}
