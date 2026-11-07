import { describe, expect, it } from "vitest";
import type { Appointment } from "@/lib/api/types";
import { buildCalendarFile } from "./calendar";

const appointment: Appointment = {
  id: "apt_123",
  barbershopId: "bs_novaera",
  status: "confirmed",
  startsAt: "2026-11-07T13:30:00.000Z",
  durationMinutes: 55,
  services: [
    { id: "svc_corte", name: "Corte de cabelo" },
    { id: "svc_barba", name: "Barba completa" },
  ],
  barber: { id: "brb_carlos", name: "Carlos Andrade" },
  totalCents: 8000,
  recurrence: null,
};

const address = { street: "Rua das Tesouras", number: "123", district: "Vila Nova", city: "São Paulo", state: "SP" };
const build = (overrides: Partial<Appointment> = {}) =>
  buildCalendarFile({
    appointment: { ...appointment, ...overrides },
    barbershopName: "Barbearia Nova Era",
    address,
    now: new Date("2026-11-06T20:00:00Z"),
  });

// Undo line folding to read whole properties.
const unfolded = (ics: string) => ics.replace(/\r\n /g, "");

describe("buildCalendarFile", () => {
  it("creates one event with start and end in UTC", () => {
    const ics = unfolded(build());
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("DTSTART:20261107T133000Z");
    expect(ics).toContain("DTEND:20261107T142500Z"); // + 55 min
    expect(ics).toContain("UID:apt_123@barbershoop");
  });

  it("describes services, barbershop, barber and address (escaping commas)", () => {
    const ics = unfolded(build());
    expect(ics).toContain("SUMMARY:Corte de cabelo + Barba completa · Barbearia Nova Era");
    expect(ics).toContain("LOCATION:Rua das Tesouras\\, 123 - Vila Nova\\, São Paulo - SP");
    expect(ics).toContain("DESCRIPTION:Profissional: Carlos Andrade\\nServiços: Corte de cabelo + Barba completa");
  });

  it("repeats in the calendar when the appointment repeats", () => {
    expect(build()).not.toContain("RRULE");
    expect(build({ recurrence: { everyWeeks: 3 } })).toContain("RRULE:FREQ=WEEKLY;INTERVAL=3");
  });

  it("uses CRLF and keeps every line within 75 bytes", () => {
    const ics = build();
    expect(ics.endsWith("\r\n")).toBe(true);
    const encoder = new TextEncoder();
    for (const line of ics.split("\r\n")) {
      expect(encoder.encode(line).length).toBeLessThanOrEqual(75);
    }
  });
});
