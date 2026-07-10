import { useMemo } from 'react';
import { Sky } from '@react-three/drei';
import type { WeatherCondition } from '../../types';

const PRESETS: Record<
  WeatherCondition,
  {
    sunPosition: [number, number, number];
    turbidity: number;
    rayleigh: number;
    mieCoefficient: number;
    ambient: number;
    dirIntensity: number;
    dirColor: string;
    ambientColor: string;
  }
> = {
  day: {
    sunPosition: [80, 60, 40],
    turbidity: 4,
    rayleigh: 1.2,
    mieCoefficient: 0.005,
    ambient: 0.45,
    dirIntensity: 1.35,
    dirColor: '#fff5e6',
    ambientColor: '#b8d0ff',
  },
  sunset: {
    sunPosition: [120, 12, -20],
    turbidity: 8,
    rayleigh: 2.2,
    mieCoefficient: 0.02,
    ambient: 0.35,
    dirIntensity: 1.1,
    dirColor: '#ffb070',
    ambientColor: '#6a5a7a',
  },
  overcast: {
    sunPosition: [40, 80, 20],
    turbidity: 12,
    rayleigh: 0.4,
    mieCoefficient: 0.01,
    ambient: 0.7,
    dirIntensity: 0.45,
    dirColor: '#d0d6e0',
    ambientColor: '#9aa3b5',
  },
};

interface SkyLightingProps {
  weather: WeatherCondition;
  shadows: boolean;
}

export function SkyLighting({ weather, shadows }: SkyLightingProps) {
  const p = useMemo(() => PRESETS[weather], [weather]);

  return (
    <>
      <Sky
        distance={450000}
        sunPosition={p.sunPosition}
        turbidity={p.turbidity}
        rayleigh={p.rayleigh}
        mieCoefficient={p.mieCoefficient}
        mieDirectionalG={0.8}
      />
      <ambientLight intensity={p.ambient} color={p.ambientColor} />
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
        shadow-bias={-0.0002}
      />
      <hemisphereLight args={['#87a0c8', '#2d4a32', 0.35]} />
    </>
  );
}
