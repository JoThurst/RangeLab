import type { ClubPreset } from '../types';

export const BUILTIN_CLUBS: ClubPreset[] = [
  {
    id: 'driver',
    name: 'Driver',
    loftDeg: 10.5,
    ballSpeedMph: 167,
    clubSpeedMph: 113,
    launchAngleDeg: 12.5,
    backspinRpm: 2550,
    spinAxisDeg: 0,
  },
  {
    id: '3wood',
    name: '3 Wood',
    loftDeg: 15,
    ballSpeedMph: 158,
    clubSpeedMph: 107,
    launchAngleDeg: 13.5,
    backspinRpm: 3200,
    spinAxisDeg: 0,
  },
  {
    id: '5iron',
    name: '5 Iron',
    loftDeg: 27,
    ballSpeedMph: 135,
    clubSpeedMph: 94,
    launchAngleDeg: 16,
    backspinRpm: 5200,
    spinAxisDeg: 0,
  },
  {
    id: '7iron',
    name: '7 Iron',
    loftDeg: 34,
    ballSpeedMph: 120,
    clubSpeedMph: 87,
    launchAngleDeg: 18.5,
    backspinRpm: 6500,
    spinAxisDeg: 0,
  },
  {
    id: '9iron',
    name: '9 Iron',
    loftDeg: 42,
    ballSpeedMph: 105,
    clubSpeedMph: 80,
    launchAngleDeg: 24,
    backspinRpm: 8200,
    spinAxisDeg: 0,
  },
  {
    id: 'pw',
    name: 'Pitching Wedge',
    loftDeg: 46,
    ballSpeedMph: 96,
    clubSpeedMph: 76,
    launchAngleDeg: 28,
    backspinRpm: 9200,
    spinAxisDeg: 0,
  },
];

export function createCustomClub(partial?: Partial<ClubPreset>): ClubPreset {
  return {
    id: `custom-${Date.now()}`,
    name: partial?.name ?? 'Custom Club',
    loftDeg: partial?.loftDeg ?? 20,
    ballSpeedMph: partial?.ballSpeedMph ?? 140,
    clubSpeedMph: partial?.clubSpeedMph ?? 95,
    launchAngleDeg: partial?.launchAngleDeg ?? 15,
    backspinRpm: partial?.backspinRpm ?? 4000,
    spinAxisDeg: partial?.spinAxisDeg ?? 0,
    isCustom: true,
  };
}
