import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readDb } from "@/server/mock/db";
import { signInForTest } from "@/test/mockApi";
import { AdminSchedules } from "./AdminSchedules";
import { ScheduleEditor } from "./ScheduleEditor";
import { SchedulesProvider } from "@/features/horarios/SchedulesProvider";

const field = (name: string) => screen.getByLabelText(name) as HTMLInputElement;
const setValue = (name: string, value: string) => fireEvent.change(field(name), { target: { value } });
const save = () => fireEvent.click(screen.getByRole("button", { name: "Salvar horários" }));

describe("ScheduleEditor (Meus horários)", () => {
  beforeEach(async () => {
    // Monday, 21 Sep 2026, 10:00 in São Paulo: sample appointments exist later in the week.
    vi.useFakeTimers({ now: new Date("2026-09-21T13:00:00Z"), toFake: ["Date"] });
    await signInForTest("barber");
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("shows the week from Monday with the default hours and Sunday off", async () => {
    render(<ScheduleEditor owner="me" weeklyTitle="Meu horário semanal" />);
    expect(await screen.findByText("Meu horário semanal")).toBeDefined();
    expect(field("Segunda: início").value).toBe("09:00");
    expect(field("Segunda: fim do intervalo").value).toBe("13:00");
    expect(screen.getByRole("switch", { name: "Trabalha domingo" }).getAttribute("aria-checked")).toBe("false");
    expect(screen.getByText("Folga")).toBeDefined();
  });

  it("keeps changes on screen until saved, refusing hours outside the barbershop's", async () => {
    render(<ScheduleEditor owner="me" weeklyTitle="Meu horário semanal" />);
    await screen.findByText("Meu horário semanal");
    setValue("Terça: início", "08:00");
    expect(screen.getByText("Alterações não salvas.")).toBeDefined();
    save();
    expect(await screen.findByText("Terça: Fora do horário da barbearia (09h às 20h)")).toBeDefined();
    expect(document.activeElement).toBe(field("Terça: início"));
    expect(readDb().schedules).toBeUndefined();
  });

  it("saves and warns when booked appointments fall outside the new hours", async () => {
    render(<ScheduleEditor owner="me" weeklyTitle="Meu horário semanal" />);
    await screen.findByText("Meu horário semanal");
    fireEvent.click(screen.getByRole("switch", { name: "Trabalha terça" }));
    save();
    expect(await screen.findByText(/ficaram? fora do horário de trabalho/)).toBeDefined();
    expect(readDb().schedules?.brb_carlos.find((d) => d.weekday === 2)?.working).toBe(false);
  });

  it("adds a block of some hours and removes it", async () => {
    render(<ScheduleEditor owner="me" weeklyTitle="Meu horário semanal" />);
    await screen.findByText("Meu horário semanal");
    fireEvent.click(screen.getByRole("button", { name: /Adicionar bloqueio/ }));
    const form = screen.getByRole("form", { name: "Novo bloqueio" });
    fireEvent.click(within(form).getByRole("radio", { name: "Algumas horas" }));
    fireEvent.click(within(form).getByRole("button", { name: "Salvar bloqueio" }));
    expect(within(form).getByText("O fim precisa ser depois do início")).toBeDefined();
    expect(within(form).getByText("Informe o motivo")).toBeDefined();

    setValue("Dia", "2026-09-22");
    setValue("Das", "15:00");
    setValue("Às", "16:00");
    setValue("Motivo", "Consulta médica");
    fireEvent.click(within(form).getByRole("button", { name: "Salvar bloqueio" }));
    const remove = await screen.findByRole("button", { name: "Remover bloqueio Ter 22 set · 15:00–16:00" });
    expect(screen.getByText("Consulta médica")).toBeDefined();
    expect(readDb().scheduleBlocks).toHaveLength(1);

    fireEvent.click(remove);
    await waitFor(() => expect(readDb().scheduleBlocks).toEqual([]));
    expect(screen.queryByText("Consulta médica")).toBeNull();
  });
});

describe("AdminSchedules (Horários)", () => {
  beforeEach(async () => {
    await signInForTest("admin");
  });
  afterEach(cleanup);

  const renderAdmin = () =>
    render(
      <SchedulesProvider>
        <AdminSchedules />
      </SchedulesProvider>,
    );

  it("has a tab per barber and edits the chosen one", async () => {
    renderAdmin();
    const rafael = await screen.findByRole("tab", { name: "Rafael Alves" });
    expect(screen.getByRole("tab", { name: "Carlos Andrade" }).getAttribute("aria-selected")).toBe("true");
    fireEvent.click(rafael);
    expect(await screen.findByRole("tabpanel", { name: "Horários de Rafael Alves" })).toBeDefined();
    await screen.findByText("Horário semanal");
    setValue("Sábado: fim", "18:00");
    save();
    await screen.findByText(/Horários salvos|fora do horário de trabalho/);
    expect(readDb().schedules?.brb_rafael.find((d) => d.weekday === 6)?.end).toBe("18:00");
  });

  it("asks before switching tabs with unsaved changes", async () => {
    renderAdmin();
    await screen.findByText("Horário semanal");
    setValue("Segunda: fim", "18:00");
    fireEvent.click(screen.getByRole("tab", { name: "Diego Ibra" }));
    expect(screen.getByRole("alert").textContent).toContain("alterações não salvas");
    fireEvent.click(screen.getByRole("button", { name: "Continuar editando" }));
    expect(field("Segunda: fim").value).toBe("18:00");

    fireEvent.click(screen.getByRole("tab", { name: "Diego Ibra" }));
    fireEvent.click(screen.getByRole("button", { name: "Descartar e trocar" }));
    expect(await screen.findByRole("tabpanel", { name: "Horários de Diego Ibra" })).toBeDefined();
  });
});
