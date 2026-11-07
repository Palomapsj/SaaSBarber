"use client";

import { PrimaryAction } from "@/components/ui/PrimaryAction";
import { useBookingStep } from "@/features/agendamento/booking/bookingSteps";
import { BookingFooter } from "@/features/agendamento/components/BookingFooter";
import { DayChips } from "@/features/agendamento/components/DayChips";
import { StepMessage } from "@/features/agendamento/components/StepMessage";
import { TimeSlotGrid } from "@/features/agendamento/components/TimeSlotGrid";
import { WaitlistButton } from "@/features/agendamento/components/WaitlistButton";
import { useAvailability } from "@/features/agendamento/hooks/useAvailability";
import { formatCompactDate, formatMonth, formatTime } from "@/lib/format/date";

type DateTimePickerProps = {
  slug: string;
  barbershopId: string;
  /** Barber id → name, for the "Horários com …" title. */
  barberNames: Record<string, string>;
  nextHref: string;
};

const sectionTitle = "px-5 md:px-8 text-[12px] font-semibold tracking-[0.5px] text-muted uppercase";

export function DateTimePicker({ slug, barbershopId, barberNames, nextHref }: DateTimePickerProps) {
  const { draft, updateDraft } = useBookingStep(slug, "data-horario");
  const { days, selectedDate, slots, selectedSlot } = useAvailability(barbershopId, draft);

  const barber = draft?.barber;
  const slotsTitle =
    barber?.kind === "barber" ? `Horários com ${barberNames[barber.barberId] ?? "o profissional"}` : "Horários disponíveis";

  let body;
  if (days.status === "error") {
    body = <StepMessage action={<button type="button" onClick={days.retry}>Tentar novamente</button>}>Não foi possível carregar os dias disponíveis.</StepMessage>;
  } else if (days.status !== "ready") {
    body = <TimeSlotGrid slots={null} selectedStartsAt={null} onSelect={() => {}} />;
  } else if (days.data.length === 0 || !selectedDate) {
    body = <StepMessage>Nenhum horário livre nos próximos dias.</StepMessage>;
  } else {
    body = (
      <>
        <h2 className={`${sectionTitle} pt-[18px] pb-1.5`}>{formatMonth(selectedDate)}</h2>
        <DayChips
          days={days.data}
          selectedDate={selectedDate}
          onSelect={(date) => updateDraft((current) => ({ ...current, date, startsAt: null }))}
        />
        <h2 className={`${sectionTitle} pb-2`}>{slotsTitle}</h2>
        {slots.status === "error" ? (
          <StepMessage action={<button type="button" onClick={slots.retry}>Tentar novamente</button>}>Não foi possível carregar os horários.</StepMessage>
        ) : slots.status === "ready" && slots.data.length === 0 ? (
          <StepMessage>Nenhum horário livre neste dia.</StepMessage>
        ) : (
          <TimeSlotGrid
            slots={slots.status === "ready" ? slots.data : null}
            selectedStartsAt={selectedSlot?.startsAt ?? null}
            onSelect={(startsAt) => updateDraft((current) => ({ ...current, date: selectedDate, startsAt }))}
          />
        )}
      </>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="content-width">{body}</div>
      <div className="flex-1" />
      <BookingFooter aside={<WaitlistButton />}>
        <PrimaryAction
          href={nextHref}
          disabled={!selectedSlot}
          detail={selectedSlot && selectedDate ? `${formatCompactDate(selectedDate)} · ${formatTime(selectedSlot.startsAt)}` : undefined}
        >
          Continuar
        </PrimaryAction>
      </BookingFooter>
    </div>
  );
}
