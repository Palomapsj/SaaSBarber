"use client";

import { useCallback, useState } from "react";
import { useSchedules } from "@/features/horarios/SchedulesProvider";
import { ScheduleEditor } from "./ScheduleEditor";

// Prototype: admin/horarios.html. One tab per barber; switching with unsaved hours asks first
// (decision: changes only count after "Salvar horários").
export function AdminSchedules() {
  const { barbers, selected, select } = useSchedules();
  const [dirty, setDirty] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const onDirtyChange = useCallback((value: boolean) => setDirty(value), []);

  if (barbers.status === "loading" || barbers.status === "idle") {
    return <div role="status" aria-label="Carregando" className="m-5 h-[480px] animate-pulse rounded-2xl bg-card md:m-8" />;
  }
  if (barbers.status === "error") {
    return (
      <p className="px-5 py-6 text-[13px] text-muted md:px-8">
        Não foi possível carregar os profissionais.{" "}
        <button type="button" onClick={barbers.retry} className="font-semibold text-accent">Tentar novamente</button>
      </p>
    );
  }
  if (!selected) {
    return <p className="px-5 py-6 text-[13px] text-muted md:px-8">Cadastre um profissional para definir os horários.</p>;
  }

  const pending = barbers.data.find((b) => b.id === pendingId);
  const switchTo = (id: string) => {
    setPendingId(null);
    setDirty(false);
    select(id);
  };

  return (
    <div className="flex flex-col gap-5 px-5 py-6 md:px-8">
      <div role="tablist" aria-label="Profissional" className="-mx-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0">
        {barbers.data.map((barber) => {
          const current = barber.id === selected.id;
          return (
            <button key={barber.id} type="button" role="tab" aria-selected={current}
              onClick={() => (current ? null : dirty ? setPendingId(barber.id) : switchTo(barber.id))}
              className={`shrink-0 rounded-[9px] px-4 py-[9px] text-[12px] font-bold ${current ? "bg-accent text-on-accent" : "bg-card text-muted"}`}>
              {barber.name}
            </button>
          );
        })}
      </div>

      {pending && (
        <div role="alert" className="flex flex-col gap-3 rounded-[10px] border border-border bg-card2 p-4 md:flex-row md:items-center md:justify-between">
          <p className="text-[13px] text-text">
            Os horários de {selected.name} têm alterações não salvas. Trocar para {pending.name} descarta essas alterações.
          </p>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={() => setPendingId(null)}
              className="flex-1 rounded-[10px] border border-border px-4 py-2.5 text-[13px] font-semibold text-text md:flex-none">
              Continuar editando
            </button>
            <button type="button" onClick={() => switchTo(pending.id)}
              className="flex-1 rounded-[10px] bg-accent px-4 py-2.5 text-[13px] font-semibold text-on-accent md:flex-none">
              Descartar e trocar
            </button>
          </div>
        </div>
      )}

      <div role="tabpanel" aria-label={`Horários de ${selected.name}`}>
        <ScheduleEditor key={selected.id} owner={{ barberId: selected.id }} weeklyTitle="Horário semanal" onDirtyChange={onDirtyChange} />
      </div>
    </div>
  );
}
