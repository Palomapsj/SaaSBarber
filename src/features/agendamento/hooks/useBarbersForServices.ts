import { type ResourceState, useAsyncResource } from "@/lib/hooks/useAsyncResource";
import { getBarbersForServices } from "@/lib/api/barbers";
import type { Barber } from "@/lib/api/types";

/** Loads barbers who perform every service in `serviceIds`. Pass `null` to skip loading. */
export function useBarbersForServices(barbershopId: string, serviceIds: string[] | null): ResourceState<Barber[]> {
  const key = serviceIds ? `${barbershopId}|${serviceIds.join(",")}` : null;
  return useAsyncResource(key, () => getBarbersForServices(barbershopId, serviceIds ?? []));
}
