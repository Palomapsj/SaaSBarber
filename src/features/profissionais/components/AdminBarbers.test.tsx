import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readDb } from "@/server/mock/db";
import { signInForTest } from "@/test/mockApi";
import { BarberCountText, BarbersProvider } from "../BarbersProvider";
import { AdminBarbers } from "./AdminBarbers";

function renderPage() {
  return render(
    <BarbersProvider>
      <p data-testid="count">
        <BarberCountText />
      </p>
      <AdminBarbers />
    </BarbersProvider>,
  );
}

const field = (label: string) => screen.getByLabelText(label) as HTMLInputElement;
const save = () => fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

describe("AdminBarbers", () => {
  beforeEach(async () => {
    await signInForTest("admin");
  });
  afterEach(cleanup);

  it("lists barbers, opens the first one and shows the counts", async () => {
    renderPage();
    expect(await screen.findByRole("button", { name: /Carlos Andrade/ })).toBeDefined();
    expect(screen.getByText("Cabelo · Barba · 40% comissão")).toBeDefined();
    expect(field("Nome completo").value).toBe("Carlos Andrade");
    expect(field("WhatsApp").value).toBe("(11) 91234-5678");
    expect(screen.getByTestId("count").textContent).toBe("3 cadastrados · 3 ativos");
  });

  it("switches a barber off from the list", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("switch", { name: "Diego Ibra ativo" }));
    await screen.findByText("3 cadastrados · 2 ativos");
    expect(readDb().barbers.bs_novaera.find((b) => b.id === "brb_diego")?.active).toBe(false);
  });

  it("shows every field error when saving an empty new barber", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /Novo profissional/ }));
    save();
    expect(screen.getByText("Informe o nome")).toBeDefined();
    expect(screen.getByText("Informe um número de 0 a 100")).toBeDefined();
    expect(screen.getByText("Informe um WhatsApp válido, com DDD")).toBeDefined();
    expect(screen.getByText("Informe um e-mail válido")).toBeDefined();
    expect(screen.getByText("Escolha ao menos um serviço")).toBeDefined();
  });

  it("creates a barber who then appears in the list", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /Novo profissional/ }));
    fireEvent.change(field("Nome completo"), { target: { value: "Bruno Teixeira" } });
    fireEvent.change(field("Comissão (%)"), { target: { value: "30" } });
    fireEvent.change(field("WhatsApp"), { target: { value: "11987650000" } });
    fireEvent.change(field("E-mail"), { target: { value: "bruno@barbearianovaera.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Corte de cabelo" }));
    save();
    expect(await screen.findByText("Profissional cadastrado.")).toBeDefined();
    expect(screen.getByRole("button", { name: /Bruno Teixeira/ })).toBeDefined();
    expect(screen.getByTestId("count").textContent).toBe("4 cadastrados · 4 ativos");
  });

  it("shows the server's message for an e-mail already in use", async () => {
    renderPage();
    await screen.findByRole("button", { name: /Carlos Andrade/ });
    fireEvent.change(field("E-mail"), { target: { value: "rafael@barbearianovaera.com" } });
    save();
    expect(await screen.findByText("Este e-mail já está em uso")).toBeDefined();
  });

  it("asks before removing and explains when it is blocked by future appointments", async () => {
    renderPage();
    await screen.findByRole("button", { name: /Carlos Andrade/ });
    fireEvent.click(screen.getByRole("button", { name: "Remover" }));
    fireEvent.click(screen.getByRole("button", { name: "Sim, remover" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/agendamentos futuros\. Desative-o/);
  });

  it("disables 'Novo profissional' when the plan limit is reached", async () => {
    const db = readDb();
    const [carlos] = db.barbers.bs_novaera;
    db.barbers.bs_novaera.push({ ...carlos, id: "x1", email: "x1@a.com" }, { ...carlos, id: "x2", email: "x2@a.com" });
    renderPage();
    const button = await screen.findByRole("button", { name: /Novo profissional/ });
    expect(button.hasAttribute("disabled")).toBe(true);
    expect(within(button).getByText("Limite do plano atingido (5/5)")).toBeDefined();
  });
});
