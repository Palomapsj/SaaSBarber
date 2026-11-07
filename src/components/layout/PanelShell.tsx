import type { ReactNode } from "react";
import { logout } from "@/app/login/actions";
import { PanelNav } from "@/components/layout/PanelNav";
import { PANEL_NAV, ROLE_LABEL } from "@/components/layout/panelNavigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LogoutIcon } from "@/components/ui/icons/LogoutIcon";
import { ScissorsIcon } from "@/components/ui/icons/ScissorsIcon";
import type { PanelRole } from "@/lib/auth/session";

// Admin and barber areas. Tablet/desktop (≥ 768px): 84px side bar as in the prototype.
// Phones: the same items in a bottom bar; the theme toggle moves to the page header.
export function PanelShell({ role, children }: { role: PanelRole; children: ReactNode }) {
  const items = PANEL_NAV[role];

  return (
    <div className="flex min-h-dvh bg-bg">
      <aside className="sticky top-0 hidden h-dvh w-[84px] shrink-0 flex-col items-center gap-2.5 border-r border-border bg-card py-5 md:flex">
        <div className="mb-1.5 flex size-10 items-center justify-center rounded-[10px] bg-accent text-on-accent">
          <ScissorsIcon size={20} />
        </div>
        <p className="pb-2 text-[9px] font-bold tracking-[0.5px] text-muted uppercase">{ROLE_LABEL[role]}</p>
        <nav aria-label="Menu do painel" className="flex flex-col gap-2.5">
          <PanelNav items={items} variant="side" />
        </nav>
        <div className="flex-1" />
        <ThemeToggle />
        <form action={logout} className="mt-1.5 border-t border-border pt-2.5">
          <button
            type="submit"
            title="Trocar perfil / Sair"
            className="flex w-[60px] flex-col items-center justify-center gap-1 rounded-[14px] py-2 text-[10px] font-semibold text-muted hover:bg-card2 hover:text-text"
          >
            <LogoutIcon size={20} />
            Sair
          </button>
        </form>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-[calc(76px+env(safe-area-inset-bottom))] md:pb-0">{children}</div>

      <nav
        aria-label="Menu do painel"
        className="fixed inset-x-0 bottom-0 z-10 flex gap-1 border-t border-border bg-card px-2 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))] md:hidden"
      >
        <PanelNav items={items} variant="bottom" />
        <form action={logout} className="flex flex-1">
          <button
            type="submit"
            className="flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-[14px] px-1 py-1.5 text-[10px] font-semibold text-muted"
          >
            <LogoutIcon size={20} />
            Sair
          </button>
        </form>
      </nav>
    </div>
  );
}
