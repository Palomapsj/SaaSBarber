"use client";

import Link from "next/link";
import { useEffect } from "react";
import { SecondaryAction } from "@/components/ui/SecondaryAction";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { CheckIcon } from "@/components/ui/icons/CheckIcon";
import { clearBookingChoices, useBookingDraft } from "@/features/agendamento/booking/bookingDraft";
import { buildCalendarFile, downloadCalendarFile } from "@/features/agendamento/calendar";
import { useAsyncResource } from "@/lib/hooks/useAsyncResource";
import { getAppointment } from "@/lib/api/appointments";
import type { Address } from "@/lib/api/types";
import { formatLongDate, formatTime } from "@/lib/format/date";

type BookingSuccessProps = {
  slug: string;
  appointmentId: string | null;
  barbershopName: string;
  address: Address;
  homeHref: string;
  myAppointmentsHref: string;
};

export function BookingSuccess(props: BookingSuccessProps) {
  const { slug, appointmentId, barbershopName, address, homeHref, myAppointmentsHref } = props;
  const [draft, updateDraft] = useBookingDraft(slug);
  const appointment = useAsyncResource(appointmentId, () =>
    appointmentId ? getAppointment(appointmentId) : Promise.resolve(null),
  );

  // The booking is done: forget the choices (so "back" cannot book twice), keep name and WhatsApp.
  const hasChoices = draft !== null && (draft.serviceIds.length > 0 || draft.barber !== null || draft.startsAt !== null);
  useEffect(() => {
    if (hasChoices) updateDraft(clearBookingChoices);
  }, [hasChoices, updateDraft]);

  let body;
  if (appointmentId && (appointment.status === "loading" || appointment.status === "idle")) {
    body = <div role="status" aria-label="Carregando" className="h-80 w-full animate-pulse rounded-2xl bg-card" />;
  } else if (appointment.status !== "ready" || appointment.data === null) {
    body = (
      <>
        <h1 className="font-display text-[22px] font-bold uppercase">Agendamento não encontrado</h1>
        <p className="max-w-[280px] pt-2 text-[14px] text-muted">Confira seus agendamentos ou faça um novo.</p>
        <Link href={homeHref} className="mt-4 text-[14px] font-semibold text-accent">
          Voltar ao início
        </Link>
      </>
    );
  } else {
    const data = appointment.data;
    const services = data.services.map((service) => service.name).join(" + ");
    body = (
      <>
        <div className="mb-5 flex size-[76px] items-center justify-center rounded-full bg-success-soft text-success">
          <CheckIcon size={38} strokeWidth={3} />
        </div>
        <h1 className="font-display text-[22px] font-bold uppercase">Agendamento confirmado</h1>
        <p className="max-w-[280px] pt-2 text-[14px] text-muted">
          Enviamos a confirmação para o seu WhatsApp com todos os detalhes.
        </p>
        <div className="mt-7 w-full rounded-2xl border border-border bg-card p-[18px] text-left">
          <p className="font-display text-[15px] font-bold">{formatLongDate(data.startsAt)}</p>
          <p className="pt-1 text-[13px] text-muted">
            {formatTime(data.startsAt)} · {data.barber.name} · {services}
          </p>
          {data.recurrence && (
            <p className="pt-1 text-[13px] text-muted">Repete a cada {data.recurrence.everyWeeks} semanas</p>
          )}
        </div>
        <div className="mt-4 flex w-full flex-col gap-2.5">
          <button
            type="button"
            onClick={() => downloadCalendarFile(buildCalendarFile({ appointment: data, barbershopName, address }))}
            className="w-full rounded-xl bg-accent py-[15px] font-display text-[14px] font-bold tracking-[0.5px] text-on-accent uppercase"
          >
            Adicionar ao calendário
          </button>
          <SecondaryAction href={myAppointmentsHref}>Ver meus agendamentos</SecondaryAction>
        </div>
      </>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col">
      <div className="absolute top-5 right-5 md:right-8">
        <ThemeToggle />
      </div>
      <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col items-center justify-center p-8 text-center">
        {body}
      </main>
    </div>
  );
}
