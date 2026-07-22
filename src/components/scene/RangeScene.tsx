import { Suspense, useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { useRangeStore } from '../../store/useRangeStore';
import { SkyLighting, getAtmosphere } from './SkyLighting';
import { RangeEnvironment } from './RangeEnvironment';
import { GolferTee } from './GolferTee';
import { Ball, LandingMarker, ShotTracer } from './Ball';
import { WindIndicators } from './WindIndicators';
import { CameraRig } from './CameraRig';
import { TeeBoxProps } from './TeeBoxProps';
import { RangeDecor } from './RangeDecor';
import { RangeHinterland } from './RangeHinterland';
function SceneContents({ onReady }: { onReady: () => void }) {
  const weather = useRangeStore((s) => s.weather);
  const atm = useMemo(() => getAtmosphere(weather), [weather]);
  const { gl } = useThree();
  const perf = useRangeStore((s) => s.performance);
  const inputs = useRangeStore((s) => s.inputs);
  const cameraMode = useRangeStore((s) => s.cameraMode);
  const lastResults = useRangeStore((s) => s.lastResults);
  const playbackTime = useRangeStore((s) => s.playbackTime);
  const isPlaying = useRangeStore((s) => s.isPlaying);
  const playbackSpeed = useRangeStore((s) => s.playbackSpeed);
  const setPlaybackTime = useRangeStore((s) => s.setPlaybackTime);
  const setIsPlaying = useRangeStore((s) => s.setIsPlaying);
  const activeSession = useRangeStore((s) => s.activeSession);
  const comparisonOverlays = useRangeStore((s) => s.comparisonOverlays);

  useEffect(() => {
    onReady();
  }, [onReady]);

  // Keep clearColor + exposure paired with fog / SkyLighting presets on weather change.
  useEffect(() => {
    gl.setClearColor(atm.clearColor);
    gl.toneMappingExposure = atm.exposure;
  }, [gl, atm.clearColor, atm.exposure]);

  useEffect(() => {
    if (!isPlaying || !lastResults) return;
    const maxT = lastResults.trajectory[lastResults.trajectory.length - 1]?.t ?? 0;
    let frame = 0;
    let last = window.performance.now();
    const tick = (now: number) => {
      const dt = ((now - last) / 1000) * playbackSpeed;
      last = now;
      const next = Math.min(maxT, useRangeStore.getState().playbackTime + dt);
      setPlaybackTime(next);
      if (next >= maxT) {
        setIsPlaying(false);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, lastResults, playbackSpeed, setPlaybackTime, setIsPlaying]);

  const landingZ = lastResults?.landingPosition.z ?? 150;

  const sessionTracers = useMemo(() => {
    if (!activeSession) return [];
    return activeSession.shots.filter((s) => s.tracerVisible);
  }, [activeSession]);

  const visibleComparisons = useMemo(
    () => comparisonOverlays.filter((o) => o.visible),
    [comparisonOverlays],
  );

  const showTeeBall = !lastResults || playbackTime < 0.02;

  return (
    <>
      <SkyLighting weather={weather} shadows={perf.shadows} />
      <fog attach="fog" args={[atm.fogColor, atm.fogNear, atm.fogFar]} />
      <RangeHinterland shadows={perf.shadows} />
      <RangeEnvironment
        showLandingGrid={perf.showLandingGrid}
        showDistanceMarkers={perf.showDistanceMarkers}
      />
      <GolferTee handedness={inputs.handedness} />
      <TeeBoxProps shadows={perf.shadows} />
      <RangeDecor shadows={perf.shadows} />
      <WindIndicators
        windSpeedMph={inputs.windSpeedMph}
        windDirectionDeg={inputs.windDirectionDeg}
        visible={perf.showWindIndicators}
      />

      {sessionTracers.map((shot) => (
        <ShotTracer
          key={shot.id}
          trajectory={shot.results.trajectory}
          color={shot.tracerColor}
          maxPoints={perf.tracerMaxPoints}
          opacity={shot.id === activeSession?.shots.at(-1)?.id ? 0.95 : 0.45}
        />
      ))}

      {visibleComparisons.map((overlay) => (
        <ShotTracer
          key={overlay.id}
          trajectory={overlay.results.trajectory}
          color={overlay.color}
          maxPoints={perf.tracerMaxPoints}
          opacity={0.7}
        />
      ))}

      {!activeSession && lastResults && (
        <ShotTracer
          trajectory={lastResults.trajectory}
          color="#00e5ff"
          maxPoints={perf.tracerMaxPoints}
        />
      )}

      <Ball
        trajectory={lastResults?.trajectory ?? null}
        playbackTime={playbackTime}
        visible={!showTeeBall}
      />

      <LandingMarker
        position={lastResults?.landingPosition ?? null}
        finalPosition={lastResults?.finalPosition ?? null}
        visible={!!lastResults && playbackTime > lastResults.flightTimeSec * 0.85}
      />

      <CameraRig
        mode={cameraMode}
        trajectory={lastResults?.trajectory ?? null}
        playbackTime={playbackTime}
        landingZ={landingZ}
      />
    </>
  );
}

interface RangeSceneProps {
  onReady: () => void;
}

export function RangeScene({ onReady }: RangeSceneProps) {
  const pixelRatioCap = useRangeStore((s) => s.performance.pixelRatioCap);
  const shadows = useRangeStore((s) => s.performance.shadows);
  const initialAtm = getAtmosphere(useRangeStore.getState().weather);

  return (
    <Canvas
      shadows={shadows}
      dpr={[1, pixelRatioCap]}
      gl={{ antialias: true, powerPreference: 'high-performance', logarithmicDepthBuffer: true }}
      camera={{ position: [0, 2.8, -8], fov: 55, near: 0.1, far: 800 }}
      onCreated={({ gl }) => {
        gl.setClearColor(initialAtm.clearColor);
        gl.toneMappingExposure = initialAtm.exposure;
      }}
    >
      <Suspense fallback={null}>
        <SceneContents onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}
