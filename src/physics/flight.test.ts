import { describe, expect, it } from 'vitest';
import { BUILTIN_CLUBS, defaultInputsFromClub, simulateShot } from '../physics';
import type { ShotInputs } from '../types';

function baseDriver(overrides: Partial<ShotInputs> = {}): ShotInputs {
  return { ...defaultInputsFromClub(BUILTIN_CLUBS[0]), ...overrides };
}

describe('ball flight relationships', () => {
  it('more ball speed generally increases carry distance', () => {
    const slow = simulateShot(baseDriver({ ballSpeedMph: 140 }));
    const fast = simulateShot(baseDriver({ ballSpeedMph: 170 }));
    expect(fast.carryYards).toBeGreaterThan(slow.carryYards);
  });

  it('headwind reduces carry vs calm', () => {
    const calm = simulateShot(baseDriver({ windSpeedMph: 0 }));
    const head = simulateShot(baseDriver({ windSpeedMph: 15, windDirectionDeg: 0 }));
    expect(head.carryYards).toBeLessThan(calm.carryYards);
  });

  it('tailwind generally increases carry vs calm', () => {
    const calm = simulateShot(baseDriver({ windSpeedMph: 0 }));
    const tail = simulateShot(baseDriver({ windSpeedMph: 15, windDirectionDeg: 180 }));
    expect(tail.carryYards).toBeGreaterThan(calm.carryYards);
  });

  it('more backspin increases apex height', () => {
    const lowSpin = simulateShot(baseDriver({ backspinRpm: 1800 }));
    const highSpin = simulateShot(baseDriver({ backspinRpm: 4000 }));
    expect(highSpin.apexHeightYards).toBeGreaterThan(lowSpin.apexHeightYards);
  });

  it('more backspin can reduce rollout', () => {
    const lowSpin = simulateShot(
      baseDriver({ backspinRpm: 1800, groundFirmness: 0.8, fairwayMoisture: 0.1 }),
    );
    const highSpin = simulateShot(
      baseDriver({ backspinRpm: 4500, groundFirmness: 0.8, fairwayMoisture: 0.1 }),
    );
    expect(highSpin.rolloutYards + highSpin.bounceYards).toBeLessThanOrEqual(
      lowSpin.rolloutYards + lowSpin.bounceYards + 2,
    );
  });

  it('tilted spin axis curves the ball offline', () => {
    const straight = simulateShot(baseDriver({ spinAxisDeg: 0 }));
    const fade = simulateShot(baseDriver({ spinAxisDeg: 8, handedness: 'right' }));
    expect(Math.abs(fade.offlineYards)).toBeGreaterThan(Math.abs(straight.offlineYards));
    expect(fade.offlineYards).toBeGreaterThan(0); // RH fade → right
  });

  it('softer ground reduces rollout', () => {
    const firm = simulateShot(baseDriver({ groundFirmness: 0.95, fairwayMoisture: 0.05 }));
    const soft = simulateShot(baseDriver({ groundFirmness: 0.2, fairwayMoisture: 0.7 }));
    expect(soft.totalYards - soft.carryYards).toBeLessThan(firm.totalYards - firm.carryYards);
  });

  it('lower-lofted clubs launch lower than wedges', () => {
    const driver = BUILTIN_CLUBS.find((c) => c.id === 'driver')!;
    const pw = BUILTIN_CLUBS.find((c) => c.id === 'pw')!;
    expect(driver.launchAngleDeg).toBeLessThan(pw.launchAngleDeg);
    const d = simulateShot(defaultInputsFromClub(driver));
    const w = simulateShot(defaultInputsFromClub(pw));
    expect(d.launchAngleDeg).toBeLessThan(w.launchAngleDeg);
  });

  it('driver carries farther than pitching wedge at stock settings', () => {
    const d = simulateShot(defaultInputsFromClub(BUILTIN_CLUBS[0]));
    const w = simulateShot(defaultInputsFromClub(BUILTIN_CLUBS[5]));
    expect(d.carryYards).toBeGreaterThan(w.carryYards);
  });
});
