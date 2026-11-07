import { apiRequest } from "@/lib/api/http";
import type {
  BarberSchedule,
  DaySchedule,
  ScheduleBlock,
  ScheduleBlockInput,
  ScheduleChangeResult,
} from "@/lib/api/scheduleTypes";

// Working hours. The admin edits any barber (`{ barberId }`); a barber only their own (`"me"`,
// the API takes who they are from the session).

export type ScheduleOwner = { barberId: string } | "me";

export { ValidationError } from "@/lib/api/http";

const base = (owner: ScheduleOwner) =>
  owner === "me" ? "/panel/me/schedule" : `/panel/schedules/${encodeURIComponent(owner.barberId)}`;

/** Admin only: who can be edited (tabs). */
export function getScheduleBarbers(): Promise<{ id: string; name: string }[]> {
  return apiRequest("/panel/schedules");
}

export function getSchedule(owner: ScheduleOwner): Promise<BarberSchedule> {
  return apiRequest(base(owner));
}

/** Throws ValidationError (422) with `fields` keyed by weekday ("0"–"6"). */
export function saveWeekly(owner: ScheduleOwner, weekly: DaySchedule[]): Promise<ScheduleChangeResult<DaySchedule[]>> {
  return apiRequest(`${base(owner)}/weekly`, { method: "PUT", body: { weekly } });
}

/** Throws ValidationError (422). */
export function addBlock(owner: ScheduleOwner, block: ScheduleBlockInput): Promise<ScheduleChangeResult<ScheduleBlock>> {
  return apiRequest(`${base(owner)}/blocks`, { method: "POST", body: block });
}

export function removeBlock(owner: ScheduleOwner, blockId: string): Promise<void> {
  return apiRequest(`${base(owner)}/blocks/${encodeURIComponent(blockId)}`, { method: "DELETE" });
}
