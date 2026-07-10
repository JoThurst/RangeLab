import { useCallback } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingScreen } from './components/LoadingScreen';
import { RangeScene } from './components/scene/RangeScene';
import { ControlPanel } from './components/controls/ControlPanel';
import { ResultsPanel } from './components/layout/ResultsPanel';
import { SessionPanel } from './components/layout/SessionPanel';
import { TopBar } from './components/layout/TopBar';
import { CameraBar } from './components/layout/CameraBar';
import { GuidedMode } from './components/layout/GuidedMode';
import { SettingsPanel } from './components/layout/SettingsPanel';
import { TrackmanImportPanel } from './components/layout/TrackmanImportPanel';
import { EnvComparePanel } from './components/layout/EnvComparePanel';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useRangeStore } from './store/useRangeStore';

function AppShell() {
  useKeyboardShortcuts();
  const isLoading = useRangeStore((s) => s.ui.isLoading);
  const setUi = useRangeStore((s) => s.setUi);

  const onReady = useCallback(() => {
    window.setTimeout(() => setUi({ isLoading: false }), 400);
  }, [setUi]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-range-bg">
      <div className="absolute inset-0">
        <RangeScene onReady={onReady} />
      </div>

      <LoadingScreen visible={isLoading} />

      <TopBar />
      <ControlPanel />
      <ResultsPanel />
      <CameraBar />
      <GuidedMode />
      <SettingsPanel />
      <SessionPanel />
      <TrackmanImportPanel />
      <EnvComparePanel />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppShell />
    </ErrorBoundary>
  );
}
