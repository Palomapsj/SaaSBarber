import type { LocalDate } from "@/lib/api/types";

// Date and time helpers shared by the mock "server" (availability and sample appointments).

export const SLOT_MINUTES = 30;

const pad = (value: number) => String(value).padStart(2, "0");

// São Paulo has had no daylight saving time since 2019, so the offset is fixed. Mock only.
export const toIso = (date: LocalDate, minutes: number) =>
  new Date(`${date}T${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}:00-03:00`).toISOString();

export const weekdayOf = (date: LocalDate) => new Date(`${date}T12:00:00Z`).getUTCDay();

export function addDays(date: LocalDate, days: number): LocalDate {
  const instant = new Date(`${date}T12:00:00Z`);
  instant.setUTCDate(instant.getUTCDate() + days);
  return instant.toISOString().slice(0, 10);
}

export function hash(text: string): number {
  let value = 2166136261;
  for (let i = 0; i < text.length; i++) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

/** Small deterministic random generator (mulberry32): same seed, same sequence. */
export function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
