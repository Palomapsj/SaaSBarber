import { TIMELINE_STATUS_LABEL, type TimelineStatus, timelineStatus } from "@/features/agenda/barberTimeline";
import type { BarberAgendaItem } from "@/lib/api/types";
import { formatTime } from "@/lib/format/date";
import { formatDuration } from "@/lib/format/duration";

const DOT: Record<TimelineStatus, string> = {
  done: "bg-muted",
  "in-progress": "bg-accent",
  upcoming: "bg-success",
};

const LABEL: Record<TimelineStatus, string> = {
  done: "text-muted",
  "in-progress": "text-accent",
  upcoming: "text-success",
};

// The day as a vertical timeline: time, dot on the line, card (prototype: barbeiro/agenda.html).
export function BarberTimeline({ items, now }: { items: BarberAgendaItem[]; now: Date }) {
  return (
    <ol className="relative flex flex-col gap-3.5">
      {/* The line runs through the middle of the dots column (48px time + 24px dots). */}
      <span aria-hidden="true" className="absolute top-0 bottom-0 left-[59.5px] w-px bg-border" />
      {items.map((item) => {
        const status = timelineStatus(item, now);
        return (
          <li key={item.id} className="relative flex items-start" aria-current={status === "in-progress" ? "time" : undefined}>
            <time dateTime={item.startsAt} className="w-12 shrink-0 pt-[21px] text-right text-[12px] font-bold text-muted">
              {formatTime(item.startsAt)}
            </time>
            <span aria-hidden="true" className="flex w-6 shrink-0 justify-center pt-[25px]">
              <span className={`relative size-2.5 rounded-full ring-4 ring-bg ${DOT[status]}`} />
            </span>
            <div className="min-w-0 flex-1 rounded-[14px] border border-border bg-card px-4 py-3.5">
              <div className="flex items-start justify-between gap-3">
                <p className="truncate text-[14px] font-semibold text-text">{item.customerName}</p>
                <p className={`shrink-0 text-[11px] font-bold tracking-[0.5px] uppercase ${LABEL[status]}`}>
                  {TIMELINE_STATUS_LABEL[status]}
                </p>
              </div>
              <p className="mt-0.5 text-[12px] text-muted">
                {item.serviceNames.join(" + ")} · {formatDuration(item.durationMinutes)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
