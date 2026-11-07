import type { Service } from "@/lib/api/types";

export type ServiceSummary = {
  count: number;
  totalMinutes: number;
  totalCents: number;
};

export function toggleServiceId(selectedIds: string[], serviceId: string): string[] {
  return selectedIds.includes(serviceId)
    ? selectedIds.filter((id) => id !== serviceId)
    : [...selectedIds, serviceId];
}

/** Ids that no longer exist in the catalog (e.g. a removed service) are ignored. */
export function summarizeServices(services: Service[], selectedIds: string[]): ServiceSummary {
  const selected = services.filter((service) => selectedIds.includes(service.id));
  return {
    count: selected.length,
    totalMinutes: selected.reduce((sum, service) => sum + service.durationMinutes, 0),
    totalCents: selected.reduce((sum, service) => sum + service.priceCents, 0),
  };
}

export function formatServiceCount(count: number): string {
  return count === 1 ? "1 serviço" : `${count} serviços`;
}
