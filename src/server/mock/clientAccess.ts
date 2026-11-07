import "server-only";
import type { Appointment, IsoDateTime, MyAppointment } from "@/lib/api/types";
import { barbershopById } from "./catalog";
import type { MockAccessRecord, MockDb } from "./db";
import { MockApiError } from "./errors";
import { toAppointment } from "./records";

// "Meus agendamentos" through the client's access code (docs/adr/002-acesso-cliente-sem-conta.md).

const VALID_DAYS_AFTER_LAST_APPOINTMENT = 30;

/** 256 random bits, base64url (43 characters). */
function newToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Reuses the client's code in this barbershop and extends it until 30 days after `lastStartsAt`. */
export function issueAccess(db: MockDb, barbershopId: string, phone: string, lastStartsAt: IsoDateTime): MockAccessRecord {
  const expiresAt = new Date(new Date(lastStartsAt).getTime() + VALID_DAYS_AFTER_LAST_APPOINTMENT * 86_400_000).toISOString();
  const existing = db.clientAccess.find((r) => r.barbershopId === barbershopId && r.phone === phone && !r.revoked);
  if (existing) {
    if (expiresAt > existing.expiresAt) existing.expiresAt = expiresAt;
    return existing;
  }
  const created: MockAccessRecord = { token: newToken(), barbershopId, phone, expiresAt, revoked: false };
  db.clientAccess.push(created);
  return created;
}

function phoneFor(db: MockDb, barbershopId: string, token: string, now: Date): string {
  const record = db.clientAccess.find((r) => r.token === token && r.barbershopId === barbershopId);
  if (!record || record.revoked || new Date(record.expiresAt) <= now) {
    throw new MockApiError(401, "INVALID_ACCESS", "Invalid client access");
  }
  return record.phone;
}

function canChange(db: MockDb, appointment: Appointment, now: Date): boolean {
  const notice = barbershopById(db, appointment.barbershopId).cancellationNoticeHours;
  return appointment.status === "confirmed" && now.getTime() < new Date(appointment.startsAt).getTime() - notice * 3_600_000;
}

// GET /barbershops/{id}/me/appointments — read only, no side effects.
export function myAppointments(db: MockDb, barbershopId: string, token: string, now: Date): MyAppointment[] {
  const phone = phoneFor(db, barbershopId, token, now);
  return db.appointments
    .filter((r) => r.barbershopId === barbershopId && r.customerPhone === phone)
    .map(toAppointment)
    .map((a) => ({ ...a, canChange: canChange(db, a, now) }))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

// POST /barbershops/{id}/me/appointments/{appointmentId}/cancel
export function cancelMyAppointment(db: MockDb, barbershopId: string, token: string, appointmentId: string, now: Date): void {
  const phone = phoneFor(db, barbershopId, token, now);
  const record = db.appointments.find((r) => r.id === appointmentId && r.barbershopId === barbershopId && r.customerPhone === phone);
  if (!record) throw new MockApiError(401, "INVALID_ACCESS", "Invalid client access");
  if (!canChange(db, record, now)) throw new MockApiError(409, "CHANGE_NOT_ALLOWED", "Appointment can no longer be changed");
  record.status = "cancelled";
}

/**
 * POST /barbershops/{id}/client-access/resend — always answers the same, so nobody can find out
 * whether a number is a client. Returns the link that the real API would send by WhatsApp
 * (the mock prints it in development instead).
 */
export function resendAccessLink(db: MockDb, barbershopId: string, phone: string): MockAccessRecord | null {
  const latest = db.appointments
    .filter((r) => r.barbershopId === barbershopId && r.customerPhone === phone)
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt))[0];
  return latest ? issueAccess(db, barbershopId, phone, latest.startsAt) : null;
}
