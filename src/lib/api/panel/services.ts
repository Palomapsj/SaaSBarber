import { apiRequest } from "@/lib/api/http";
import type { PanelService, PanelServiceInput, PanelServicesPage } from "@/lib/api/types";

// Admin "Serviços" (barbershop from the session).

export { ValidationError } from "@/lib/api/http";

export function getPanelServices(): Promise<PanelServicesPage> {
  return apiRequest("/panel/services");
}

/** Throws ValidationError (422). */
export function createPanelService(input: PanelServiceInput): Promise<PanelService> {
  return apiRequest("/panel/services", { method: "POST", body: input });
}

/** Throws ValidationError (422). */
export function updatePanelService(id: string, input: PanelServiceInput): Promise<PanelService> {
  return apiRequest(`/panel/services/${id}`, { method: "PUT", body: input });
}

export function setPanelServiceActive(id: string, active: boolean): Promise<PanelService> {
  return apiRequest(`/panel/services/${id}/active`, { method: "PATCH", body: { active } });
}
