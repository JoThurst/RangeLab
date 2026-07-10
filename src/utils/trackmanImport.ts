import type { Handedness, ShotInputs } from '../types';
import { airDensityFromElevationFt } from '../physics/atmosphere';

/** Launch-only fields typically exported by Trackman / launch monitors. */
export interface MeasuredLaunch {
  ballSpeedMph?: number;
  clubSpeedMph?: number;
  launchAngleDeg?: number;
  horizontalLaunchDeg?: number;
  backspinRpm?: number;
  spinAxisDeg?: number;
  clubName?: string;
  handedness?: Handedness;
  sourceLabel?: string;
}

export interface TrackmanParseResult {
  shots: MeasuredLaunch[];
  warnings: string[];
}

const HEADER_ALIASES: Record<keyof Omit<MeasuredLaunch, 'clubName' | 'handedness' | 'sourceLabel'>, string[]> = {
  ballSpeedMph: ['ball speed', 'ballspeed', 'ball_speed', 'bs', 'ball speed (mph)'],
  clubSpeedMph: ['club speed', 'clubspeed', 'club_speed', 'cs', 'club speed (mph)'],
  launchAngleDeg: [
    'launch angle',
    'launchangle',
    'launch_angle',
    'vert launch',
    'vertical launch',
    'la',
    'launch angle (deg)',
  ],
  horizontalLaunchDeg: [
    'launch direction',
    'horiz launch',
    'horizontal launch',
    'azimuth',
    'side angle',
    'launch dir',
    'ld',
  ],
  backspinRpm: [
    'spin rate',
    'back spin',
    'backspin',
    'total spin',
    'spin',
    'ball spin',
    'spin rate (rpm)',
  ],
  spinAxisDeg: ['spin axis', 'spinaxis', 'spin_axis', 'axis', 'spin axis (deg)'],
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, ' ');
}

function mapHeaders(headers: string[]): Partial<Record<keyof MeasuredLaunch, number>> {
  const map: Partial<Record<keyof MeasuredLaunch, number>> = {};
  const normalized = headers.map(normalizeHeader);

  for (const [field, aliases] of Object.entries(HEADER_ALIASES) as [
    keyof typeof HEADER_ALIASES,
    string[],
  ][]) {
    const idx = normalized.findIndex((h) => aliases.includes(h));
    if (idx >= 0) map[field] = idx;
  }

  const clubIdx = normalized.findIndex((h) =>
    ['club', 'club name', 'clubname', 'club type'].includes(h),
  );
  if (clubIdx >= 0) map.clubName = clubIdx;

  return map;
}

