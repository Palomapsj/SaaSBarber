import type { InputHTMLAttributes, Ref } from "react";

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  id: string;
  label: string;
  error?: string | null;
  ref?: Ref<HTMLInputElement>;
};

// Label + input + error message. 16px text so iOS does not zoom in on focus.
export function TextField({ id, label, error, ref, className = "", ...inputProps }: TextFieldProps) {
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[12px] font-semibold tracking-[0.5px] text-muted uppercase">
        {label}
      </label>
      <input
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`rounded-xl border bg-card p-3.5 text-[16px] text-text placeholder:text-muted2 focus:border-accent focus-visible:outline-none ${
          error ? "border-accent" : "border-border"
        } ${className}`}
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="text-[12px] text-accent">
          {error}
        </p>
      )}
    </div>
  );
}
