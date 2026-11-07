import type { MyAppointment } from "@/lib/api/types";

export type AppointmentTone = "success" | "muted" | "accent";

/** "Próximos": confirmed and not started yet, soonest first. "Histórico": the rest, latest first. */
export function splitAppointments(appointments: MyAppointment[], now: Date) {
  const isUpcoming = (a: MyAppointment) => a.status === "confirmed" && new Date(a.startsAt) >= now;
  return {
    upcoming: appointments.filter(isUpcoming).sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    history: appointments.filter((a) => !isUpcoming(a)).sort((a, b) => b.startsAt.localeCompare(a.startsAt)),
  };
}

/** Label and color of the status line on the card (only existing color tokens). */
export function appointmentStatus(appointment: MyAppointment, now: Date): { label: string; tone: AppointmentTone } {
  if (appointment.status === "cancelled") return { label: "Cancelado", tone: "accent" };
  if (appointment.status === "completed" || new Date(appointment.startsAt) < now) {
    return { label: "Concluído", tone: "muted" };
  }
  return { label: "Confirmado", tone: "success" };
}

/** "Corte de cabelo + Barba completa", with " (recorrente)" as in the prototype. */
export function appointmentTitle(appointment: MyAppointment): string {
  const services = appointment.services.map((service) => service.name).join(" + ");
  return appointment.recurrence ? `${services} (recorrente)` : services;
}
