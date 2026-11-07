import type { BarberAgendaItem } from "@/lib/api/types";

export type TimelineStatus = "done" | "in-progress" | "upcoming";

/** Where the appointment stands right now: finished, happening or still to come. */
export function timelineStatus(item: BarberAgendaItem, now: Date): TimelineStatus {
  if (item.status === "completed") return "done";
  const start = new Date(item.startsAt).getTime();
  const end = start + item.durationMinutes * 60_000;
  if (now.getTime() >= end) return "done";
  if (now.getTime() >= start) return "in-progress";
  return "upcoming";
}

export const TIMELINE_STATUS_LABEL: Record<TimelineStatus, string> = {
  done: "Concluído",
  "in-progress": "Em andamento",
  upcoming: "Confirmado",
};

/** "6 agendamentos hoje", "1 agendamento" (only "hoje" when the day is today). */
export function appointmentCountLabel(count: number, isToday: boolean): string {
  const noun = count === 1 ? "agendamento" : "agendamentos";
  return `${count} ${noun}${isToday ? " hoje" : ""}`;
}

/** "Carlos Andrade" → "Carlos". */
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? "";
}
