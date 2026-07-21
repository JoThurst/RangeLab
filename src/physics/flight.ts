import {
  BALL_AREA,
  BALL_MASS,
  BALL_RADIUS,
  DT,
  GRAVITY,
  MAX_SIM_TIME,
  clamp,
  degToRad,
  metersToYards,
  mphToMs,
  rpmToRadPerSec,
} from './constants';
import {
  classifyShotShape,
  playerAimToWorldYaw,
  playerSpinAxisToWorld,
  sideSpinFromAxis,
} from './classify';
import type { FlightSample, ShotInputs, ShotResults, Vec3 } from '../types';
import { add, clone, cross, distanceXZ, length, normalize, scale, sub, vec3 } from './vec3';

/**
 * Simplified but credible golf ball flight model.
 *
 * Forces during flight:
 * - Gravity
 * - Quadratic aerodynamic drag
 * - Magnus lift from backspin / spin axis
 * - Constant wind (added to relative air velocity)
 *
 * Ground interaction:
 * - Bounce with restitution from firmness
 * - Friction-based rollout modulated by moisture
 */

function dragCoefficient(speedMs: number, spinRpm: number): number {
  // Soft Reynolds / spin-sensitive Cd around typical golf values
  const base = 0.24;
  const spinFactor = clamp(spinRpm / 10000, 0, 1.2) * 0.04;
  const speedFactor = clamp((speedMs - 30) / 80, -0.03, 0.05);
  return base + spinFactor + speedFactor;
}

function liftCoefficient(spinRpm: number, speedMs: number): number {
  const spinParam = (rpmToRadPerSec(spinRpm) * BALL_RADIUS) / Math.max(speedMs, 1);
  // Empirical Cl curve for golf balls, calibrated against TrackMan PGA Tour
  // apex averages (~29-32yd, roughly flat across the bag). The previous curve
  // saturated too quickly at low spin ratios, so low-spin/high-speed driver
  // shots reached nearly the same Cl as high-spin wedges, blowing out driver
  // apex (~70yd) relative to measured data.
  return clamp(0.3 * (1 - Math.exp(-9 * spinParam)), 0.06, 0.25);
}

function windVelocity(inputs: ShotInputs): Vec3 {
  const speed = mphToMs(inputs.windSpeedMph);
  // 0° = headwind (from +Z toward tee, so wind velocity is -Z)
  const rad = degToRad(inputs.windDirectionDeg);
  return {
    x: speed * Math.sin(rad),
    y: 0,
    z: -speed * Math.cos(rad),
  };
}

function aeroAcceleration(
  velocity: Vec3,
  spinAxisWorld: Vec3,
  airDensity: number,
  backspinRpm: number,
  wind: Vec3,
): Vec3 {
  const vRel = sub(velocity, wind);
  const speed = length(vRel);
  if (speed < 0.05) return vec3(0, -GRAVITY, 0);

  const cd = dragCoefficient(speed, backspinRpm);
  const cl = liftCoefficient(backspinRpm, speed);

  const dragMag = 0.5 * airDensity * cd * BALL_AREA * speed * speed;
  const liftMag = 0.5 * airDensity * cl * BALL_AREA * speed * speed;

  const dragDir = scale(normalize(vRel), -1);
  // Magnus: ω × v
  const liftDir = normalize(cross(spinAxisWorld, vRel));

  const force = add(scale(dragDir, dragMag), scale(liftDir, liftMag));
  const accel = scale(force, 1 / BALL_MASS);
  accel.y -= GRAVITY;
  return accel;
}

function rk4Step(
  position: Vec3,
  velocity: Vec3,
  dt: number,
  spinAxisWorld: Vec3,
  airDensity: number,
  backspinRpm: number,
  wind: Vec3,
): { position: Vec3; velocity: Vec3 } {
  const a = (v: Vec3) => aeroAcceleration(v, spinAxisWorld, airDensity, backspinRpm, wind);

  const v1 = velocity;
  const a1 = a(v1);

  const v2 = add(velocity, scale(a1, dt / 2));
  const a2 = a(v2);

  const v3 = add(velocity, scale(a2, dt / 2));
  const a3 = a(v3);

  const v4 = add(velocity, scale(a3, dt));
  const a4 = a(v4);

  const dv = scale(add(add(a1, scale(a2, 2)), add(scale(a3, 2), a4)), dt / 6);
  const dp = scale(add(add(v1, scale(v2, 2)), add(scale(v3, 2), v4)), dt / 6);

  return {
    position: add(position, dp),
    velocity: add(velocity, dv),
  };
}

function restitution(firmness: number): number {
  return 0.28 + firmness * 0.32; // ~0.28 soft … ~0.60 firm
}

function frictionCoeff(firmness: number, moisture: number): number {
  const base = 0.12 + (1 - firmness) * 0.18;
  return base + moisture * 0.22;
}

