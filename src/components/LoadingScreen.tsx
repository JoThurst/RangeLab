interface LoadingScreenProps {
  visible: boolean;
}

export function LoadingScreen({ visible }: LoadingScreenProps) {
  if (!visible) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-range-bg">
      <div className="flex flex-col items-center gap-3 animate-fade-in">
        <div className="h-10 w-10 rounded-full border-2 border-range-accent/30 border-t-range-accent animate-spin" />
        <div className="font-display text-lg font-semibold tracking-wide text-range-text">RangeLab</div>
        <div className="font-mono text-xs text-range-muted animate-pulse-soft">Loading range…</div>
      </div>
    </div>
  );
}
