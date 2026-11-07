import "server-only";
import type { PanelRole, PanelUser } from "@/lib/api/types";
import type { MockDb } from "./db";

// Panel login. Demo password for every account (admins and every registered barber, including
// the ones the admin creates: decision "login automático na simulação"). The real API checks
// hashed passwords and invitations.

export const DEMO_PASSWORD = "barbearia123";

type Account = PanelUser & { email: string; phone: string };

function accounts(db: MockDb): Account[] {
  const admins: Account[] = db.admins.map((a) => ({ ...a, role: "admin", barberId: null }));
  const barbers: Account[] = Object.entries(db.barbers).flatMap(([barbershopId, list]) =>
    list.map((b) => ({ id: `usr_${b.id}`, role: "barber" as const, barbershopId, barberId: b.id, name: b.name, email: b.email, phone: b.phone })),
  );
  return [...admins, ...barbers];
}

const toUser = ({ id, role, barbershopId, barberId, name }: Account): PanelUser => ({ id, role, barbershopId, barberId, name });

/** `identifier` is an e-mail or a phone number in any format. */
export function authenticate(db: MockDb, identifier: string, password: string): PanelUser | null {
  const value = identifier.trim().toLowerCase();
  const digits = value.replace(/\D/g, "");
  const account = accounts(db).find((a) => a.email.toLowerCase() === value || (digits.length >= 10 && a.phone === digits));
  return account && password === DEMO_PASSWORD ? toUser(account) : null;
}

/** Development shortcut behind the profile selector: the first admin, or Carlos for barbers. */
export function demoUser(db: MockDb, role: PanelRole): PanelUser {
  const account = accounts(db).find((a) => a.role === role);
  if (!account) throw new Error(`No demo user for role ${role}`);
  return toUser(account);
}

/** A barber's account still exists (removed barbers lose access on their next request). */
export function barberStillExists(db: MockDb, barbershopId: string, barberId: string): boolean {
  return (db.barbers[barbershopId] ?? []).some((b) => b.id === barberId);
}
