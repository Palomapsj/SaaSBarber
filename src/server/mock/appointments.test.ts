import { describe, expect, it } from "vitest";
import type { BarberSelection } from "@/lib/api/types";
import { createAppointment, getAppointment } from "./appointments";
import { timeSlots } from "./availability";
import { readDb } from "./db";
import { MockApiError } from "./errors";

// Monday, 21 Sep 2026, 10:00 in São Paulo.
const now = new Date("2026-09-21T13:00:00Z");
const date = "2026-09-23";
const corte = { barbershopId: "bs_novaera", serviceIds: ["svc_corte"] };
const customer = { name: "João Silva", phone: "11987654321" };
const carlos = { kind: "barber", barberId: "brb_carlos" } as const;

function firstFreeSlot(barber: BarberSelection): string {
  const slot = timeSlots(readDb(), { ...corte, barber, date }, now).find((s) => s.available);
  if (!slot) throw new Error("test setup: no free slot");
  return slot.startsAt;
}

const book = (barber: BarberSelection, startsAt = firstFreeSlot(barber), recurring = false) =>
  createAppointment(readDb(), { ...corte, barber, startsAt, customer, recurring }, now);

const expectCode = (run: () => unknown, code: string) => {
  try {
    run();
  } catch (error) {
    expect(error).toBeInstanceOf(MockApiError);
    expect((error as MockApiError).code).toBe(code);
    return;
  }
  throw new Error(`expected ${code}`);
};

describe("appointments (mock API)", () => {
  it("creates a confirmed appointment with services, total and barber", () => {
    const startsAt = firstFreeSlot(carlos);
    const { appointment } = book(carlos, startsAt);
    expect(appointment).toMatchObject({
      status: "confirmed",
      startsAt,
      durationMinutes: 30,
      services: [{ id: "svc_corte", name: "Corte de cabelo" }],
      barber: { id: "brb_carlos", name: "Carlos Andrade" },
      totalCents: 4500,
      recurrence: null,
    });
    expect(getAppointment(readDb(), appointment.id)).toEqual(appointment);
  });

  it("picks a free barber for 'any barber'", () => {
    expect(["brb_carlos", "brb_rafael"]).toContain(book({ kind: "any" }).appointment.barber.id);
  });

  it("uses the barbershop's interval when repeating", () => {
    expect(book(carlos, undefined, true).appointment.recurrence).toEqual({ everyWeeks: 3 });
  });

  it("returns an access code, the same one for the same WhatsApp", () => {
    const first = book({ kind: "any" });
    const second = book({ kind: "any" });
    expect(first.clientAccess.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(second.clientAccess.token).toBe(first.clientAccess.token);
  });

  it("never sends the client's name or WhatsApp back with the appointment", () => {
    const { appointment } = book({ kind: "any" });
    const sent = JSON.stringify(getAppointment(readDb(), appointment.id));
    expect(sent).not.toContain(customer.phone);
    expect(sent).not.toContain(customer.name);
  });

  it("refuses a time that was just taken, and the grid shows it as taken", () => {
    const startsAt = firstFreeSlot(carlos);
    book(carlos, startsAt);
    expectCode(() => book(carlos, startsAt), "SLOT_UNAVAILABLE");
    expect(timeSlots(readDb(), { ...corte, barber: carlos, date }, now).find((s) => s.startsAt === startsAt)?.available).toBe(false);
  });

  it("refuses a time in the past", () => {
    expectCode(() => book(carlos, "2026-09-21T12:00:00.000Z"), "SLOT_UNAVAILABLE");
  });

  it("answers 404 for an unknown appointment", () => {
    expectCode(() => getAppointment(readDb(), "apt_unknown"), "NOT_FOUND");
  });
});
