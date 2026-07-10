import { describe, expect, it } from 'vitest';
import { classifyShotShape } from './classify';

describe('shot shape classification — right-handed', () => {
  it('classifies straight', () => {
    expect(
      classifyShotShape({
        offlineYards: 1,
        curveYards: 1,
        horizontalLaunchDeg: 0,
        handedness: 'right',
      }),
    ).toBe('Straight');
  });

  it('classifies RH draw (curves left)', () => {
    expect(
      classifyShotShape({
        offlineYards: -8,
        curveYards: -10,
        horizontalLaunchDeg: 0,
        handedness: 'right',
      }),
    ).toBe('Draw');
  });

  it('classifies RH fade (curves right)', () => {
    expect(
      classifyShotShape({
        offlineYards: 8,
        curveYards: 10,
        horizontalLaunchDeg: 0,
        handedness: 'right',
      }),
    ).toBe('Fade');
  });

  it('classifies RH hook and slice', () => {
    expect(
      classifyShotShape({
        offlineYards: -20,
        curveYards: -18,
        horizontalLaunchDeg: 0,
        handedness: 'right',
      }),
    ).toBe('Hook');
    expect(
      classifyShotShape({
        offlineYards: 20,
        curveYards: 18,
        horizontalLaunchDeg: 0,
        handedness: 'right',
      }),
    ).toBe('Slice');
  });

  it('classifies pull and push', () => {
    expect(
      classifyShotShape({
        offlineYards: -12,
        curveYards: 0,
        horizontalLaunchDeg: -5,
        handedness: 'right',
      }),
    ).toBe('Pull');
    expect(
      classifyShotShape({
        offlineYards: 12,
        curveYards: 0,
        horizontalLaunchDeg: 5,
        handedness: 'right',
      }),
    ).toBe('Push');
  });

  it('classifies pull-draw and push-fade', () => {
    expect(
      classifyShotShape({
        offlineYards: -15,
        curveYards: -8,
        horizontalLaunchDeg: -5,
        handedness: 'right',
      }),
    ).toBe('Pull-Draw');
    expect(
      classifyShotShape({
        offlineYards: 15,
        curveYards: 8,
        horizontalLaunchDeg: 5,
        handedness: 'right',
      }),
    ).toBe('Push-Fade');
  });
});

describe('shot shape classification — left-handed', () => {
  it('LH draw curves toward world +X (player draw)', () => {
    expect(
      classifyShotShape({
        offlineYards: 8,
        curveYards: 10,
        horizontalLaunchDeg: 0,
        handedness: 'left',
      }),
    ).toBe('Draw');
  });

  it('LH fade curves toward world -X', () => {
    expect(
      classifyShotShape({
        offlineYards: -8,
        curveYards: -10,
        horizontalLaunchDeg: 0,
        handedness: 'left',
      }),
    ).toBe('Fade');
  });

  it('LH pull is toward player left (world +X), push toward player right (world -X)', () => {
    // horizontalLaunchDeg positive = player right
    // For LH, player right = world -X
    expect(
      classifyShotShape({
        offlineYards: 12,
        curveYards: 0,
        horizontalLaunchDeg: -5, // player left
        handedness: 'left',
      }),
    ).toBe('Pull');
    expect(
      classifyShotShape({
        offlineYards: -12,
        curveYards: 0,
        horizontalLaunchDeg: 5, // player right
        handedness: 'left',
      }),
    ).toBe('Push');
  });

  it('LH pull-draw and push-fade', () => {
    expect(
      classifyShotShape({
        offlineYards: 15,
        curveYards: 8,
        horizontalLaunchDeg: -5,
        handedness: 'left',
      }),
    ).toBe('Pull-Draw');
    expect(
      classifyShotShape({
        offlineYards: -15,
        curveYards: -8,
        horizontalLaunchDeg: 5,
        handedness: 'left',
      }),
    ).toBe('Push-Fade');
  });

  it('same world curve is opposite shape for LH vs RH', () => {
    const worldCurveRight = {
      offlineYards: 10,
      curveYards: 12,
      horizontalLaunchDeg: 0,
    };
    expect(classifyShotShape({ ...worldCurveRight, handedness: 'right' })).toBe('Fade');
    expect(classifyShotShape({ ...worldCurveRight, handedness: 'left' })).toBe('Draw');
  });
});
