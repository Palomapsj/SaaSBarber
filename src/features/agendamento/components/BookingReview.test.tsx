import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetBookingDraftCache } from "@/features/agendamento/booking/bookingDraft";
import { createAppointment } from "@/lib/api/appointments";
import { getAvailableDays, getTimeSlots } from "@/lib/api/availability";
import { readDb } from "@/server/mock/db";
import { BookingReview } from "./BookingReview";

const replace = vi.fn();
const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, push }) }));

const barbershop = readDb().barbershops[0];
const carlos = { kind: "barber", barberId: "brb_carlos" } as const;
const query = { barbershopId: barbershop.id, serviceIds: ["svc_corte", "svc_barba"], barber: carlos };

/** First free time for Carlos (Corte + Barba) in the coming days, skipping `except`. */
async function freeSlot(except?: string) {
  for (const day of await getAvailableDays(query)) {
    const slot = (await getTimeSlots({ ...query, date: day.date })).find((s) => s.available && s.startsAt !== except);
    if (slot) return { date: day.date, startsAt: slot.startsAt };
  }
  throw new Error("test setup: no free slot");
}

async function storeCompleteDraft(extra: object = {}) {
  const { date, startsAt } = await freeSlot();
  const draft = {
    serviceIds: query.serviceIds,
    barber: carlos,
    date,
    startsAt,
    customerName: "João Silva",
    customerPhone: "11987654321",
    recurring: false,
    ...extra,
  };
  sessionStorage.setItem("booking:novaera", JSON.stringify(draft));
  return draft;
}

function renderReview() {
  return render(
    <BookingReview
      barbershop={barbershop}
      services={readDb().services[barbershop.id]}
      barberNames={{ brb_carlos: "Carlos Andrade" }}
      dateTimeHref="/novaera/agendar/data-horario"
      successHref="/novaera/agendar/sucesso"
    />,
  );
}

const confirmButton = () => screen.getByRole("button", { name: "Confirmar agendamento" });
const valueOf = (label: string) => screen.getByText(label).nextElementSibling?.textContent?.replace(/ /g, " ");

describe("BookingReview", () => {
  beforeEach(() => {
    sessionStorage.clear();
    resetBookingDraftCache();
    replace.mockClear();
    push.mockClear();
  });
  afterEach(cleanup);

  it("summarizes the booking", async () => {
    await storeCompleteDraft();
    renderReview();
    expect(valueOf("Barbearia")).toBe("Barbearia Nova Era");
    expect(valueOf("Serviços")).toBe("Corte de cabelo + Barba completa");
    expect(valueOf("Profissional")).toBe("Carlos Andrade");
    expect(valueOf("Horário")).toMatch(/^\d{2}:\d{2} · 55 min$/);
    expect(valueOf("WhatsApp")).toBe("(11) 98765-4321");
    expect(valueOf("Total")).toBe("R$ 80");
    expect(screen.getByText("Cancelamento ou reagendamento grátis até 3h antes do horário.")).toBeDefined();
  });

  it("shows 'Qualquer profissional' and the repetition when chosen", async () => {
    await storeCompleteDraft({ recurring: true, barber: { kind: "any" } });
    renderReview();
    expect(valueOf("Profissional")).toBe("Qualquer profissional");
    expect(valueOf("Repetição")).toBe("A cada 3 semanas");
  });

  it("creates the appointment once and goes to the success screen", async () => {
    await storeCompleteDraft();
    renderReview();
    fireEvent.click(confirmButton());
    fireEvent.click(screen.getByRole("button", { name: "Confirmando…" }));
    await vi.waitFor(() => expect(push).toHaveBeenCalledTimes(1));

    const [created] = readDb().appointments;
    expect(readDb().appointments).toHaveLength(1);
    expect(push).toHaveBeenCalledWith(`/novaera/agendar/sucesso?agendamento=${created.id}`);
  });

  it("starts unlocked for a second booking in the same visit", async () => {
    await storeCompleteDraft();
    const { rerender } = renderReview();
    fireEvent.click(confirmButton());
    await vi.waitFor(() => expect(push).toHaveBeenCalledTimes(1));

    // Same screen instance (kept in the background), new time chosen.
    const stored = JSON.parse(sessionStorage.getItem("booking:novaera") ?? "{}");
    const next = await freeSlot(stored.startsAt);
    sessionStorage.setItem("booking:novaera", JSON.stringify({ ...stored, ...next }));
    resetBookingDraftCache();
    rerender(
      <BookingReview
        barbershop={barbershop}
        services={readDb().services[barbershop.id]}
        barberNames={{ brb_carlos: "Carlos Andrade" }}
        dateTimeHref="/novaera/agendar/data-horario"
        successHref="/novaera/agendar/sucesso"
      />,
    );
    expect(confirmButton().hasAttribute("disabled")).toBe(false);
  });

  it("offers another time when the slot was just taken", async () => {
    const draft = await storeCompleteDraft();
    await createAppointment({ ...query, startsAt: draft.startsAt, customer: { name: "Outro", phone: "11911112222" }, recurring: false });
    renderReview();
    fireEvent.click(confirmButton());

    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "Esse horário acabou de ser reservado. Escolha outro horário.",
    );
    expect(screen.getByRole("link", { name: "Escolher outro horário" }).getAttribute("href")).toBe(
      "/novaera/agendar/data-horario",
    );
    expect(push).not.toHaveBeenCalled();
  });

  it("goes back to the customer step when the WhatsApp is missing", async () => {
    await storeCompleteDraft({ customerPhone: "" });
    renderReview();
    expect(replace).toHaveBeenCalledWith("/novaera/agendar/dados");
  });
});
