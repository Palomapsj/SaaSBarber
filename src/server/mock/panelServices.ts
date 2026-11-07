import "server-only";
import type { PanelService, PanelServiceInput, PanelServicesPage, Service } from "@/lib/api/types";
import {
  SERVICE_NAME_TAKEN,
  validateCategoryName,
  validateDuration,
  validatePriceCents,
  validateServiceName,
} from "@/lib/validation/service";
import { barbersOf, barbershopById, isServiceActive, servicesOf } from "./catalog";
import type { MockDb } from "./db";
import { MockApiError, notFound } from "./errors";

// Admin "Serviços" (barbershop always from the session). Decisions: the category is free text
// (a new name creates it; an empty category disappears); a service may have no barber; services
// are deactivated, never removed. Who performs a service is stored on the barbers, so this screen
// and "Profissionais" always agree.

function toPanelService(db: MockDb, barbershopId: string, service: Service): PanelService {
  return {
    ...service,
    active: isServiceActive(service),
    barberIds: barbersOf(db, barbershopId)
      .filter((b) => b.serviceIds.includes(service.id))
      .map((b) => b.id),
  };
}

export function servicesPage(db: MockDb, barbershopId: string): PanelServicesPage {
  barbershopById(db, barbershopId);
  return {
    categories: db.categories[barbershopId] ?? [],
    services: servicesOf(db, barbershopId).map((s) => toPanelService(db, barbershopId, s)),
    barbers: barbersOf(db, barbershopId).map(({ id, name, active }) => ({ id, name, active })),
  };
}

function clean(input: PanelServiceInput): PanelServiceInput {
  return {
    name: String(input.name ?? "").trim().replace(/\s+/g, " "),
    categoryName: String(input.categoryName ?? "").trim().replace(/\s+/g, " "),
    durationMinutes: Number(input.durationMinutes),
    priceCents: Number(input.priceCents),
    barberIds: Array.isArray(input.barberIds) ? input.barberIds : [],
    active: input.active !== false,
  };
}

function validate(db: MockDb, barbershopId: string, input: PanelServiceInput, editingId: string | null): void {
  const fields: Record<string, string> = {};
  const set = (field: string, error: string | null) => {
    if (error) fields[field] = error;
  };
  const taken = servicesOf(db, barbershopId).some(
    (s) => s.id !== editingId && s.name.toLowerCase() === input.name.toLowerCase(),
  );
  set("name", validateServiceName(input.name) ?? (taken ? SERVICE_NAME_TAKEN : null));
  set("categoryName", validateCategoryName(input.categoryName));
  set("durationMinutes", validateDuration(input.durationMinutes));
  set("priceCents", validatePriceCents(input.priceCents));
  const known = new Set(barbersOf(db, barbershopId).map((b) => b.id));
  if (!input.barberIds.every((id) => known.has(id))) set("barberIds", "Profissional desconhecido");
  if (Object.keys(fields).length > 0) throw new MockApiError(422, "VALIDATION", "Invalid fields", { fields });
}

/** The category with that name (ignoring case), created when it does not exist yet. */
function categoryIdFor(db: MockDb, barbershopId: string, name: string): string {
  const categories = (db.categories[barbershopId] ??= []);
  const existing = categories.find((c) => c.name.toLowerCase() === name.toLowerCase());
  if (existing) return existing.id;
  const created = { id: `cat_${crypto.randomUUID().slice(0, 8)}`, name };
  categories.push(created);
  return created.id;
}

function pruneEmptyCategories(db: MockDb, barbershopId: string): void {
  const used = new Set(servicesOf(db, barbershopId).map((s) => s.categoryId));
  db.categories[barbershopId] = (db.categories[barbershopId] ?? []).filter((c) => used.has(c.id));
}

function assignBarbers(db: MockDb, barbershopId: string, serviceId: string, barberIds: string[]): void {
  for (const barber of barbersOf(db, barbershopId)) {
    const has = barber.serviceIds.includes(serviceId);
    const should = barberIds.includes(barber.id);
    if (should && !has) barber.serviceIds = [...barber.serviceIds, serviceId];
    if (!should && has) barber.serviceIds = barber.serviceIds.filter((id) => id !== serviceId);
  }
}

function find(db: MockDb, barbershopId: string, serviceId: string): Service {
  const service = servicesOf(db, barbershopId).find((s) => s.id === serviceId);
  if (!service) throw notFound("Service");
  return service;
}

export function createService(db: MockDb, barbershopId: string, raw: PanelServiceInput): PanelService {
  barbershopById(db, barbershopId);
  const input = clean(raw);
  validate(db, barbershopId, input, null);
  const service: Service = {
    id: `svc_${crypto.randomUUID().slice(0, 8)}`,
    categoryId: categoryIdFor(db, barbershopId, input.categoryName),
    name: input.name,
    durationMinutes: input.durationMinutes,
    priceCents: input.priceCents,
    active: input.active,
  };
  (db.services[barbershopId] ??= []).push(service);
  assignBarbers(db, barbershopId, service.id, input.barberIds);
  return toPanelService(db, barbershopId, service);
}

export function updateService(db: MockDb, barbershopId: string, serviceId: string, raw: PanelServiceInput): PanelService {
  const service = find(db, barbershopId, serviceId);
  const input = clean(raw);
  validate(db, barbershopId, input, serviceId);
  Object.assign(service, {
    categoryId: categoryIdFor(db, barbershopId, input.categoryName),
    name: input.name,
    durationMinutes: input.durationMinutes,
    priceCents: input.priceCents,
    active: input.active,
  });
  assignBarbers(db, barbershopId, serviceId, input.barberIds);
  pruneEmptyCategories(db, barbershopId);
  return toPanelService(db, barbershopId, service);
}

export function setServiceActive(db: MockDb, barbershopId: string, serviceId: string, active: boolean): PanelService {
  const service = find(db, barbershopId, serviceId);
  service.active = active;
  return toPanelService(db, barbershopId, service);
}
