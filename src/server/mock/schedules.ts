import "server-only";
import type {
  BarberSchedule,
  DaySchedule,
  ScheduleBlock,
  ScheduleBlockInput,
  ScheduleChangeResult,
} from "@/lib/api/scheduleTypes";
import type { Weekday } from "@/lib/api/types";
import { localDateOf, localMinutesOf } from "@/lib/format/date";
import { validateBlock, validateWeekly } from "@/lib/validation/schedule";
import { barbersOf, barbershopById } from "./catalog";
import type { MockBarber, MockDb } from "./db";
import { MockApiError, notFound } from "./errors";
import { WEEK_ORDER, defaultWeekly, fitsInPeriods, workingPeriodsOn } from "./scheduleRules";
import { seededAppointmentsFor } from "./seededAppointments";
import { addDays } from "./time";

// Barbers' working hours (admin "Horários", barber "Meus horários"). Decisions: hours stay inside
// the barbershop's opening hours; a change that leaves booked appointments outside is saved and
// the number of those appointments is returned so the screen can warn.

const BOOKING_WINDOW_DAYS = 14;

export function weeklyOf(db: MockDb, barbershopId: string, barberId: string): DaySchedule[] {
  return db.schedules?.[barberId] ?? defaultWeekly(barbershopById(db, barbershopId).openingHours);
}

export function blocksOf(db: MockDb, barberId: string): ScheduleBlock[] {
  return (db.scheduleBlocks ?? []).filter((b) => b.barberId === barberId);
}

function findBarber(db: MockDb, barbershopId: string, barberId: string): MockBarber {
  const barber = barbersOf(db, barbershopId).find((b) => b.id === barberId);
  if (!barber) throw notFound("Barber");
  return barber;
}

export function scheduleBarbers(db: MockDb, barbershopId: string): { id: string; name: string }[] {
  return barbersOf(db, barbershopId).map(({ id, name }) => ({ id, name }));
}

export function barberSchedule(db: MockDb, barbershopId: string, barberId: string): BarberSchedule {
  const barber = findBarber(db, barbershopId, barberId);
  const blocks = blocksOf(db, barberId).sort((a, b) =>
    `${a.startDate}${a.startTime ?? ""}`.localeCompare(`${b.startDate}${b.startTime ?? ""}`),
  );
  return {
    barber: { id: barber.id, name: barber.name },
    weekly: weeklyOf(db, barbershopId, barberId),
    blocks,
    shopHours: barbershopById(db, barbershopId).openingHours,
  };
}

/** Future appointments of the barber (from now) that do not fit the given hours and blocks. */
export function appointmentsOutside(
  db: MockDb,
  barbershopId: string,
  barberId: string,
  weekly: DaySchedule[],
  blocks: ScheduleBlock[],
  now: Date,
): number {
  const today = localDateOf(now);
  const samples = Array.from({ length: BOOKING_WINDOW_DAYS }, (_, i) =>
    seededAppointmentsFor(db, barbershopId, addDays(today, i)),
  ).flat();
  return [...samples, ...db.appointments]
    .filter((a) => a.barber.id === barberId && a.status === "confirmed" && new Date(a.startsAt) > now)
    .filter((a) => {
      const periods = workingPeriodsOn(weekly, blocks, localDateOf(a.startsAt));
      return !fitsInPeriods(periods, localMinutesOf(a.startsAt), a.durationMinutes);
    }).length;
}

function cleanWeekly(raw: unknown): DaySchedule[] {
  const list = Array.isArray(raw) ? (raw as Partial<DaySchedule>[]) : [];
  return WEEK_ORDER.map((weekday) => {
    const day = list.find((d) => d?.weekday === weekday) ?? {};
    return {
      weekday: weekday as Weekday,
      working: day.working === true,
      start: String(day.start ?? "09:00"),
      end: String(day.end ?? "20:00"),
      breakStart: day.breakStart ? String(day.breakStart) : null,
      breakEnd: day.breakEnd ? String(day.breakEnd) : null,
    };
  });
}

export function saveWeekly(
  db: MockDb,
  barbershopId: string,
  barberId: string,
  raw: unknown,
  now: Date,
): ScheduleChangeResult<DaySchedule[]> {
  findBarber(db, barbershopId, barberId);
  const weekly = cleanWeekly(raw);
  const errors = validateWeekly(weekly, barbershopById(db, barbershopId).openingHours);
  if (Object.keys(errors).length > 0) throw new MockApiError(422, "VALIDATION", "Invalid schedule", { fields: errors });
  (db.schedules ??= {})[barberId] = weekly;
  return { saved: weekly, outsideCount: appointmentsOutside(db, barbershopId, barberId, weekly, blocksOf(db, barberId), now) };
}

export function addBlock(
  db: MockDb,
  barbershopId: string,
  barberId: string,
  raw: ScheduleBlockInput,
  now: Date,
): ScheduleChangeResult<ScheduleBlock> {
  findBarber(db, barbershopId, barberId);
  const kind = raw?.kind === "hours" ? "hours" : "days";
  const input: ScheduleBlockInput = {
    kind,
    startDate: String(raw?.startDate ?? ""),
    endDate: kind === "hours" ? String(raw?.startDate ?? "") : String(raw?.endDate ?? ""),
    startTime: kind === "hours" ? String(raw?.startTime ?? "") : null,
    endTime: kind === "hours" ? String(raw?.endTime ?? "") : null,
    reason: String(raw?.reason ?? "").trim(),
  };
  const errors = validateBlock(input);
  if (Object.keys(errors).length > 0) throw new MockApiError(422, "VALIDATION", "Invalid block", { fields: errors });
  const block: ScheduleBlock = { id: `blk_${crypto.randomUUID().slice(0, 8)}`, barberId, ...input };
  (db.scheduleBlocks ??= []).push(block);
  const weekly = weeklyOf(db, barbershopId, barberId);
  return { saved: block, outsideCount: appointmentsOutside(db, barbershopId, barberId, weekly, blocksOf(db, barberId), now) };
}

export function removeBlock(db: MockDb, barbershopId: string, barberId: string, blockId: string): void {
  findBarber(db, barbershopId, barberId);
  const blocks = db.scheduleBlocks ?? [];
  if (!blocks.some((b) => b.id === blockId && b.barberId === barberId)) throw notFound("Block");
  db.scheduleBlocks = blocks.filter((b) => b.id !== blockId);
}
