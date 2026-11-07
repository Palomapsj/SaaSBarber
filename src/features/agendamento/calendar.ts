import type { Address, Appointment } from "@/lib/api/types";
import { formatFullAddress } from "@/lib/format/address";

// Builds an iCalendar (.ics) file for "Adicionar ao calendário". It opens in Apple Calendar,
// Outlook and Google Calendar without any external service.

type CalendarInput = {
  appointment: Appointment;
  barbershopName: string;
  address: Address;
  now?: Date;
};

/** 2026-11-07T13:30:00.000Z → 20261107T133000Z */
function toIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

const encoder = new TextEncoder();

/**
 * Lines longer than 75 bytes continue on the next line, indented by one space (RFC 5545).
 * Counts UTF-8 bytes so accented letters are never split in half.
 */
function fold(line: string): string {
  const parts: string[] = [];
  let current = "";
  let bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    const limit = parts.length === 0 ? 75 : 74; // continuation lines start with a space
    if (bytes + size > limit) {
      parts.push(current);
      current = "";
      bytes = 0;
    }
    current += char;
    bytes += size;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

export function buildCalendarFile({ appointment, barbershopName, address, now = new Date() }: CalendarInput): string {
  const start = new Date(appointment.startsAt);
  const end = new Date(start.getTime() + appointment.durationMinutes * 60_000);
  const services = appointment.services.map((service) => service.name).join(" + ");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Barbershoop//Agendamento//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${appointment.id}@barbershoop`,
    `DTSTAMP:${toIcsDate(now)}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escapeText(`${services} · ${barbershopName}`)}`,
    `LOCATION:${escapeText(formatFullAddress(address))}`,
    `DESCRIPTION:${escapeText(`Profissional: ${appointment.barber.name}\nServiços: ${services}`)}`,
    ...(appointment.recurrence ? [`RRULE:FREQ=WEEKLY;INTERVAL=${appointment.recurrence.everyWeeks}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

/** Starts the download of the .ics file in the browser. */
export function downloadCalendarFile(content: string, fileName = "agendamento.ics"): void {
  const url = URL.createObjectURL(new Blob([content], { type: "text/calendar;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
