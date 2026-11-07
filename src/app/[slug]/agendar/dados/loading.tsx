import { ClientScreen } from "@/components/layout/ClientScreen";
import { BookingProgress } from "@/features/agendamento/components/BookingProgress";
import { OptionListSkeleton } from "@/features/agendamento/components/OptionListSkeleton";

export default function Loading() {
  return (
    <ClientScreen>
      <div className="h-14" />
      <BookingProgress currentStep={4} />
      <OptionListSkeleton count={3} cardHeight={70} />
    </ClientScreen>
  );
}
