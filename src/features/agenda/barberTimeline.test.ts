import { describe, expect, it } from "vitest";
import type { BarberAgendaItem } from "@/lib/api/types";
import { appointmentCountLabel, firstName, timelineStatus } from "./barberTimeline";

// 10:00–10:55 in São Paulo.
const item: BarberAgendaItem = {
  id: "a",
  startsAt: "2026-09-22T13:00:00Z",
  durationMinutes: 55,
  customerName: "João Pedro",
  serviceNames: ["Corte de cabelo", "Barba completa"],
  status: "confirmed",
};

describe("timelineStatus", () => {
  it.each([
    ["before it starts", "2026-09-22T12:59:00Z", "upcoming"],
    ["when it starts", "2026-09-22T13:00:00Z", "in-progress"],
    ["while it happens", "2026-09-22T13:30:00Z", "in-progress"],
    ["when it ends", "2026-09-22T13:55:00Z", "done"],
    ["after it ends", "2026-09-22T18:00:00Z", "done"],
  ])("%s", (_, now, expected) => {
    expect(timelineStatus(item, new Date(now))).toBe(expected);
  });

  it("treats appointments marked as completed as done", () => {
    expect(timelineStatus({ ...item, status: "completed" }, new Date("2026-09-22T12:00:00Z"))).toBe("done");
  });
});

describe("appointmentCountLabel", () => {
  it("uses singular/plural and says 'hoje' only for today", () => {
    expect(appointmentCountLabel(6, true)).toBe("6 agendamentos hoje");
    expect(appointmentCountLabel(1, true)).toBe("1 agendamento hoje");
    expect(appointmentCountLabel(5, false)).toBe("5 agendamentos");
  });
});

describe("firstName", () => {
  it("greets by the first name", () => {
    expect(firstName("Carlos Andrade")).toBe("Carlos");
    expect(firstName("  Diego ")).toBe("Diego");
  });
});
