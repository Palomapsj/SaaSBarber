import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { qualifiedBarbers } from "@/server/mock/catalog";
import { readDb, updateDb } from "@/server/mock/db";
import { setServiceActive } from "@/server/mock/panelServices";
import { signInForTest } from "@/test/mockApi";
import { BarberServices } from "./BarberServices";

const toggle = (name: string) => screen.getByRole("switch", { name: `Eu atendo ${name}` }) as HTMLButtonElement;
const isOn = (name: string) => toggle(name).getAttribute("aria-checked") === "true";
const barbersFor = (serviceId: string) => qualifiedBarbers(readDb(), "bs_novaera", [serviceId]).map((b) => b.name);

describe("BarberServices", () => {
  beforeEach(async () => {
    await signInForTest("barber");
  });
  afterEach(cleanup);

  it("lists the services by category with duration and price, marking the ones Carlos performs", async () => {
    render(<BarberServices />);
    const cabelo = await screen.findByRole("region", { name: "Cabelo" });
    expect(within(cabelo).getByText("Cabelo · 30 min · R$ 45")).toBeDefined();
    expect(screen.getByRole("region", { name: "Barba" })).toBeDefined();
    expect([isOn("Corte de cabelo"), isOn("Corte + Sobrancelha"), isOn("Barba completa"), isOn("Barboterapia")]).toEqual([
      true,
      false,
      true,
      false,
    ]);
  });

  it("saves a change right away, so clients can book Carlos for it", async () => {
    render(<BarberServices />);
    await screen.findByRole("region", { name: "Cabelo" });
    fireEvent.click(toggle("Barboterapia"));
    expect(isOn("Barboterapia")).toBe(true);
    await waitFor(() => expect(barbersFor("svc_barboterapia")).toContain("Carlos Andrade"));

    fireEvent.click(toggle("Corte de cabelo"));
    await waitFor(() => expect(barbersFor("svc_corte")).not.toContain("Carlos Andrade"));
    expect(isOn("Corte de cabelo")).toBe(false);
  });

  it("locks the last service with an explanation", async () => {
    render(<BarberServices />);
    await screen.findByRole("region", { name: "Cabelo" });
    fireEvent.click(toggle("Corte de cabelo"));
    // Every switch waits while a change is saving; once saved only the last one stays locked.
    await waitFor(() => expect(toggle("Corte de cabelo").disabled).toBe(false));
    expect(toggle("Barba completa").disabled).toBe(true);
    expect(screen.getByText("Você precisa atender pelo menos um serviço.")).toBeDefined();
  });

  it("puts the switch back and shows an error when the API refuses", async () => {
    render(<BarberServices />);
    await screen.findByRole("region", { name: "Cabelo" });
    updateDb((db) => setServiceActive(db, "bs_novaera", "svc_barboterapia", false));
    fireEvent.click(toggle("Barboterapia"));
    expect(await screen.findByRole("alert")).toHaveProperty("textContent", "Não foi possível alterar. Tente novamente.");
    expect(isOn("Barboterapia")).toBe(false);
  });

  it("shows a message when the barbershop has no active services", async () => {
    for (const id of ["svc_corte", "svc_corte_sobrancelha", "svc_barba", "svc_barboterapia"]) {
      updateDb((db) => setServiceActive(db, "bs_novaera", id, false));
    }
    render(<BarberServices />);
    expect(await screen.findByText(/ainda não tem serviços ativos/)).toBeDefined();
  });
});
