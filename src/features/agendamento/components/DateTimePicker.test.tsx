import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetBookingDraftCache } from "@/features/agendamento/booking/bookingDraft";
import { DateTimePicker } from "./DateTimePicker";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

const carlosDraft = { serviceIds: ["svc_corte", "svc_barba"], barber: { kind: "barber", barberId: "brb_carlos" } };

function storeDraft(draft: object) {
  sessionStorage.setItem("booking:novaera", JSON.stringify(draft));
}

function renderPicker() {
  return render(
    <DateTimePicker
      slug="novaera"
      barbershopId="bs_novaera"
      barberNames={{ brb_carlos: "Carlos Andrade" }}
      nextHref="/novaera/agendar/dados"
    />,
  );
}

const radios = (group: string) =>
  screen.getByRole("radiogroup", { name: group }).querySelectorAll<HTMLInputElement>("input[type=radio]");
const enabled = (group: string) => [...radios(group)].filter((input) => !input.disabled);
const checked = (group: string) => [...radios(group)].filter((input) => input.checked);

async function waitForSlots() {
  await screen.findByRole("radiogroup", { name: "Horário" });
}

describe("DateTimePicker", () => {
  beforeEach(() => {
    sessionStorage.clear();
    resetBookingDraftCache();
    replace.mockClear();
  });
  afterEach(cleanup);

  it("selects the first day with free slots and no time", async () => {
    storeDraft(carlosDraft);
    renderPicker();
    await waitForSlots();
    expect(checked("Dia")).toEqual([enabled("Dia")[0]]);
    expect(checked("Horário")).toHaveLength(0);
    expect(screen.getByRole("button", { name: "Continuar" }).hasAttribute("disabled")).toBe(true);
  });

  it("titles the slots with the chosen barber", async () => {
    storeDraft(carlosDraft);
    renderPicker();
    expect(await screen.findByText("Horários com Carlos Andrade")).toBeDefined();
  });

  it("titles the slots generically for 'any barber'", async () => {
    storeDraft({ serviceIds: ["svc_corte"], barber: { kind: "any" } });
    renderPicker();
    expect(await screen.findByText("Horários disponíveis")).toBeDefined();
  });

  it("enables Continuar with the chosen date and time once a free time is picked", async () => {
    storeDraft(carlosDraft);
    renderPicker();
    await waitForSlots();
    fireEvent.click(enabled("Horário")[0]);
    const link = screen.getByRole("link", { name: /Continuar/ });
    expect(link.getAttribute("href")).toBe("/novaera/agendar/dados");
    expect(link.textContent).toMatch(/^Continuar\S{3} \d{1,2} \S{3} · \d{2}:\d{2}$/u);
  });

  it("does not allow picking a taken time", async () => {
    storeDraft(carlosDraft);
    renderPicker();
    await waitForSlots();
    const taken = [...radios("Horário")].find((input) => input.disabled);
    expect(taken?.getAttribute("aria-label")).toMatch(/indisponível$/);
  });

  it("clears the chosen time when the day changes", async () => {
    storeDraft(carlosDraft);
    renderPicker();
    await waitForSlots();
    fireEvent.click(enabled("Horário")[0]);
    fireEvent.click(enabled("Dia")[1]);
    await waitForSlots();
    expect(checked("Dia")).toEqual([enabled("Dia")[1]]);
    expect(checked("Horário")).toHaveLength(0);
  });

  it("goes back to the barber step when no barber was chosen", () => {
    storeDraft({ serviceIds: ["svc_corte"] });
    renderPicker();
    expect(replace).toHaveBeenCalledWith("/novaera/agendar/profissional");
  });

  it("goes back to the services step when no service was chosen", () => {
    renderPicker();
    expect(replace).toHaveBeenCalledWith("/novaera/agendar/servicos");
  });

  it("shows the waitlist as disabled and still in development", () => {
    storeDraft(carlosDraft);
    renderPicker();
    const waitlist = screen.getByRole("button", { name: /Lista de espera/ });
    expect(waitlist.hasAttribute("disabled")).toBe(true);
    expect(waitlist.textContent).toContain("Em desenvolvimento");
  });
});
