"use client";

import { type ReactNode, createContext, use, useCallback, useEffect, useState } from "react";
import { getPanelServices } from "@/lib/api/panel/services";
import type { PanelServicesPage } from "@/lib/api/types";

type ServicesState =
  | { status: "loading" }
  | { status: "error"; retry: () => void }
  | { status: "ready"; page: PanelServicesPage; reload: () => Promise<void> };

const ServicesContext = createContext<ServicesState | null>(null);

// Shares the services between the page header (counts) and the list/form below it. After a
// change the page is reloaded quietly (no skeleton): categories may appear or disappear.
export function ServicesProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<PanelServicesPage | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    getPanelServices().then(
      (data) => {
        if (active) setPage(data);
      },
      () => {
        if (active) setFailed(true);
      },
    );
    return () => {
      active = false;
    };
  }, [attempt]);

  const reload = useCallback(async () => {
    setPage(await getPanelServices());
  }, []);

  const retry = () => {
    setFailed(false);
    setAttempt((n) => n + 1);
  };

  const state: ServicesState = page
    ? { status: "ready", page, reload }
    : failed
      ? { status: "error", retry }
      : { status: "loading" };

  return <ServicesContext value={state}>{children}</ServicesContext>;
}

export function useServices(): ServicesState {
  const state = use(ServicesContext);
  if (!state) throw new Error("useServices must be used inside ServicesProvider");
  return state;
}

/** "4 cadastrados · 3 ativos" (prototype header). */
export function ServiceCountText() {
  const state = useServices();
  if (state.status !== "ready") return null;
  const { services } = state.page;
  const active = services.filter((s) => s.active).length;
  return (
    <>
      {services.length} {services.length === 1 ? "cadastrado" : "cadastrados"} · {active} {active === 1 ? "ativo" : "ativos"}
    </>
  );
}
