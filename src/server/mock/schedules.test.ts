import { describe, expect, it } from "vitest";
import type { DaySchedule } from "@/lib/api/scheduleTypes";
import type { TimeSlot } from "@/lib/api/types";
import { formatTime } from "@/lib/format/date";
import { signInForTest } from "@/test/mockApi";
import { type AvailabilityQuery, timeSlots } from "./availability";
import { readDb } from "./db";
import { MockApiError } from "./errors";
import { addBlock, barberSchedule, removeBlock, saveWeekly } from "./schedules";

// Monday, 21 Sep 2026, 10:00 in São Paulo.
const now = new Date("2026-09-21T13:00:00Z");
const shop = "bs_novaera";
const tuesday = "2026-09-22";
const corte: AvailabilityQuery = { barbershopId: shop, serviceIds: ["svc_corte"], barber: { kind: "barber", barberId: "brb_carlos" } };

const times = (slots: TimeSlot[]) => slots.map((s) => formatTime(s.startsAt));
const withDay = (weekly: DaySchedule[], weekday: number, change: Partial<DaySchedule>) =>
  weekly.map((d) => (d.weekday === weekday ? { ...d, ...change } : d));

function errorOf(action: () => unknown): MockApiError {
  try {
    action();
  } catch (error) {
    if (error instanceof MockApiError) return error;
  }
  throw new Error("expected a MockApiError");
}

describe("barber schedules (mock API rules)", () => {
  it("starts from the barbershop's hours with a 12:00–13:00 break and Sunday off", () => {
    const { weekly, blocks } = barberSchedule(readDb(), shop, "brb_carlos");
    expect(weekly.map((d) => d.weekday)).toEqual([1, 2, 3, 4, 5, 6, 0]);
    expect(weekly[0]).toEqual({ weekday: 1, working: true, start: "09:00", end: "20:00", breakStart: "12:00", breakEnd: "13:00" });
    expect(weekly.at(-1)?.working).toBe(false);
    expect(blocks).toEqual([]);
  });

  it("refuses hours outside the barbershop's, keyed by weekday", () => {
    const db = readDb();
    const weekly = withDay(barberSchedule(db, shop, "brb_carlos").weekly, 2, { start: "08:00" });
    const error = errorOf(() => saveWeekly(db, shop, "brb_carlos", weekly, now));
    expect(error.status).toBe(422);
    expect(error.details?.fields).toEqual({ "2": "Fora do horário da barbearia (09h às 20h)" });
  });

  it("refuses working on a day the barbershop is closed", () => {
    const db = readDb();
    const weekly = withDay(barberSchedule(db, shop, "brb_carlos").weekly, 0, { working: true });
    expect(errorOf(() => saveWeekly(db, shop, "brb_carlos", weekly, now)).details?.fields).toEqual({
      "0": "A barbearia não abre neste dia",
    });
  });

  it("saves new hours, changes the client's times and counts appointments left outside", () => {
    const db = readDb();
    const weekly = withDay(barberSchedule(db, shop, "brb_carlos").weekly, 2, { start: "14:00", breakStart: null, breakEnd: null });
    const result = saveWeekly(db, shop, "brb_carlos", weekly, now);
    expect(result.outsideCount).toBeGreaterThan(0);
    const slots = timeSlots(db, { ...corte, date: tuesday }, now);
    expect(times(slots)[0]).toBe("14:00");
  });

  it("a day off on the week removes the day for the client", () => {
    const db = readDb();
    saveWeekly(db, shop, "brb_carlos", withDay(barberSchedule(db, shop, "brb_carlos").weekly, 2, { working: false }), now);
    expect(timeSlots(db, { ...corte, date: tuesday }, now)).toEqual([]);
  });

  it("blocks whole days or a few hours, and removing the block frees them again", () => {
    const db = readDb();
    const days = addBlock(db, shop, "brb_carlos", { kind: "days", startDate: tuesday, endDate: "2026-09-23", startTime: null, endTime: null, reason: "Férias" }, now);
    expect(days.outsideCount).toBeGreaterThan(0);
    expect(timeSlots(db, { ...corte, date: "2026-09-23" }, now)).toEqual([]);

    removeBlock(db, shop, "brb_carlos", days.saved.id);
    addBlock(db, shop, "brb_carlos", { kind: "hours", startDate: tuesday, endDate: tuesday, startTime: "15:00", endTime: "16:00", reason: "Médico" }, now);
    const slots = times(timeSlots(db, { ...corte, date: tuesday }, now));
    expect(slots).toContain("14:30");
    expect(slots).not.toContain("15:00");
    expect(slots).not.toContain("15:30");
    expect(slots).toContain("16:00");
  });

  it("validates blocks", () => {
    const error = errorOf(() =>
      addBlock(readDb(), shop, "brb_carlos", { kind: "days", startDate: "2026-09-23", endDate: tuesday, startTime: null, endTime: null, reason: " " }, now),
    );
    expect(error.status).toBe(422);
    expect(Object.keys(error.details?.fields as object).sort()).toEqual(["endDate", "reason"]);
  });

  it("a barber only reaches their own hours; the admin reaches anyone's", async () => {
    expect((await fetch("/api/mock/panel/me/schedule")).status).toBe(401);
    await signInForTest("barber");
    const mine = await (await fetch("/api/mock/panel/me/schedule")).json();
    expect(mine.barber.id).toBe("brb_carlos");
    expect((await fetch("/api/mock/panel/schedules/brb_rafael")).status).toBe(403);
    await signInForTest("admin");
    expect((await (await fetch("/api/mock/panel/schedules")).json()).map((b: { id: string }) => b.id)).toEqual([
      "brb_carlos",
      "brb_rafael",
      "brb_diego",
    ]);
    expect((await (await fetch("/api/mock/panel/schedules/brb_rafael")).json()).barber.name).toBe("Rafael Alves");
    expect((await fetch("/api/mock/panel/schedules/nobody")).status).toBe(404);
  });
});
