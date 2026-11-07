"use client";

import { useEffect, useState } from "react";
import { appointmentCountLabel } from "@/features/agenda/barberTimeline";
import { BarberTimeline } from "@/features/agenda/components/BarberTimeline";
import { DayNavigator } from "@/features/agenda/components/DayNavigator";
import { useAgendaDate } from "@/features/agenda/hooks/useAgendaDate";
import { getBarberAgendaDay } from "@/lib/api/panel/agenda";
import { useAsyncResource } from "@/lib/hooks/useAsyncResource";

const CLOCK_TICK_MS = 60_000;

type BarberAgendaProps = {
  barbershopId: string;
  /** Always from the session: a barber only ever sees their own agenda. */
  barberId: string;
};

// The barber's day (prototype: barbeiro/agenda.html). Statuses follow the clock, so the
// "now" is refreshed every minute.
export function BarberAgenda({ barbershopId, barberId }: BarberAgendaProps) {
  const { date, isToday, goTo } = useAgendaDate();
  const [now, setNow] = useState(() => new Date());
  const agenda = useAsyncResource(`${barbershopId}|${barberId}|${date}`, () => getBarberAgendaDay(date));

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), CLOCK_TICK_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col gap-4 px-5 py-6 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DayNavigator date={date} onChange={goTo} />
        {agenda.status === "ready" && agenda.data.hours !== null && (
          <span className="rounded-full bg-success-soft px-3.5 py-1.5 text-[12px] font-bold text-success">
            {appointmentCountLabel(agenda.data.appointments.length, isToday)}
          </span>
        )}
      </div>

      {agenda.status === "error" ? (
        <p className="text-[13px] text-muted">
          Não foi possível carregar sua agenda.{" "}
          <button type="button" onClick={agenda.retry} className="font-semibold text-accent">
            Tentar novamente
          </button>
        </p>
      ) : agenda.status !== "ready" ? (
        <div role="status" aria-label="Carregando agenda" className="flex animate-pulse flex-col gap-3.5">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="ml-[72px] h-[62px] rounded-[14px] bg-card" />
          ))}
        </div>
      ) : agenda.data.hours === null ? (
        <p className="rounded-[14px] border border-border bg-card px-4 py-6 text-center text-[13px] text-muted">
          Barbearia fechada neste dia.
        </p>
      ) : agenda.data.appointments.length === 0 ? (
        <p className="rounded-[14px] border border-border bg-card px-4 py-6 text-center text-[13px] text-muted">
          Nenhum agendamento neste dia.
        </p>
      ) : (
        <BarberTimeline items={agenda.data.appointments} now={now} />
      )}
    </div>
  );
}
