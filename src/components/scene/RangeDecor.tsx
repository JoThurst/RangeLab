/**
 * Downrange visual anchors (bunkers, cart path, signage, net posts).
 * Does NOT own trees/greens — those stay in RangeEnvironment (stream A).
 *
 * Y layer budget (scene units / yards) — keep flat markings ≥ 0.1:
 *   0.00  — fairway / rough (RangeEnvironment)
 *   0.10  — cart path, bunker sand tops, yardage plates
 *   0.15  — bunker lips / plate rims
 *   0.40+ — posts, benches, net frame uprights
 */

interface RangeDecorProps {
  shadows?: boolean;
}

export function RangeDecor({ shadows = false }: RangeDecorProps) {
  return (
    <group>
      <Bunker position={[-12, 0, 95]} radius={5.5} shadows={shadows} />
      <Bunker position={[14, 0, 155]} radius={4.2} shadows={shadows} />
      <Bunker position={[-9, 0, 210]} radius={6} shadows={shadows} />

      <CartPath shadows={shadows} />

      <YardagePlate position={[-22, 0, 100]} yards={100} shadows={shadows} />
      <YardagePlate position={[22, 0, 150]} yards={150} shadows={shadows} />
      <YardagePlate position={[-22, 0, 200]} yards={200} shadows={shadows} />

      <RangeNetDetail shadows={shadows} />

      {/* Sideline benches as mid-range anchors */}
      <SidelineBench position={[-24, 0, 60]} rotationY={0.1} shadows={shadows} />
      <SidelineBench position={[24, 0, 130]} rotationY={-0.05} shadows={shadows} />
    </group>
  );
}

function Bunker({
  position,
  radius,
  shadows,
}: {
  position: [number, number, number];
  radius: number;
  shadows: boolean;
}) {
  const lip = radius * 1.12;
  return (
    <group position={position}>
      {/* Sand face — Y 0.10 above fairway */}
      <mesh rotation={[-Math.PI / 2, 0, 0.35]} position={[0, 0.1, 0]} receiveShadow={shadows}>
        <circleGeometry args={[radius, 24]} />
        <meshStandardMaterial color="#e8d5a3" roughness={1} />
      </mesh>
      {/* Darker lip ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0.35]} position={[0, 0.12, 0]}>
        <ringGeometry args={[radius * 0.92, lip, 24]} />
        <meshStandardMaterial color="#c4a574" roughness={0.95} />
      </mesh>
      {/* Subtle raised rear lip (suggests bunker face) */}
      <mesh position={[0, 0.28, -radius * 0.55]} rotation={[0.35, 0, 0]} castShadow={shadows}>
        <boxGeometry args={[radius * 1.4, 0.35, 0.5]} />
        <meshStandardMaterial color="#5c4033" roughness={0.9} />
      </mesh>
    </group>
  );
}

