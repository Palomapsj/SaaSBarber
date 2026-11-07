import { apiRequest, queryString } from "@/lib/api/http";
import type { AvailableDay, BarberSelection, LocalDate, TimeSlot } from "@/lib/api/types";

export type AvailabilityQuery = {
  barbershopId: string;
  serviceIds: string[];
  barber: BarberSelection;
};

const params = (query: AvailabilityQuery, date?: LocalDate) =>
  queryString({
    serviceIds: query.serviceIds.join(","),
    barber: query.barber.kind === "any" ? "any" : query.barber.barberId,
    date,
  });

// Bookable days (window decided by the API) and times. Rules: duration, opening hours, breaks,
// notice and "any barber" are all decided by the API.
export function getAvailableDays(query: AvailabilityQuery): Promise<AvailableDay[]> {
  return apiRequest(`/barbershops/${query.barbershopId}/availability/days${params(query)}`);
}

export function getTimeSlots(query: AvailabilityQuery & { date: LocalDate }): Promise<TimeSlot[]> {
  return apiRequest(`/barbershops/${query.barbershopId}/availability/slots${params(query, query.date)}`);
}
