import type { PracticeSession, SessionShot, SessionStats } from '../types';

function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((acc, v) => acc + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function computeSessionStats(shots: SessionShot[]): SessionStats {
  if (!shots.length) {
    return {
      shotCount: 0,
      avgCarry: 0,
      avgTotal: 0,
      longestTotal: 0,
      longestCarry: 0,
      carryConsistency: 0,
      avgOffline: 0,
      offlineStdDev: 0,
      leftRightDispersion: 0,
    };
  }

  const carries = shots.map((s) => s.results.carryYards);
  const totals = shots.map((s) => s.results.totalYards);
  const offlines = shots.map((s) => s.results.offlineYards);
  const absOffline = offlines.map(Math.abs);
  const carrySd = stdDev(carries);
  const avgCarry = mean(carries);

  // Consistency: 100 when SD is 0, decreases as SD grows relative to mean
  const carryConsistency =
    avgCarry <= 0 ? 0 : Math.max(0, Math.min(100, 100 * (1 - carrySd / (avgCarry * 0.15 + 1))));

  return {
    shotCount: shots.length,
    avgCarry: round1(avgCarry),
    avgTotal: round1(mean(totals)),
    longestTotal: round1(Math.max(...totals)),
    longestCarry: round1(Math.max(...carries)),
    carryConsistency: round1(carryConsistency),
    avgOffline: round1(mean(absOffline)),
    offlineStdDev: round1(stdDev(offlines)),
    leftRightDispersion: round1(Math.max(...offlines) - Math.min(...offlines)),
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function sessionToJson(session: PracticeSession): string {
  return JSON.stringify(session, null, 2);
}

/** Compact text summary for pasting into chat/email when sharing with a coach. */
export function sessionShareSummary(session: PracticeSession): string {
  const stats = computeSessionStats(session.shots);
  const lines = [
    `RangeLab session: ${session.name}`,
    `Shots: ${stats.shotCount}/${session.targetShots}`,
    `Avg carry: ${stats.avgCarry} yd · Avg total: ${stats.avgTotal} yd`,
    `Longest total: ${stats.longestTotal} yd · Consistency: ${stats.carryConsistency}`,
    `Avg |offline|: ${stats.avgOffline} yd · L-R spread: ${stats.leftRightDispersion} yd`,
  ];
  if (session.note?.trim()) {
    lines.push(`Note: ${session.note.trim()}`);
  }
  if (session.shots.length) {
    lines.push('Shots:');
    for (const shot of session.shots) {
      lines.push(
        `  #${shot.index} ${shot.clubName}: ${shot.results.carryYards}/${shot.results.totalYards} yd · ${shot.results.shotShape} · offline ${shot.results.offlineYards} yd`,
      );
    }
  }
  lines.push(
    'Full tracers: share the Export JSON file and open it via Session → Load shared session (or Import).',
  );
  return lines.join('\n');
}

export function sessionToCsv(session: PracticeSession): string {
  const header = [
    'index',
    'club',
    'carry_yd',
    'total_yd',
    'apex_ht_yd',
    'flight_s',
    'ball_speed_mph',
    'club_speed_mph',
    'launch_deg',
    'horizontal_launch_deg',
    'backspin_rpm',
    'spin_axis_deg',
    'offline_yd',
    'landing_angle_deg',
    'bounce_yd',
    'rollout_yd',
    'shape',
    'handedness',
    'wind_mph',
    'wind_dir_deg',
    'elevation_ft',
  ].join(',');

  const rows = session.shots.map((s) =>
    [
      s.index,
      csvEscape(s.clubName),
      s.results.carryYards,
      s.results.totalYards,
      s.results.apexHeightYards,
      s.results.flightTimeSec,
      s.results.ballSpeedMph,
      s.inputs.clubSpeedMph,
      s.results.launchAngleDeg,
      s.inputs.horizontalLaunchDeg,
      s.results.backspinRpm,
      s.results.spinAxisDeg,
      s.results.offlineYards,
      s.results.landingAngleDeg,
      s.results.bounceYards,
      s.results.rolloutYards,
      csvEscape(s.results.shotShape),
      s.inputs.handedness,
      s.inputs.windSpeedMph,
      s.inputs.windDirectionDeg,
      s.inputs.elevationFt,
    ].join(','),
  );

  return [header, ...rows].join('\n');
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function downloadText(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
