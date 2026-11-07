import { apiRequest } from "@/lib/api/http";
import type { MyAppointment } from "@/lib/api/types";

// "Meus agendamentos" through the client's access code (docs/adr/002-acesso-cliente-sem-conta.md).

export { ChangeNotAllowedError, InvalidAccessError } from "@/lib/api/http";

/** Throws InvalidAccessError (401) for an unknown, expired or revoked code. */
export function getMyAppointments(barbershopId: string, token: string): Promise<MyAppointment[]> {
  return apiRequest(`/barbershops/${barbershopId}/me/appointments`, { token });
}

/** Throws ChangeNotAllowedError (409) inside the barbershop's cancellation notice. */
export function cancelMyAppointment(barbershopId: string, token: string, appointmentId: string): Promise<void> {
  return apiRequest(`/barbershops/${barbershopId}/me/appointments/${encodeURIComponent(appointmentId)}/cancel`, {
    method: "POST",
    token,
  });
}

/** Always succeeds (the API never tells whether a number is a client). */
export function requestAccessLink(barbershopId: string, phone: string, slug: string): Promise<void> {
  return apiRequest(`/barbershops/${barbershopId}/client-access/resend`, { method: "POST", body: { phone, slug } });
}
