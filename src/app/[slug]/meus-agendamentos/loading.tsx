import { ClientScreen } from "@/components/layout/ClientScreen";
import { OptionListSkeleton } from "@/features/agendamento/components/OptionListSkeleton";

export default function Loading() {
  return (
    <ClientScreen>
      <div className="h-14" />
      <OptionListSkeleton count={2} cardHeight={150} />
    </ClientScreen>
  );
}
