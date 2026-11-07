import { ClientScreen } from "@/components/layout/ClientScreen";
import { BookingProgress } from "@/features/agendamento/components/BookingProgress";
import { OptionListSkeleton } from "@/features/agendamento/components/OptionListSkeleton";

export default function Loading() {
  return (
    <ClientScreen>
      <div className="h-14" />
      <BookingProgress currentStep={2} />
      <OptionListSkeleton count={4} cardHeight={74} />
    </ClientScreen>
  );
}
