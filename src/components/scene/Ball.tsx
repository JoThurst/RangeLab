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
      <sphereGeometry args={[0.055, 20, 20]} />
      <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.05} />
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
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
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

export function LandingMarker({ position, finalPosition, visible }: LandingMarkerProps) {
  if (!visible || !position) return null;
  return (
    <group>
      <mesh position={[position.x, 0.05, position.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 0.85, 32]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.9} />
      </mesh>
      <mesh position={[position.x, 0.02, position.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.25, 16]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.5} />
      </mesh>
      {finalPosition && (
        <mesh position={[finalPosition.x, 0.04, finalPosition.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.35, 0.5, 24]} />
          <meshBasicMaterial color="#3dd68c" transparent opacity={0.85} />
        </mesh>
      )}
    </group>
  );
}
