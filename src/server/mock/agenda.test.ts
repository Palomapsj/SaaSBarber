import { describe, expect, it } from "vitest";
import { localMinutesOf } from "@/lib/format/date";
import { agendaDay, barberAgendaDay } from "./agenda";
import { createAppointment } from "./appointments";
import { timeSlots } from "./availability";
import { readDb } from "./db";
import { seededAppointmentsFor } from "./seededAppointments";

const shop = "bs_novaera";
const date = "2026-09-23";
const now = new Date("2026-09-21T13:00:00Z");
const carlos = { kind: "barber", barberId: "brb_carlos" } as const;

function bookWith(barberId: string, name: string) {
  const query = { barbershopId: shop, serviceIds: ["svc_corte"], barber: { kind: "barber", barberId } as const };
  const slot = timeSlots(readDb(), { ...query, date }, now).find((s) => s.available);
  if (!slot) throw new Error("test setup: no free slot");
  createAppointment(readDb(), { ...query, startsAt: slot.startsAt, customer: { name, phone: "11987654321" }, recurring: false }, now);
  return slot.startsAt;
}

describe("admin agenda (mock API)", () => {
  it("returns the day's hours, plan and one column per active barber", () => {
    const day = agendaDay(readDb(), shop, date);
    expect(day.hours).toEqual({ opens: "09:00", closes: "20:00" });
    expect(day.plan).toEqual({ name: "Pro", maxBarbers: 5, barberCount: 3 });
    expect(day.barbers.map((b) => b.name)).toEqual(["Carlos Andrade", "Rafael Alves", "Diego Ibra"]);
  });

  it("is closed on Sundays", () => {
    expect(agendaDay(readDb(), shop, "2026-09-27").hours).toBeNull();
  });

  it("shows the sample appointments with the customer's name and a color", () => {
    const day = agendaDay(readDb(), shop, date);
    expect(day.appointments).toHaveLength(seededAppointmentsFor(readDb(), shop, date).length);
    for (const a of day.appointments) {
      expect(a.customerName).not.toBe("");
      expect([0, 1, 2, 3]).toContain(a.colorIndex);
    }
  });

  it("shows a booking made by a client, and the time is taken for the next client", () => {
    const startsAt = bookWith("brb_carlos", "Cliente Novo");
    expect(agendaDay(readDb(), shop, date).appointments.find((a) => a.customerName === "Cliente Novo")?.startsAt).toBe(startsAt);
    const query = { barbershopId: shop, serviceIds: ["svc_corte"], barber: carlos, date };
    expect(timeSlots(readDb(), query, now).find((s) => s.startsAt === startsAt)?.available).toBe(false);
  });

  it("matches the client's taken times: a free time never overlaps a card in the agenda", () => {
    const slots = timeSlots(readDb(), { barbershopId: shop, serviceIds: ["svc_corte"], barber: carlos, date }, now);
    const cards = agendaDay(readDb(), shop, date).appointments.filter((a) => a.barberId === "brb_carlos");
    for (const slot of slots.filter((s) => s.available)) {
      const start = localMinutesOf(slot.startsAt);
      expect(cards.some((c) => localMinutesOf(c.startsAt) < start + 30 && start < localMinutesOf(c.startsAt) + c.durationMinutes)).toBe(false);
    }
  });

  it("hides an inactive barber unless they have appointments that day", () => {
    const db = readDb();
    const diego = db.barbers[shop].find((b) => b.id === "brb_diego");
    if (!diego) throw new Error("setup");
    diego.active = false;
    const hasAppointments = seededAppointmentsFor(db, shop, date).some((a) => a.barber.id === "brb_diego");
    expect(agendaDay(db, shop, date).barbers.some((b) => b.id === "brb_diego")).toBe(hasAppointments);
  });
});

describe("barber agenda (mock API)", () => {
  it("returns only that barber's appointments, in time order", () => {
    const expected = seededAppointmentsFor(readDb(), shop, date)
      .filter((a) => a.barber.id === "brb_carlos")
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    expect(barberAgendaDay(readDb(), shop, "brb_carlos", date).appointments.map((a) => a.id)).toEqual(expected.map((a) => a.id));
  });

  it("includes a client's booking for that barber only", () => {
    bookWith("brb_rafael", "Cliente Novo");
    expect(barberAgendaDay(readDb(), shop, "brb_rafael", date).appointments.some((a) => a.customerName === "Cliente Novo")).toBe(true);
    expect(barberAgendaDay(readDb(), shop, "brb_carlos", date).appointments.some((a) => a.customerName === "Cliente Novo")).toBe(false);
  });
});
