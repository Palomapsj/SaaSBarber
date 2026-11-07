import "server-only";
import type { Appointment, AvailableDay, BarberSelection, LocalDate, TimeSlot } from "@/lib/api/types";
import { localDateOf, localMinutesOf } from "@/lib/format/date";
import { barbershopById, qualifiedBarbers, servicesOf } from "./catalog";
import type { MockBarber, MockDb } from "./db";
import { type Period, defaultWeekly, fitsInPeriods, workingPeriodsOn } from "./scheduleRules";
import { blocksOf, weeklyOf } from "./schedules";
import { seededAppointmentsFor } from "./seededAppointments";
import { SLOT_MINUTES, addDays, toIso } from "./time";

// The back-end's availability rules: 30-minute slots inside each barber's working hours (weekly
// schedule minus break and blocks), the whole duration must fit, at least one hour of notice, and
// a time is taken when it overlaps a sample appointment or a stored one.
// "Any barber" = at least one qualified barber can attend.

export const DAYS_AHEAD = 14;
export const MIN_NOTICE_MINUTES = 60;

export type AvailabilityQuery = { barbershopId: string; serviceIds: string[]; barber: BarberSelection };

type Context = { db: MockDb; barbershopId: string; barbers: MockBarber[]; durationMinutes: number; now: Date };

function contextFor(db: MockDb, query: AvailabilityQuery, now: Date): Context {
  barbershopById(db, query.barbershopId);
  const qualified = qualifiedBarbers(db, query.barbershopId, query.serviceIds);
  const choice = query.barber;
  return {
    db,
    barbershopId: query.barbershopId,
    barbers: choice.kind === "any" ? qualified : qualified.filter((b) => b.id === choice.barberId),
    durationMinutes: servicesOf(db, query.barbershopId)
      .filter((s) => query.serviceIds.includes(s.id))
      .reduce((sum, s) => sum + s.durationMinutes, 0),
    now,
  };
}

function overlaps(barberId: string, startsAt: string, duration: number, taken: Appointment[]): boolean {
  const start = new Date(startsAt).getTime();
  const end = start + duration * 60_000;
  return taken.some((a) => {
    if (a.barber.id !== barberId || a.status === "cancelled") return false;
    const otherStart = new Date(a.startsAt).getTime();
    return otherStart < end && start < otherStart + a.durationMinutes * 60_000;
  });
}

function takenOn(context: Context, date: LocalDate): Appointment[] {
  return [...context.db.appointments, ...seededAppointmentsFor(context.db, context.barbershopId, date)];
}

const periodsOf = (context: Context, barberId: string, date: LocalDate) =>
  workingPeriodsOn(weeklyOf(context.db, context.barbershopId, barberId), blocksOf(context.db, barberId), date);

/** Can this barber take the whole appointment starting at `start` (minutes) on `date`? */
function canAttend(context: Context, barber: MockBarber, date: LocalDate, start: number, taken: Appointment[]) {
  return (
    fitsInPeriods(periodsOf(context, barber.id, date), start, context.durationMinutes) &&
    !overlaps(barber.id, toIso(date, start), context.durationMinutes, taken)
  );
}

/** Start times shown for the day: every 30 minutes inside any candidate barber's working periods. */
function slotStarts(context: Context, date: LocalDate): number[] {
  const periods: Period[] =
    context.barbers.length > 0
      ? context.barbers.flatMap((b) => periodsOf(context, b.id, date))
      : workingPeriodsOn(defaultWeekly(barbershopById(context.db, context.barbershopId).openingHours), [], date);
  const starts = new Set<number>();
  for (const period of periods) {
    for (let start = period.start; start < period.end; start += SLOT_MINUTES) starts.add(start);
  }
  return [...starts].sort((a, b) => a - b);
}

function slotsFor(context: Context, date: LocalDate): TimeSlot[] {
  const earliest = context.now.getTime() + MIN_NOTICE_MINUTES * 60_000;
  const taken = takenOn(context, date);
  return slotStarts(context, date).map((start) => {
    const startsAt = toIso(date, start);
    const available =
      new Date(startsAt).getTime() >= earliest && context.barbers.some((b) => canAttend(context, b, date, start, taken));
    return { startsAt, available };
  });
}

export function timeSlots(db: MockDb, query: AvailabilityQuery & { date: LocalDate }, now: Date): TimeSlot[] {
  return slotsFor(contextFor(db, query, now), query.date);
}

export function availableDays(db: MockDb, query: AvailabilityQuery, now: Date): AvailableDay[] {
  const context = contextFor(db, query, now);
  const today = localDateOf(now);
  const days: AvailableDay[] = [];
  for (let offset = 0; offset < DAYS_AHEAD; offset++) {
    const date = addDays(today, offset);
    const slots = slotsFor(context, date);
    if (slots.length > 0) days.push({ date, hasFreeSlots: slots.some((s) => s.available) });
  }
  return days;
}

/** Barbers free for the whole duration starting at `startsAt` (empty when the time is not bookable). */
export function freeBarbersAt(db: MockDb, query: AvailabilityQuery, startsAt: string, now: Date): MockBarber[] {
  const context = contextFor(db, query, now);
  const date = localDateOf(startsAt);
  if (!slotsFor(context, date).find((s) => s.startsAt === startsAt)?.available) return [];
  const taken = takenOn(context, date);
  const start = localMinutesOf(startsAt);
  return context.barbers.filter((b) => canAttend(context, b, date, start, taken));
}
