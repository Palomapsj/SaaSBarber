import { apiRequest } from "@/lib/api/http";
import type { PanelBarber, PanelBarberInput, PanelBarbersPage } from "@/lib/api/types";

// Admin "Profissionais" (barbershop from the session).

export { HasFutureAppointmentsError, PlanLimitError, ValidationError } from "@/lib/api/http";

export function getPanelBarbers(): Promise<PanelBarbersPage> {
  return apiRequest("/panel/barbers");
}

/** Throws PlanLimitError (409) or ValidationError (422). */
export function createPanelBarber(input: PanelBarberInput): Promise<PanelBarber> {
  return apiRequest("/panel/barbers", { method: "POST", body: input });
}

/** Throws ValidationError (422). */
export function updatePanelBarber(id: string, input: PanelBarberInput): Promise<PanelBarber> {
  return apiRequest(`/panel/barbers/${id}`, { method: "PUT", body: input });
}

export function setPanelBarberActive(id: string, active: boolean): Promise<PanelBarber> {
  return apiRequest(`/panel/barbers/${id}/active`, { method: "PATCH", body: { active } });
}

/** Throws HasFutureAppointmentsError (409) while the barber has future appointments. */
export function removePanelBarber(id: string): Promise<void> {
  return apiRequest(`/panel/barbers/${id}`, { method: "DELETE" });
}
