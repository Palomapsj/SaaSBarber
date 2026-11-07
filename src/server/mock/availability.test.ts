import { describe, expect, it } from "vitest";
import type { TimeSlot } from "@/lib/api/types";
import { formatTime } from "@/lib/format/date";
import { availableDays, timeSlots } from "./availability";
import { readDb } from "./db";

// Monday, 21 Sep 2026, 10:00 in São Paulo.
const now = new Date("2026-09-21T13:00:00Z");
const carlos = { kind: "barber", barberId: "brb_carlos" } as const;
const corteBarba = { barbershopId: "bs_novaera", serviceIds: ["svc_corte", "svc_barba"], barber: carlos };

const times = (slots: TimeSlot[]) => slots.map((slot) => formatTime(slot.startsAt));
const availableTimes = (slots: TimeSlot[]) => times(slots.filter((slot) => slot.available));
const slotAt = (slots: TimeSlot[], time: string) => slots.find((slot) => formatTime(slot.startsAt) === time);

describe("availability (mock API rules)", () => {
  it("lists the open days of the next 14 days, starting today", () => {
    const days = availableDays(readDb(), corteBarba, now);
    expect(days).toHaveLength(12); // 14 days minus two Sundays
    expect(days[0].date).toBe("2026-09-21");
    expect(days.map((day) => day.date)).not.toContain("2026-09-27");
  });

  it("marks every day as full for a barber who does not exist", () => {
    const days = availableDays(readDb(), { ...corteBarba, barber: { kind: "barber", barberId: "nobody" } }, now);
    expect(days.every((day) => !day.hasFreeSlots)).toBe(true);
  });

  it("offers 30-minute slots inside opening hours, skipping the lunch break", () => {
    const slots = timeSlots(readDb(), { ...corteBarba, date: "2026-09-22" }, now);
    expect(times(slots).slice(0, 6)).toEqual(["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"]);
    expect(times(slots)).not.toContain("12:00");
    expect(times(slots)).not.toContain("12:30");
    expect(times(slots)).toContain("13:00");
    expect(times(slots).at(-1)).toBe("19:30");
  });

  it("returns times in UTC that show as São Paulo time", () => {
    expect(timeSlots(readDb(), { ...corteBarba, date: "2026-09-22" }, now)[0].startsAt).toBe("2026-09-22T12:00:00.000Z");
  });

  it("marks a time as taken when the services (55 min) do not fit before the break or closing", () => {
    const slots = timeSlots(readDb(), { ...corteBarba, date: "2026-09-22" }, now);
    expect(slotAt(slots, "11:30")?.available).toBe(false);
    expect(slotAt(slots, "19:30")?.available).toBe(false);
  });

  it("marks times earlier than one hour from now as taken", () => {
    const slots = timeSlots(readDb(), { ...corteBarba, date: "2026-09-21" }, now);
    for (const time of ["09:00", "09:30", "10:00", "10:30"]) expect(slotAt(slots, time)?.available).toBe(false);
  });

  it("with 'any barber', a time is free when at least one qualified barber is free", () => {
    const date = "2026-09-23";
    const corte = { barbershopId: "bs_novaera", serviceIds: ["svc_corte"] };
    const db = readDb();
    const any = timeSlots(db, { ...corte, barber: { kind: "any" }, date }, now);
    const carlosSlots = timeSlots(db, { ...corte, barber: carlos, date }, now);
    const rafaelSlots = timeSlots(db, { ...corte, barber: { kind: "barber", barberId: "brb_rafael" }, date }, now);
    expect(new Set(availableTimes(any))).toEqual(new Set([...availableTimes(carlosSlots), ...availableTimes(rafaelSlots)]));
  });

  it("ignores inactive barbers", () => {
    const db = readDb();
    const diego = db.barbers.bs_novaera.find((b) => b.id === "brb_diego");
    if (!diego) throw new Error("setup");
    diego.active = false;
    const slots = timeSlots(db, { barbershopId: "bs_novaera", serviceIds: ["svc_barboterapia"], barber: { kind: "any" }, date: "2026-09-23" }, now);
    expect(slots.every((s) => !s.available)).toBe(true);
  });

  it("returns no slots on a closed day", () => {
    expect(timeSlots(readDb(), { ...corteBarba, date: "2026-09-27" }, now)).toEqual([]);
  });
});
