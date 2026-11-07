import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PanelHeader } from "@/components/layout/PanelHeader";
import { ScheduleEditor } from "@/features/horarios/components/ScheduleEditor";
import { getSession } from "@/lib/auth/currentSession";

export const metadata: Metadata = { title: "Meus horários" };

// Reads the session (the barber's name under the title), so it renders behind Suspense.
// The barber only edits their own hours: the API takes who they are from the session.
async function BarberSchedulesSection() {
  const session = await getSession();
  if (!session || session.role !== "barber" || !session.barberId) redirect("/login");

  return (
    <>
      <PanelHeader title="Meus horários" subtitle={session.name} />
      <div className="px-5 py-6 md:px-8">
        <ScheduleEditor owner="me" weeklyTitle="Meu horário semanal" />
      </div>
    </>
  );
}

function Loading() {
  return (
    <>
      <PanelHeader title="Meus horários" />
      <div role="status" aria-label="Carregando" className="m-5 h-[480px] animate-pulse rounded-2xl bg-card md:m-8" />
    </>
  );
}

export default function BarberSchedulesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <BarberSchedulesSection />
    </Suspense>
  );
}
