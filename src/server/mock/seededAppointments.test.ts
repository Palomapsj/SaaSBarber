import { describe, expect, it } from "vitest";
import { localMinutesOf } from "@/lib/format/date";
import { readDb } from "./db";
import { seededAppointmentsFor } from "./seededAppointments";

// Default break of the prototype (scheduleRules.defaultWeekly).
const LUNCH_BREAK = { start: 12 * 60, end: 13 * 60 };

const shop = "bs_novaera";
const tuesday = "2026-09-22";

describe("sample appointments", () => {
  it("are always the same for the same day", () => {
    const first = seededAppointmentsFor(readDb(), shop, tuesday);
    expect(seededAppointmentsFor(readDb(), shop, tuesday)).toEqual(first);
    expect(first.length).toBeGreaterThan(0);
  });

  it("never overlap for the same barber", () => {
    const appointments = seededAppointmentsFor(readDb(), shop, tuesday);
    for (const barber of readDb().barbers[shop]) {
      const theirs = appointments
        .filter((a) => a.barber.id === barber.id)
        .map((a) => ({ start: localMinutesOf(a.startsAt), end: localMinutesOf(a.startsAt) + a.durationMinutes }))
        .sort((a, b) => a.start - b.start);
      for (let i = 1; i < theirs.length; i++) expect(theirs[i].start).toBeGreaterThanOrEqual(theirs[i - 1].end);
    }
  });

  it("stay inside opening hours and outside the lunch break", () => {
    for (const a of seededAppointmentsFor(readDb(), shop, tuesday)) {
      const start = localMinutesOf(a.startsAt);
      const end = start + a.durationMinutes;
      expect(start).toBeGreaterThanOrEqual(9 * 60);
      expect(end).toBeLessThanOrEqual(20 * 60);
      expect(end <= LUNCH_BREAK.start || start >= LUNCH_BREAK.end).toBe(true);
    }
  });

  it("only use the barber's services, combining different categories in catalog order", () => {
    const db = readDb();
    const services = db.services[shop];
    for (const a of seededAppointmentsFor(db, shop, tuesday)) {
      const barber = db.barbers[shop].find((b) => b.id === a.barber.id);
      for (const service of a.services) expect(barber?.serviceIds).toContain(service.id);
      if (a.services.length === 2) {
        const [first, second] = a.services.map((s) => services.findIndex((x) => x.id === s.id));
        expect(first).toBeLessThan(second);
      }
    }
  });

  it("are not generated for barbers created later", () => {
    const db = readDb();
    db.barbers[shop].push({ ...db.barbers[shop][0], id: "brb_novo", hasSampleAgenda: false });
    expect(seededAppointmentsFor(db, shop, tuesday).some((a) => a.barber.id === "brb_novo")).toBe(false);
  });

  it("do not exist on closed days", () => {
    expect(seededAppointmentsFor(readDb(), shop, "2026-09-27")).toEqual([]);
  });
});
