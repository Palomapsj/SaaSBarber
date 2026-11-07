import { Switch } from "@/components/ui/Switch";
import { TagIcon } from "@/components/ui/icons/TagIcon";
import type { BarberService, ServiceCategory } from "@/lib/api/types";
import { formatCurrency } from "@/lib/format/currency";
import { formatDuration } from "@/lib/format/duration";

type BarberServiceItemProps = {
  service: BarberService;
  categories: ServiceCategory[];
  onChange: (performed: boolean) => void;
  /** While a change is being saved, and on the last service (it cannot be unchecked). */
  disabled: boolean;
  /** The only service the barber performs: shows why the switch is locked. */
  isLast: boolean;
};

// One row of "Meus serviços" (prototype: barbeiro/servicos.html): red border and icon when the
// barber performs it, "Cabelo · 30 min · R$ 45" and the "Eu atendo" switch.
export function BarberServiceItem({ service, categories, onChange, disabled, isLast }: BarberServiceItemProps) {
  const category = categories.find((c) => c.id === service.categoryId)?.name;
  const summary = [category, formatDuration(service.durationMinutes), formatCurrency(service.priceCents)]
    .filter(Boolean)
    .join(" · ");
  const hintId = `last-${service.id}`;

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border bg-card px-4 py-3.5 md:gap-4 ${service.performed ? "border-accent" : "border-border"}`}
    >
      <span
        aria-hidden="true"
        className={`hidden size-9 shrink-0 items-center justify-center rounded-[9px] sm:flex ${
          service.performed ? "bg-accent-soft text-accent" : "bg-card2 text-muted"
        }`}
      >
        <TagIcon size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-text">{service.name}</p>
        <p className="truncate text-[11px] text-muted">{summary}</p>
        {isLast && (
          <p id={hintId} className="mt-0.5 text-[11px] text-muted">
            Você precisa atender pelo menos um serviço.
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2 text-[12px] font-semibold text-muted">
        <span aria-hidden="true">Eu atendo</span>
        <Switch
          checked={service.performed}
          onChange={onChange}
          disabled={disabled}
          label={`Eu atendo ${service.name}`}
          describedBy={isLast ? hintId : undefined}
        />
      </div>
    </div>
  );
}
