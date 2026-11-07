import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PANEL_NAV } from "./panelNavigation";
import { PanelNav } from "./PanelNav";

let pathname = "/admin/agenda";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

describe("PanelNav", () => {
  afterEach(cleanup);

  it("shows the admin's four items and marks the current page", () => {
    pathname = "/admin/servicos";
    render(<PanelNav items={PANEL_NAV.admin} variant="side" />);
    expect(screen.getAllByRole("link")).toHaveLength(4);
    expect(screen.getByRole("link", { name: "Serviços" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Agenda" }).getAttribute("aria-current")).toBeNull();
  });

  it("shows the barber's three items with labels in the bottom bar", () => {
    pathname = "/barbeiro/agenda";
    render(<PanelNav items={PANEL_NAV.barber} variant="bottom" />);
    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual([
      "Agenda",
      "Meus horários",
      "Meus serviços",
    ]);
  });
});
