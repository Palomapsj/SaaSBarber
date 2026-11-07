import "server-only";
import type { Barber, Barbershop, PanelBarber, Service, ServiceCatalog } from "@/lib/api/types";
import { type MockBarber, type MockDb } from "./db";
import { notFound } from "./errors";

export function barbershopById(db: MockDb, barbershopId: string): Barbershop {
  const shop = db.barbershops.find((s) => s.id === barbershopId);
  if (!shop) throw notFound("Barbershop");
  return shop;
}

export function servicesOf(db: MockDb, barbershopId: string): Service[] {
  return db.services[barbershopId] ?? [];
}

export function barbersOf(db: MockDb, barbershopId: string): MockBarber[] {
  return db.barbers[barbershopId] ?? [];
}

/** Category names of the services the barber performs, in catalog order (decision: generated). */
export function specialtiesOf(db: MockDb, barbershopId: string, serviceIds: string[]): string[] {
  const categoryIds = new Set(servicesOf(db, barbershopId).filter((s) => serviceIds.includes(s.id)).map((s) => s.categoryId));
  return (db.categories[barbershopId] ?? []).filter((c) => categoryIds.has(c.id)).map((c) => c.name);
}

/** Only what clients may see (no phone, e-mail or commission). */
export function toPublicBarber(db: MockDb, barbershopId: string, barber: MockBarber): Barber {
  return {
    id: barber.id,
    name: barber.name,
    specialties: specialtiesOf(db, barbershopId, barber.serviceIds),
    serviceIds: barber.serviceIds,
    active: barber.active,
  };
}

export function toPanelBarber(db: MockDb, barbershopId: string, barber: MockBarber): PanelBarber {
  return {
    ...toPublicBarber(db, barbershopId, barber),
    commissionPercent: barber.commissionPercent,
    phone: barber.phone,
    email: barber.email,
  };
}

/** Files created before services had `active` count as active. */
export const isServiceActive = (service: Service) => service.active !== false;

/**
 * What clients can book: active services that at least one active barber performs, and only the
 * categories that still have one (decision: a service without barbers stays hidden).
 */
export function clientCatalog(db: MockDb, barbershopId: string): ServiceCatalog {
  const performed = new Set(barbersOf(db, barbershopId).filter((b) => b.active).flatMap((b) => b.serviceIds));
  const services = servicesOf(db, barbershopId).filter((s) => isServiceActive(s) && performed.has(s.id));
  const used = new Set(services.map((s) => s.categoryId));
  return { categories: (db.categories[barbershopId] ?? []).filter((c) => used.has(c.id)), services };
}

/** Active barbers who perform every service in `serviceIds`, all of them active (the back-end's rule). */
export function qualifiedBarbers(db: MockDb, barbershopId: string, serviceIds: string[]): MockBarber[] {
  const active = new Set(servicesOf(db, barbershopId).filter(isServiceActive).map((s) => s.id));
  if (!serviceIds.every((id) => active.has(id))) return [];
  return barbersOf(db, barbershopId).filter((b) => b.active && serviceIds.every((id) => b.serviceIds.includes(id)));
}
