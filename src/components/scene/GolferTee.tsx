import type { Handedness } from '../../types';

interface GolferTeeProps {
  handedness: Handedness;
}

/** Stylized golfer silhouette + club/ball tee setup */
export function GolferTee({ handedness }: GolferTeeProps) {
  const side = handedness === 'right' ? 1 : -1;

  return (
    <group position={[0, 0, 0]}>
      {/* Tee peg */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.012, 0.018, 0.08, 8]} />
        <meshStandardMaterial color="#d4a373" />
      </mesh>

      {/* Ball on tee (static until launch playback moves Ball) */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <sphereGeometry args={[0.042, 16, 16]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.35} />
      </mesh>

      {/* Golfer body */}
      <group position={[side * -1.1, 0, 0.15]} rotation={[0, side * 0.15, 0]}>
        {/* Legs */}
        <mesh position={[-0.12, 0.45, 0]} castShadow>
          <capsuleGeometry args={[0.08, 0.55, 4, 8]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0.12, 0.45, 0]} castShadow>
          <capsuleGeometry args={[0.08, 0.55, 4, 8]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        {/* Torso */}
        <mesh position={[0, 1.15, 0]} castShadow>
          <capsuleGeometry args={[0.22, 0.55, 4, 8]} />
          <meshStandardMaterial color="#0f766e" />
        </mesh>
        {/* Head */}
        <mesh position={[0, 1.75, 0]} castShadow>
          <sphereGeometry args={[0.16, 12, 12]} />
          <meshStandardMaterial color="#c4a484" />
        </mesh>
        {/* Arms + club */}
        <group position={[side * 0.15, 1.25, 0.1]} rotation={[0.4, 0, side * -0.6]}>
          <mesh position={[0, -0.25, 0]} castShadow>
            <capsuleGeometry args={[0.06, 0.45, 4, 8]} />
            <meshStandardMaterial color="#c4a484" />
          </mesh>
          <mesh position={[0, -0.7, 0.05]} rotation={[0.3, 0, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.025, 1.05, 8]} />
            <meshStandardMaterial color="#334155" metalness={0.4} roughness={0.4} />
          </mesh>
          <mesh position={[0, -1.25, 0.12]} rotation={[0.2, 0, 0.3]} castShadow>
            <boxGeometry args={[0.28, 0.08, 0.45]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
