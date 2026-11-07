import { describe, expect, it } from "vitest";
import type { Service } from "@/lib/api/types";
import { formatServiceCount, summarizeServices, toggleServiceId } from "./serviceSelection";

const services: Service[] = [
  { id: "corte", categoryId: "cabelo", name: "Corte de cabelo", durationMinutes: 30, priceCents: 4500, active: true },
  { id: "barba", categoryId: "barba", name: "Barba completa", durationMinutes: 25, priceCents: 3500, active: true },
];

describe("toggleServiceId", () => {
  it("adds a service that was not selected", () => {
    expect(toggleServiceId(["corte"], "barba")).toEqual(["corte", "barba"]);
  });

  it("removes a service that was selected", () => {
    expect(toggleServiceId(["corte", "barba"], "corte")).toEqual(["barba"]);
  });
});

describe("summarizeServices", () => {
  it("adds up count, time and price like the prototype (2 serviços · 55 min · R$ 80)", () => {
    expect(summarizeServices(services, ["corte", "barba"])).toEqual({
      count: 2,
      totalMinutes: 55,
      totalCents: 8000,
    });
  });

  it("is zero when nothing is selected", () => {
    expect(summarizeServices(services, [])).toEqual({ count: 0, totalMinutes: 0, totalCents: 0 });
  });

  it("ignores ids that are no longer in the catalog", () => {
    expect(summarizeServices(services, ["corte", "removido"]).count).toBe(1);
  });
});

describe("formatServiceCount", () => {
  it("uses singular and plural", () => {
    expect(formatServiceCount(1)).toBe("1 serviço");
    expect(formatServiceCount(2)).toBe("2 serviços");
  });
});
