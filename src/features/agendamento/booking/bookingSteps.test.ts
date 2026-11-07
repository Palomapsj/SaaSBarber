import { describe, expect, it } from "vitest";
import { type BookingDraft, EMPTY_DRAFT } from "./bookingDraft";
import { firstMissingStep } from "./bookingSteps";

const complete: BookingDraft = {
  serviceIds: ["svc_corte"],
  barber: { kind: "any" },
  date: "2026-09-22",
  startsAt: "2026-09-22T13:00:00Z",
  customerName: "João Silva",
  customerPhone: "11987654321",
  recurring: false,
};

describe("firstMissingStep", () => {
  it("never blocks the first step", () => {
    expect(firstMissingStep(EMPTY_DRAFT, "servicos")).toBeNull();
  });

  it("points to the earliest incomplete step", () => {
    expect(firstMissingStep(EMPTY_DRAFT, "confirmar")).toBe("servicos");
    expect(firstMissingStep({ ...complete, barber: null }, "dados")).toBe("profissional");
    expect(firstMissingStep({ ...complete, startsAt: null }, "dados")).toBe("data-horario");
    expect(firstMissingStep({ ...complete, customerPhone: "119" }, "confirmar")).toBe("dados");
  });

  it("ignores later steps", () => {
    expect(firstMissingStep({ ...complete, startsAt: null }, "data-horario")).toBeNull();
  });

  it("lets a complete draft reach the confirmation", () => {
    expect(firstMissingStep(complete, "confirmar")).toBeNull();
  });
});
