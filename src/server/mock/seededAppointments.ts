import "server-only";
import type { LocalDate, Service } from "@/lib/api/types";
import { localDateOf } from "@/lib/format/date";
import { barbersOf, servicesOf } from "./catalog";
import type { MockAppointmentRecord, MockDb } from "./db";
import { defaultWeekly, workingPeriodsOn } from "./scheduleRules";
import { SLOT_MINUTES, hash, seededRandom, toIso } from "./time";

// Sample appointments so the agenda is never empty while there is no API. Generated, not stored:
// the same barbershop, barber and day always give the same appointments (stable screenshots and
// tests). They make the client's "taken" times match exactly what the admin sees in the agenda.
// Only the sample barbers get them; barbers created by the admin start with an empty agenda.

const CUSTOMERS = [
  "João Pedro", "Marcos Lima", "Felipe Reis", "Bruno Costa", "Igor Nunes", "Renan Dias", "André Melo",
  "Lucas Martins", "Thiago Rocha", "Gabriel Souza", "Paulo Henrique", "Vinícius Prado", "Mateus Lopes",
  "Henrique Barros", "Caio Teixeira", "Leonardo Dias",
];

const BOOKING_CHANCE = 0.3;
const COMBO_CHANCE = 0.25;

/** One service, or sometimes two from different categories, in catalog order. */
function pickServices(available: Service[], random: () => number): Service[] {
  const first = available[Math.floor(random() * available.length)];
  const others = available.filter((s) => s.categoryId !== first.categoryId);
  if (others.length > 0 && random() < COMBO_CHANCE) {
    const second = others[Math.floor(random() * others.length)];
    return [first, second].sort((a, b) => available.indexOf(a) - available.indexOf(b));
  }
  return [first];
}

export function seededAppointmentsFor(db: MockDb, barbershopId: string, date: LocalDate): MockAppointmentRecord[] {
  const barbershop = db.barbershops.find((shop) => shop.id === barbershopId);
  // Generated from the default hours (prototype: 12:00–13:00 break), not from each barber's
  // current schedule: they stand for bookings made earlier, so a later schedule change does not
  // move them (it reports them as "outside the new hours" instead).
  const periods = barbershop ? workingPeriodsOn(defaultWeekly(barbershop.openingHours), [], date) : [];
  const services = servicesOf(db, barbershopId);
  const appointments: MockAppointmentRecord[] = [];

  for (const barber of barbersOf(db, barbershopId).filter((b) => b.hasSampleAgenda)) {
    const theirs = services.filter((service) => barber.serviceIds.includes(service.id));
    if (theirs.length === 0) continue;
    const random = seededRandom(hash(`${barber.id}|${date}`));

    for (const period of periods) {
      let start = period.start;
      while (start < period.end) {
        if (random() >= BOOKING_CHANCE) {
          start += SLOT_MINUTES;
          continue;
        }
        const chosen = pickServices(theirs, random);
        const duration = chosen.reduce((sum, s) => sum + s.durationMinutes, 0);
        if (start + duration > period.end) {
          start += SLOT_MINUTES;
          continue;
        }
        appointments.push({
          id: `seed_${barber.id}_${date}_${start}`,
          barbershopId,
          status: "confirmed",
          startsAt: toIso(date, start),
          durationMinutes: duration,
          services: chosen.map(({ id, name }) => ({ id, name })),
          barber: { id: barber.id, name: barber.name },
          totalCents: chosen.reduce((sum, s) => sum + s.priceCents, 0),
          recurrence: null,
          customerName: CUSTOMERS[Math.floor(random() * CUSTOMERS.length)],
          customerPhone: "seed",
        });
        start += Math.ceil(duration / SLOT_MINUTES) * SLOT_MINUTES;
      }
    }
  }
  return appointments;
}

/** Every non-cancelled appointment of a barbershop on a day: samples + stored ones, by time. */
export function dayAppointments(db: MockDb, barbershopId: string, date: LocalDate): MockAppointmentRecord[] {
  return [
    ...seededAppointmentsFor(db, barbershopId, date),
    ...db.appointments.filter((r) => r.barbershopId === barbershopId && localDateOf(r.startsAt) === date),
  ]
    .filter((record) => record.status !== "cancelled")
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}
