import type { InputHTMLAttributes } from "react";

type TimeInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> & {
  label: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
};

// Compact time field of the schedule rows (prototype: 70px inputs). The visible "Das"/"às" next to
// it are not labels, so the accessible name comes from `label`. 16px text: iOS zooms in below that.
export function TimeInput({ label, value, onChange, invalid = false, className = "", ...props }: TimeInputProps) {
  return (
    <input
      type="time"
      step={300}
      aria-label={label}
      aria-invalid={invalid || undefined}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`w-[104px] rounded-lg border bg-card px-2 py-[7px] text-[16px] text-text focus:border-accent focus-visible:outline-none disabled:opacity-60 ${
        invalid ? "border-accent" : "border-border"
      } ${className}`}
      {...props}
    />
  );
}
