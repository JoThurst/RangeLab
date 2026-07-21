import { describe, expect, it } from 'vitest';
import { BUILTIN_CLUBS, defaultInputsFromClub, simulateShot } from '../physics';
import type { PracticeSession } from '../types';
import { TRACER_COLORS } from './colors';
import { computeSessionStats, sessionShareSummary, sessionToJson } from './sessionStats';

describe('sessionShareSummary', () => {
  const base = defaultInputsFromClub(BUILTIN_CLUBS[0]);
  const results = simulateShot(base);

  const session: PracticeSession = {
    id: 'session-summary',
    name: 'Coach Review',
    createdAt: 1,
    updatedAt: 1,
    targetShots: 10,
    note: 'Work the draw shape',
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

  it('includes name, stats, note, and shot lines', () => {
    const text = sessionShareSummary(session);
    expect(text).toContain('RangeLab session: Coach Review');
    expect(text).toContain('Shots: 1/10');
    expect(text).toContain('Note: Work the draw shape');
    expect(text).toContain('#1 Driver:');
    expect(text).toContain('Export JSON');
  });

  it('omits note line when absent', () => {
    const { note: _n, ...noNote } = session;
    const text = sessionShareSummary(noNote);
    expect(text).not.toContain('Note:');
  });

  it('matches JSON export shape used for coach share', () => {
    const json = sessionToJson(session);
    const parsed = JSON.parse(json) as PracticeSession;
    expect(parsed.note).toBe('Work the draw shape');
    expect(parsed.shots[0].results.trajectory.length).toBeGreaterThan(10);
  });
});

describe('computeSessionStats', () => {
  it('returns zeros for empty sessions', () => {
    expect(computeSessionStats([])).toEqual({
      shotCount: 0,
      avgCarry: 0,
      avgTotal: 0,
      longestTotal: 0,
      longestCarry: 0,
      carryConsistency: 0,
      avgOffline: 0,
      offlineStdDev: 0,
      leftRightDispersion: 0,
    });
  });
});
