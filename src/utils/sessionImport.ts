import type { Handedness, PracticeSession, SessionShot, ShotInputs, ShotResults } from '../types';
import { airDensityFromElevationFt } from '../physics/atmosphere';
import { simulateShot } from '../physics/flight';
import { TRACER_COLORS } from './colors';
import {
  applyMeasuredLaunch,
  parseTrackmanFile,
  type MeasuredLaunch,
  type TrackmanParseResult,
} from './trackmanImport';

export type ImportFileResult =
  | { kind: 'launches'; shots: MeasuredLaunch[]; warnings: string[] }
  | { kind: 'session'; session: PracticeSession; warnings: string[] };

function isSessionShot(value: unknown): value is SessionShot {
  if (!value || typeof value !== 'object') return false;
  const s = value as Record<string, unknown>;
  return (
    typeof s.id === 'string' &&
    typeof s.inputs === 'object' &&
    s.inputs != null &&
    typeof s.results === 'object' &&
    s.results != null
  );
}

function isPracticeSession(value: unknown): value is PracticeSession {
  if (!value || typeof value !== 'object') return false;
  const s = value as Record<string, unknown>;
  return typeof s.id === 'string' && Array.isArray(s.shots) && s.shots.some(isSessionShot);
}

function normalizeSession(raw: PracticeSession): PracticeSession {
  const now = Date.now();
  return {
    id: raw.id || `session-${now}`,
    name: raw.name || `Imported Session ${new Date(now).toLocaleString()}`,
    createdAt: raw.createdAt || now,
    updatedAt: now,
    targetShots: Math.max(raw.targetShots || 10, raw.shots.length),
    shots: raw.shots.map((shot, i) => ({
      ...shot,
      id: shot.id || `shot-import-${now}-${i}`,
      index: shot.index || i + 1,
      timestamp: shot.timestamp || now + i,
      tracerVisible: shot.tracerVisible !== false,
      tracerColor: shot.tracerColor || TRACER_COLORS[i % TRACER_COLORS.length],
      inputs: ensureInputs(shot.inputs),
      results: ensureResults(shot.results, shot.inputs),
    })),
  };
}

function ensureInputs(inputs: ShotInputs): ShotInputs {
  const elevationFt = inputs.elevationFt ?? 0;
  return {
    ...inputs,
    elevationFt,
    airDensityKgM3: inputs.airDensityKgM3 ?? airDensityFromElevationFt(elevationFt),
    windSpeedMph: inputs.windSpeedMph ?? 0,
    windDirectionDeg: inputs.windDirectionDeg ?? 0,
    groundFirmness: inputs.groundFirmness ?? 0.65,
    fairwayMoisture: inputs.fairwayMoisture ?? 0.25,
    handedness: inputs.handedness ?? 'right',
  };
}

function ensureResults(results: ShotResults, inputs: ShotInputs): ShotResults {
  if (results.trajectory?.length) return results;
  return simulateShot(ensureInputs(inputs));
}

/** Build a practice session by re-simulating measured launches (e.g. from CSV export). */
export function sessionFromMeasuredLaunches(
  launches: MeasuredLaunch[],
  baseInputs: ShotInputs,
  name?: string,
): PracticeSession {
  const now = Date.now();
  const shots: SessionShot[] = launches.map((launch, i) => {
    const inputs = applyMeasuredLaunch(baseInputs, launch);
    // Prefer env hints from launch if we stored them on the object (CSV reimport)
    const withEnv = applyLaunchEnv(inputs, launch);
    const results = simulateShot(withEnv);
    return {
      id: `shot-import-${now}-${i}`,
      index: i + 1,
      timestamp: now + i,
      clubName: launch.clubName ?? 'Imported',
      inputs: withEnv,
      results,
      tracerVisible: true,
      tracerColor: TRACER_COLORS[i % TRACER_COLORS.length],
    };
  });

  return {
    id: `session-${now}`,
    name: name ?? `Imported Session ${new Date(now).toLocaleString()}`,
    createdAt: now,
    updatedAt: now,
    shots,
    targetShots: Math.max(10, shots.length),
  };
}

/** Optional env fields attached during RangeLab CSV parse. */
export type MeasuredLaunchWithEnv = MeasuredLaunch & {
  windSpeedMph?: number;
  windDirectionDeg?: number;
  elevationFt?: number;
  handedness?: Handedness;
};

function applyLaunchEnv(inputs: ShotInputs, launch: MeasuredLaunchWithEnv): ShotInputs {
  const next = { ...inputs };
  if (launch.windSpeedMph != null) next.windSpeedMph = launch.windSpeedMph;
  if (launch.windDirectionDeg != null) next.windDirectionDeg = launch.windDirectionDeg;
  if (launch.elevationFt != null) {
    next.elevationFt = launch.elevationFt;
    next.airDensityKgM3 = airDensityFromElevationFt(launch.elevationFt);
  }
  if (launch.handedness) next.handedness = launch.handedness;
  return next;
}

export function parseImportFile(text: string, filename?: string): ImportFileResult {
  const trimmed = text.trim();
  const lower = (filename ?? '').toLowerCase();

  if (lower.endsWith('.json') || trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const data = JSON.parse(trimmed) as unknown;
      if (isPracticeSession(data)) {
        return { kind: 'session', session: normalizeSession(data), warnings: [] };
      }
      // Array of session shots
      if (Array.isArray(data) && data.length && data.every(isSessionShot)) {
        const now = Date.now();
        return {
          kind: 'session',
          session: normalizeSession({
            id: `session-${now}`,
            name: `Imported Session ${new Date(now).toLocaleString()}`,
            createdAt: now,
            updatedAt: now,
            shots: data,
            targetShots: Math.max(10, data.length),
          }),
          warnings: [],
        };
      }
    } catch {
      // fall through to launch parser
    }
  }

  const launchResult = parseTrackmanFile(text, filename);
  return { kind: 'launches', shots: launchResult.shots, warnings: launchResult.warnings };
}

export function launchesFromSession(session: PracticeSession): MeasuredLaunch[] {
  return session.shots.map((s) => ({
    ballSpeedMph: s.inputs.ballSpeedMph,
    clubSpeedMph: s.inputs.clubSpeedMph,
    launchAngleDeg: s.inputs.launchAngleDeg,
    horizontalLaunchDeg: s.inputs.horizontalLaunchDeg,
    backspinRpm: s.inputs.backspinRpm,
    spinAxisDeg: s.inputs.spinAxisDeg,
    clubName: s.clubName,
    handedness: s.inputs.handedness,
    sourceLabel: 'RangeLab Session',
    windSpeedMph: s.inputs.windSpeedMph,
    windDirectionDeg: s.inputs.windDirectionDeg,
    elevationFt: s.inputs.elevationFt,
  }));
}

export type { TrackmanParseResult };
