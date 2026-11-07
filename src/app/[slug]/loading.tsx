import { ClientScreen } from "@/components/layout/ClientScreen";

// Placeholder shaped like the client home while the barbershop loads.
export default function Loading() {
  return (
    <ClientScreen>
      <div role="status" aria-label="Carregando" className="flex flex-col animate-pulse">
        <div className="content-width flex items-center justify-between px-5 pt-5 pb-4 md:px-8">
          <div className="flex items-center gap-2.5">
            <div className="size-11 rounded-full bg-card2" />
            <div className="h-5 w-44 rounded bg-card2" />
          </div>
          <div className="size-9 rounded-full bg-card2" />
        </div>
        <div className="border-b border-border">
          <div className="content-width flex flex-col gap-2 px-5 pb-[18px] md:px-8">
            <div className="h-3 w-52 rounded bg-card2" />
            <div className="h-3 w-36 rounded bg-card2" />
          </div>
        </div>
        <div className="content-width grid gap-2.5 px-5 py-[18px] md:grid-cols-2 md:gap-4 md:px-8">
          <div className="h-[70px] rounded-[14px] bg-card" />
          <div className="h-[70px] rounded-[14px] bg-card" />
        </div>
      </div>
    </ClientScreen>
  );
}
