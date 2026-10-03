import "./Segmented.css";

type Option<T extends string> = { value: T; label: string; count?: number };

type SegmentedProps<T extends string> = {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function Segmented<T extends string>({ label, options, value, onChange }: SegmentedProps<T>) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className="segmented__option"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
          {option.count !== undefined && option.count > 0 && <span className="segmented__count">{option.count}</span>}
        </button>
      ))}
    </div>
  );
}
