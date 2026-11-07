import { UsersIcon } from "@/components/ui/icons/UsersIcon";
import type { BarberChoice } from "@/features/agendamento/booking/bookingDraft";
import { BarberOption } from "@/features/agendamento/components/BarberOption";
import type { Barber } from "@/lib/api/types";
import { formatInitials } from "@/lib/format/initials";

type BarberListProps = {
  barbers: Barber[];
  choice: BarberChoice | null;
  onChoose: (choice: BarberChoice) => void;
};

export function BarberList({ barbers, choice, onChoose }: BarberListProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Profissional"
      className="content-width grid gap-2.5 px-5 py-[18px] md:grid-cols-2 md:gap-3 md:px-8 lg:grid-cols-3"
    >
      <BarberOption
        variant="any"
        title="Qualquer profissional"
        description="Mais horários disponíveis"
        avatar={<UsersIcon size={20} />}
        selected={choice?.kind === "any"}
        onSelect={() => onChoose({ kind: "any" })}
      />
      {barbers.map((barber) => (
        <BarberOption
          key={barber.id}
          title={barber.name}
          description={barber.specialties.join(" · ")}
          avatar={formatInitials(barber.name)}
          selected={choice?.kind === "barber" && choice.barberId === barber.id}
          onSelect={() => onChoose({ kind: "barber", barberId: barber.id })}
        />
      ))}
    </div>
  );
}
