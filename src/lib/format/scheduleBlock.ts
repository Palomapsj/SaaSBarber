import type { ScheduleBlock } from "@/lib/api/scheduleTypes";
import { formatCompactDate } from "@/lib/format/date";

const dayMonth = (date: string) => {
  // "2026-09-29" → "29 set"
  const [, , day] = date.split("-");
  return `${day} ${formatCompactDate(date).split(" ").at(-1)}`;
};

/**
 * How a block is listed (prototype admin/horarios.html):
 * whole days → "29 set – 03 out" (or "29 set" for one day); some hours → "Ter 22 set · 15:00–16:00".
 */
export function formatBlockPeriod(block: Pick<ScheduleBlock, "kind" | "startDate" | "endDate" | "startTime" | "endTime">): string {
  if (block.kind === "hours") return `${formatCompactDate(block.startDate)} · ${block.startTime}–${block.endTime}`;
  return block.startDate === block.endDate
    ? dayMonth(block.startDate)
    : `${dayMonth(block.startDate)} – ${dayMonth(block.endDate)}`;
}
