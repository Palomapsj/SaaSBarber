import "server-only";
import type { BarberServicesPage } from "@/lib/api/types";
import { barbersOf, isServiceActive, servicesOf } from "./catalog";
import type { MockBarber, MockDb } from "./db";
import { MockApiError, notFound } from "./errors";

// Barber "Meus serviços" (barbershop and barber always from the session). Decisions: only active
// services are listed (clients cannot book the others); the barber must keep at least one active
// service, like the "Profissionais" form; unchecking a service keeps the appointments already made.

function barberOf(db: MockDb, barbershopId: string, barberId: string): MockBarber {
  const barber = barbersOf(db, barbershopId).find((b) => b.id === barberId);
  if (!barber) throw notFound("Barber");
  return barber;
}

const activeServicesOf = (db: MockDb, barbershopId: string) => servicesOf(db, barbershopId).filter(isServiceActive);

export function barberServicesPage(db: MockDb, barbershopId: string, barberId: string): BarberServicesPage {
  const barber = barberOf(db, barbershopId, barberId);
  const services = activeServicesOf(db, barbershopId);
  const used = new Set(services.map((s) => s.categoryId));
  return {
    categories: (db.categories[barbershopId] ?? []).filter((c) => used.has(c.id)),
    services: services.map((service) => ({ ...service, performed: barber.serviceIds.includes(service.id) })),
  };
}

export function setBarberPerformsService(
  db: MockDb,
  barbershopId: string,
  barberId: string,
  serviceId: string,
  performed: boolean,
): BarberServicesPage {
  const barber = barberOf(db, barbershopId, barberId);
  const active = activeServicesOf(db, barbershopId);
  if (!active.some((s) => s.id === serviceId)) throw notFound("Service");

  if (performed && !barber.serviceIds.includes(serviceId)) barber.serviceIds = [...barber.serviceIds, serviceId];
  if (!performed && barber.serviceIds.includes(serviceId)) {
    const remaining = active.filter((s) => s.id !== serviceId && barber.serviceIds.includes(s.id));
    if (remaining.length === 0) throw new MockApiError(409, "LAST_SERVICE", "The barber must perform at least one service");
    barber.serviceIds = barber.serviceIds.filter((id) => id !== serviceId);
  }
  return barberServicesPage(db, barbershopId, barberId);
}
