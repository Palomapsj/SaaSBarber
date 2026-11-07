import type { DaySchedule } from "@/lib/api/scheduleTypes";
import type { Weekday } from "@/lib/api/types";

export const WEEKDAY_NAMES: Record<Weekday, string> = {
  0: "Domingo",
  1: "Segunda",
  2: "Terça",
  3: "Quarta",
  4: "Quinta",
  5: "Sexta",
  6: "Sábado",
};

/** Decision "permitir e avisar": the change is saved, the booked appointments stay as they are. */
export function outsideWarning(count: number): string {
  return count === 1
    ? "1 agendamento ficou fora do horário de trabalho. Ele continua marcado: avise o cliente ou remarque."
    : `${count} agendamentos ficaram fora do horário de trabalho. Eles continuam marcados: avise os clientes ou remarque.`;
}

export const sameWeekly = (a: DaySchedule[], b: DaySchedule[]) => JSON.stringify(a) === JSON.stringify(b);
