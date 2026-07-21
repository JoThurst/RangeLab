import { describe, expect, it } from 'vitest';
import { BUILTIN_CLUBS, defaultInputsFromClub, simulateShot } from '../physics';
import { parseImportFile, sessionFromMeasuredLaunches } from './sessionImport';
import { sessionToCsv, sessionToJson } from './sessionStats';
import { TRACER_COLORS } from './colors';
import type { PracticeSession } from '../types';

describe('session export round-trip', () => {
  const base = defaultInputsFromClub(BUILTIN_CLUBS[0]);
  const results = simulateShot(base);

  const session: PracticeSession = {
    id: 'session-test',
    name: 'Test Session',
    createdAt: 1,
    updatedAt: 1,
    targetShots: 10,
    shots: [
      {
        id: 'shot-1',
        index: 1,
        timestamp: 1,
        clubName: 'Driver',
        inputs: base,
        results,
        tracerVisible: true,
        tracerColor: TRACER_COLORS[0],
      },
    ],
  };

  it('reimports RangeLab session JSON as a session', () => {
    const json = sessionToJson(session);
    const parsed = parseImportFile(json, 'session-test.json');
    expect(parsed.kind).toBe('session');
    if (parsed.kind !== 'session') return;
    expect(parsed.session.shots).toHaveLength(1);
    expect(parsed.session.shots[0].inputs.ballSpeedMph).toBe(base.ballSpeedMph);
    expect(parsed.session.shots[0].results.trajectory.length).toBeGreaterThan(10);
  });

  it('reimports RangeLab session CSV as launch rows', () => {
    const csv = sessionToCsv(session);
    const parsed = parseImportFile(csv, 'session-test.csv');
    expect(parsed.kind).toBe('launches');
    if (parsed.kind !== 'launches') return;
    expect(parsed.shots.length).toBe(1);
    expect(parsed.shots[0].ballSpeedMph).toBe(base.ballSpeedMph);
    expect(parsed.shots[0].launchAngleDeg).toBe(base.launchAngleDeg);
    expect(parsed.shots[0].backspinRpm).toBe(base.backspinRpm);
  });

  it('rebuilds a session from CSV launch rows', () => {
    const csv = sessionToCsv(session);
    const parsed = parseImportFile(csv, 'session-test.csv');
    if (parsed.kind !== 'launches') throw new Error('expected launches');
    const rebuilt = sessionFromMeasuredLaunches(parsed.shots, base, 'Rebuilt');
    expect(rebuilt.shots).toHaveLength(1);
    expect(rebuilt.shots[0].results.carryYards).toBeGreaterThan(100);
  });
});
