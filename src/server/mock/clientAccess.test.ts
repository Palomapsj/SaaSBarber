import { describe, expect, it } from "vitest";
import { createAppointment } from "./appointments";
import { timeSlots } from "./availability";
import { cancelMyAppointment, issueAccess, myAppointments, resendAccessLink } from "./clientAccess";
import { readDb } from "./db";
import { MockApiError } from "./errors";

// Monday, 21 Sep 2026, 10:00 in São Paulo.
const now = new Date("2026-09-21T13:00:00Z");
const shop = "bs_novaera";
const corte = { barbershopId: shop, serviceIds: ["svc_corte"], barber: { kind: "any" } as const };
const joao = { name: "João Silva", phone: "11987654321" };
const maria = { name: "Maria Souza", phone: "11911112222" };

function book(customer: typeof joao) {
  const slot = timeSlots(readDb(), { ...corte, date: "2026-09-23" }, now).find((s) => s.available);
  if (!slot) throw new Error("test setup: no free slot");
  return createAppointment(readDb(), { ...corte, startsAt: slot.startsAt, customer, recurring: false }, now);
}

const codeOf = (run: () => unknown) => {
  try {
    run();
  } catch (error) {
    return (error as MockApiError).code;
  }
  return null;
};

describe("client access (mock API)", () => {
  it("lists only the appointments of the code's WhatsApp", () => {
    const mine = book(joao);
    book(maria);
    const list = myAppointments(readDb(), shop, mine.clientAccess.token, now);
    expect(list.map((a) => a.id)).toEqual([mine.appointment.id]);
    expect(list[0].canChange).toBe(true);
  });

  it("rejects unknown, expired and other-barbershop codes", () => {
    expect(codeOf(() => myAppointments(readDb(), shop, "nope", now))).toBe("INVALID_ACCESS");
    const { clientAccess } = book(joao);
    expect(codeOf(() => myAppointments(readDb(), shop, clientAccess.token, new Date("2027-01-01T00:00:00Z")))).toBe("INVALID_ACCESS");
    expect(codeOf(() => myAppointments(readDb(), "bs_other", clientAccess.token, now))).toBe("INVALID_ACCESS");
  });

  it("cancels an appointment, which can no longer be changed", () => {
    const { appointment, clientAccess } = book(joao);
    cancelMyAppointment(readDb(), shop, clientAccess.token, appointment.id, now);
    const [cancelled] = myAppointments(readDb(), shop, clientAccess.token, now);
    expect(cancelled.status).toBe("cancelled");
    expect(cancelled.canChange).toBe(false);
  });

  it("does not let a client cancel someone else's appointment", () => {
    const other = book(maria);
    const mine = book(joao);
    expect(codeOf(() => cancelMyAppointment(readDb(), shop, mine.clientAccess.token, other.appointment.id, now))).toBe("INVALID_ACCESS");
  });

  it("blocks changes inside the 3-hour notice", () => {
    const db = readDb();
    const access = issueAccess(db, shop, joao.phone, "2026-09-21T15:00:00Z");
    db.appointments.push({
      id: "apt_soon",
      barbershopId: shop,
      status: "confirmed",
      startsAt: "2026-09-21T15:00:00Z", // 12:00, two hours after "now"
      durationMinutes: 30,
      services: [{ id: "svc_corte", name: "Corte de cabelo" }],
      barber: { id: "brb_carlos", name: "Carlos Andrade" },
      totalCents: 4500,
      recurrence: null,
      customerName: joao.name,
      customerPhone: joao.phone,
    });
    expect(myAppointments(db, shop, access.token, now)[0].canChange).toBe(false);
    expect(codeOf(() => cancelMyAppointment(db, shop, access.token, "apt_soon", now))).toBe("CHANGE_NOT_ALLOWED");
  });

  it("only issues a new link for numbers that have appointments", () => {
    expect(resendAccessLink(readDb(), shop, "11900000000")).toBeNull();
    book(joao);
    expect(resendAccessLink(readDb(), shop, joao.phone)?.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });
});
