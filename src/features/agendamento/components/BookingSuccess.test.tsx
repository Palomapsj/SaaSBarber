import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetBookingDraftCache } from "@/features/agendamento/booking/bookingDraft";
import { readDb } from "@/server/mock/db";
import type { Appointment } from "@/lib/api/types";
import { BookingSuccess } from "./BookingSuccess";

const barbershop = readDb().barbershops[0];
const appointment: Appointment = {
  id: "apt_123",
  barbershopId: barbershop.id,
  status: "confirmed",
  startsAt: "2026-11-07T13:30:00.000Z",
  durationMinutes: 55,
  services: [
    { id: "svc_corte", name: "Corte de cabelo" },
    { id: "svc_barba", name: "Barba completa" },
  ],
  barber: { id: "brb_carlos", name: "Carlos Andrade" },
  totalCents: 8000,
  recurrence: { everyWeeks: 3 },
};

function renderSuccess(appointmentId: string | null = "apt_123") {
  return render(
    <BookingSuccess
      slug="novaera"
      appointmentId={appointmentId}
      barbershopName={barbershop.name}
      address={barbershop.address}
      homeHref="/novaera"
      myAppointmentsHref="/novaera/meus-agendamentos"
    />,
  );
}

const storedDraft = () => JSON.parse(sessionStorage.getItem("booking:novaera") ?? "{}");

describe("BookingSuccess", () => {
  beforeEach(() => {
    sessionStorage.clear();
    resetBookingDraftCache();
    readDb().appointments.push({ ...appointment, customerName: "João Silva", customerPhone: "11987654321" });
  });
  afterEach(cleanup);

  it("shows the confirmed appointment", async () => {
    renderSuccess();
    expect(await screen.findByRole("heading", { name: "Agendamento confirmado" })).toBeDefined();
    expect(screen.getByText("Sábado, 7 de novembro")).toBeDefined();
    expect(screen.getByText("10:30 · Carlos Andrade · Corte de cabelo + Barba completa")).toBeDefined();
    expect(screen.getByText("Repete a cada 3 semanas")).toBeDefined();
    expect(screen.getByRole("link", { name: "Ver meus agendamentos" }).getAttribute("href")).toBe(
      "/novaera/meus-agendamentos",
    );
  });

  it("clears the booking choices but keeps name and WhatsApp", async () => {
    sessionStorage.setItem(
      "booking:novaera",
      JSON.stringify({
        serviceIds: ["svc_corte"],
        barber: { kind: "any" },
        date: "2026-11-07",
        startsAt: appointment.startsAt,
        customerName: "João Silva",
        customerPhone: "11987654321",
        recurring: true,
      }),
    );
    renderSuccess();
    await screen.findByRole("heading", { name: "Agendamento confirmado" });
    expect(storedDraft()).toMatchObject({
      serviceIds: [],
      barber: null,
      startsAt: null,
      recurring: false,
      customerName: "João Silva",
      customerPhone: "11987654321",
    });
  });

  it("downloads a calendar file", async () => {
    const createObjectURL = vi.fn(() => "blob:test");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL, revokeObjectURL }));
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    renderSuccess();
    fireEvent.click(await screen.findByRole("button", { name: "Adicionar ao calendário" }));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    click.mockRestore();
  });

  it("explains when the appointment is not found", async () => {
    renderSuccess("apt_unknown");
    expect(await screen.findByRole("heading", { name: "Agendamento não encontrado" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Voltar ao início" }).getAttribute("href")).toBe("/novaera");
  });

  it("handles a missing appointment code", () => {
    renderSuccess(null);
    expect(screen.getByRole("heading", { name: "Agendamento não encontrado" })).toBeDefined();
  });
});
