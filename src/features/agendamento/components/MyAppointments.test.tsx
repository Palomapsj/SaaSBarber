import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAppointment } from "@/lib/api/appointments";
import { getAvailableDays, getTimeSlots } from "@/lib/api/availability";
import { issueAccess } from "@/server/mock/clientAccess";
import { readDb } from "@/server/mock/db";
import { MyAppointments } from "./MyAppointments";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

const shop = "bs_novaera";
const phone = "11987654321";
const query = { barbershopId: shop, serviceIds: ["svc_corte"], barber: { kind: "any" } as const };

async function bookUpcoming() {
  const day = (await getAvailableDays(query)).find((d) => d.hasFreeSlots);
  const slot = day && (await getTimeSlots({ ...query, date: day.date })).find((s) => s.available);
  if (!slot) throw new Error("test setup: no free slot");
  return createAppointment({ ...query, startsAt: slot.startsAt, customer: { name: "João", phone }, recurring: false });
}

function savePast() {
  readDb().appointments.push({
    id: "apt_past",
    barbershopId: shop,
    status: "confirmed",
    startsAt: "2026-01-10T13:00:00Z",
    durationMinutes: 30,
    services: [{ id: "svc_corte", name: "Corte de cabelo" }],
    barber: { id: "brb_rafael", name: "Rafael Alves" },
    totalCents: 4500,
    recurrence: null,
    customerName: "João Silva",
    customerPhone: phone,
  });
}

function renderPage(options: { linkToken?: string | null; linkWasInvalid?: boolean } = {}) {
  return render(
    <MyAppointments
      slug="novaera"
      barbershopId={shop}
      cancellationNoticeHours={3}
      linkToken={options.linkToken ?? null}
      linkWasInvalid={options.linkWasInvalid ?? false}
      selfHref="/novaera/meus-agendamentos"
      bookHref="/novaera/agendar/servicos"
    />,
  );
}

describe("MyAppointments", () => {
  beforeEach(() => {
    localStorage.clear();
    replace.mockClear();
  });
  afterEach(cleanup);

  it("asks for the WhatsApp when this device has no access code", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: "Veja seus agendamentos" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Agendar novo horário" }).getAttribute("href")).toBe("/novaera/agendar/servicos");
  });

  it("lists upcoming appointments with the code saved when booking", async () => {
    const { clientAccess } = await bookUpcoming();
    localStorage.setItem("client-access:novaera", clientAccess.token);
    renderPage();
    expect(await screen.findByText("Confirmado")).toBeDefined();
    expect(screen.getByRole("heading", { name: "Corte de cabelo" })).toBeDefined();
    expect(screen.getByRole("tab", { name: "Próximos" }).getAttribute("aria-selected")).toBe("true");
  });

  it("shows past appointments in 'Histórico' without actions", async () => {
    const { clientAccess } = await bookUpcoming();
    savePast();
    localStorage.setItem("client-access:novaera", clientAccess.token);
    renderPage();
    fireEvent.click(await screen.findByRole("tab", { name: "Histórico" }));
    const card = screen.getByRole("article");
    expect(within(card).getByText("Concluído")).toBeDefined();
    expect(within(card).queryByRole("button")).toBeNull();
  });

  it("saves a valid magic link code and removes it from the address", async () => {
    const { clientAccess } = await bookUpcoming();
    renderPage({ linkToken: clientAccess.token });
    await screen.findByText("Confirmado");
    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith("/novaera/meus-agendamentos"));
    expect(localStorage.getItem("client-access:novaera")).toBe(clientAccess.token);
  });

  it("does not save an invalid magic link and keeps the existing access", async () => {
    const { clientAccess } = await bookUpcoming();
    localStorage.setItem("client-access:novaera", clientAccess.token);
    renderPage({ linkToken: "invalid-code" });
    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith("/novaera/meus-agendamentos?link=invalido"));
    expect(localStorage.getItem("client-access:novaera")).toBe(clientAccess.token);
  });

  it("explains when the saved code is no longer valid", async () => {
    localStorage.setItem("client-access:novaera", "expired-code");
    renderPage();
    expect(await screen.findByText(/Esse link não é mais válido/)).toBeDefined();
  });

  it("asks for confirmation before cancelling, then cancels", async () => {
    const { clientAccess } = await bookUpcoming();
    localStorage.setItem("client-access:novaera", clientAccess.token);
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Cancelar" }));
    expect(screen.getByText("Cancelar este agendamento?")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
    expect(screen.queryByText("Cancelar este agendamento?")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    fireEvent.click(screen.getByRole("button", { name: "Sim, cancelar" }));
    expect(await screen.findByText("Você não tem agendamentos próximos.")).toBeDefined();
  });

  it("blocks changes inside the cancellation notice", async () => {
    const soon = new Date(Date.now() + 2 * 3_600_000).toISOString();
    const access = issueAccess(readDb(), shop, phone, soon);
    readDb().appointments.push({
      id: "apt_soon",
      barbershopId: shop,
      status: "confirmed",
      startsAt: soon,
      durationMinutes: 30,
      services: [{ id: "svc_corte", name: "Corte de cabelo" }],
      barber: { id: "brb_carlos", name: "Carlos Andrade" },
      totalCents: 4500,
      recurrence: null,
      customerName: "João Silva",
      customerPhone: phone,
    });
    localStorage.setItem("client-access:novaera", access.token);
    renderPage();
    expect(await screen.findByText("Faltam menos de 3h. Para alterar, fale com a barbearia.")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Cancelar" })).toBeNull();
  });

  it("shows 'Reagendar' as still in development", async () => {
    const { clientAccess } = await bookUpcoming();
    localStorage.setItem("client-access:novaera", clientAccess.token);
    renderPage();
    const reschedule = await screen.findByRole("button", { name: /Reagendar/ });
    expect(reschedule.hasAttribute("disabled")).toBe(true);
    expect(reschedule.textContent).toContain("Em desenvolvimento");
  });

  it("forgets the code on 'Sair deste aparelho'", async () => {
    const { clientAccess } = await bookUpcoming();
    localStorage.setItem("client-access:novaera", clientAccess.token);
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Sair deste aparelho" }));
    expect(localStorage.getItem("client-access:novaera")).toBeNull();
    expect(screen.getByRole("heading", { name: "Veja seus agendamentos" })).toBeDefined();
  });

  it("asks for a valid WhatsApp and confirms the link was sent", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Receber link no WhatsApp" }));
    expect(screen.getByText("Informe um WhatsApp válido, com DDD")).toBeDefined();

    fireEvent.change(screen.getByLabelText("WhatsApp"), { target: { value: phone } });
    fireEvent.click(screen.getByRole("button", { name: "Receber link no WhatsApp" }));
    expect(await screen.findByText("Se esse número tiver agendamentos aqui, enviamos um link pelo WhatsApp.")).toBeDefined();
  });
});
