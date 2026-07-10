import { describe, expect, it } from 'vitest';
import { airDensityFromElevationFt } from './atmosphere';
import { BUILTIN_CLUBS, defaultInputsFromClub, simulateShot } from './index';

describe('elevation / atmosphere', () => {
  it('higher elevation reduces air density', () => {
    const sea = airDensityFromElevationFt(0);
    const denver = airDensityFromElevationFt(5280);
    expect(sea).toBeCloseTo(1.225, 2);
    expect(denver).toBeLessThan(sea);
    expect(denver).toBeGreaterThan(0.95);
  });

  it('higher elevation generally increases carry for the same launch', () => {
    const base = defaultInputsFromClub(BUILTIN_CLUBS[0]);
    const sea = simulateShot({
      ...base,
      elevationFt: 0,
      airDensityKgM3: airDensityFromElevationFt(0),
    });
    const high = simulateShot({
      ...base,
      elevationFt: 5280,
      airDensityKgM3: airDensityFromElevationFt(5280),
    });
    expect(high.carryYards).toBeGreaterThan(sea.carryYards);
  });
});
