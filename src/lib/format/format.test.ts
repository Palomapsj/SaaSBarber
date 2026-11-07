import { describe, expect, it } from "vitest";
import { formatAddressLine } from "./address";
import { formatCurrency } from "./currency";
import {
  formatCompactDate,
  formatDayChip,
  formatLongDate,
  formatMonth,
  formatShortDate,
  formatTime,
  localDateOf,
} from "./date";
import { formatDuration } from "./duration";
import { formatOpeningHours } from "./openingHours";
import { formatPhone, formatPhoneInput } from "./phone";

// Intl uses a non-breaking space between "R$" and the number.
const nbsp = (text: string) => text.replace(/ /g, " ");

describe("formatCurrency", () => {
  it("hides cents when the value is whole, like the prototype", () => {
    expect(formatCurrency(4500)).toBe(nbsp("R$ 45"));
    expect(formatCurrency(8000)).toBe(nbsp("R$ 80"));
  });

  it("shows cents when there are any", () => {
    expect(formatCurrency(4550)).toBe(nbsp("R$ 45,50"));
  });

  it("uses a thousands separator", () => {
    expect(formatCurrency(150000)).toBe(nbsp("R$ 1.500"));
  });
});

describe("formatDuration", () => {
  it.each([
    [55, "55 min"],
    [60, "1h"],
    [90, "1h 30 min"],
  ])("%i minutes → %s", (minutes, expected) => {
    expect(formatDuration(minutes)).toBe(expected);
  });
});

describe("formatPhone", () => {
  it("formats mobile and landline numbers", () => {
    expect(formatPhone("11987654321")).toBe("(11) 98765-4321");
    expect(formatPhone("1134567890")).toBe("(11) 3456-7890");
  });

  it("ignores punctuation in the input", () => {
    expect(formatPhone("(11) 98765 4321")).toBe("(11) 98765-4321");
  });

  it("returns unknown formats unchanged", () => {
    expect(formatPhone("123")).toBe("123");
  });
});

describe("formatPhoneInput (mask while typing)", () => {
  it.each([
    ["", ""],
    ["1", "(1"],
    ["11", "(11"],
    ["119", "(11) 9"],
    ["119876", "(11) 9876"],
    ["1198765", "(11) 9876-5"],
    ["1134567890", "(11) 3456-7890"],
    ["11987654321", "(11) 98765-4321"],
    ["119876543210000", "(11) 98765-4321"],
  ])("%s → %s", (digits, expected) => {
    expect(formatPhoneInput(digits)).toBe(expected);
  });
});

describe("date formatting in America/Sao_Paulo", () => {
  // 13:00 UTC = 10:00 in São Paulo (UTC-3).
  const appointment = "2026-09-22T13:00:00Z";

  it("formats the time in the barbershop time zone", () => {
    expect(formatTime(appointment)).toBe("10:00");
  });

  it("formats the short date like 'Ter, 22 set'", () => {
    expect(formatShortDate(appointment)).toBe("Ter, 22 set");
  });

  it("formats the long date like 'Terça, 22 de setembro'", () => {
    expect(formatLongDate(appointment)).toBe("Terça, 22 de setembro");
  });

  it("uses the São Paulo day, not the UTC day", () => {
    // 01:00 UTC on the 23rd is still 22:00 on the 22nd in São Paulo.
    expect(formatLongDate("2026-09-23T01:00:00Z")).toBe("Terça, 22 de setembro");
  });

  it("handles Saturday's accent", () => {
    expect(formatShortDate("2026-09-26T13:00:00Z")).toBe("Sáb, 26 set");
  });

  it("formats the compact date used under Continuar", () => {
    expect(formatCompactDate(appointment)).toBe("Ter 22 set");
  });

  it("accepts calendar dates (YYYY-MM-DD) as well as timestamps", () => {
    expect(formatLongDate("2026-09-22")).toBe("Terça, 22 de setembro");
    expect(formatMonth("2026-09-22")).toBe("Setembro");
    expect(formatDayChip("2026-09-21")).toEqual({ weekday: "Seg", day: "21" });
  });

  it("gives the São Paulo calendar day of an instant", () => {
    expect(localDateOf("2026-09-23T01:00:00Z")).toBe("2026-09-22");
    expect(localDateOf(new Date("2026-09-23T03:00:00Z"))).toBe("2026-09-23");
  });
});

describe("formatOpeningHours", () => {
  const day = (weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6, opens = "09:00", closes = "20:00") => ({ weekday, opens, closes });

  it("groups consecutive days with the same hours", () => {
    const monToSat = ([1, 2, 3, 4, 5, 6] as const).map((weekday) => day(weekday));
    expect(formatOpeningHours(monToSat)).toBe("Seg–Sáb · 09h às 20h");
  });

  it("splits groups when hours differ", () => {
    const hours = [day(1), day(2), day(3), day(4), day(5), day(6, "09:00", "14:30")];
    expect(formatOpeningHours(hours)).toBe("Seg–Sex · 09h às 20h, Sáb · 09h às 14h30");
  });

  it("splits groups when a day in the middle is closed", () => {
    const hours = [day(1), day(2), day(4), day(5)];
    expect(formatOpeningHours(hours)).toBe("Seg–Ter · 09h às 20h, Qui–Sex · 09h às 20h");
  });

  it("lists Sunday last", () => {
    expect(formatOpeningHours([day(0), day(6)])).toBe("Sáb–Dom · 09h às 20h");
  });
});

describe("formatAddressLine", () => {
  it("joins street, number and district like the prototype", () => {
    expect(
      formatAddressLine({ street: "Rua das Tesouras", number: "123", district: "Vila Nova", city: "São Paulo", state: "SP" }),
    ).toBe("Rua das Tesouras, 123 · Vila Nova");
  });
});
