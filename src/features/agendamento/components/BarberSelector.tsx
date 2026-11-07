"use client";

import Link from "next/link";
import { PrimaryAction } from "@/components/ui/PrimaryAction";
import type { BarberChoice } from "@/features/agendamento/booking/bookingDraft";
import { useBookingStep } from "@/features/agendamento/booking/bookingSteps";
import { BarberList } from "@/features/agendamento/components/BarberList";
import { BookingFooter } from "@/features/agendamento/components/BookingFooter";
import { OptionListSkeleton } from "@/features/agendamento/components/OptionListSkeleton";
import { useBarbersForServices } from "@/features/agendamento/hooks/useBarbersForServices";
import type { Barber } from "@/lib/api/types";

type BarberSelectorProps = {
  slug: string;
  barbershopId: string;
  servicesHref: string;
  nextHref: string;
};

function isChoiceAvailable(choice: BarberChoice | null, barbers: Barber[]): boolean {
  if (!choice || barbers.length === 0) return false;
  return choice.kind === "any" || barbers.some((barber) => barber.id === choice.barberId);
}

export function BarberSelector({ slug, barbershopId, servicesHref, nextHref }: BarberSelectorProps) {
  const { draft, updateDraft } = useBookingStep(slug, "profissional");
  const state = useBarbersForServices(barbershopId, draft ? draft.serviceIds : null);

  const barbers = state.status === "ready" ? state.data : [];
  const choice = draft?.barber ?? null;

  return (
    <div className="flex flex-1 flex-col">
      {state.status === "error" ? (
        <div className="px-5 py-[18px] text-[13px] text-muted">
          <p>Não foi possível carregar os profissionais.</p>
          <button type="button" onClick={state.retry} className="mt-2 font-semibold text-accent">
            Tentar novamente
          </button>
        </div>
      ) : state.status === "ready" && barbers.length === 0 ? (
        <div className="px-5 py-[18px] text-[13px] text-muted">
          <p>Nenhum profissional atende todos os serviços escolhidos.</p>
          <Link href={servicesHref} className="mt-2 inline-block font-semibold text-accent">
            Alterar serviços
          </Link>
        </div>
      ) : state.status === "ready" ? (
        <BarberList
          barbers={barbers}
          choice={choice}
          onChoose={(barber) => updateDraft((current) => ({ ...current, barber }))}
        />
      ) : (
        <OptionListSkeleton count={4} cardHeight={74} />
      )}

      <div className="flex-1" />

      <BookingFooter>
        <PrimaryAction href={nextHref} disabled={!isChoiceAvailable(choice, barbers)}>
          Continuar
        </PrimaryAction>
      </BookingFooter>
    </div>
  );
}
