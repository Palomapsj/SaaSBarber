import { apiRequest } from "@/lib/api/http";
import type { AgendaDay, BarberAgendaDay, LocalDate } from "@/lib/api/types";

// Panel agendas. The API takes the barbershop (and, for barbers, who they are) from the session.

export function getAgendaDay(date: LocalDate): Promise<AgendaDay> {
  return apiRequest(`/panel/agenda?date=${date}`);
}

export function getBarberAgendaDay(date: LocalDate): Promise<BarberAgendaDay> {
  return apiRequest(`/panel/me/agenda?date=${date}`);
}
