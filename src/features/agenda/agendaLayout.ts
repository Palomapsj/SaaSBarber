import type { IsoDateTime, LocalTime } from "@/lib/api/types";
import { localMinutesOf } from "@/lib/format/date";

// Geometry of the day grid (prototype admin/agenda.html: 56px per hour).

export const HOUR_HEIGHT = 56;
const CARD_GAP = 4;
const MIN_CARD_HEIGHT = 28;

const toMinutes = (time: LocalTime) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

/** Whole hours shown on the left, from opening to closing: 09:00–20:00 → [9, 10, …, 19]. */
export function gridHours(opens: LocalTime, closes: LocalTime): number[] {
  const first = Math.floor(toMinutes(opens) / 60);
  const last = Math.ceil(toMinutes(closes) / 60);
  return Array.from({ length: Math.max(0, last - first) }, (_, index) => first + index);
}

/** Position of an appointment card, in pixels from the top of the grid. */
export function eventBox(startsAt: IsoDateTime, durationMinutes: number, firstHour: number) {
  const fromTop = localMinutesOf(startsAt) - firstHour * 60;
  return {
    top: (fromTop * HOUR_HEIGHT) / 60 + CARD_GAP / 2,
    height: Math.max(MIN_CARD_HEIGHT, (durationMinutes * HOUR_HEIGHT) / 60 - CARD_GAP),
  };
}
