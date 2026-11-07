import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PanelHeader } from "@/components/layout/PanelHeader";
import { BarberServices } from "@/features/servicos/components/BarberServices";
import { getSession } from "@/lib/auth/currentSession";

export const metadata: Metadata = { title: "Meus serviços" };

// Reads the session (the barber's name under the title), so it renders behind Suspense.
// proxy.ts already checked it; the API checks it again on every call.
async function BarberServicesSection() {
  const session = await getSession();
  if (!session || session.role !== "barber" || !session.barberId) redirect("/login");

  return (
    <>
      <PanelHeader title="Meus serviços" subtitle={session.name} />
      <BarberServices />
    </>
  );
}

function Loading() {
  return (
    <>
      <PanelHeader title="Meus serviços" />
      <div role="status" aria-label="Carregando" className="m-5 h-[400px] animate-pulse rounded-2xl bg-card md:m-8" />
    </>
  );
}

export default function BarberServicesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <BarberServicesSection />
    </Suspense>
  );
}
