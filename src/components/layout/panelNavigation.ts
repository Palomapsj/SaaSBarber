import type { PanelRole } from "@/lib/auth/session";

export type PanelNavIcon = "calendar" | "users" | "tag" | "clock";
export type PanelNavItem = { href: string; label: string; icon: PanelNavIcon };

// Side bar items per role (prototype: admin/*.html has 4, barbeiro/*.html has 3).
export const PANEL_NAV: Record<PanelRole, PanelNavItem[]> = {
  admin: [
    { href: "/admin/agenda", label: "Agenda", icon: "calendar" },
    { href: "/admin/profissionais", label: "Profissionais", icon: "users" },
    { href: "/admin/servicos", label: "Serviços", icon: "tag" },
    { href: "/admin/horarios", label: "Horários", icon: "clock" },
  ],
  barber: [
    { href: "/barbeiro/agenda", label: "Agenda", icon: "calendar" },
    { href: "/barbeiro/horarios", label: "Meus horários", icon: "clock" },
    { href: "/barbeiro/servicos", label: "Meus serviços", icon: "tag" },
  ],
};

export const ROLE_LABEL: Record<PanelRole, string> = { admin: "Admin", barber: "Barbeiro" };
