import type { Handedness } from '../../types';

interface GolferTeeProps {
  handedness: Handedness;
}

/** Stylized golfer silhouette + club/ball tee setup — higher contrast for readability. */
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
        <meshStandardMaterial color="#f8fafc" roughness={0.28} metalness={0.08} />
      </mesh>

      {/* Golfer — slightly taller stance, clearer limb/torso contrast */}
      <group position={[side * -1.15, 0, 0.18]} rotation={[0, side * 0.12, 0]}>
        {/* Shoes */}
        <mesh position={[-0.14, 0.08, 0.06]} castShadow>
          <boxGeometry args={[0.16, 0.1, 0.32]} />
          <meshStandardMaterial color="#0f172a" roughness={0.7} />
        </mesh>
        <mesh position={[0.14, 0.08, 0.06]} castShadow>
          <boxGeometry args={[0.16, 0.1, 0.32]} />
          <meshStandardMaterial color="#0f172a" roughness={0.7} />
        </mesh>
        {/* Legs — darker pants vs brighter top */}
        <mesh position={[-0.14, 0.48, 0]} castShadow>
          <capsuleGeometry args={[0.09, 0.58, 4, 8]} />
          <meshStandardMaterial color="#0f172a" roughness={0.75} />
        </mesh>
        <mesh position={[0.14, 0.48, 0]} castShadow>
          <capsuleGeometry args={[0.09, 0.58, 4, 8]} />
          <meshStandardMaterial color="#0f172a" roughness={0.75} />
        </mesh>
        {/* Belt line */}
        <mesh position={[0, 0.92, 0]} castShadow>
          <cylinderGeometry args={[0.24, 0.24, 0.08, 10]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        {/* Torso — saturated teal for silhouette pop */}
        <mesh position={[0, 1.22, 0]} castShadow>
          <capsuleGeometry args={[0.24, 0.58, 4, 8]} />
          <meshStandardMaterial color="#0d9488" roughness={0.55} />
        </mesh>
        {/* Shoulders */}
        <mesh position={[0, 1.48, 0]} castShadow>
          <capsuleGeometry args={[0.28, 0.12, 4, 8]} />
          <meshStandardMaterial color="#0f766e" roughness={0.55} />
        </mesh>
        {/* Neck */}
        <mesh position={[0, 1.68, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.08, 0.14, 8]} />
          <meshStandardMaterial color="#c4a484" />
        </mesh>
        {/* Head */}
        <mesh position={[0, 1.88, 0]} castShadow>
          <sphereGeometry args={[0.17, 12, 12]} />
          <meshStandardMaterial color="#d4a574" roughness={0.65} />
        </mesh>
        {/* Cap brim for readable head silhouette */}
        <mesh position={[0, 2.02, 0.08]} rotation={[0.35, 0, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.06, 12]} />
          <meshStandardMaterial color="#134e4a" />
        </mesh>
        <mesh position={[0, 1.98, 0.22]} rotation={[1.1, 0, 0]} castShadow>
          <boxGeometry args={[0.28, 0.14, 0.04]} />
          <meshStandardMaterial color="#134e4a" />
        </mesh>
        {/* Arms + club */}
        <group position={[side * 0.18, 1.32, 0.12]} rotation={[0.45, 0, side * -0.55]}>
          <mesh position={[0, -0.28, 0]} castShadow>
            <capsuleGeometry args={[0.065, 0.48, 4, 8]} />
            <meshStandardMaterial color="#d4a574" />
          </mesh>
          {/* Glove hand */}
          <mesh position={[0, -0.58, 0.02]} castShadow>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.78, 0.06]} rotation={[0.3, 0, 0]} castShadow>
            <cylinderGeometry args={[0.018, 0.024, 1.15, 8]} />
            <meshStandardMaterial color="#1e293b" metalness={0.45} roughness={0.35} />
          </mesh>
          <mesh position={[0, -1.38, 0.14]} rotation={[0.2, 0, 0.3]} castShadow>
            <boxGeometry args={[0.3, 0.09, 0.48]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.65} roughness={0.25} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
