import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readDb } from "@/server/mock/db";
import { seededAppointmentsFor } from "@/server/mock/seededAppointments";
import { signInForTest } from "@/test/mockApi";
import { AdminAgenda } from "./AdminAgenda";

const push = vi.fn();
let search = "dia=2026-09-22";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/admin/agenda",
  useSearchParams: () => new URLSearchParams(search),
}));

describe("AdminAgenda", () => {
  beforeEach(async () => {
    localStorage.clear();
    await signInForTest("admin");
    push.mockClear();
    search = "dia=2026-09-22";
  });
  afterEach(cleanup);

  it("shows the day from the address with one column per barber", async () => {
    render(<AdminAgenda barbershopId="bs_novaera" />);
    expect(screen.getByRole("heading", { name: "Terça, 22 de setembro" })).toBeDefined();
    expect(await screen.findByRole("region", { name: "Agenda de Carlos Andrade" })).toBeDefined();
    expect(screen.getByRole("region", { name: "Agenda de Rafael Alves" })).toBeDefined();
    expect(screen.getByRole("region", { name: "Agenda de Diego Ibra" })).toBeDefined();
  });

  it("shows each appointment as a card in its barber's column", async () => {
    render(<AdminAgenda barbershopId="bs_novaera" />);
    const first = seededAppointmentsFor(readDb(), "bs_novaera", "2026-09-22")[0];
    const column = await screen.findByRole("region", { name: `Agenda de ${first.barber.name}` });
    expect(within(column).getAllByText(first.customerName).length).toBeGreaterThan(0);
  });

  it("shows the plan and its barber limit", async () => {
    render(<AdminAgenda barbershopId="bs_novaera" />);
    expect((await screen.findByText(/PLANO PRO/)).textContent).toBe("PLANO PRO · 3/5 profissionais");
  });

  it("moves to the previous and next day through the address", async () => {
    render(<AdminAgenda barbershopId="bs_novaera" />);
    fireEvent.click(screen.getByRole("button", { name: "Próximo dia" }));
    expect(push).toHaveBeenLastCalledWith("/admin/agenda?dia=2026-09-23");
    fireEvent.click(screen.getByRole("button", { name: "Dia anterior" }));
    expect(push).toHaveBeenLastCalledWith("/admin/agenda?dia=2026-09-21");
  });

  it("says when the barbershop is closed", async () => {
    search = "dia=2026-09-27";
    render(<AdminAgenda barbershopId="bs_novaera" />);
    expect(await screen.findByText("Barbearia fechada neste dia.")).toBeDefined();
  });

  it("keeps the week view disabled and marked as in development", () => {
    render(<AdminAgenda barbershopId="bs_novaera" />);
    const week = screen.getByRole("button", { name: /Semana/ });
    expect(week.hasAttribute("disabled")).toBe(true);
    expect(week.textContent).toContain("Em desenvolvimento");
  });
});