function parseNumber(raw: string | undefined): number | undefined {
  if (raw == null || raw.trim() === '') return undefined;
  const cleaned = raw.replace(/[^0-9.+-]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

function rowToLaunch(
  cells: string[],
  colMap: Partial<Record<keyof MeasuredLaunch, number>>,
): MeasuredLaunch | null {
  const get = (key: keyof MeasuredLaunch) => {
    const i = colMap[key];
    return i == null ? undefined : cells[i];
  };

  const ballSpeedMph = parseNumber(get('ballSpeedMph'));
  if (ballSpeedMph == null) return null;

  const launch: MeasuredLaunch = {
    ballSpeedMph,
    clubSpeedMph: parseNumber(get('clubSpeedMph')),
    launchAngleDeg: parseNumber(get('launchAngleDeg')),
    horizontalLaunchDeg: parseNumber(get('horizontalLaunchDeg')),
    backspinRpm: parseNumber(get('backspinRpm')),
    spinAxisDeg: parseNumber(get('spinAxisDeg')),
    clubName: get('clubName')?.trim() || undefined,
    sourceLabel: 'Trackman',
  };

  return launch;
}

function parseCsv(text: string): TrackmanParseResult {
  const warnings: string[] = [];
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { shots: [], warnings: ['CSV needs a header row and at least one data row.'] };
  }

  const headers = splitCsvLine(lines[0]);
  const colMap = mapHeaders(headers);

  if (colMap.ballSpeedMph == null) {
    return {
      shots: [],
      warnings: [
        'Could not find a Ball Speed column. Expected headers like "Ball Speed", "BallSpeed", or "BS".',
      ],
    };
  }

  const shots: MeasuredLaunch[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    const launch = rowToLaunch(cells, colMap);
    if (launch) shots.push(launch);
  }

  if (!shots.length) warnings.push('No valid shot rows found (Ball Speed required).');
  if (colMap.launchAngleDeg == null) warnings.push('Launch Angle column not found — left unchanged.');
  if (colMap.backspinRpm == null) warnings.push('Spin Rate column not found — left unchanged.');

  return { shots, warnings };
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

function parseJson(text: string): TrackmanParseResult {
  const warnings: string[] = [];
  try {
    const data = JSON.parse(text) as unknown;
    const rows = Array.isArray(data) ? data : Array.isArray((data as { shots?: unknown }).shots)
      ? (data as { shots: unknown[] }).shots
      : [data];

    const shots: MeasuredLaunch[] = [];
    for (const row of rows) {
      if (!row || typeof row !== 'object') continue;
      const r = row as Record<string, unknown>;
      const launch = objectToLaunch(r);
      if (launch) shots.push(launch);
    }

    if (!shots.length) warnings.push('JSON parsed but no shots with ball speed were found.');
    return { shots, warnings };
  } catch {
    return { shots: [], warnings: ['Invalid JSON.'] };
  }
}

function objectToLaunch(r: Record<string, unknown>): MeasuredLaunch | null {
  const pick = (...keys: string[]): number | undefined => {
    for (const k of keys) {
      const found = Object.entries(r).find(([key]) => normalizeHeader(key) === normalizeHeader(k));
      if (found) {
        const n = typeof found[1] === 'number' ? found[1] : parseNumber(String(found[1]));
        if (n != null) return n;
      }
    }
    return undefined;
  };

  const ballSpeedMph = pick('ballSpeed', 'ballSpeedMph', 'Ball Speed', 'BS');
  if (ballSpeedMph == null) return null;

  const clubNameRaw = Object.entries(r).find(([k]) =>
    ['club', 'club name', 'clubname'].includes(normalizeHeader(k)),
  )?.[1];

  return {
    ballSpeedMph,
    clubSpeedMph: pick('clubSpeed', 'clubSpeedMph', 'Club Speed', 'CS'),
    launchAngleDeg: pick('launchAngle', 'launchAngleDeg', 'Launch Angle', 'Vert Launch'),
    horizontalLaunchDeg: pick(
      'launchDirection',
      'horizontalLaunchDeg',
      'Launch Direction',
      'Azimuth',
    ),
    backspinRpm: pick('spinRate', 'backspinRpm', 'Spin Rate', 'Back Spin', 'Total Spin'),
    spinAxisDeg: pick('spinAxis', 'spinAxisDeg', 'Spin Axis'),
    clubName: clubNameRaw != null ? String(clubNameRaw) : undefined,
    sourceLabel: 'Trackman',
  };
}

export function parseTrackmanFile(text: string, filename?: string): TrackmanParseResult {
  const lower = (filename ?? '').toLowerCase();
  if (lower.endsWith('.json') || text.trim().startsWith('{') || text.trim().startsWith('[')) {
    return parseJson(text);
  }
  return parseCsv(text);
}

/** Merge measured launch into existing inputs (env preserved). */
export function applyMeasuredLaunch(inputs: ShotInputs, launch: MeasuredLaunch): ShotInputs {
  return {
    ...inputs,
    ballSpeedMph: launch.ballSpeedMph ?? inputs.ballSpeedMph,
    clubSpeedMph: launch.clubSpeedMph ?? inputs.clubSpeedMph,
    launchAngleDeg: launch.launchAngleDeg ?? inputs.launchAngleDeg,
    horizontalLaunchDeg: launch.horizontalLaunchDeg ?? inputs.horizontalLaunchDeg,
    backspinRpm: launch.backspinRpm ?? inputs.backspinRpm,
    spinAxisDeg: launch.spinAxisDeg ?? inputs.spinAxisDeg,
    handedness: launch.handedness ?? inputs.handedness,
  };
}

export function withElevation(inputs: ShotInputs, elevationFt: number): ShotInputs {
  return {
    ...inputs,
    elevationFt,
    airDensityKgM3: airDensityFromElevationFt(elevationFt),
  };
}
