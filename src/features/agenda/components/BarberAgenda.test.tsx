import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readDb } from "@/server/mock/db";
import { seededAppointmentsFor } from "@/server/mock/seededAppointments";
import { signInForTest } from "@/test/mockApi";
import { BarberAgenda } from "./BarberAgenda";

const push = vi.fn();
let search = "dia=2026-09-22";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/barbeiro/agenda",
  useSearchParams: () => new URLSearchParams(search),
}));

const carlosOn = (date: string) => seededAppointmentsFor(readDb(), "bs_novaera", date).filter((a) => a.barber.id === "brb_carlos");

describe("BarberAgenda", () => {
  beforeEach(async () => {
    localStorage.clear();
    await signInForTest("barber");
    push.mockClear();
    search = "dia=2026-09-22";
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("lists the barber's appointments in a timeline with a count", async () => {
    render(<BarberAgenda barbershopId="bs_novaera" barberId="brb_carlos" />);
    const expected = carlosOn("2026-09-22");
    const items = await screen.findAllByRole("listitem");
    expect(items).toHaveLength(expected.length);
    expect(within(items[0]).getByText(expected[0].customerName)).toBeDefined();
    const noun = expected.length === 1 ? "agendamento" : "agendamentos";
    expect(screen.getByText(`${expected.length} ${noun}`)).toBeDefined();
  });

  it("marks finished, current and upcoming appointments from the clock", async () => {
    const expected = carlosOn("2026-09-22");
    if (expected.length < 2) throw new Error("test setup: needs two appointments");
    // "Now" is right in the middle of the second appointment.
    const second = new Date(expected[1].startsAt).getTime();
    vi.useFakeTimers({ toFake: ["Date"], now: second + 5 * 60_000 });

    render(<BarberAgenda barbershopId="bs_novaera" barberId="brb_carlos" />);
    const items = await screen.findAllByRole("listitem");
    expect(within(items[0]).getByText("Concluído")).toBeDefined();
    expect(within(items[1]).getByText("Em andamento")).toBeDefined();
    expect(items[1].getAttribute("aria-current")).toBe("time");
    if (items[2]) expect(within(items[2]).getByText("Confirmado")).toBeDefined();
  });

  it("says when the barbershop is closed", async () => {
    search = "dia=2026-09-27";
    render(<BarberAgenda barbershopId="bs_novaera" barberId="brb_carlos" />);
    expect(await screen.findByText("Barbearia fechada neste dia.")).toBeDefined();
  });

  it("moves between days through the address", () => {
    render(<BarberAgenda barbershopId="bs_novaera" barberId="brb_carlos" />);
    fireEvent.click(screen.getByRole("button", { name: "Próximo dia" }));
    expect(push).toHaveBeenLastCalledWith("/barbeiro/agenda?dia=2026-09-23");
  });
});
