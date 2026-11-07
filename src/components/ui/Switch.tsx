type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Accessible name, e.g. "Carlos Andrade ativo". */
  label: string;
  disabled?: boolean;
  /** Id of a text explaining the switch, e.g. why it is disabled. */
  describedBy?: string;
};

// On/off toggle (prototype: admin/profissionais.html, 40×22). The 44px touch area comes from
// the invisible ::before; state is shown by color and by the knob position.
export function Switch({ checked, onChange, label, disabled = false, describedBy }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-describedby={describedBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-[22px] w-10 shrink-0 rounded-full transition-colors before:absolute before:-inset-x-[2px] before:-inset-y-[11px] before:content-[''] disabled:cursor-not-allowed disabled:opacity-60 ${
        checked ? "bg-accent" : "bg-border"
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute top-[3px] size-4 rounded-full bg-on-accent transition-[left] ${checked ? "left-[21px]" : "left-[3px]"}`}
      />
    </button>
  );
}
