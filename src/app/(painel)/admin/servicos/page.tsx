import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { PanelHeader } from "@/components/layout/PanelHeader";
import { ServiceCountText, ServicesProvider } from "@/features/servicos/ServicesProvider";
import { AdminServices } from "@/features/servicos/components/AdminServices";
import { getSession } from "@/lib/auth/currentSession";

export const metadata: Metadata = { title: "Serviços" };

// Checks the session on the server too (proxy.ts already did); the API checks it again.
async function RequireAdmin({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/login");
  return children;
}

function Loading() {
  return (
    <>
      <PanelHeader title="Serviços" />
      <div role="status" aria-label="Carregando" className="m-5 h-[480px] animate-pulse rounded-2xl bg-card md:m-8" />
    </>
  );
}

// The data provider sits inside the same Suspense boundary as the list, so both hydrate
// together (otherwise the provider could load the data before the list hydrates).
export default function AdminServicesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <RequireAdmin>
        <ServicesProvider>
          <PanelHeader title="Serviços" subtitle={<ServiceCountText />} />
          <AdminServices />
        </ServicesProvider>
      </RequireAdmin>
    </Suspense>
  );
}
