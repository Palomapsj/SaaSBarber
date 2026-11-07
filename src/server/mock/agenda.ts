import "server-only";
import type { AgendaDay, BarberAgendaDay, DayHours, LocalDate } from "@/lib/api/types";
import { barbersOf, barbershopById, servicesOf } from "./catalog";
import type { MockDb } from "./db";
import { dayAppointments } from "./seededAppointments";
import { weekdayOf } from "./time";

export const AGENDA_COLOR_COUNT = 4;

function dayHours(db: MockDb, barbershopId: string, date: LocalDate): DayHours | null {
  const opening = barbershopById(db, barbershopId).openingHours.find((h) => h.weekday === weekdayOf(date));
  return opening ? { opens: opening.opens, closes: opening.closes } : null;
}

// GET /panel/agenda?date= (admin; barbershop from the session).
export function agendaDay(db: MockDb, barbershopId: string, date: LocalDate): AgendaDay {
  const shop = barbershopById(db, barbershopId);
  const services = servicesOf(db, barbershopId);
  const allBarbers = barbersOf(db, barbershopId);
  const records = dayAppointments(db, barbershopId, date);

  // Color by the first service, following the catalog order (decision: automatic, per service).
  const colorOf = (serviceId: string | undefined) =>
    Math.max(0, services.findIndex((s) => s.id === serviceId)) % AGENDA_COLOR_COUNT;
  // Active barbers, plus inactive ones who still have appointments that day.
  const withAppointments = new Set(records.map((r) => r.barber.id));

  return {
    date,
    hours: dayHours(db, barbershopId, date),
    barbers: allBarbers
      .filter((b) => b.active || withAppointments.has(b.id))
      .map(({ id, name, active }) => ({ id, name, active })),
    appointments: records.map((r) => ({
      id: r.id,
      barberId: r.barber.id,
      startsAt: r.startsAt,
      durationMinutes: r.durationMinutes,
      customerName: r.customerName,
      serviceNames: r.services.map((s) => s.name),
      status: r.status,
      colorIndex: colorOf(r.services[0]?.id),
    })),
    plan: { name: shop.plan.name, maxBarbers: shop.plan.maxBarbers, barberCount: allBarbers.length },
  };
}

// GET /panel/me/agenda?date= (barber; barbershop and barber from the session).
export function barberAgendaDay(db: MockDb, barbershopId: string, barberId: string, date: LocalDate): BarberAgendaDay {
  return {
    date,
    hours: dayHours(db, barbershopId, date),
    appointments: dayAppointments(db, barbershopId, date)
      .filter((r) => r.barber.id === barberId)
      .map((r) => ({
        id: r.id,
        startsAt: r.startsAt,
        durationMinutes: r.durationMinutes,
        customerName: r.customerName,
        serviceNames: r.services.map((s) => s.name),
        status: r.status,
      })),
  };
}
