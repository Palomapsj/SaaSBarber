import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetBookingDraftCache } from "@/features/agendamento/booking/bookingDraft";
import type { ServiceCatalog } from "@/lib/api/types";
import { ServiceSelector } from "./ServiceSelector";

const catalog: ServiceCatalog = {
  categories: [
    { id: "cabelo", name: "Cabelo" },
    { id: "barba", name: "Barba" },
  ],
  services: [
    { id: "corte", categoryId: "cabelo", name: "Corte de cabelo", durationMinutes: 30, priceCents: 4500, active: true },
    { id: "barba-completa", categoryId: "barba", name: "Barba completa", durationMinutes: 25, priceCents: 3500, active: true },
  ],
};

function renderSelector() {
  return render(<ServiceSelector slug="novaera" catalog={catalog} nextHref="/novaera/agendar/profissional" />);
}

// Normalizes the non-breaking spaces produced by Intl.
const summaryText = () => screen.getByText(/serviço/).textContent?.replace(/ /g, " ");

describe("ServiceSelector", () => {
  beforeEach(() => {
    sessionStorage.clear();
    resetBookingDraftCache();
  });
  afterEach(cleanup);

  it("lists services grouped by category", () => {
    renderSelector();
    expect(screen.getByRole("heading", { name: "Cabelo" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Barba" })).toBeDefined();
    expect(screen.getByRole("checkbox", { name: /Corte de cabelo/ })).toBeDefined();
  });

  it("starts with nothing selected and Continuar disabled", () => {
    renderSelector();
    expect(summaryText()).toBe("Selecione ao menos um serviço");
    expect(screen.getByRole("button", { name: "Continuar" }).hasAttribute("disabled")).toBe(true);
  });

  it("updates the summary and enables Continuar as services are selected", () => {
    renderSelector();
    fireEvent.click(screen.getByRole("checkbox", { name: /Corte de cabelo/ }));
    expect(summaryText()).toBe("1 serviço · 30 min · R$ 45");

    fireEvent.click(screen.getByRole("checkbox", { name: /Barba completa/ }));
    expect(summaryText()).toBe("2 serviços · 55 min · R$ 80");

    const continueLink = screen.getByRole("link", { name: "Continuar" });
    expect(continueLink.getAttribute("href")).toBe("/novaera/agendar/profissional");
  });

  it("unselects a service on a second click", () => {
    renderSelector();
    const corte = screen.getByRole("checkbox", { name: /Corte de cabelo/ }) as HTMLInputElement;
    fireEvent.click(corte);
    fireEvent.click(corte);
    expect(corte.checked).toBe(false);
    expect(summaryText()).toBe("Selecione ao menos um serviço");
  });

  it("keeps the selection after a reload (sessionStorage)", () => {
    renderSelector();
    fireEvent.click(screen.getByRole("checkbox", { name: /Barba completa/ }));
    cleanup();
    resetBookingDraftCache();

    renderSelector();
    expect((screen.getByRole("checkbox", { name: /Barba completa/ }) as HTMLInputElement).checked).toBe(true);
  });

  it("shows an empty state when the barbershop has no services", () => {
    render(
      <ServiceSelector slug="novaera" catalog={{ categories: [], services: [] }} nextHref="/x" />,
    );
    expect(screen.getByText("Nenhum serviço disponível no momento.")).toBeDefined();
  });
});
