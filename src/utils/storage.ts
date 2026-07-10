import type { PracticeSession } from '../types';

const KEY = 'rangelab.sessions.v1';

export function loadSessions(): PracticeSession[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PracticeSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSessions(sessions: PracticeSession[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(sessions.slice(0, 20)));
  } catch {
    // quota / private mode — ignore
  }
}
