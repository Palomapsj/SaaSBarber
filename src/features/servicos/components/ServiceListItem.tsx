import { Switch } from "@/components/ui/Switch";
import { PencilIcon } from "@/components/ui/icons/PencilIcon";
import { TagIcon } from "@/components/ui/icons/TagIcon";
import { serviceSummary } from "@/features/servicos/serviceForm";
import type { PanelService, ServiceCategory } from "@/lib/api/types";
import { formatCurrency } from "@/lib/format/currency";

type ServiceListItemProps = {
  service: PanelService;
  categories: ServiceCategory[];
  editing: boolean;
  onEdit: () => void;
  onToggleActive: (active: boolean) => void;
  toggling: boolean;
};

// One row of the list (prototype: admin/servicos.html): icon, name, "Cabelo · 30 min", price,
// on/off switch and the pencil that loads the service into the form.
export function ServiceListItem({ service, categories, editing, onEdit, onToggleActive, toggling }: ServiceListItemProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 md:gap-4 ${editing ? "border-accent" : "border-border"} bg-card`}
    >
      <span aria-hidden="true" className="hidden size-9 shrink-0 items-center justify-center rounded-[9px] bg-card2 text-muted sm:flex">
        <TagIcon size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-[13px] font-semibold ${service.active ? "text-text" : "text-muted"}`}>{service.name}</p>
        <p className="truncate text-[11px] text-muted">{serviceSummary(service, categories)}</p>
      </div>
      <p className="shrink-0 text-[13px] font-bold text-text">{formatCurrency(service.priceCents)}</p>
      <Switch checked={service.active} onChange={onToggleActive} disabled={toggling} label={`${service.name} ativo`} />
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Editar ${service.name}`}
        className="relative flex size-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted hover:text-text before:absolute before:-inset-1.5 before:content-['']"
      >
        <PencilIcon size={15} />
      </button>
    </div>
  );
}
