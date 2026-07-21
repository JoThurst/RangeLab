import { create } from 'zustand';
import { COURSE_PRESETS, coursePresetToEnv } from '../data/coursePresets';
import {
  BUILTIN_CLUBS,
  airDensityFromElevationFt,
  createCustomClub,
  defaultInputsFromClub,
  simulateShot,
} from '../physics';
import type {
  AppUiState,
  CameraMode,
  ClubPreset,
  EnvComparisonOverlay,
  Handedness,
  MeasuredShotLock,
  PerformanceSettings,
  PracticeSession,
  SessionShot,
  ShotInputs,
  ShotResults,
  WeatherCondition,
} from '../types';
import { TRACER_COLORS } from '../utils/colors';
import { loadSessions, saveSessions } from '../utils/storage';
import { applyMeasuredLaunch, type MeasuredLaunch } from '../utils/trackmanImport';

const defaultClub = BUILTIN_CLUBS[0];

const COMPARE_COLORS = ['#f5a524', '#a78bfa', '#f31260', '#38bdf8'];

interface RangeState {
  clubs: ClubPreset[];
  selectedClubId: string;
  selectedCourseId: string | null;
  inputs: ShotInputs;
  weather: WeatherCondition;
  cameraMode: CameraMode;
  performance: PerformanceSettings;
  ui: AppUiState;

  measuredLock: MeasuredShotLock | null;
  importedBatch: MeasuredLaunch[];
  importedBatchIndex: number;
  baselineResults: ShotResults | null;
  baselineInputs: ShotInputs | null;
  comparisonOverlays: EnvComparisonOverlay[];

  lastResults: ShotResults | null;
  isSimulating: boolean;
  isPlaying: boolean;
  playbackTime: number;
  playbackSpeed: number;

  activeSession: PracticeSession | null;
  recentSessions: PracticeSession[];
  replayShotId: string | null;

  setClub: (clubId: string) => void;
  updateInput: <K extends keyof ShotInputs>(key: K, value: ShotInputs[K]) => void;
  setElevation: (elevationFt: number) => void;
  applyCoursePreset: (courseId: string) => void;
  clearCoursePreset: () => void;
  setHandedness: (h: Handedness) => void;
  setWeather: (w: WeatherCondition) => void;
  setCameraMode: (m: CameraMode) => void;
  setPerformance: (p: Partial<PerformanceSettings>) => void;
  setUi: (u: Partial<AppUiState>) => void;
  addCustomClub: (partial?: Partial<ClubPreset>) => void;
  updateCustomClub: (id: string, partial: Partial<ClubPreset>) => void;

  importMeasuredLaunch: (launch: MeasuredLaunch, options?: { lock?: boolean }) => void;
  importMeasuredBatch: (launches: MeasuredLaunch[], startIndex?: number) => void;
  selectImportedShot: (index: number) => void;
  stepImportedShot: (delta: number) => void;
  importPracticeSession: (session: PracticeSession) => void;
  setMeasuredLock: (locked: boolean) => void;
  clearMeasuredLock: () => void;

  saveBaseline: () => void;
  clearBaseline: () => void;
  compareAgainstCourse: (courseId: string) => void;
  compareAgainstBaseline: () => void;
  toggleComparisonOverlay: (id: string) => void;
  clearComparisons: () => void;

  launchShot: () => ShotResults | null;
  clearLastShot: () => void;
  setPlaybackTime: (t: number) => void;
  setIsPlaying: (v: boolean) => void;
  setPlaybackSpeed: (s: number) => void;

  startSession: (name?: string) => void;
  endSession: () => void;
  toggleTracer: (shotId: string) => void;
  setReplayShot: (shotId: string | null) => void;
  loadSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
}

function newSession(name?: string): PracticeSession {
  const now = Date.now();
  return {
    id: `session-${now}`,
    name: name ?? `Session ${new Date(now).toLocaleString()}`,
    createdAt: now,
    updatedAt: now,
    shots: [],
    targetShots: 10,
  };
}

function envSlice(inputs: ShotInputs) {
  return {
    windSpeedMph: inputs.windSpeedMph,
    windDirectionDeg: inputs.windDirectionDeg,
    elevationFt: inputs.elevationFt,
    airDensityKgM3: inputs.airDensityKgM3,
    groundFirmness: inputs.groundFirmness,
    fairwayMoisture: inputs.fairwayMoisture,
  };
}

