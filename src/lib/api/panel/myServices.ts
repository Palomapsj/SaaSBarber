import { apiRequest } from "@/lib/api/http";
import type { BarberServicesPage } from "@/lib/api/types";

// Barber "Meus serviços" (barbershop and barber from the session).

export { LastServiceError } from "@/lib/api/http";

export function getMyServices(): Promise<BarberServicesPage> {
  return apiRequest("/panel/me/services");
}

/** Throws LastServiceError (409) when unchecking the last active service. */
export function setPerformsService(serviceId: string, performed: boolean): Promise<BarberServicesPage> {
  return apiRequest(`/panel/me/services/${serviceId}`, { method: "PUT", body: { performed } });
}
