import { describe, expect, it } from "vitest";
import type { MyAppointment } from "@/lib/api/types";
import { appointmentStatus, appointmentTitle, splitAppointments } from "./myAppointments";

const now = new Date("2026-09-21T13:00:00Z");
const base: MyAppointment = {
  id: "a",
  barbershopId: "bs_novaera",
  status: "confirmed",
  startsAt: "2026-09-22T13:00:00Z",
  durationMinutes: 55,
  services: [
    { id: "svc_corte", name: "Corte de cabelo" },
    { id: "svc_barba", name: "Barba completa" },
  ],
  barber: { id: "brb_carlos", name: "Carlos Andrade" },
  totalCents: 8000,
  recurrence: null,
  canChange: true,
};

describe("splitAppointments", () => {
  it("puts confirmed future appointments in 'Próximos' (soonest first) and the rest in 'Histórico' (latest first)", () => {
    const later = { ...base, id: "later", startsAt: "2026-10-12T19:30:00Z" };
    const soon = { ...base, id: "soon" };
    const past = { ...base, id: "past", startsAt: "2026-09-01T13:00:00Z" };
    const cancelled = { ...base, id: "cancelled", status: "cancelled" as const, startsAt: "2026-09-30T13:00:00Z" };
    const { upcoming, history } = splitAppointments([later, past, cancelled, soon], now);
    expect(upcoming.map((a) => a.id)).toEqual(["soon", "later"]);
    expect(history.map((a) => a.id)).toEqual(["cancelled", "past"]);
  });
});

describe("appointmentStatus", () => {
  it.each([
    [base, "Confirmado", "success"],
    [{ ...base, startsAt: "2026-09-01T13:00:00Z" }, "Concluído", "muted"],
    [{ ...base, status: "cancelled" as const }, "Cancelado", "accent"],
  ])("%#: %s", (appointment, label, tone) => {
    expect(appointmentStatus(appointment, now)).toEqual({ label, tone });
  });
});

describe("appointmentTitle", () => {
  it("joins services and marks repeating appointments as in the prototype", () => {
    expect(appointmentTitle(base)).toBe("Corte de cabelo + Barba completa");
    expect(appointmentTitle({ ...base, recurrence: { everyWeeks: 3 } })).toBe(
      "Corte de cabelo + Barba completa (recorrente)",
    );
  });
});
