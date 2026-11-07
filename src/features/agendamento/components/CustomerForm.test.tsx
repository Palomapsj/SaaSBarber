import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetBookingDraftCache } from "@/features/agendamento/booking/bookingDraft";
import { CustomerForm } from "./CustomerForm";

const replace = vi.fn();
const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, push }) }));

const previousSteps = {
  serviceIds: ["svc_corte"],
  barber: { kind: "any" },
  date: "2026-09-22",
  startsAt: "2026-09-22T13:00:00Z",
};

function storeDraft(draft: object) {
  sessionStorage.setItem("booking:novaera", JSON.stringify(draft));
}

function renderForm(recurrenceIntervalWeeks: number | null = 3) {
  return render(
    <CustomerForm slug="novaera" recurrenceIntervalWeeks={recurrenceIntervalWeeks} nextHref="/novaera/agendar/confirmar" />,
  );
}

const nameInput = () => screen.getByLabelText("Nome completo") as HTMLInputElement;
const phoneInput = () => screen.getByLabelText("WhatsApp") as HTMLInputElement;
const submit = () => fireEvent.click(screen.getByRole("button", { name: "Revisar agendamento" }));

describe("CustomerForm", () => {
  beforeEach(() => {
    sessionStorage.clear();
    resetBookingDraftCache();
    replace.mockClear();
    push.mockClear();
    storeDraft(previousSteps);
  });
  afterEach(cleanup);

  it("shows no errors before the client interacts", () => {
    renderForm();
    expect(screen.queryByText("Informe seu nome")).toBeNull();
    expect(screen.queryByText("Informe um WhatsApp válido, com DDD")).toBeNull();
  });

  it("shows a field error when leaving it empty", () => {
    renderForm();
    fireEvent.blur(nameInput());
    expect(screen.getByText("Informe seu nome")).toBeDefined();
    expect(nameInput().getAttribute("aria-invalid")).toBe("true");
  });

  it("masks the WhatsApp while typing", () => {
    renderForm();
    fireEvent.change(phoneInput(), { target: { value: "11987654321" } });
    expect(phoneInput().value).toBe("(11) 98765-4321");
  });

  it("removes a digit when the client deletes a mask character", () => {
    renderForm();
    fireEvent.change(phoneInput(), { target: { value: "1198765" } });
    expect(phoneInput().value).toBe("(11) 9876-5");
    fireEvent.change(phoneInput(), { target: { value: "(11) 9876-" } });
    expect(phoneInput().value).toBe("(11) 9876");
  });

  it("blocks submission and focuses the first invalid field", () => {
    renderForm();
    submit();
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByText("Informe seu nome")).toBeDefined();
    expect(screen.getByText("Informe um WhatsApp válido, com DDD")).toBeDefined();
    expect(document.activeElement).toBe(nameInput());
  });

  it("goes to the confirmation when name and WhatsApp are valid", () => {
    renderForm();
    fireEvent.change(nameInput(), { target: { value: "João Silva" } });
    fireEvent.change(phoneInput(), { target: { value: "11987654321" } });
    submit();
    expect(push).toHaveBeenCalledWith("/novaera/agendar/confirmar");
  });

  it("shows the barbershop's repetition interval and saves the choice", () => {
    renderForm(3);
    const checkbox = screen.getByRole("checkbox", { name: /a cada 3 semanas/ }) as HTMLInputElement;
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);
    expect(JSON.parse(sessionStorage.getItem("booking:novaera") ?? "{}").recurring).toBe(true);
  });

  it("hides the repetition when the barbershop does not offer it", () => {
    renderForm(null);
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("keeps what was typed after a reload", () => {
    renderForm();
    fireEvent.change(nameInput(), { target: { value: "João Silva" } });
    cleanup();
    resetBookingDraftCache();
    renderForm();
    expect(nameInput().value).toBe("João Silva");
  });

  it("goes back to the date step when no time was chosen", () => {
    storeDraft({ ...previousSteps, startsAt: null });
    renderForm();
    expect(replace).toHaveBeenCalledWith("/novaera/agendar/data-horario");
  });
});
