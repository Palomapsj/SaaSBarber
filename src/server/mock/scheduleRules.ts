import type { DaySchedule, ScheduleBlock } from "@/lib/api/scheduleTypes";
import type { LocalDate, OpeningHours, Weekday } from "@/lib/api/types";
import { toMinutes } from "@/lib/validation/schedule";
import { weekdayOf } from "./time";

// Pure rules of the barbers' schedules, used by availability and the sample appointments.

export type Period = { start: number; end: number };

/** Monday first, as shown on screen. */
export const WEEK_ORDER: Weekday[] = [1, 2, 3, 4, 5, 6, 0];

/** Prototype default: the barbershop's opening hours, with a 12:00–13:00 break; closed days off. */
export function defaultWeekly(shopHours: OpeningHours[]): DaySchedule[] {
  return WEEK_ORDER.map((weekday) => {
    const shop = shopHours.find((h) => h.weekday === weekday);
    return {
      weekday,
      working: Boolean(shop),
      start: shop?.opens ?? "09:00",
      end: shop?.closes ?? "20:00",
      breakStart: "12:00",
      breakEnd: "13:00",
    };
  });
}

/** Minutes ranges the barber works on that date: weekly hours minus the break and blocks. */
export function workingPeriodsOn(weekly: DaySchedule[], blocks: ScheduleBlock[], date: LocalDate): Period[] {
  const day = weekly.find((d) => d.weekday === weekdayOf(date));
  if (!day?.working) return [];
  let periods: Period[] = [{ start: toMinutes(day.start), end: toMinutes(day.end) }];
  const cut = (from: number, to: number) => {
    periods = periods.flatMap((p) =>
      to <= p.start || from >= p.end
        ? [p]
        : [
            { start: p.start, end: Math.min(p.end, from) },
            { start: Math.max(p.start, to), end: p.end },
          ].filter((part) => part.start < part.end),
    );
  };
  if (day.breakStart && day.breakEnd) cut(toMinutes(day.breakStart), toMinutes(day.breakEnd));
  for (const block of blocks) {
    if (date < block.startDate || date > block.endDate) continue;
    if (block.kind === "days") return [];
    if (block.startTime && block.endTime) cut(toMinutes(block.startTime), toMinutes(block.endTime));
  }
  return periods;
}

/** Whether [start, start + duration) fits entirely inside one working period. */
export function fitsInPeriods(periods: Period[], start: number, duration: number): boolean {
  return periods.some((p) => start >= p.start && start + duration <= p.end);
}