export const useRangeStore = create<RangeState>((set, get) => ({
  clubs: [...BUILTIN_CLUBS],
  selectedClubId: defaultClub.id,
  selectedCourseId: null,
  inputs: defaultInputsFromClub(defaultClub, 'right'),
  weather: 'day',
  cameraMode: 'behind',
  performance: {
    shadows: true,
    tracerMaxPoints: 400,
    pixelRatioCap: 1.75,
    showWindIndicators: true,
    showLandingGrid: true,
    showDistanceMarkers: true,
  },
  ui: {
    controlPanelOpen: true,
    resultsPanelOpen: true,
    sessionPanelOpen: false,
    guidedModeOpen: false,
    settingsOpen: false,
    importOpen: false,
    compareOpen: false,
    isLoading: true,
  },

  measuredLock: null,
  importedBatch: [],
  importedBatchIndex: 0,
  baselineResults: null,
  baselineInputs: null,
  comparisonOverlays: [],

  lastResults: null,
  isSimulating: false,
  isPlaying: false,
  playbackTime: 0,
  playbackSpeed: 1,

  activeSession: null,
  recentSessions: loadSessions(),
  replayShotId: null,

  setClub: (clubId) => {
    const club = get().clubs.find((c) => c.id === clubId);
    if (!club) return;
    const lock = get().measuredLock;
    const env = envSlice(get().inputs);
    const handedness = get().inputs.handedness;

    if (lock?.locked) {
      set({ selectedClubId: clubId });
      return;
    }

    set({
      selectedClubId: clubId,
      inputs: {
        ...defaultInputsFromClub(club, handedness),
        ...env,
      },
    });
  },

  updateInput: (key, value) => {
    const lock = get().measuredLock;
    const launchKeys: (keyof ShotInputs)[] = [
      'ballSpeedMph',
      'clubSpeedMph',
      'launchAngleDeg',
      'horizontalLaunchDeg',
      'backspinRpm',
      'spinAxisDeg',
    ];
    if (lock?.locked && launchKeys.includes(key)) return;

    if (key === 'elevationFt') {
      get().setElevation(value as number);
      return;
    }

    set({
      inputs: { ...get().inputs, [key]: value },
      selectedCourseId: key === 'windSpeedMph' || key === 'groundFirmness' || key === 'fairwayMoisture'
        ? null
        : get().selectedCourseId,
    });
  },

  setElevation: (elevationFt) => {
    set({
      inputs: {
        ...get().inputs,
        elevationFt,
        airDensityKgM3: airDensityFromElevationFt(elevationFt),
      },
      selectedCourseId: null,
    });
  },

  applyCoursePreset: (courseId) => {
    const preset = COURSE_PRESETS.find((c) => c.id === courseId);
    if (!preset) return;
    const env = coursePresetToEnv(preset);
    set({
      selectedCourseId: courseId,
      inputs: {
        ...get().inputs,
        windSpeedMph: env.windSpeedMph,
        elevationFt: env.elevationFt,
        airDensityKgM3: airDensityFromElevationFt(env.elevationFt),
        fairwayMoisture: env.fairwayMoisture,
        groundFirmness: env.groundFirmness,
      },
    });
  },

  clearCoursePreset: () => set({ selectedCourseId: null }),

  setHandedness: (h) => set({ inputs: { ...get().inputs, handedness: h } }),
  setWeather: (w) => set({ weather: w }),
  setCameraMode: (m) => set({ cameraMode: m }),
  setPerformance: (p) => set({ performance: { ...get().performance, ...p } }),
  setUi: (u) => set({ ui: { ...get().ui, ...u } }),

  addCustomClub: (partial) => {
    const club = createCustomClub(partial);
    set({ clubs: [...get().clubs, club], selectedClubId: club.id });
    if (!get().measuredLock?.locked) get().setClub(club.id);
  },

  updateCustomClub: (id, partial) => {
    set({
      clubs: get().clubs.map((c) => (c.id === id ? { ...c, ...partial, isCustom: true } : c)),
    });
  },

  importMeasuredLaunch: (launch, options) => {
    get().importMeasuredBatch([launch], 0);
    if (options?.lock === false) {
      get().setMeasuredLock(false);
    }
  },

  importMeasuredBatch: (launches, startIndex = 0) => {
    if (!launches.length) return;
    const index = Math.max(0, Math.min(startIndex, launches.length - 1));
    const launch = launches[index];
    let nextInputs = applyMeasuredLaunch(get().inputs, launch);

    if (launch.windSpeedMph != null) nextInputs = { ...nextInputs, windSpeedMph: launch.windSpeedMph };
    if (launch.windDirectionDeg != null) {
      nextInputs = { ...nextInputs, windDirectionDeg: launch.windDirectionDeg };
    }
    if (launch.elevationFt != null) {
      nextInputs = {
        ...nextInputs,
        elevationFt: launch.elevationFt,
        airDensityKgM3: airDensityFromElevationFt(launch.elevationFt),
      };
    }

    let selectedClubId = get().selectedClubId;
    let clubs = get().clubs;
    if (launch.clubName) {
      const existing = clubs.find((c) => c.name.toLowerCase() === launch.clubName!.toLowerCase());
      if (existing) {
        selectedClubId = existing.id;
      } else {
        const custom = createCustomClub({
          name: launch.clubName,
          ballSpeedMph: nextInputs.ballSpeedMph,
          clubSpeedMph: nextInputs.clubSpeedMph,
          launchAngleDeg: nextInputs.launchAngleDeg,
          backspinRpm: nextInputs.backspinRpm,
          spinAxisDeg: nextInputs.spinAxisDeg,
        });
        clubs = [...clubs, custom];
        selectedClubId = custom.id;
      }
    }

    set({
      clubs,
      selectedClubId,
      inputs: nextInputs,
      importedBatch: launches,
      importedBatchIndex: index,
      measuredLock: {
        locked: true,
        sourceLabel: launch.sourceLabel ?? 'Trackman',
        clubName: launch.clubName,
        importedAt: Date.now(),
        importElevationFt: nextInputs.elevationFt,
        measuredCarryYards: launch.carryYards,
        measuredTotalYards: launch.totalYards,
        measuredApexYards: launch.apexYards,
      },
      lastResults: null,
      isPlaying: false,
      playbackTime: 0,
      ui: { ...get().ui, importOpen: false, resultsPanelOpen: true, controlPanelOpen: true },
    });
  },

  selectImportedShot: (index) => {
    const { importedBatch, activeSession } = get();
    if (!importedBatch.length) return;
    const i = Math.max(0, Math.min(index, importedBatch.length - 1));
    const sessionShot =
      activeSession && activeSession.shots.length === importedBatch.length
        ? activeSession.shots[i]
        : undefined;
    get().importMeasuredBatch(importedBatch, i);
    if (sessionShot) {
      set({
        lastResults: sessionShot.results,
        inputs: { ...sessionShot.inputs },
        isPlaying: true,
        playbackTime: 0,
      });
    }
  },

  stepImportedShot: (delta) => {
    const { importedBatch, importedBatchIndex } = get();
    if (importedBatch.length < 2) return;
    const next = (importedBatchIndex + delta + importedBatch.length) % importedBatch.length;
    get().selectImportedShot(next);
  },

  importPracticeSession: (session) => {
    const recent = [session, ...get().recentSessions.filter((s) => s.id !== session.id)].slice(
      0,
      20,
    );
    saveSessions(recent);
    const launches: MeasuredLaunch[] = session.shots.map((s) => ({
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
    const last = session.shots.at(-1);
    const idx = Math.max(0, launches.length - 1);

    set({
      recentSessions: recent,
      activeSession: session,
      lastResults: last?.results ?? null,
      inputs: last ? { ...last.inputs } : get().inputs,
      importedBatch: launches,
      importedBatchIndex: idx,
      measuredLock: launches.length
        ? {
            locked: true,
            sourceLabel: 'RangeLab Session',
            clubName: last?.clubName,
            importedAt: Date.now(),
            importElevationFt: last?.inputs.elevationFt,
          }
        : null,
      isPlaying: false,
      playbackTime: 0,
      ui: {
        ...get().ui,
        importOpen: false,
        sessionPanelOpen: true,
        resultsPanelOpen: true,
        controlPanelOpen: true,
      },
    });
  },

  setMeasuredLock: (locked) => {
    const current = get().measuredLock;
    if (!current) return;
    set({ measuredLock: { ...current, locked } });
  },

  clearMeasuredLock: () =>
    set({ measuredLock: null, importedBatch: [], importedBatchIndex: 0 }),

  saveBaseline: () => {
    const { lastResults, inputs } = get();
    if (!lastResults) return;
    set({
      baselineResults: lastResults,
      baselineInputs: { ...inputs },
      ui: { ...get().ui, compareOpen: true, guidedModeOpen: false },
    });
  },

  clearBaseline: () => set({ baselineResults: null, baselineInputs: null }),

  compareAgainstCourse: (courseId) => {
    const preset = COURSE_PRESETS.find((c) => c.id === courseId);
    if (!preset) return;
    const env = coursePresetToEnv(preset);
    const compareInputs: ShotInputs = {
      ...get().inputs,
      windSpeedMph: env.windSpeedMph,
      elevationFt: env.elevationFt,
      airDensityKgM3: airDensityFromElevationFt(env.elevationFt),
      fairwayMoisture: env.fairwayMoisture,
      groundFirmness: env.groundFirmness,
    };
    const results = simulateShot(compareInputs);
    const overlays = [...get().comparisonOverlays];
    const id = `cmp-${courseId}-${Date.now()}`;
    overlays.push({
      id,
      label: preset.course,
      color: COMPARE_COLORS[overlays.length % COMPARE_COLORS.length],
      inputs: compareInputs,
      results,
      visible: true,
    });
    set({
      comparisonOverlays: overlays.slice(-4),
      ui: { ...get().ui, compareOpen: true, guidedModeOpen: false },
    });
  },

  compareAgainstBaseline: () => {
    const { baselineResults, baselineInputs, comparisonOverlays } = get();
    if (!baselineResults || !baselineInputs) return;
    if (comparisonOverlays.some((o) => o.id === 'baseline')) {
      set({
        comparisonOverlays: comparisonOverlays.map((o) =>
          o.id === 'baseline' ? { ...o, visible: true } : o,
        ),
      });
      return;
    }
    set({
      comparisonOverlays: [
        {
          id: 'baseline',
          label: 'Baseline',
          color: '#f5a524',
          inputs: baselineInputs,
          results: baselineResults,
          visible: true,
        },
        ...comparisonOverlays,
      ].slice(0, 4),
      ui: { ...get().ui, compareOpen: true, guidedModeOpen: false },
    });
  },

  toggleComparisonOverlay: (id) => {
    set({
      comparisonOverlays: get().comparisonOverlays.map((o) =>
        o.id === id ? { ...o, visible: !o.visible } : o,
      ),
    });
  },

  clearComparisons: () => set({ comparisonOverlays: [] }),

  launchShot: () => {
    const { inputs, activeSession, recentSessions } = get();
    set({ isSimulating: true });
    try {
      const results = simulateShot(inputs);
      const shot: SessionShot = {
        id: `shot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        index: (activeSession?.shots.length ?? 0) + 1,
        timestamp: Date.now(),
        clubName: get().clubs.find((c) => c.id === get().selectedClubId)?.name ?? 'Club',
        inputs: { ...inputs },
        results,
        tracerVisible: true,
        tracerColor: TRACER_COLORS[(activeSession?.shots.length ?? 0) % TRACER_COLORS.length],
      };

      let nextSession = activeSession;
      let nextRecent = recentSessions;

      if (nextSession) {
        const shots = [...nextSession.shots, shot].slice(0, nextSession.targetShots);
        nextSession = { ...nextSession, shots, updatedAt: Date.now() };
        nextRecent = [nextSession, ...recentSessions.filter((s) => s.id !== nextSession!.id)].slice(
          0,
          20,
        );
        saveSessions(nextRecent);
      }

      set({
        lastResults: results,
        isSimulating: false,
        isPlaying: true,
        playbackTime: 0,
        activeSession: nextSession,
        recentSessions: nextRecent,
        replayShotId: null,
        ui: { ...get().ui, resultsPanelOpen: true },
      });
      return results;
    } catch {
      set({ isSimulating: false });
      return null;
    }
  },

  clearLastShot: () => set({ lastResults: null, isPlaying: false, playbackTime: 0 }),

  setPlaybackTime: (t) => set({ playbackTime: t }),
  setIsPlaying: (v) => set({ isPlaying: v }),
  setPlaybackSpeed: (s) => set({ playbackSpeed: s }),

  startSession: (name) => {
    const session = newSession(name);
    set({
      activeSession: session,
      ui: { ...get().ui, sessionPanelOpen: true },
      lastResults: null,
    });
  },

  endSession: () => {
    const { activeSession, recentSessions } = get();
    if (activeSession && activeSession.shots.length > 0) {
      const updated = [
        activeSession,
        ...recentSessions.filter((s) => s.id !== activeSession.id),
      ].slice(0, 20);
      saveSessions(updated);
      set({ recentSessions: updated, activeSession: null });
    } else {
      set({ activeSession: null });
    }
  },

  toggleTracer: (shotId) => {
    const { activeSession } = get();
    if (!activeSession) return;
    const shots = activeSession.shots.map((s) =>
      s.id === shotId ? { ...s, tracerVisible: !s.tracerVisible } : s,
    );
    set({ activeSession: { ...activeSession, shots, updatedAt: Date.now() } });
  },

  setReplayShot: (shotId) => {
    if (!shotId) {
      set({ replayShotId: null });
      return;
    }
    const session = get().activeSession;
    const shot = session?.shots.find((s) => s.id === shotId);
    if (!shot) return;
    set({
      replayShotId: shotId,
      lastResults: shot.results,
      inputs: { ...shot.inputs },
      isPlaying: true,
      playbackTime: 0,
    });
  },

  loadSession: (sessionId) => {
    const session = get().recentSessions.find((s) => s.id === sessionId);
    if (!session) return;
    set({
      activeSession: { ...session },
      ui: { ...get().ui, sessionPanelOpen: true },
      lastResults: session.shots.at(-1)?.results ?? null,
    });
  },

  deleteSession: (sessionId) => {
    const next = get().recentSessions.filter((s) => s.id !== sessionId);
    saveSessions(next);
    set({
      recentSessions: next,
      activeSession: get().activeSession?.id === sessionId ? null : get().activeSession,
    });
  },
}));
