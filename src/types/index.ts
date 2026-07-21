/** Shared domain types for RangeLab */

export type Handedness = 'right' | 'left';

export type CameraMode =
  | 'behind'
  | 'follow'
  | 'side'
  | 'landing'
  | 'orbit'
  | 'topdown';

export type WeatherCondition = 'day' | 'sunset' | 'overcast';

export type ShotShape =
  | 'Straight'
  | 'Draw'
  | 'Fade'
  | 'Hook'
  | 'Slice'
  | 'Pull'
  | 'Push'
  | 'Pull-Draw'
  | 'Push-Fade'
  | 'Pull-Hook'
  | 'Push-Slice';

export type ClubId =
  | 'driver'
  | '3wood'
  | '5iron'
  | '7iron'
  | '9iron'
  | 'pw'
  | 'custom';

export interface ClubPreset {
  id: ClubId | string;
  name: string;
  loftDeg: number;
  ballSpeedMph: number;
  clubSpeedMph: number;
  launchAngleDeg: number;
  backspinRpm: number;
  spinAxisDeg: number;
  isCustom?: boolean;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface ShotInputs {
  ballSpeedMph: number;
  clubSpeedMph: number;
  launchAngleDeg: number;
  /** Horizontal aim relative to target line. Positive = right for RH, left for LH (player perspective). */
  horizontalLaunchDeg: number;
  backspinRpm: number;
  /** Spin axis tilt. Positive = fade for RH / draw for LH (player perspective). */
  spinAxisDeg: number;
  windSpeedMph: number;
  /** Meteorological: 0 = into face (headwind), 90 = from right, 180 = tailwind, 270 = from left. */
  windDirectionDeg: number;
  /** Feet above sea level — drives air density when not manually overridden. */
  elevationFt: number;
  airDensityKgM3: number;
  /** 0 soft … 1 firm */
  groundFirmness: number;
  /** 0 dry … 1 wet */
  fairwayMoisture: number;
  handedness: Handedness;
}

/** Locked launch fingerprint from Trackman / launch monitor import. */
export interface MeasuredShotLock {
  locked: boolean;
  sourceLabel: string;
  clubName?: string;
  importedAt: number;
  /** Elevation captured at import time — used to detect when the current env has drifted from the import site. */
  importElevationFt?: number;
  /** Ground-truth results reported by the launch monitor, if the file included them (for measured-vs-simulated deltas). */
  measuredCarryYards?: number;
  measuredTotalYards?: number;
  measuredApexYards?: number;
}

export interface EnvComparisonOverlay {
  id: string;
  label: string;
  color: string;
  inputs: ShotInputs;
  results: ShotResults;
  visible: boolean;
}

export interface FlightSample {
  t: number;
  position: Vec3;
  velocity: Vec3;
  phase: 'flight' | 'bounce' | 'roll' | 'rest';
}

export interface ShotResults {
  carryYards: number;
  totalYards: number;
  apexYards: number;
  apexHeightYards: number;
  flightTimeSec: number;
  ballSpeedMph: number;
  launchAngleDeg: number;
  backspinRpm: number;
  spinAxisDeg: number;
  sideSpinRpm: number;
  offlineYards: number;
  landingAngleDeg: number;
  bounceYards: number;
  rolloutYards: number;
  shotShape: ShotShape;
  landingPosition: Vec3;
  finalPosition: Vec3;
  trajectory: FlightSample[];
}

export interface SessionShot {
  id: string;
  index: number;
  timestamp: number;
  clubName: string;
  inputs: ShotInputs;
  results: ShotResults;
  tracerVisible: boolean;
  tracerColor: string;
}

export interface PracticeSession {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  shots: SessionShot[];
  targetShots: number;
  /** Optional coach/player note carried through export/import for sharing context. */
  note?: string;
}

export interface SessionStats {
  shotCount: number;
  avgCarry: number;
  avgTotal: number;
  longestTotal: number;
  longestCarry: number;
  carryConsistency: number;
  avgOffline: number;
  offlineStdDev: number;
  leftRightDispersion: number;
}

export interface PerformanceSettings {
  shadows: boolean;
  tracerMaxPoints: number;
  pixelRatioCap: number;
  showWindIndicators: boolean;
  showLandingGrid: boolean;
  showDistanceMarkers: boolean;
}

export interface AppUiState {
  controlPanelOpen: boolean;
  resultsPanelOpen: boolean;
  sessionPanelOpen: boolean;
  guidedModeOpen: boolean;
  settingsOpen: boolean;
  importOpen: boolean;
  compareOpen: boolean;
  isLoading: boolean;
}
