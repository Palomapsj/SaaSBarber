type RecurrenceOptionProps = {
  intervalWeeks: number;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

// "Repetir esse horário a cada N semanas" card. The interval comes from the barbershop.
export function RecurrenceOption({ intervalWeeks, checked, onChange }: RecurrenceOptionProps) {
  const interval = intervalWeeks === 1 ? "1 semana" : `${intervalWeeks} semanas`;
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-[14px] border border-border bg-card p-3.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-[18px] shrink-0 accent-accent"
      />
      <span className="text-[13px] text-text">
        Repetir esse horário a cada <strong>{interval}</strong>, automaticamente
      </span>
    </label>
  );
}
