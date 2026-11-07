import { eventBox } from "@/features/agenda/agendaLayout";
import type { AgendaAppointment } from "@/lib/api/types";
import { formatTime } from "@/lib/format/date";

const COMPACT_BELOW = 44;

// Full class names (Tailwind only generates classes it can find in the code).
const COLOR_CLASSES = [
  "border-event-1 bg-event-1/13",
  "border-event-2 bg-event-2/13",
  "border-event-3 bg-event-3/13",
  "border-event-4 bg-event-4/13",
];

export function AgendaEventCard({ appointment, firstHour }: { appointment: AgendaAppointment; firstHour: number }) {
  const { top, height } = eventBox(appointment.startsAt, appointment.durationMinutes, firstHour);
  const start = formatTime(appointment.startsAt);
  const end = formatTime(new Date(new Date(appointment.startsAt).getTime() + appointment.durationMinutes * 60_000).toISOString());
  const services = appointment.serviceNames.join(" + ");

  // Short appointments (about 30 min or less) do not fit two lines: name and services share one.
  const compact = height < COMPACT_BELOW;

  return (
    <div
      title={`${start}–${end} · ${appointment.customerName} · ${services}`}
      style={{ top, height }}
      className={`absolute right-2 left-2 overflow-hidden rounded-lg border-l-[3px] px-2.5 ${compact ? "flex items-center" : "py-2"} ${COLOR_CLASSES[appointment.colorIndex]}`}
    >
      <p className={compact ? "truncate text-[12px]" : ""}>
        <span className={`font-bold text-text ${compact ? "" : "block truncate text-[12px]"}`}>{appointment.customerName}</span>
        {compact && <span className="text-muted"> · </span>}
        <span className={`text-muted ${compact ? "text-[11px]" : "block truncate text-[11px]"}`}>
          <span className="sr-only">{`${start} a ${end}, `}</span>
          {services}
        </span>
      </p>
    </div>
  );
}
