import { apiRequest } from "@/lib/api/http";
import type { Appointment, CreateAppointmentInput, CreatedAppointment } from "@/lib/api/types";

export { SlotUnavailableError } from "@/lib/api/http";

/** Throws SlotUnavailableError when the time was taken meanwhile (409). */
export function createAppointment(input: CreateAppointmentInput): Promise<CreatedAppointment> {
  return apiRequest(`/barbershops/${input.barbershopId}/appointments`, { method: "POST", body: input });
}

export function getAppointment(id: string): Promise<Appointment> {
  return apiRequest(`/appointments/${encodeURIComponent(id)}`);
}
