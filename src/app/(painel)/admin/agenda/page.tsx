import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PanelHeader } from "@/components/layout/PanelHeader";
import { AdminAgenda } from "@/features/agenda/components/AdminAgenda";
import { getSession } from "@/lib/auth/currentSession";

export const metadata: Metadata = { title: "Agenda geral" };

// Checks the session again on the server (proxy.ts already did): never trust a single gate.
async function AdminAgendaSection() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/login");
  return <AdminAgenda barbershopId={session.barbershopId} />;
}

function AgendaSkeleton() {
  return (
    <div className="px-5 py-6 md:px-8">
      <div role="status" aria-label="Carregando agenda" className="h-[620px] animate-pulse rounded-[14px] bg-card" />
    </div>
  );
}

export default function AdminAgendaPage() {
  return (
    <>
      <PanelHeader title="Agenda geral" subtitle="Todos os profissionais" />
      <Suspense fallback={<AgendaSkeleton />}>
        <AdminAgendaSection />
      </Suspense>
    </>
  );
}
