import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readDb } from "@/server/mock/db";
import { signInForTest } from "@/test/mockApi";
import { ServiceCountText, ServicesProvider } from "../ServicesProvider";
import { AdminServices } from "./AdminServices";

function renderPage() {
  return render(
    <ServicesProvider>
      <p data-testid="count">
        <ServiceCountText />
      </p>
      <AdminServices />
    </ServicesProvider>,
  );
}

const field = (label: string) => screen.getByLabelText(label) as HTMLInputElement;
const save = () => fireEvent.click(screen.getByRole("button", { name: "Salvar serviço" }));

describe("AdminServices", () => {
  beforeEach(async () => {
    await signInForTest("admin");
  });
  afterEach(cleanup);

  it("lists services by category with price and starts on 'Novo serviço'", async () => {
    renderPage();
    const cabelo = await screen.findByRole("region", { name: "Cabelo" });
    expect(within(cabelo).getByText("Corte de cabelo")).toBeDefined();
    expect(within(cabelo).getByText("Cabelo · 30 min")).toBeDefined();
    expect(screen.getByRole("heading", { name: "Novo serviço" })).toBeDefined();
    expect(screen.getByTestId("count").textContent).toBe("4 cadastrados · 4 ativos");
  });

  it("loads a service into the form with the pencil and saves a new price", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Editar Barboterapia" }));
    expect(screen.getByRole("heading", { name: "Editar serviço" })).toBeDefined();
    expect(field("Preço (R$)").value).toBe("50");
    fireEvent.change(field("Preço (R$)"), { target: { value: "52,50" } });
    save();
    expect(await screen.findByText("Alterações salvas.")).toBeDefined();
    expect(screen.getByText("R$ 52,50")).toBeDefined();
  });

  it("creates a service in a new category and warns when nobody performs it", async () => {
    renderPage();
    await screen.findByRole("region", { name: "Cabelo" });
    fireEvent.change(field("Nome do serviço"), { target: { value: "Hidratação" } });
    fireEvent.change(field("Categoria"), { target: { value: "Tratamentos" } });
    fireEvent.change(field("Duração (min)"), { target: { value: "20" } });
    fireEvent.change(field("Preço (R$)"), { target: { value: "30" } });
    expect(screen.getByText(/Nenhum profissional atende este serviço/)).toBeDefined();
    save();
    expect(await screen.findByRole("region", { name: "Tratamentos" })).toBeDefined();
    expect(screen.getByTestId("count").textContent).toBe("5 cadastrados · 5 ativos");
  });

  it("shows field errors for an empty form", async () => {
    renderPage();
    await screen.findByRole("region", { name: "Cabelo" });
    save();
    expect(screen.getByText("Informe o nome do serviço")).toBeDefined();
    expect(screen.getByText("Informe a categoria")).toBeDefined();
    expect(screen.getByText("Informe de 5 a 240 minutos")).toBeDefined();
    expect(screen.getByText("Informe um preço válido")).toBeDefined();
  });

  it("switches a service off from the list", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("switch", { name: "Barboterapia ativo" }));
    await screen.findByText("4 cadastrados · 3 ativos");
    expect(readDb().services.bs_novaera.find((s) => s.id === "svc_barboterapia")?.active).toBe(false);
  });

  it("goes back to 'Novo serviço' on Cancelar", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Editar Corte de cabelo" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByRole("heading", { name: "Novo serviço" })).toBeDefined();
    expect(field("Nome do serviço").value).toBe("");
  });
});
