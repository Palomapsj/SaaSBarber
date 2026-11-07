import { apiRequest } from "@/lib/api/http";
import type { Barber } from "@/lib/api/types";

/** Active barbers who perform every chosen service (the rule is the API's). */
export function getBarbersForServices(barbershopId: string, serviceIds: string[]): Promise<Barber[]> {
  const ids = encodeURIComponent(serviceIds.join(","));
  return apiRequest(`/barbershops/${barbershopId}/barbers?serviceIds=${ids}`);
}
