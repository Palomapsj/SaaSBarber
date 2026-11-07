import { CheckIcon } from "@/components/ui/icons/CheckIcon";
import type { Service } from "@/lib/api/types";
import { formatCurrency } from "@/lib/format/currency";
import { formatDuration } from "@/lib/format/duration";

type ServiceOptionProps = {
  service: Service;
  selected: boolean;
  onToggle: () => void;
};

// A real checkbox (visually hidden) inside the card, so screen readers announce the state.
// Selected = red border + filled box with a check mark, never color alone.
export function ServiceOption({ service, selected, onToggle }: ServiceOptionProps) {
  return (
    <label
      className={`flex w-full cursor-pointer items-center gap-3.5 rounded-[14px] border bg-card p-3.5 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-accent ${
        selected ? "border-accent" : "border-border"
      }`}
    >
      <input type="checkbox" checked={selected} onChange={onToggle} className="sr-only" />
      <span
        aria-hidden="true"
        className={`flex size-6 shrink-0 items-center justify-center rounded-[7px] border-2 ${
          selected ? "border-accent bg-accent text-on-accent" : "border-border"
        }`}
      >
        {selected && <CheckIcon size={14} strokeWidth={3} />}
      </span>
      <span className="flex-1">
        <span className="block text-[14px] font-semibold text-text">{service.name}</span>
        <span className="block text-[12px] text-muted">{formatDuration(service.durationMinutes)}</span>
      </span>
      <span className="text-[14px] font-bold text-text">{formatCurrency(service.priceCents)}</span>
    </label>
  );
}
