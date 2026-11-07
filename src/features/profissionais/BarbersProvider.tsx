"use client";

import { type ReactNode, createContext, use, useCallback, useEffect, useState } from "react";
import { getPanelBarbers } from "@/lib/api/panel/barbers";
import type { PanelBarber, PanelBarbersPage } from "@/lib/api/types";

type BarbersState =
  | { status: "loading" }
  | { status: "error"; retry: () => void }
  | { status: "ready"; page: PanelBarbersPage; upsert: (barber: PanelBarber) => void; remove: (id: string) => void };

const BarbersContext = createContext<BarbersState | null>(null);

// Shares the barbers between the page header (counts) and the list/form below it.
// Changes are applied locally with what the API returns, without reloading the whole page.
export function BarbersProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<PanelBarbersPage | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    getPanelBarbers().then(
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

  const upsert = useCallback((barber: PanelBarber) => {
    setPage((current) => {
      if (!current) return current;
      const exists = current.barbers.some((b) => b.id === barber.id);
      return {
        ...current,
        barbers: exists ? current.barbers.map((b) => (b.id === barber.id ? barber : b)) : [...current.barbers, barber],
      };
    });
  }, []);

  const remove = useCallback((id: string) => {
    setPage((current) => (current ? { ...current, barbers: current.barbers.filter((b) => b.id !== id) } : current));
  }, []);

  const retry = () => {
    setFailed(false);
    setAttempt((n) => n + 1);
  };

  const state: BarbersState = page
    ? { status: "ready", page, upsert, remove }
    : failed
      ? { status: "error", retry }
      : { status: "loading" };

  return <BarbersContext value={state}>{children}</BarbersContext>;
}

export function useBarbers(): BarbersState {
  const state = use(BarbersContext);
  if (!state) throw new Error("useBarbers must be used inside BarbersProvider");
  return state;
}

/** "3 cadastrados · 2 ativos" (prototype header). */
export function BarberCountText() {
  const state = useBarbers();
  if (state.status !== "ready") return null;
  const { barbers } = state.page;
  const active = barbers.filter((b) => b.active).length;
  return (
    <>
      {barbers.length} {barbers.length === 1 ? "cadastrado" : "cadastrados"} · {active} {active === 1 ? "ativo" : "ativos"}
    </>
  );
}
