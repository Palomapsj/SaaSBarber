import "server-only";
import type { PanelBarber, PanelBarberInput, PanelBarbersPage } from "@/lib/api/types";
import { localDateOf } from "@/lib/format/date";
import { validateEmail, validateMobilePhone, validatePercent, validatePersonName } from "@/lib/validation/person";
import { DAYS_AHEAD } from "./availability";
import { barbersOf, barbershopById, servicesOf, toPanelBarber } from "./catalog";
import type { MockBarber, MockDb } from "./db";
import { MockApiError, notFound } from "./errors";
import { dayAppointments } from "./seededAppointments";
import { addDays } from "./time";

// Admin "Profissionais" (barbershop always from the session).

const SERVICES_ERROR = "Escolha ao menos um serviço";
const EMAIL_IN_USE = "Este e-mail já está em uso";

export function barbersPage(db: MockDb, barbershopId: string): PanelBarbersPage {
  const shop = barbershopById(db, barbershopId);
  return {
    barbers: barbersOf(db, barbershopId).map((b) => toPanelBarber(db, barbershopId, b)),
    plan: shop.plan,
    categories: db.categories[barbershopId] ?? [],
    services: servicesOf(db, barbershopId),
  };
}

function validate(db: MockDb, barbershopId: string, input: PanelBarberInput, editingId: string | null) {
  const knownServices = new Set(servicesOf(db, barbershopId).map((s) => s.id));
  const emailTaken =
    db.admins.some((a) => a.email.toLowerCase() === input.email) ||
    Object.values(db.barbers)
      .flat()
      .some((b) => b.id !== editingId && b.email.toLowerCase() === input.email);
  const fields: Record<string, string> = {};
  const set = (field: string, error: string | null) => {
    if (error) fields[field] = error;
  };
  set("name", validatePersonName(input.name));
  set("commissionPercent", validatePercent(input.commissionPercent));
  set("phone", validateMobilePhone(input.phone));
  set("email", validateEmail(input.email) ?? (emailTaken ? EMAIL_IN_USE : null));
  set(
    "serviceIds",
    input.serviceIds.length > 0 && input.serviceIds.every((id) => knownServices.has(id)) ? null : SERVICES_ERROR,
  );
  if (Object.keys(fields).length > 0) throw new MockApiError(422, "VALIDATION", "Invalid fields", { fields });
}

/** Trims, keeps only phone digits and lowercases the e-mail; validation runs on the result. */
function clean(input: PanelBarberInput): PanelBarberInput {
  return {
    name: String(input.name ?? "").trim(),
    commissionPercent: Number(input.commissionPercent),
    phone: String(input.phone ?? "").replace(/\D/g, ""),
    email: String(input.email ?? "").trim().toLowerCase(),
    serviceIds: Array.isArray(input.serviceIds) ? input.serviceIds : [],
    active: input.active !== false,
  };
}

function find(db: MockDb, barbershopId: string, barberId: string): MockBarber {
  const barber = barbersOf(db, barbershopId).find((b) => b.id === barberId);
  if (!barber) throw notFound("Barber");
  return barber;
}

export function createBarber(db: MockDb, barbershopId: string, input: PanelBarberInput): PanelBarber {
  const shop = barbershopById(db, barbershopId);
  const list = (db.barbers[barbershopId] ??= []);
  if (list.length >= shop.plan.maxBarbers) {
    throw new MockApiError(409, "PLAN_LIMIT", "Plan limit reached", { maxBarbers: shop.plan.maxBarbers });
  }
  const values = clean(input);
  validate(db, barbershopId, values, null);
  const barber: MockBarber = { id: `brb_${crypto.randomUUID().slice(0, 8)}`, ...values, hasSampleAgenda: false };
  list.push(barber);
  return toPanelBarber(db, barbershopId, barber);
}

export function updateBarber(db: MockDb, barbershopId: string, barberId: string, input: PanelBarberInput): PanelBarber {
  const barber = find(db, barbershopId, barberId);
  const values = clean(input);
  validate(db, barbershopId, values, barberId);
  Object.assign(barber, values);
  return toPanelBarber(db, barbershopId, barber);
}

export function setBarberActive(db: MockDb, barbershopId: string, barberId: string, active: boolean): PanelBarber {
  const barber = find(db, barbershopId, barberId);
  barber.active = active;
  return toPanelBarber(db, barbershopId, barber);
}

/** Future appointments within the booking window (sample + stored), from now on. */
export function futureAppointmentCount(db: MockDb, barbershopId: string, barberId: string, now: Date): number {
  const today = localDateOf(now);
  let count = 0;
  for (let offset = 0; offset < DAYS_AHEAD; offset++) {
    count += dayAppointments(db, barbershopId, addDays(today, offset)).filter(
      (a) => a.barber.id === barberId && new Date(a.startsAt) > now,
    ).length;
  }
  // Stored appointments further ahead (e.g. booked before the window moved).
  count += db.appointments.filter(
    (a) => a.barber.id === barberId && a.status === "confirmed" && localDateOf(a.startsAt) >= addDays(today, DAYS_AHEAD),
  ).length;
  return count;
}

/** Decision: removing is blocked while there are future appointments (deactivate instead). */
export function removeBarber(db: MockDb, barbershopId: string, barberId: string, now: Date): void {
  find(db, barbershopId, barberId);
  const count = futureAppointmentCount(db, barbershopId, barberId, now);
  if (count > 0) {
    throw new MockApiError(409, "HAS_FUTURE_APPOINTMENTS", "Barber has future appointments", { count });
  }
  db.barbers[barbershopId] = barbersOf(db, barbershopId).filter((b) => b.id !== barberId);
}
