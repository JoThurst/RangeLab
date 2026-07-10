import { DEFAULT_AIR_DENSITY, clamp } from './constants';

/**
 * Approximate ISA air density from elevation (ft above sea level).
 * Temperature lapse ignored beyond a simple exponential scale-height model —
 * good enough for golf what-if comparisons (sea level ↔ mile-high).
 */
export function airDensityFromElevationFt(elevationFt: number): number {
  const hMeters = elevationFt * 0.3048;
  // Scale height ~8500 m for density in troposphere
  const density = DEFAULT_AIR_DENSITY * Math.exp(-hMeters / 8500);
  return Math.round(clamp(density, 0.85, 1.35) * 1000) / 1000;
}

export function elevationLabel(elevationFt: number): string {
  if (elevationFt < 100) return 'Sea level';
  if (elevationFt < 500) return 'Low';
  if (elevationFt < 1500) return 'Moderate';
  if (elevationFt < 4000) return 'High';
  return 'Very high';
}
