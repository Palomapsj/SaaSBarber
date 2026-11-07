import type { Appointment } from "@/lib/api/types";
import type { MockAppointmentRecord } from "./db";

/** Only the public fields (an allowlist, so the client's name and WhatsApp never leak). */
export function toAppointment(record: MockAppointmentRecord): Appointment {
  const { id, barbershopId, status, startsAt, durationMinutes, services, barber, totalCents, recurrence } = record;
  return { id, barbershopId, status, startsAt, durationMinutes, services, barber, totalCents, recurrence };
}
