/**
 * Tee-area dressing (mat, markers, bag). Mounted beside GolferTee.
 *
 * Y layer budget (scene units / yards):
 *   0.00  — fairway / rough planes (RangeEnvironment)
 *   0.05  — tee box plane (RangeEnvironment)
 *   0.10  — flat markings (mat edge, cart path, bunker sand)  ← this file + RangeDecor
 *   0.15+ — rings / plates / markers that sit above markings
 *   0.40+ — solid props (bags, benches, posts)
 */

interface TeeBoxPropsProps {
  shadows?: boolean;
}

/** Hitting mat edge, tee markers, and a simple bag/stand off the camera path. */
export function TeeBoxProps({ shadows = false }: TeeBoxPropsProps) {
  return (
    <group>
      {/* Hitting mat — slightly above tee-box plane to avoid z-fight */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, -0.4]} receiveShadow={shadows}>
        <planeGeometry args={[2.4, 3.2]} />
        <meshStandardMaterial color="#1a3a2a" roughness={0.9} />
      </mesh>
      {/* Mat edge frame (four strips at Y 0.11) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.11, 1.15]}>
        <planeGeometry args={[2.4, 0.1]} />
        <meshStandardMaterial color="#0f2418" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.11, -1.95]}>
        <planeGeometry args={[2.4, 0.1]} />
        <meshStandardMaterial color="#0f2418" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1.15, 0.11, -0.4]}>
        <planeGeometry args={[0.1, 3.2]} />
        <meshStandardMaterial color="#0f2418" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.15, 0.11, -0.4]}>
        <planeGeometry args={[0.1, 3.2]} />
        <meshStandardMaterial color="#0f2418" roughness={1} />
      </mesh>
      {/* Inner mat turf strip */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.105, 0.1]}>
        <planeGeometry args={[0.55, 1.4]} />
        <meshStandardMaterial color="#2d6a4f" roughness={0.85} />
      </mesh>

      {/* Left / right tee markers (low, won't block behind camera) */}
      <TeeMarker position={[-1.35, 0, -0.2]} color="#ef4444" shadows={shadows} />
      <TeeMarker position={[1.35, 0, -0.2]} color="#f8fafc" shadows={shadows} />

      {/* Bag + stand — offset left-rear so it stays clear of behind view */}
      <group position={[-3.2, 0, -2.4]} rotation={[0, 0.35, 0]}>
        {/* Stand legs */}
        <mesh position={[-0.18, 0.45, 0.1]} rotation={[0.15, 0, 0.2]} castShadow={shadows}>
          <cylinderGeometry args={[0.025, 0.03, 0.95, 6]} />
          <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0.18, 0.45, 0.1]} rotation={[0.15, 0, -0.2]} castShadow={shadows}>
          <cylinderGeometry args={[0.025, 0.03, 0.95, 6]} />
          <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Bag body */}
        <mesh position={[0, 0.85, -0.05]} castShadow={shadows}>
          <cylinderGeometry args={[0.28, 0.32, 1.1, 10]} />
          <meshStandardMaterial color="#1e3a5f" roughness={0.7} />
        </mesh>
        {/* Club grips peeking out */}
        <mesh position={[-0.08, 1.55, -0.05]} castShadow={shadows}>
          <cylinderGeometry args={[0.035, 0.03, 0.45, 6]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <mesh position={[0.1, 1.6, 0]} castShadow={shadows}>
          <cylinderGeometry args={[0.03, 0.028, 0.5, 6]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        <mesh position={[0.02, 1.52, -0.12]} castShadow={shadows}>
          <cylinderGeometry args={[0.028, 0.025, 0.4, 6]} />
          <meshStandardMaterial color="#78716c" />
        </mesh>
      </group>

      {/* Small bench on the opposite side */}
      <group position={[3.4, 0, -2.6]} rotation={[0, -0.2, 0]}>
        <mesh position={[0, 0.42, 0]} castShadow={shadows}>
          <boxGeometry args={[1.6, 0.08, 0.45]} />
          <meshStandardMaterial color="#6b4f2a" roughness={0.85} />
        </mesh>
        <mesh position={[-0.65, 0.2, 0]} castShadow={shadows}>
          <boxGeometry args={[0.08, 0.4, 0.4]} />
          <meshStandardMaterial color="#4a3720" roughness={0.9} />
        </mesh>
        <mesh position={[0.65, 0.2, 0]} castShadow={shadows}>
          <boxGeometry args={[0.08, 0.4, 0.4]} />
          <meshStandardMaterial color="#4a3720" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

function TeeMarker({
  position,
  color,
  shadows,
}: {
  position: [number, number, number];
  color: string;
  shadows: boolean;
}) {
  return (
    <group position={position}>
      <mesh position={[0, 0.22, 0]} castShadow={shadows}>
        <cylinderGeometry args={[0.04, 0.05, 0.44, 6]} />
        <meshStandardMaterial color="#64748b" metalness={0.3} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow={shadows}>
        <sphereGeometry args={[0.09, 10, 10]} />
        <meshStandardMaterial color={color} roughness={0.45} />
      </mesh>
    </group>
  );
}
