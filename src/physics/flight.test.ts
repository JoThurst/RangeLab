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

describe('apex calibration regression (TrackMan PGA Tour averages)', () => {
  // Reference pairs (ball speed/launch/spin -> max height) from TrackMan's
  // published PGA Tour averages. Apex height on tour is famously flat across
  // the bag (~29-32yd / 87-96ft for driver through wedges), unlike a naive
  // lift model where low-spin/high-speed driver shots and high-spin/low-speed
  // wedge shots diverge sharply. These bands guard against the previous bug
  // where driver apex ballooned to ~70yd (~3x measured) while short irons
  // stayed close to measured.
  const driver = BUILTIN_CLUBS.find((c) => c.id === 'driver')!;
  const wood3 = BUILTIN_CLUBS.find((c) => c.id === '3wood')!;
  const iron7 = BUILTIN_CLUBS.find((c) => c.id === '7iron')!;
  const pw = BUILTIN_CLUBS.find((c) => c.id === 'pw')!;

  it('driver apex height stays within a credible band of the ~32yd tour average', () => {
    const r = simulateShot(defaultInputsFromClub(driver));
    expect(r.apexHeightYards).toBeGreaterThan(24);
    expect(r.apexHeightYards).toBeLessThan(45);
  });

  it('7-iron apex height stays within a credible band of the ~29-32yd tour average', () => {
    const r = simulateShot(defaultInputsFromClub(iron7));
    expect(r.apexHeightYards).toBeGreaterThan(22);
    expect(r.apexHeightYards).toBeLessThan(40);
  });

  it('pitching wedge apex height stays within a credible band of the ~29yd tour average', () => {
    const r = simulateShot(defaultInputsFromClub(pw));
    expect(r.apexHeightYards).toBeGreaterThan(20);
    expect(r.apexHeightYards).toBeLessThan(38);
  });

  it('apex heights stay relatively flat across the bag instead of blowing out for the driver', () => {
    const heights = BUILTIN_CLUBS.map((c) => simulateShot(defaultInputsFromClub(c)).apexHeightYards);
    const spread = Math.max(...heights) - Math.min(...heights);
    // Real tour bags show roughly a five-to-ten-yard spread top to bottom.
    // Allow headroom for our simplified model, but this catches the old
    // driver-apex blowout (which produced a ~35yd spread on its own).
    expect(spread).toBeLessThan(20);
  });

  it('driver apex is no longer inflated relative to a mid iron (previous regression)', () => {
    const d = simulateShot(defaultInputsFromClub(driver));
    const w3 = simulateShot(defaultInputsFromClub(wood3));
    // Before calibration, driver apex (~71yd) was nearly double the 3-wood's
    // (~65yd) and more than 2x a mid-iron's; both should now be in the same
    // ballpark, matching measured data where every club nets a similar apex.
    expect(d.apexHeightYards).toBeLessThan(w3.apexHeightYards + 10);
  });
});
