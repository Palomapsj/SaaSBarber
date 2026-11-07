import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { PanelHeader } from "@/components/layout/PanelHeader";
import { EditingBarberText, SchedulesProvider } from "@/features/horarios/SchedulesProvider";
import { AdminSchedules } from "@/features/horarios/components/AdminSchedules";
import { getSession } from "@/lib/auth/currentSession";

export const metadata: Metadata = { title: "Horários de trabalho" };

// Checks the session on the server too (proxy.ts already did); the API checks it again.
async function RequireAdmin({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/login");
  return children;
}

function Loading() {
  return (
    <>
      <PanelHeader title="Horários de trabalho" />
      <div role="status" aria-label="Carregando" className="m-5 h-[480px] animate-pulse rounded-2xl bg-card md:m-8" />
    </>
  );
}

// The provider sits inside the same Suspense boundary as the tabs, so both hydrate together.
export default function AdminSchedulesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <RequireAdmin>
        <SchedulesProvider>
          <PanelHeader title="Horários de trabalho" subtitle={<EditingBarberText />} />
          <AdminSchedules />
        </SchedulesProvider>
      </RequireAdmin>
    </Suspense>
  );
}
