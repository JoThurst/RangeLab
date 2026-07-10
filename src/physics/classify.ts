import type { Handedness, ShotInputs, ShotShape } from '../types';

/**
 * Classify shot shape from launch direction and in-flight curve.
 *
 * Coordinate convention (world):
 * - +Z = down the target line
 * - +X = right when facing the target
 *
 * Player-perspective horizontal launch:
 * - Positive = toward player's right (RH: +X world, LH: -X world)
 *
 * Spin axis (player perspective):
 * - Positive = fade for RH / draw for LH
 * - Negative = draw for RH / fade for LH
 *
 * Curve sign in world X (positive = ball curves toward +X / right):
 * - RH fade / LH draw → positive curve
 * - RH draw / LH fade → negative curve
 */
export interface ClassificationInput {
  /** Offline at landing in yards. Positive = right of target (+X). */
  offlineYards: number;
  /** Peak lateral deviation during flight relative to initial aim line, yards. */
  curveYards: number;
  /** Horizontal launch in player perspective degrees. */
  horizontalLaunchDeg: number;
  handedness: Handedness;
}

const AIM_THRESHOLD_DEG = 2.5;
const CURVE_THRESHOLD_YD = 4;
const SEVERE_CURVE_YD = 14;
const OFFLINE_THRESHOLD_YD = 5;

export function classifyShotShape(input: ClassificationInput): ShotShape {
  const { offlineYards, curveYards, horizontalLaunchDeg, handedness } = input;

  // Player-perspective offline: positive = right of target from player's view
  const playerOffline = handedness === 'right' ? offlineYards : -offlineYards;
  // Player-perspective curve: positive = fades (curves away from draw side)
  // World curve positive = to the right (+X)
  // RH: fade curves right (+), draw curves left (-)
  // LH: fade curves left (world -), draw curves right (world +)
  // So player-fade curve = RH: +worldCurve, LH: -worldCurve
  const playerCurve = handedness === 'right' ? curveYards : -curveYards;

  const aim =
    Math.abs(horizontalLaunchDeg) < AIM_THRESHOLD_DEG
      ? 'center'
      : horizontalLaunchDeg > 0
        ? 'push'
        : 'pull';

  let curve: 'straight' | 'draw' | 'fade' | 'hook' | 'slice' = 'straight';
  if (Math.abs(playerCurve) >= SEVERE_CURVE_YD) {
    curve = playerCurve > 0 ? 'slice' : 'hook';
  } else if (Math.abs(playerCurve) >= CURVE_THRESHOLD_YD) {
    curve = playerCurve > 0 ? 'fade' : 'draw';
  }

  if (aim === 'center' && curve === 'straight') {
    if (Math.abs(playerOffline) < OFFLINE_THRESHOLD_YD) return 'Straight';
    // Mild residual offline without clear curve
    return playerOffline > 0 ? 'Push' : 'Pull';
  }

  if (aim === 'center') {
    if (curve === 'draw') return 'Draw';
    if (curve === 'fade') return 'Fade';
    if (curve === 'hook') return 'Hook';
    if (curve === 'slice') return 'Slice';
  }

  if (aim === 'pull') {
    if (curve === 'draw' || curve === 'hook') return curve === 'hook' ? 'Pull-Hook' : 'Pull-Draw';
    if (curve === 'fade' || curve === 'slice') return 'Pull'; // started left, faded back
    return 'Pull';
  }

  // push
  if (curve === 'fade' || curve === 'slice') return curve === 'slice' ? 'Push-Slice' : 'Push-Fade';
  if (curve === 'draw' || curve === 'hook') return 'Push';
  return 'Push';
}

/** Convert player-perspective horizontal launch to world +X angle (degrees). */
export function playerAimToWorldYaw(horizontalLaunchDeg: number, handedness: Handedness): number {
  return handedness === 'right' ? horizontalLaunchDeg : -horizontalLaunchDeg;
}

/**
 * Convert player-perspective spin axis to world spin-axis tilt.
 * Positive world tilt produces fade for RH (curves toward +X).
 */
export function playerSpinAxisToWorld(spinAxisDeg: number, handedness: Handedness): number {
  return handedness === 'right' ? spinAxisDeg : -spinAxisDeg;
}

export function sideSpinFromAxis(backspinRpm: number, spinAxisDeg: number): number {
  return backspinRpm * Math.sin((spinAxisDeg * Math.PI) / 180);
}

export function defaultInputsFromClub(
  club: {
    ballSpeedMph: number;
    clubSpeedMph: number;
    launchAngleDeg: number;
    backspinRpm: number;
    spinAxisDeg: number;
  },
  handedness: Handedness = 'right',
): ShotInputs {
  return {
    ballSpeedMph: club.ballSpeedMph,
    clubSpeedMph: club.clubSpeedMph,
    launchAngleDeg: club.launchAngleDeg,
    horizontalLaunchDeg: 0,
    backspinRpm: club.backspinRpm,
    spinAxisDeg: club.spinAxisDeg,
    windSpeedMph: 0,
    windDirectionDeg: 0,
    elevationFt: 0,
    airDensityKgM3: 1.225,
    groundFirmness: 0.65,
    fairwayMoisture: 0.25,
    handedness,
  };
}
