"use client";

import { type ReactNode, createContext, use, useState } from "react";
import { getScheduleBarbers } from "@/lib/api/panel/schedules";
import { type ResourceState, useAsyncResource } from "@/lib/hooks/useAsyncResource";

type ScheduleBarber = { id: string; name: string };

type SchedulesState = {
  barbers: ResourceState<ScheduleBarber[]>;
  /** The tab being edited (the first barber until the admin picks another). */
  selected: ScheduleBarber | null;
  select: (id: string) => void;
};

const SchedulesContext = createContext<SchedulesState | null>(null);

// Shares the chosen barber between the header ("Editando: …") and the tabs below it.
export function SchedulesProvider({ children }: { children: ReactNode }) {
  const barbers = useAsyncResource("schedule-barbers", getScheduleBarbers);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const list = barbers.status === "ready" ? barbers.data : [];
  const selected = list.find((b) => b.id === selectedId) ?? list[0] ?? null;

  return <SchedulesContext value={{ barbers, selected, select: setSelectedId }}>{children}</SchedulesContext>;
}

export function useSchedules(): SchedulesState {
  const state = use(SchedulesContext);
  if (!state) throw new Error("useSchedules must be used inside SchedulesProvider");
  return state;
}

/** "Editando: Carlos Andrade" (prototype header). */
export function EditingBarberText() {
  const { selected } = useSchedules();
  return selected ? <>Editando: {selected.name}</> : null;
}
