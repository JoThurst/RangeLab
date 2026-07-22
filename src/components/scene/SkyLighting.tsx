import { useMemo } from 'react';
import { Sky } from '@react-three/drei';
import type { WeatherCondition } from '../../types';

/** Mid-range fairway green family — local bounce fill, not shared env constants. */
const FAIRWAY_GROUND = '#3d7358';
const FAIRWAY_GROUND_WARM = '#4a6e48';
const FAIRWAY_GROUND_COOL = '#355f4c';

export type AtmospherePreset = {
  sunPosition: [number, number, number];
  turbidity: number;
  rayleigh: number;
  mieCoefficient: number;
  mieDirectionalG: number;
  ambient: number;
  dirIntensity: number;
  dirColor: string;
  ambientColor: string;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  /** Paired with Canvas clearColor — horizon haze, not sky zenith. */
  fogColor: string;
  fogNear: number;
  fogFar: number;
  clearColor: string;
  exposure: number;
};

/**
 * Per-weather sky + light + fog. Fog/clear live in RangeScene but are driven
 * from these presets via `getAtmosphere` so colors stay matched.
 */
export const ATMOSPHERE_PRESETS: Record<WeatherCondition, AtmospherePreset> = {
  day: {
    sunPosition: [90, 72, 48],
    turbidity: 3.2,
    rayleigh: 1.35,
    mieCoefficient: 0.004,
    mieDirectionalG: 0.82,
    ambient: 0.28,
    dirIntensity: 1.45,
    dirColor: '#fff4e0',
    ambientColor: '#c2d6f5',
    hemiSky: '#8eb4e8',
    hemiGround: FAIRWAY_GROUND,
    hemiIntensity: 0.55,
    fogColor: '#9eb8d4',
    fogNear: 180,
    fogFar: 560,
    clearColor: '#9eb8d4',
    exposure: 1.08,
  },
  sunset: {
    sunPosition: [130, 10, -28],
    turbidity: 9.5,
    rayleigh: 2.6,
    mieCoefficient: 0.028,
    mieDirectionalG: 0.92,
    ambient: 0.22,
    dirIntensity: 1.25,
    dirColor: '#ff9a5c',
    ambientColor: '#7a5a78',
    hemiSky: '#e8a078',
    hemiGround: FAIRWAY_GROUND_WARM,
    hemiIntensity: 0.48,
    fogColor: '#c4927e',
    fogNear: 160,
    fogFar: 520,
    clearColor: '#c4927e',
    exposure: 1.0,
  },
  overcast: {
    sunPosition: [35, 90, 15],
    turbidity: 14,
    rayleigh: 0.28,
    mieCoefficient: 0.012,
    mieDirectionalG: 0.7,
    ambient: 0.42,
    dirIntensity: 0.38,
    dirColor: '#c8ced8',
    ambientColor: '#a8b0c0',
    hemiSky: '#9aa6b8',
    hemiGround: FAIRWAY_GROUND_COOL,
    hemiIntensity: 0.72,
    fogColor: '#a4acb8',
    fogNear: 140,
    fogFar: 500,
    clearColor: '#a4acb8',
    exposure: 0.95,
  },
};

export function getAtmosphere(weather: WeatherCondition): AtmospherePreset {
  return ATMOSPHERE_PRESETS[weather];
}

interface SkyLightingProps {
  weather: WeatherCondition;
  shadows: boolean;
}

export function SkyLighting({ weather, shadows }: SkyLightingProps) {
  const p = useMemo(() => getAtmosphere(weather), [weather]);

  return (
    <>
      <Sky
        distance={450000}
        sunPosition={p.sunPosition}
        turbidity={p.turbidity}
        rayleigh={p.rayleigh}
        mieCoefficient={p.mieCoefficient}
        mieDirectionalG={p.mieDirectionalG}
      />
      <ambientLight intensity={p.ambient} color={p.ambientColor} />
      <hemisphereLight args={[p.hemiSky, p.hemiGround, p.hemiIntensity]} />
      <directionalLight
        castShadow={shadows}
        position={p.sunPosition}
        intensity={p.dirIntensity}
        color={p.dirColor}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={500}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={200}
        shadow-camera-bottom={-20}
        shadow-bias={-0.00025}
      />
    </>
  );
}
