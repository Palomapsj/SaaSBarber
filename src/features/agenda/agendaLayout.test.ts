import { describe, expect, it } from "vitest";
import { HOUR_HEIGHT, eventBox, gridHours } from "./agendaLayout";

describe("gridHours", () => {
  it("lists every hour from opening to closing", () => {
    expect(gridHours("09:00", "20:00")).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
  });

  it("includes a partial last hour", () => {
    expect(gridHours("09:00", "18:30")).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17, 18]);
  });
});

describe("eventBox", () => {
  // 10:30 in São Paulo.
  const startsAt = "2026-09-22T13:30:00Z";

  it("places the card proportionally to its start time", () => {
    expect(eventBox(startsAt, 60, 9).top).toBe(1.5 * HOUR_HEIGHT + 2);
  });

  it("sizes the card proportionally to its duration, leaving a small gap", () => {
    expect(eventBox(startsAt, 60, 9).height).toBe(HOUR_HEIGHT - 4);
  });

  it("keeps very short appointments readable", () => {
    expect(eventBox(startsAt, 10, 9).height).toBe(28);
  });
});
