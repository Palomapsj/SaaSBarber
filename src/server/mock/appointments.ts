import "server-only";
import type { Appointment, CreateAppointmentInput, CreatedAppointment } from "@/lib/api/types";
import { freeBarbersAt } from "./availability";
import { barbershopById, servicesOf } from "./catalog";
import { issueAccess } from "./clientAccess";
import type { MockDb } from "./db";
import { MockApiError, notFound } from "./errors";
import { toAppointment } from "./records";

// POST /barbershops/{id}/appointments: checks the time is still free, picks the barber for
// "any", computes the total and returns the client's access code.
export function createAppointment(db: MockDb, input: CreateAppointmentInput, now: Date): CreatedAppointment {
  const shop = barbershopById(db, input.barbershopId);
  const [barber] = freeBarbersAt(db, input, input.startsAt, now);
  if (!barber) throw new MockApiError(409, "SLOT_UNAVAILABLE", "Slot no longer available");

  const services = servicesOf(db, input.barbershopId).filter((s) => input.serviceIds.includes(s.id));
  const interval = shop.recurrenceIntervalWeeks;
  const appointment: Appointment = {
    id: `apt_${now.getTime().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    barbershopId: input.barbershopId,
    status: "confirmed",
    startsAt: input.startsAt,
    durationMinutes: services.reduce((sum, s) => sum + s.durationMinutes, 0),
    services: services.map(({ id, name }) => ({ id, name })),
    barber: { id: barber.id, name: barber.name },
    totalCents: services.reduce((sum, s) => sum + s.priceCents, 0),
    recurrence: input.recurring && interval ? { everyWeeks: interval } : null,
  };
  db.appointments.push({ ...appointment, customerName: input.customer.name, customerPhone: input.customer.phone });
  const access = issueAccess(db, input.barbershopId, input.customer.phone, input.startsAt);
  return { appointment, clientAccess: { token: access.token, expiresAt: access.expiresAt } };
}

// GET /appointments/{id}
export function getAppointment(db: MockDb, id: string): Appointment {
  const record = db.appointments.find((a) => a.id === id);
  if (!record) throw notFound("Appointment");
  return toAppointment(record);
}
