interface SelectControlProps {
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

export function SelectControl({ id, label, value, options, onChange }: SelectControlProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-medium text-range-muted">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-range-border bg-range-bg px-2.5 py-1.5 text-sm text-range-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-range-accent"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
