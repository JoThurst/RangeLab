import { useEffect } from 'react';
import type { CameraMode } from '../types';
import { useRangeStore } from '../store/useRangeStore';

const CAMERA_KEYS: Record<string, CameraMode> = {
  '1': 'behind',
  '2': 'follow',
  '3': 'side',
  '4': 'landing',
  '5': 'orbit',
  '6': 'topdown',
};

export function useKeyboardShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        const state = useRangeStore.getState();
        if (state.activeSession && state.activeSession.shots.length >= state.activeSession.targetShots) {
          return;
        }
        state.launchShot();
        return;
      }

      if (CAMERA_KEYS[e.key]) {
        useRangeStore.getState().setCameraMode(CAMERA_KEYS[e.key]);
        return;
      }

      if (e.key === 'r' || e.key === 'R') {
        const { lastResults, setPlaybackTime, setIsPlaying } = useRangeStore.getState();
        if (lastResults) {
          setPlaybackTime(0);
          setIsPlaying(true);
        }
      }

      if (e.key === 'g' || e.key === 'G') {
        const { ui, setUi } = useRangeStore.getState();
        setUi({ guidedModeOpen: !ui.guidedModeOpen });
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
