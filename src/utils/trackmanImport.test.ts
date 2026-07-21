import { describe, expect, it } from 'vitest';
import { applyMeasuredLaunch, parseTrackmanFile } from '../utils/trackmanImport';
import { defaultInputsFromClub, BUILTIN_CLUBS } from '../physics';

describe('Trackman import', () => {
  it('parses CSV with Trackman-style headers', () => {
    const csv = [
      'Club,Ball Speed,Club Speed,Launch Angle,Launch Direction,Spin Rate,Spin Axis',
      'Driver,167.2,112.5,12.4,-1.2,2480,2.5',
      '7 Iron,120.1,86.0,18.2,0.5,6400,-3.0',
    ].join('\n');

    const result = parseTrackmanFile(csv, 'session.csv');
    expect(result.shots).toHaveLength(2);
    expect(result.shots[0].ballSpeedMph).toBeCloseTo(167.2);
    expect(result.shots[0].launchAngleDeg).toBeCloseTo(12.4);
    expect(result.shots[0].backspinRpm).toBeCloseTo(2480);
    expect(result.shots[0].spinAxisDeg).toBeCloseTo(2.5);
    expect(result.shots[0].clubName).toBe('Driver');
    expect(result.shots[1].clubName).toBe('7 Iron');
  });

  it('parses JSON shot objects', () => {
    const json = JSON.stringify({
      shots: [{ BallSpeed: 155, LaunchAngle: 14, SpinRate: 3000, SpinAxis: -4 }],
    });
    const result = parseTrackmanFile(json, 'shots.json');
    expect(result.shots).toHaveLength(1);
    expect(result.shots[0].ballSpeedMph).toBe(155);
    expect(result.shots[0].launchAngleDeg).toBe(14);
    expect(result.shots[0].backspinRpm).toBe(3000);
  });

  it('parses measured carry/total/apex when the file reports them', () => {
    const csv = [
      'Club,Ball Speed,Launch Angle,Spin Rate,Carry,Total,Apex Height',
      'Driver,167.2,12.4,2480,268.4,289.1,31.2',
    ].join('\n');

    const result = parseTrackmanFile(csv, 'session.csv');
    expect(result.shots[0].carryYards).toBeCloseTo(268.4);
    expect(result.shots[0].totalYards).toBeCloseTo(289.1);
    expect(result.shots[0].apexYards).toBeCloseTo(31.2);
  });

  it('parses measured carry/apex from JSON shot objects', () => {
    const json = JSON.stringify({
      shots: [{ BallSpeed: 155, LaunchAngle: 14, Carry: 240.5, Apex: 28.6 }],
    });
    const result = parseTrackmanFile(json, 'shots.json');
    expect(result.shots[0].carryYards).toBe(240.5);
    expect(result.shots[0].apexYards).toBe(28.6);
  });

  it('applies measured launch while preserving environment', () => {
    const inputs = {
      ...defaultInputsFromClub(BUILTIN_CLUBS[0]),
      windSpeedMph: 12,
      elevationFt: 1160,
      airDensityKgM3: 1.18,
    };
    const next = applyMeasuredLaunch(inputs, {
      ballSpeedMph: 160,
      launchAngleDeg: 11,
      backspinRpm: 2200,
      spinAxisDeg: 5,
    });
    expect(next.ballSpeedMph).toBe(160);
    expect(next.launchAngleDeg).toBe(11);
    expect(next.windSpeedMph).toBe(12);
    expect(next.elevationFt).toBe(1160);
  });
});
