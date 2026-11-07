import type { LocalDate, LocalTime, OpeningHours, Weekday } from "@/lib/api/types";

// Working hours of each barber (admin "Horários" and barber "Meus horários").

/** One day of the weekly schedule. A day off has `working: false` (times are kept for later). */
export type DaySchedule = {
  weekday: Weekday;
  working: boolean;
  start: LocalTime;
  end: LocalTime;
  /** Break inside the day (e.g. lunch); both null when there is none. */
  breakStart: LocalTime | null;
  breakEnd: LocalTime | null;
};

/** A period when the barber does not attend: whole days (vacation) or some hours on one day. */
export type ScheduleBlock = {
  id: string;
  barberId: string;
  kind: "days" | "hours";
  startDate: LocalDate;
  /** Same as startDate for an "hours" block. */
  endDate: LocalDate;
  /** Only for "hours" blocks. */
  startTime: LocalTime | null;
  endTime: LocalTime | null;
  reason: string;
};

export type ScheduleBlockInput = Omit<ScheduleBlock, "id" | "barberId">;

export type BarberSchedule = {
  barber: { id: string; name: string };
  /** Monday first, seven days. */
  weekly: DaySchedule[];
  blocks: ScheduleBlock[];
  /** The barbershop's opening hours: a barber's schedule must stay inside them. */
  shopHours: OpeningHours[];
};

/** Answer to a change: what was saved and how many booked appointments now fall outside. */
export type ScheduleChangeResult<T> = { saved: T; outsideCount: number };
