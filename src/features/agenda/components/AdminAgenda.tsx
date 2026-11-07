"use client";

import { AgendaGrid } from "@/features/agenda/components/AgendaGrid";
import { DayNavigator } from "@/features/agenda/components/DayNavigator";
import { useAgendaDate } from "@/features/agenda/hooks/useAgendaDate";
import { getAgendaDay } from "@/lib/api/panel/agenda";
import { useAsyncResource } from "@/lib/hooks/useAsyncResource";

// "Agenda geral" (prototype: admin/agenda.html).
export function AdminAgenda({ barbershopId }: { barbershopId: string }) {
  const { date, goTo } = useAgendaDate();
  const agenda = useAsyncResource(`${barbershopId}|${date}`, () => getAgendaDay(date));

  return (
    <div className="flex flex-col gap-4 px-5 py-6 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DayNavigator date={date} onChange={goTo} />
        <div className="flex flex-wrap items-center gap-2.5">
          {agenda.status === "ready" && (
            <span className="rounded-full bg-accent-soft px-3 py-1.5 text-[12px] font-bold text-accent">
              PLANO {agenda.data.plan.name.toUpperCase()} · {agenda.data.plan.barberCount}/{agenda.data.plan.maxBarbers}{" "}
              profissionais
            </span>
          )}
          {/* Kept together so "Dia" and "Semana" never end up on different lines on phones. */}
          <div className="flex items-center gap-2.5">
            <button type="button" aria-pressed="true" className="rounded-lg bg-accent px-4 py-2 text-[12px] font-bold text-on-accent">
              Dia
            </button>
            <button
              type="button"
              disabled
              className="flex cursor-not-allowed items-center gap-2 rounded-lg border border-border px-4 py-2 text-[12px] font-semibold text-muted2"
            >
              Semana
              <span className="rounded-full bg-card2 px-1.5 py-0.5 text-[9px] font-bold tracking-[0.5px] text-muted uppercase">
                Em desenvolvimento
              </span>
            </button>
          </div>
        </div>
      </div>

      {agenda.status === "error" ? (
        <p className="text-[13px] text-muted">
          Não foi possível carregar a agenda.{" "}
          <button type="button" onClick={agenda.retry} className="font-semibold text-accent">
            Tentar novamente
          </button>
        </p>
      ) : agenda.status !== "ready" ? (
        <div role="status" aria-label="Carregando agenda" className="h-[560px] animate-pulse rounded-[14px] bg-card" />
      ) : agenda.data.hours === null ? (
        <p className="rounded-[14px] border border-border bg-card px-4 py-6 text-center text-[13px] text-muted">
          Barbearia fechada neste dia.
        </p>
      ) : agenda.data.barbers.length === 0 ? (
        <p className="text-[13px] text-muted">Nenhum profissional ativo.</p>
      ) : (
        <AgendaGrid day={{ ...agenda.data, hours: agenda.data.hours }} />
      )}
    </div>
  );
}
