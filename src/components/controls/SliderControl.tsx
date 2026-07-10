interface SliderControlProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  format?: (v: number) => string;
}

export function SliderControl({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  format,
}: SliderControlProps) {
  const display = format ? format(value) : `${value}${unit ? ` ${unit}` : ''}`;
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-xs font-medium text-range-muted">
          {label}
        </label>
        <span className="font-mono text-xs tabular-nums text-range-text">{display}</span>
      </div>
      <input
        id={id}
        type="range"
        className="input-range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label}
      />
    </div>
  );
}
