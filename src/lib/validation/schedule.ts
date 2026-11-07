import type { DaySchedule, ScheduleBlockInput } from "@/lib/api/scheduleTypes";
import type { LocalTime, OpeningHours } from "@/lib/api/types";

// Schedule checks shared by the screens and the mock server. Decision: a barber's hours stay
// inside the barbershop's opening hours (what clients see on the home screen).

export const TIME_ORDER_ERROR = "O fim precisa ser depois do início";
export const BREAK_ERROR = "Intervalo precisa ficar dentro do horário";
export const CLOSED_DAY_ERROR = "A barbearia não abre neste dia";
export const REASON_ERROR = "Informe o motivo";
export const DATE_ERROR = "Informe a data";
export const DATE_ORDER_ERROR = "A data final precisa ser igual ou depois da inicial";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export const toMinutes = (time: LocalTime) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

/** "09:00" → "09h", "09:30" → "09h30" */
const hourLabel = (time: LocalTime) => (time.endsWith(":00") ? `${time.slice(0, 2)}h` : time.replace(":", "h"));

export const outsideShopHoursError = (shop: OpeningHours) =>
  `Fora do horário da barbearia (${hourLabel(shop.opens)} às ${hourLabel(shop.closes)})`;

/** Error of one working day, or null. Days off are always valid. */
export function validateDaySchedule(day: DaySchedule, shopHours: OpeningHours[]): string | null {
  if (!day.working) return null;
  const shop = shopHours.find((h) => h.weekday === day.weekday);
  if (!shop) return CLOSED_DAY_ERROR;
  if (!TIME.test(day.start) || !TIME.test(day.end) || toMinutes(day.end) <= toMinutes(day.start)) return TIME_ORDER_ERROR;
  if (toMinutes(day.start) < toMinutes(shop.opens) || toMinutes(day.end) > toMinutes(shop.closes)) {
    return outsideShopHoursError(shop);
  }
  const hasBreak = day.breakStart !== null || day.breakEnd !== null;
  if (hasBreak) {
    if (!day.breakStart || !day.breakEnd || !TIME.test(day.breakStart) || !TIME.test(day.breakEnd)) return BREAK_ERROR;
    const breakStart = toMinutes(day.breakStart);
    const breakEnd = toMinutes(day.breakEnd);
    if (breakEnd <= breakStart || breakStart <= toMinutes(day.start) || breakEnd >= toMinutes(day.end)) return BREAK_ERROR;
  }
  return null;
}

/** Errors by weekday (0–6); empty when the whole week is valid. */
export function validateWeekly(weekly: DaySchedule[], shopHours: OpeningHours[]): Partial<Record<number, string>> {
  const errors: Partial<Record<number, string>> = {};
  for (const day of weekly) {
    const error = validateDaySchedule(day, shopHours);
    if (error) errors[day.weekday] = error;
  }
  return errors;
}

export type BlockField = "startDate" | "endDate" | "time" | "reason";

export function validateBlock(block: ScheduleBlockInput): Partial<Record<BlockField, string>> {
  const errors: Partial<Record<BlockField, string>> = {};
  const isDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
  if (!isDate(block.startDate)) errors.startDate = DATE_ERROR;
  if (block.kind === "days") {
    if (!isDate(block.endDate)) errors.endDate = DATE_ERROR;
    else if (isDate(block.startDate) && block.endDate < block.startDate) errors.endDate = DATE_ORDER_ERROR;
  } else if (
    !block.startTime ||
    !block.endTime ||
    !TIME.test(block.startTime) ||
    !TIME.test(block.endTime) ||
    toMinutes(block.endTime) <= toMinutes(block.startTime)
  ) {
    errors.time = TIME_ORDER_ERROR;
  }
  if (block.reason.trim().length < 2) errors.reason = REASON_ERROR;
  return errors;
}
