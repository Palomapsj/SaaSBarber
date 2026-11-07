import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PanelHeader } from "@/components/layout/PanelHeader";
import { firstName } from "@/features/agenda/barberTimeline";
import { BarberAgenda } from "@/features/agenda/components/BarberAgenda";
import { getSession } from "@/lib/auth/currentSession";

export const metadata: Metadata = { title: "Agenda" };

// Reads the session (greeting + which agenda to show), so it renders behind Suspense.
async function BarberAgendaSection() {
  const session = await getSession();
  if (!session || session.role !== "barber" || !session.barberId) redirect("/login");

  return (
    <>
      <PanelHeader
        title={
          <>
            Olá, {firstName(session.name)} <span aria-hidden="true">👋</span>
          </>
        }
        subtitle="Sua agenda de hoje"
      />
      <BarberAgenda barbershopId={session.barbershopId} barberId={session.barberId} />
    </>
  );
}

function AgendaSkeleton() {
  return (
    <>
      <PanelHeader title="Agenda" subtitle="Sua agenda de hoje" />
      <div className="px-5 py-6 md:px-8">
        <div role="status" aria-label="Carregando agenda" className="h-[400px] animate-pulse rounded-[14px] bg-card" />
      </div>
    </>
  );
}

export default function BarberAgendaPage() {
  return (
    <Suspense fallback={<AgendaSkeleton />}>
      <BarberAgendaSection />
    </Suspense>
  );
}
