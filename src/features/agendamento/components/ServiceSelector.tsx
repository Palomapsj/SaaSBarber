"use client";

import { PrimaryAction } from "@/components/ui/PrimaryAction";
import { EMPTY_DRAFT, useBookingDraft } from "@/features/agendamento/booking/bookingDraft";
import { BookingFooter } from "@/features/agendamento/components/BookingFooter";
import { ServiceOption } from "@/features/agendamento/components/ServiceOption";
import {
  formatServiceCount,
  summarizeServices,
  toggleServiceId,
} from "@/features/agendamento/serviceSelection";
import type { ServiceCatalog } from "@/lib/api/types";
import { formatCurrency } from "@/lib/format/currency";
import { formatDuration } from "@/lib/format/duration";

type ServiceSelectorProps = {
  slug: string;
  catalog: ServiceCatalog;
  nextHref: string;
};

export function ServiceSelector({ slug, catalog, nextHref }: ServiceSelectorProps) {
  const [storedDraft, updateDraft] = useBookingDraft(slug);
  const draft = storedDraft ?? EMPTY_DRAFT;
  const summary = summarizeServices(catalog.services, draft.serviceIds);

  const groups = catalog.categories
    .map((category) => ({
      category,
      services: catalog.services.filter((service) => service.categoryId === category.id),
    }))
    .filter((group) => group.services.length > 0);

  function toggle(serviceId: string) {
    updateDraft((current) => ({ ...current, serviceIds: toggleServiceId(current.serviceIds, serviceId) }));
  }

  return (
    <div className="flex flex-1 flex-col">
      {groups.length === 0 ? (
        <p className="content-width px-5 py-[18px] text-[13px] text-muted md:px-8">Nenhum serviço disponível no momento.</p>
      ) : (
        <div className="content-width flex flex-col gap-[18px] px-5 py-[18px] md:gap-6 md:px-8">
          {groups.map(({ category, services }) => (
            <section key={category.id} aria-labelledby={`category-${category.id}`}>
              <h2
                id={`category-${category.id}`}
                className="pb-2 text-[12px] font-semibold tracking-[0.5px] text-muted uppercase"
              >
                {category.name}
              </h2>
              <div className="grid gap-2.5 md:grid-cols-2 md:gap-3">
                {services.map((service) => (
                  <ServiceOption
                    key={service.id}
                    service={service}
                    selected={draft.serviceIds.includes(service.id)}
                    onToggle={() => toggle(service.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="flex-1" />

      <BookingFooter
        summary={
          summary.count === 0 ? (
            "Selecione ao menos um serviço"
          ) : (
            <>
              {formatServiceCount(summary.count)} · {formatDuration(summary.totalMinutes)} ·{" "}
              <span className="font-semibold text-text">{formatCurrency(summary.totalCents)}</span>
            </>
          )
        }
      >
        <PrimaryAction href={nextHref} disabled={summary.count === 0}>
          Continuar
        </PrimaryAction>
      </BookingFooter>
    </div>
  );
}
