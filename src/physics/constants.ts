/** Physical constants and conversion helpers (SI units internally). */

export const GRAVITY = 9.80665; // m/s²
export const BALL_MASS = 0.0459; // kg (regulation golf ball ~1.62 oz)
export const BALL_RADIUS = 0.02135; // m
export const BALL_AREA = Math.PI * BALL_RADIUS * BALL_RADIUS;
export const DEFAULT_AIR_DENSITY = 1.225; // kg/m³ sea level ISA

/** Fixed physics timestep */
export const DT = 1 / 240;
export const MAX_SIM_TIME = 30;

export const YARDS_PER_METER = 1.0936133;
export const METERS_PER_YARD = 1 / YARDS_PER_METER;
export const MPH_TO_MS = 0.44704;
export const MS_TO_MPH = 1 / MPH_TO_MS;

export function mphToMs(mph: number): number {
  return mph * MPH_TO_MS;
}

export function msToMph(ms: number): number {
  return ms * MS_TO_MPH;
}

export function yardsToMeters(yd: number): number {
  return yd * METERS_PER_YARD;
}

export function metersToYards(m: number): number {
  return m * YARDS_PER_METER;
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function rpmToRadPerSec(rpm: number): number {
  return (rpm * 2 * Math.PI) / 60;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
