import { Switch } from "@/components/ui/Switch";
import { barberSummary } from "@/features/profissionais/barberForm";
import type { PanelBarber } from "@/lib/api/types";
import { formatInitials } from "@/lib/format/initials";

type BarberListItemProps = {
  barber: PanelBarber;
  selected: boolean;
  onSelect: () => void;
  onToggleActive: (active: boolean) => void;
  toggling: boolean;
};

// One row of the list (prototype: admin/profissionais.html). Selecting and the on/off switch
// are two separate controls, so keyboard and screen readers reach both.
export function BarberListItem({ barber, selected, onSelect, onToggleActive, toggling }: BarberListItemProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-3 ${selected ? "border-accent bg-accent-soft" : "border-border bg-card"}`}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected ? "true" : undefined}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <span
          aria-hidden="true"
          className={`flex size-[38px] shrink-0 items-center justify-center rounded-full font-display text-[13px] font-bold ${
            selected ? "bg-accent text-on-accent" : "bg-card2 text-text"
          }`}
        >
          {formatInitials(barber.name)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-semibold text-text">{barber.name}</span>
          <span className="block truncate text-[11px] text-muted">{barberSummary(barber)}</span>
        </span>
      </button>
      <Switch checked={barber.active} onChange={onToggleActive} disabled={toggling} label={`${barber.name} ativo`} />
    </div>
  );
}
