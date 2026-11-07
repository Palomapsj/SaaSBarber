import { AgendaEventCard } from "@/features/agenda/components/AgendaEventCard";
import { HOUR_HEIGHT, gridHours } from "@/features/agenda/agendaLayout";
import type { AgendaDay } from "@/lib/api/types";
import { formatInitials } from "@/lib/format/initials";

const HEADER_HEIGHT = 59;

// Hours on the left, one column per barber. Scrolls sideways on narrow screens with the
// hours column pinned (prototype: admin/agenda.html).
export function AgendaGrid({ day }: { day: AgendaDay & { hours: NonNullable<AgendaDay["hours"]> } }) {
  const hours = gridHours(day.hours.opens, day.hours.closes);
  const firstHour = hours[0];
  const bodyHeight = hours.length * HOUR_HEIGHT;

  return (
    // Sideways scrolling snaps to each barber; scroll-padding keeps the pinned hours column clear.
    <div className="flex snap-x snap-mandatory scroll-pl-14 overflow-x-auto overflow-y-hidden rounded-[14px] border border-border">
      <div className="sticky left-0 z-10 w-14 shrink-0 bg-card" style={{ paddingTop: HEADER_HEIGHT }}>
        {hours.map((hour) => (
          <div
            key={hour}
            className="border-t border-border pt-0.5 pr-2.5 text-right text-[11px] text-muted2"
            style={{ height: HOUR_HEIGHT }}
          >
            {String(hour).padStart(2, "0")}:00
          </div>
        ))}
      </div>

      {day.barbers.map((barber) => {
        const theirs = day.appointments.filter((appointment) => appointment.barberId === barber.id);
        return (
          <section
            key={barber.id}
            aria-label={`Agenda de ${barber.name}`}
            className="min-w-[220px] flex-1 snap-start border-r border-border last:border-r-0"
          >
            <header className="flex items-center gap-2.5 border-b border-border p-3.5" style={{ height: HEADER_HEIGHT }}>
              <span className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-card2 font-display text-[12px] font-bold text-text">
                {formatInitials(barber.name)}
              </span>
              <h2 className="truncate text-[13px] font-semibold text-text">{barber.name}</h2>
              {!barber.active && <span className="text-[11px] text-muted">(inativo)</span>}
            </header>
            <div className="relative" style={{ height: bodyHeight }}>
              {theirs.map((appointment) => (
                <AgendaEventCard key={appointment.id} appointment={appointment} firstHour={firstHour} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
