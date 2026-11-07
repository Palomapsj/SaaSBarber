import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetBookingDraftCache } from "@/features/agendamento/booking/bookingDraft";
import { BarberSelector } from "./BarberSelector";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

function storeDraft(draft: object) {
  sessionStorage.setItem("booking:novaera", JSON.stringify(draft));
}

function renderSelector() {
  return render(
    <BarberSelector
      slug="novaera"
      barbershopId="bs_novaera"
      servicesHref="/novaera/agendar/servicos"
      nextHref="/novaera/agendar/data-horario"
    />,
  );
}

const continueButton = () => screen.getByRole("button", { name: "Continuar" });

describe("BarberSelector", () => {
  beforeEach(() => {
    sessionStorage.clear();
    resetBookingDraftCache();
    replace.mockClear();
  });
  afterEach(cleanup);

  it("lists 'Qualquer profissional' and only barbers who do every chosen service", async () => {
    storeDraft({ serviceIds: ["svc_corte"] });
    renderSelector();
    expect(await screen.findByRole("radio", { name: /Qualquer profissional/ })).toBeDefined();
    expect(screen.getByRole("radio", { name: /Carlos Andrade/ })).toBeDefined();
    expect(screen.getByRole("radio", { name: /Rafael Alves/ })).toBeDefined();
    expect(screen.queryByRole("radio", { name: /Diego Ibra/ })).toBeNull();
  });

  it("shows initials and specialties (the categories of their services)", async () => {
    storeDraft({ serviceIds: ["svc_corte"] });
    renderSelector();
    expect(await screen.findByText("CA")).toBeDefined();
    expect(screen.getByText("Cabelo · Barba")).toBeDefined();
  });

  it("keeps Continuar disabled until a choice is made, then links to the next step", async () => {
    storeDraft({ serviceIds: ["svc_corte"] });
    renderSelector();
    fireEvent.click(await screen.findByRole("radio", { name: /Rafael Alves/ }));
    expect(screen.getByRole("link", { name: "Continuar" }).getAttribute("href")).toBe("/novaera/agendar/data-horario");
  });

  it("starts with nothing chosen", async () => {
    storeDraft({ serviceIds: ["svc_corte"] });
    renderSelector();
    await screen.findByRole("radio", { name: /Carlos Andrade/ });
    expect(continueButton().hasAttribute("disabled")).toBe(true);
  });

  it("allows only one choice at a time", async () => {
    storeDraft({ serviceIds: ["svc_corte"] });
    renderSelector();
    fireEvent.click(await screen.findByRole("radio", { name: /Carlos Andrade/ }));
    fireEvent.click(screen.getByRole("radio", { name: /Qualquer profissional/ }));
    expect((screen.getByRole("radio", { name: /Carlos Andrade/ }) as HTMLInputElement).checked).toBe(false);
    expect((screen.getByRole("radio", { name: /Qualquer profissional/ }) as HTMLInputElement).checked).toBe(true);
  });

  it("ignores a stored barber who no longer performs the chosen services", async () => {
    storeDraft({ serviceIds: ["svc_corte", "svc_barba"], barber: { kind: "barber", barberId: "brb_rafael" } });
    renderSelector();
    await screen.findByRole("radio", { name: /Carlos Andrade/ });
    expect(continueButton().hasAttribute("disabled")).toBe(true);
  });

  it("explains when nobody performs all chosen services", async () => {
    storeDraft({ serviceIds: ["svc_corte_sobrancelha", "svc_barboterapia"] });
    renderSelector();
    expect(await screen.findByText("Nenhum profissional atende todos os serviços escolhidos.")).toBeDefined();
    expect(screen.getByRole("link", { name: "Alterar serviços" }).getAttribute("href")).toBe("/novaera/agendar/servicos");
  });

  it("goes back to the services step when no service was chosen", () => {
    renderSelector();
    expect(replace).toHaveBeenCalledWith("/novaera/agendar/servicos");
  });
});