function sample(
  t: number,
  position: Vec3,
  velocity: Vec3,
  phase: FlightSample['phase'],
): FlightSample {
  return { t, position: clone(position), velocity: clone(velocity), phase };
}

export function simulateShot(inputs: ShotInputs): ShotResults {
  const speed = mphToMs(inputs.ballSpeedMph);
  const launch = degToRad(inputs.launchAngleDeg);
  const yaw = degToRad(playerAimToWorldYaw(inputs.horizontalLaunchDeg, inputs.handedness));
  const worldSpinAxisDeg = playerSpinAxisToWorld(inputs.spinAxisDeg, inputs.handedness);
  const spinAxisRad = degToRad(worldSpinAxisDeg);

  // Initial velocity
  const horizontal = speed * Math.cos(launch);
  let velocity = vec3(
    horizontal * Math.sin(yaw),
    speed * Math.sin(launch),
    horizontal * Math.cos(yaw),
  );

  // Spin axis (Y-up, right-handed): right = up × forward.
  // Pure backspin ω = −right so ω × v points up (Magnus lift).
  const forward = normalize(vec3(velocity.x, 0, velocity.z));
  const up = vec3(0, 1, 0);
  const right = normalize(cross(up, forward));
  const pureBackspinAxis = scale(right, -1);
  // Positive world spin-axis tilt adds +up to ω → curves toward +X (RH fade).
  const tilted = normalize(
    add(scale(pureBackspinAxis, Math.cos(spinAxisRad)), scale(up, Math.sin(spinAxisRad))),
  );

  const wind = windVelocity(inputs);
  const airDensity = inputs.airDensityKgM3;

  let position = vec3(0, 0.05, 0); // tee height ~5cm
  const trajectory: FlightSample[] = [sample(0, position, velocity, 'flight')];

  let t = 0;
  let apexHeight = position.y;
  let apexPos = clone(position);
  let carryPos: Vec3 | null = null;
  let landingAngleDeg = 0;
  let firstBouncePos: Vec3 | null = null;
  let bounceDistance = 0;
  let phase: FlightSample['phase'] = 'flight';
  let bounceCount = 0;
  const maxBounces = 6;

  // For curve measurement: sample lateral vs initial aim line
  const aimDir = normalize(vec3(Math.sin(yaw), 0, Math.cos(yaw)));
  let maxCurveSigned = 0; // world +X relative to aim

  const recordCurve = (pos: Vec3) => {
    // Signed lateral offset from aim ray: positive = to the right of aim
    const lateral = pos.x * aimDir.z - pos.z * aimDir.x;
    const lateralYd = metersToYards(lateral);
    if (Math.abs(lateralYd) > Math.abs(maxCurveSigned)) {
      maxCurveSigned = lateralYd;
    }
  };

  while (t < MAX_SIM_TIME) {
    if (phase === 'flight') {
      const next = rk4Step(
        position,
        velocity,
        DT,
        tilted,
        airDensity,
        inputs.backspinRpm,
        wind,
      );
      position = next.position;
      velocity = next.velocity;
      t += DT;

      if (position.y > apexHeight) {
        apexHeight = position.y;
        apexPos = clone(position);
      }
      recordCurve(position);

      if (position.y <= 0 && velocity.y < 0) {
        // First ground contact → carry
        const impactSpeed = length(velocity);
        landingAngleDeg = Math.abs(
          (Math.atan2(velocity.y, Math.hypot(velocity.x, velocity.z)) * 180) / Math.PI,
        );
        position.y = 0;
        if (!carryPos) carryPos = clone(position);

        const e = restitution(inputs.groundFirmness);
        // Vertical bounce
        velocity.y = -velocity.y * e;
        // Horizontal speed loss on impact
        const mu = frictionCoeff(inputs.groundFirmness, inputs.fairwayMoisture);
        const frictionLoss = clamp(1 - mu * (0.35 + landingAngleDeg / 90), 0.35, 0.92);
        velocity.x *= frictionLoss;
        velocity.z *= frictionLoss;

        // Spin reduces after bounce
        bounceCount += 1;
        firstBouncePos = firstBouncePos ?? clone(position);

        if (velocity.y < 1.2 || bounceCount >= maxBounces || impactSpeed < 3) {
          phase = 'roll';
          velocity.y = 0;
        } else {
          phase = 'bounce';
        }
      }
    } else if (phase === 'bounce') {
      const next = rk4Step(
        position,
        velocity,
        DT,
        tilted,
        airDensity,
        inputs.backspinRpm * 0.55,
        wind,
      );
      position = next.position;
      velocity = next.velocity;
      t += DT;
      recordCurve(position);

      if (position.y <= 0 && velocity.y < 0) {
        position.y = 0;
        const e = restitution(inputs.groundFirmness) * 0.75;
        velocity.y = -velocity.y * e;
        const mu = frictionCoeff(inputs.groundFirmness, inputs.fairwayMoisture);
        const frictionLoss = clamp(1 - mu * 0.5, 0.4, 0.9);
        velocity.x *= frictionLoss;
        velocity.z *= frictionLoss;
        bounceCount += 1;
        if (velocity.y < 0.9 || bounceCount >= maxBounces) {
          phase = 'roll';
          velocity.y = 0;
        }
      }
    } else if (phase === 'roll') {
      // Friction-based rollout on flat ground
      position.y = 0;
      velocity.y = 0;
      const speedH = Math.hypot(velocity.x, velocity.z);
      if (speedH < 0.35) {
        velocity = vec3();
        phase = 'rest';
        break;
      }
      const mu = frictionCoeff(inputs.groundFirmness, inputs.fairwayMoisture);
      // Higher backspin → slightly less rollout (check effect)
      const spinPenalty = clamp(inputs.backspinRpm / 12000, 0, 0.35);
      const decel = GRAVITY * (mu + spinPenalty * 0.08 + inputs.fairwayMoisture * 0.05);
      const dir = normalize(vec3(velocity.x, 0, velocity.z));
      velocity = add(velocity, scale(dir, -decel * DT));
      // Prevent reverse
      if (dotXZ(velocity, dir) < 0) velocity = vec3();
      position = add(position, scale(velocity, DT));
      t += DT;
    } else {
      break;
    }

    // Subsample trajectory for rendering (~60 Hz worth)
    if (trajectory.length === 0 || t - trajectory[trajectory.length - 1].t >= 1 / 60) {
      trajectory.push(sample(t, position, velocity, phase));
    }
  }

  // Ensure final sample
  trajectory.push(sample(t, position, velocity, 'rest'));

  const carry = carryPos ?? position;
  const finalPos = position;
  if (firstBouncePos) {
    bounceDistance = distanceXZ(firstBouncePos, finalPos);
  }

  const carryYards = metersToYards(distanceXZ(vec3(), carry));
  const totalYards = metersToYards(distanceXZ(vec3(), finalPos));
  const bounceYards = metersToYards(bounceDistance);
  // Approximate pure bounce vs roll: first segment after landing until speed low
  const rolloutYards = Math.max(0, totalYards - carryYards);
  const estimatedBounce = Math.min(rolloutYards, bounceYards * 0.45 + rolloutYards * 0.15);
  const estimatedRoll = Math.max(0, rolloutYards - estimatedBounce);

  const offlineYards = metersToYards(finalPos.x); // +X = right
  // Curve relative to initial aim (not target line): use maxCurveSigned during flight
  // For classification we want curvature of the shot shape — difference between
  // landing offline and what pure aim would produce.
  const aimOfflineAtCarry = metersToYards(carry.x);
  // Better: curve = how much the ball bent from its initial direction
  // Use max lateral from aim line during flight, signed
  const curveYards = maxCurveSigned;

  const shotShape = classifyShotShape({
    offlineYards: aimOfflineAtCarry,
    curveYards,
    horizontalLaunchDeg: inputs.horizontalLaunchDeg,
    handedness: inputs.handedness,
  });

  const flightTime =
    trajectory.find((s) => s.phase !== 'flight')?.t ??
    trajectory[trajectory.length - 1]?.t ??
    t;

  return {
    carryYards: round1(carryYards),
    totalYards: round1(totalYards),
    apexYards: round1(metersToYards(apexPos.z)),
    apexHeightYards: round1(metersToYards(apexHeight)),
    flightTimeSec: round2(flightTime),
    ballSpeedMph: round1(inputs.ballSpeedMph),
    launchAngleDeg: round1(inputs.launchAngleDeg),
    backspinRpm: Math.round(inputs.backspinRpm),
    spinAxisDeg: round1(inputs.spinAxisDeg),
    sideSpinRpm: Math.round(sideSpinFromAxis(inputs.backspinRpm, inputs.spinAxisDeg)),
    offlineYards: round1(offlineYards),
    landingAngleDeg: round1(landingAngleDeg),
    bounceYards: round1(estimatedBounce),
    rolloutYards: round1(estimatedRoll),
    shotShape,
    landingPosition: {
      x: metersToYards(carry.x),
      y: 0,
      z: metersToYards(carry.z),
    },
    finalPosition: {
      x: metersToYards(finalPos.x),
      y: 0,
      z: metersToYards(finalPos.z),
    },
    trajectory,
  };
}

function dotXZ(v: Vec3, dir: Vec3): number {
  return v.x * dir.x + v.z * dir.z;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Convenience: simulate and return carry only (for tests). */
export function simulateCarryYards(inputs: ShotInputs): number {
  return simulateShot(inputs).carryYards;
}