function CartPath({ shadows }: { shadows: boolean }) {
  // Winding path along the right rough edge
  const segments: { pos: [number, number, number]; rot: number; len: number }[] = [
    { pos: [28, 0.1, 40], rot: 0.08, len: 36 },
    { pos: [30, 0.1, 85], rot: -0.12, len: 42 },
    { pos: [26, 0.1, 140], rot: 0.1, len: 48 },
    { pos: [29, 0.1, 200], rot: -0.06, len: 50 },
    { pos: [27, 0.1, 260], rot: 0.04, len: 45 },
  ];

  return (
    <group>
      {segments.map((s, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, s.rot]}
          position={s.pos}
          receiveShadow={shadows}
        >
          <planeGeometry args={[2.4, s.len]} />
          <meshStandardMaterial color="#6b7280" roughness={0.95} />
        </mesh>
      ))}
      {/* Edge lines */}
      {segments.map((s, i) => (
        <mesh
          key={`edge-${i}`}
          rotation={[-Math.PI / 2, 0, s.rot]}
          position={[s.pos[0], 0.11, s.pos[2]]}
        >
          <planeGeometry args={[0.08, s.len]} />
          <meshStandardMaterial color="#9ca3af" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function YardagePlate({
  position,
  yards,
  shadows,
}: {
  position: [number, number, number];
  yards: number;
  shadows: boolean;
}) {
  // Color-code like range plates: 100 red-ish, 150 white, 200 yellow-ish
  const face =
    yards <= 100 ? '#b91c1c' : yards <= 150 ? '#f8fafc' : yards <= 200 ? '#ca8a04' : '#1d4ed8';
  const text = yards <= 150 && yards > 100 ? '#0f172a' : '#f8fafc';

  return (
    <group position={position}>
      <mesh position={[0, 0.55, 0]} castShadow={shadows}>
        <cylinderGeometry args={[0.06, 0.08, 1.1, 6]} />
        <meshStandardMaterial color="#475569" metalness={0.35} roughness={0.45} />
      </mesh>
      {/* Plate disc — Y top of post */}
      <mesh position={[0, 1.25, 0]} rotation={[0, Math.PI / 2, 0]} castShadow={shadows}>
        <cylinderGeometry args={[0.55, 0.55, 0.08, 20]} />
        <meshStandardMaterial color={face} roughness={0.55} metalness={0.1} />
      </mesh>
      {/* Numeric stub as raised bars (no Text dependency — keeps stream lean) */}
      <PlateDigits yards={yards} color={text} />
    </group>
  );
}

function PlateDigits({ yards, color }: { yards: number; color: string }) {
  // Stylized hash marks instead of Text — readable at distance as a plate face accent
  const bars = yards >= 200 ? 4 : yards >= 150 ? 3 : 2;
  return (
    <group position={[0, 1.25, 0.06]}>
      {Array.from({ length: bars }).map((_, i) => (
        <mesh key={i} position={[(i - (bars - 1) / 2) * 0.22, 0, 0]}>
          <boxGeometry args={[0.12, 0.35, 0.04]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, -0.32, 0]}>
        <boxGeometry args={[bars * 0.22 + 0.1, 0.06, 0.04]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
    </group>
  );
}

function RangeNetDetail({ shadows }: { shadows: boolean }) {
  const z = 328;
  const halfW = 55;
  const postXs = [-halfW, -halfW / 2, 0, halfW / 2, halfW];

  return (
    <group>
      {postXs.map((x, i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 5, 0]} castShadow={shadows}>
            <cylinderGeometry args={[0.18, 0.22, 10, 8]} />
            <meshStandardMaterial color="#334155" metalness={0.4} roughness={0.5} />
          </mesh>
          {/* Cap */}
          <mesh position={[0, 10.15, 0]} castShadow={shadows}>
            <cylinderGeometry args={[0.28, 0.2, 0.3, 8]} />
            <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.4} />
          </mesh>
        </group>
      ))}
      {/* Top cable */}
      <mesh position={[0, 9.8, z]}>
        <boxGeometry args={[halfW * 2.05, 0.08, 0.08]} />
        <meshStandardMaterial color="#64748b" metalness={0.6} roughness={0.35} />
      </mesh>
      {/* Mid cable */}
      <mesh position={[0, 5, z]}>
        <boxGeometry args={[halfW * 2.05, 0.06, 0.06]} />
        <meshStandardMaterial color="#64748b" metalness={0.55} roughness={0.4} />
      </mesh>
      {/* Mesh panel suggestion (semi-transparent) */}
      <mesh position={[0, 5, z + 0.15]}>
        <boxGeometry args={[halfW * 2, 9.5, 0.05]} />
        <meshStandardMaterial color="#0f172a" transparent opacity={0.35} roughness={0.8} />
      </mesh>
    </group>
  );
}

function SidelineBench({
  position,
  rotationY,
  shadows,
}: {
  position: [number, number, number];
  rotationY: number;
  shadows: boolean;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.45, 0]} castShadow={shadows}>
        <boxGeometry args={[2.2, 0.1, 0.5]} />
        <meshStandardMaterial color="#5c4033" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.85, -0.18]} castShadow={shadows}>
        <boxGeometry args={[2.2, 0.55, 0.08]} />
        <meshStandardMaterial color="#6b4f2a" roughness={0.85} />
      </mesh>
      <mesh position={[-0.9, 0.22, 0]} castShadow={shadows}>
        <boxGeometry args={[0.1, 0.44, 0.45]} />
        <meshStandardMaterial color="#3f2e1a" />
      </mesh>
      <mesh position={[0.9, 0.22, 0]} castShadow={shadows}>
        <boxGeometry args={[0.1, 0.44, 0.45]} />
        <meshStandardMaterial color="#3f2e1a" />
      </mesh>
    </group>
  );
}
