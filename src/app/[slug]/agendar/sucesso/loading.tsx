import { ClientScreen } from "@/components/layout/ClientScreen";

export default function Loading() {
  return (
    <ClientScreen>
      <div className="mx-auto flex w-full max-w-[480px] flex-1 items-center p-8">
        <div role="status" aria-label="Carregando" className="h-80 w-full animate-pulse rounded-2xl bg-card" />
      </div>
    </ClientScreen>
  );
}
