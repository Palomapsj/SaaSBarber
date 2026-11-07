import { ClientScreen } from "@/components/layout/ClientScreen";
import { BookingProgress } from "@/features/agendamento/components/BookingProgress";
import { TimeSlotGrid } from "@/features/agendamento/components/TimeSlotGrid";

export default function Loading() {
  return (
    <ClientScreen>
      <div className="h-14" />
      <BookingProgress currentStep={3} />
      <div className="pt-[18px]">
        <TimeSlotGrid slots={null} selectedStartsAt={null} onSelect={() => {}} />
      </div>
    </ClientScreen>
  );
}
