import { describe, expect, it } from "vitest";
import { formatInitials } from "./initials";

describe("formatInitials", () => {
  it.each([
    ["Carlos Andrade", "CA"],
    ["Diego Ibra", "DI"],
    ["Ana Maria Souza", "AS"],
    ["carlos", "CA"],
    ["  Rafael   Alves ", "RA"],
    ["", ""],
  ])("%s → %s", (name, expected) => {
    expect(formatInitials(name)).toBe(expected);
  });
});
