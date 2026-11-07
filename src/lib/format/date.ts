import type { IsoDateTime, LocalDate } from "@/lib/api/types";

// The API returns UTC; everything is shown in the barbershop's time zone.
export const TIME_ZONE = "America/Sao_Paulo";

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
});

const partsFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
});

// en-CA formats as YYYY-MM-DD.
const localDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** A LocalDate is read as noon UTC, which is the same calendar day in São Paulo. */
function toInstant(value: IsoDateTime | LocalDate): Date {
  return new Date(LOCAL_DATE_PATTERN.test(value) ? `${value}T12:00:00Z` : value);
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function dateParts(value: IsoDateTime | LocalDate) {
  const parts = partsFormatter.formatToParts(toInstant(value));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  const weekday = get("weekday").replace("-feira", "");
  const month = get("month");
  return {
    weekday: capitalize(weekday),
    weekdayShort: capitalize(weekday.slice(0, 3)),
    day: get("day"),
    month,
    monthShort: month.slice(0, 3),
  };
}

/** The São Paulo calendar day of an instant: 2026-09-23T01:00Z → "2026-09-22". */
export function localDateOf(value: Date | IsoDateTime): LocalDate {
  return localDateFormatter.format(typeof value === "string" ? new Date(value) : value);
}

/** "2026-09-22" + 1 → "2026-09-23" (calendar math, no time zone involved). */
export function shiftDate(date: LocalDate, days: number): LocalDate {
  const instant = new Date(`${date}T12:00:00Z`);
  instant.setUTCDate(instant.getUTCDate() + days);
  return instant.toISOString().slice(0, 10);
}

/** Minutes since midnight in São Paulo: "2026-09-22T13:30:00Z" → 630 (10:30). */
export function localMinutesOf(iso: IsoDateTime): number {
  const [hours, minutes] = formatTime(iso).split(":").map(Number);
  return hours * 60 + minutes;
}

/** "2026-09-22T13:00:00Z" → "10:00" */
export function formatTime(iso: IsoDateTime): string {
  return timeFormatter.format(new Date(iso));
}

/** "Ter, 22 set" */
export function formatShortDate(value: IsoDateTime | LocalDate): string {
  const { weekdayShort, day, monthShort } = dateParts(value);
  return `${weekdayShort}, ${day} ${monthShort}`;
}

/** "Ter 22 set" (no comma), used under "Continuar". */
export function formatCompactDate(value: IsoDateTime | LocalDate): string {
  const { weekdayShort, day, monthShort } = dateParts(value);
  return `${weekdayShort} ${day} ${monthShort}`;
}

/** "Terça, 22 de setembro" */
export function formatLongDate(value: IsoDateTime | LocalDate): string {
  const { weekday, day, month } = dateParts(value);
  return `${weekday}, ${day} de ${month}`;
}

/** "Setembro" */
export function formatMonth(value: IsoDateTime | LocalDate): string {
  return capitalize(dateParts(value).month);
}

/** { weekday: "Seg", day: "21" } for the day chips. */
export function formatDayChip(value: IsoDateTime | LocalDate): { weekday: string; day: string } {
  const { weekdayShort, day } = dateParts(value);
  return { weekday: weekdayShort, day };
}
