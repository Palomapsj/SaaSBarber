"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PrimaryAction, primaryActionClasses } from "@/components/ui/PrimaryAction";
import { InfoIcon } from "@/components/ui/icons/InfoIcon";
import type { BookingDraft } from "@/features/agendamento/booking/bookingDraft";
import { useBookingStep } from "@/features/agendamento/booking/bookingSteps";
import { saveClientAccess } from "@/features/agendamento/booking/clientAccess";
import { BookingFooter } from "@/features/agendamento/components/BookingFooter";
import { OptionListSkeleton } from "@/features/agendamento/components/OptionListSkeleton";
import { type SummaryRow, SummaryCard } from "@/features/agendamento/components/SummaryCard";
import { summarizeServices } from "@/features/agendamento/serviceSelection";
import { SlotUnavailableError, createAppointment } from "@/lib/api/appointments";
import type { Barbershop, Service } from "@/lib/api/types";
import { formatCurrency } from "@/lib/format/currency";
import { formatLongDate, formatTime } from "@/lib/format/date";
import { formatDuration } from "@/lib/format/duration";
import { formatPhone } from "@/lib/format/phone";

type BookingReviewProps = {
  barbershop: Pick<Barbershop, "id" | "slug" | "name" | "cancellationNoticeHours" | "recurrenceIntervalWeeks">;
  services: Service[];
  barberNames: Record<string, string>;
  dateTimeHref: string;
  successHref: string;
};

type Status = "idle" | "submitting" | "slot-taken" | "error";

function summaryRows(draft: BookingDraft, props: BookingReviewProps): SummaryRow[] {
  const { barbershop, services, barberNames } = props;
  const chosen = services.filter((service) => draft.serviceIds.includes(service.id));
  const { totalMinutes } = summarizeServices(services, draft.serviceIds);
  const startsAt = draft.startsAt ?? "";
  const rows: SummaryRow[] = [
    { label: "Barbearia", value: barbershop.name },
    { label: "Serviços", value: chosen.map((service) => service.name).join(" + ") },
    {
      label: "Profissional",
      value: draft.barber?.kind === "barber" ? (barberNames[draft.barber.barberId] ?? "") : "Qualquer profissional",
    },
    { label: "Data", value: formatLongDate(startsAt) },
    { label: "Horário", value: `${formatTime(startsAt)} · ${formatDuration(totalMinutes)}` },
    { label: "WhatsApp", value: formatPhone(draft.customerPhone) },
  ];
  if (draft.recurring && barbershop.recurrenceIntervalWeeks) {
    rows.push({ label: "Repetição", value: `A cada ${barbershop.recurrenceIntervalWeeks} semanas` });
  }
  return rows;
}

export function BookingReview(props: BookingReviewProps) {
  const { barbershop, services, dateTimeHref, successHref } = props;
  const router = useRouter();
  const { draft } = useBookingStep(barbershop.slug, "confirmar");
  const [status, setStatus] = useState<Status>("idle");
  // Next.js keeps visited screens mounted in the background, so "already confirmed" is tied to
  // the confirmed time: a new booking in the same visit starts unlocked.
  const [confirmedStartsAt, setConfirmedStartsAt] = useState<string | null>(null);
  const isConfirmed = draft?.startsAt != null && draft.startsAt === confirmedStartsAt;
  const isBusy = status === "submitting" || isConfirmed;

  async function confirm() {
    if (!draft?.barber || !draft.startsAt || isBusy) return;
    setStatus("submitting");
    try {
      const { appointment, clientAccess } = await createAppointment({
        barbershopId: barbershop.id,
        serviceIds: draft.serviceIds,
        barber: draft.barber,
        startsAt: draft.startsAt,
        customer: { name: draft.customerName.trim(), phone: draft.customerPhone },
        recurring: draft.recurring,
      });
      // "Lembrar neste aparelho" (ADR-002): "Ver meus agendamentos" works right away.
      saveClientAccess(barbershop.slug, clientAccess.token);
      setConfirmedStartsAt(draft.startsAt);
      setStatus("idle");
      router.push(`${successHref}?agendamento=${encodeURIComponent(appointment.id)}`);
    } catch (error) {
      setStatus(error instanceof SlotUnavailableError ? "slot-taken" : "error");
    }
  }

  if (!draft) {
    return <OptionListSkeleton count={2} cardHeight={150} />;
  }

  const { totalCents } = summarizeServices(services, draft.serviceIds);
  const notice = barbershop.cancellationNoticeHours;

  return (
    <div className="flex flex-1 flex-col">
      <div className="content-width grid gap-4 px-5 py-[18px] md:grid-cols-[minmax(0,1fr)_320px] md:items-start md:gap-6 md:px-8">
        <SummaryCard rows={summaryRows(draft, props)} total={formatCurrency(totalCents)} />
        {notice > 0 && (
          <div className="flex gap-2.5 rounded-xl bg-card px-3.5 py-3">
            <InfoIcon size={18} className="mt-0.5 shrink-0 text-muted" />
            <p className="text-[12px] text-muted">
              Cancelamento ou reagendamento grátis até {notice}h antes do horário.
            </p>
          </div>
        )}
      </div>

      <div className="flex-1" />

      <BookingFooter
        aside={
          status === "slot-taken" || status === "error" ? (
            <p role="alert" className="text-center text-[13px] text-accent">
              {status === "slot-taken"
                ? "Esse horário acabou de ser reservado. Escolha outro horário."
                : "Não foi possível confirmar. Tente novamente."}
            </p>
          ) : undefined
        }
      >
        {status === "slot-taken" ? (
          <PrimaryAction href={dateTimeHref}>Escolher outro horário</PrimaryAction>
        ) : (
          <button
            type="button"
            onClick={confirm}
            disabled={isBusy}
            aria-busy={status === "submitting"}
            className={`${primaryActionClasses} disabled:cursor-wait disabled:opacity-70`}
          >
            {isBusy ? "Confirmando…" : "Confirmar agendamento"}
          </button>
        )}
      </BookingFooter>
    </div>
  );
}
