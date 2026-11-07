import "server-only";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { DaySchedule, ScheduleBlock } from "@/lib/api/scheduleTypes";
import type { Appointment, Barbershop, IsoDateTime, Service, ServiceCategory } from "@/lib/api/types";
import { initialDb } from "./seed";

// The mock "server" database. Kept in a local JSON file (MOCK_DB_FILE, default .data/mock-db.json,
// ignored by git) so route handlers and server components, which Next.js may load as separate
// module instances, always see the same data. Tests run in memory only.

export type MockBarber = {
  id: string;
  name: string;
  serviceIds: string[];
  active: boolean;
  commissionPercent: number;
  phone: string;
  email: string;
  /** The sample barbers get generated sample appointments; barbers created later do not. */
  hasSampleAgenda: boolean;
};

export type MockAdmin = { id: string; barbershopId: string; name: string; email: string; phone: string };

/** The appointment plus the client's name and WhatsApp (the client screens never get them back). */
export type MockAppointmentRecord = Appointment & { customerName: string; customerPhone: string };

/** Client access code (docs/adr/002). The real API stores only a hash of it. */
export type MockAccessRecord = {
  token: string;
  barbershopId: string;
  phone: string;
  expiresAt: IsoDateTime;
  revoked: boolean;
};

export type MockDb = {
  barbershops: Barbershop[];
  categories: Record<string, ServiceCategory[]>;
  services: Record<string, Service[]>;
  barbers: Record<string, MockBarber[]>;
  admins: MockAdmin[];
  appointments: MockAppointmentRecord[];
  clientAccess: MockAccessRecord[];
  /**
   * Weekly hours by barber id. Optional: a barber without an entry (and files saved before
   * schedules existed) uses the default from the barbershop's opening hours.
   */
  schedules?: Record<string, DaySchedule[]>;
  scheduleBlocks?: ScheduleBlock[];
};

function dbFile(): string | null {
  if (process.env.NODE_ENV === "test" || !fileWritable) return null;
  // On Vercel only /tmp can be written (per instance, erased from time to time): fine for a demo.
  const fallback = process.env.VERCEL ? "/tmp/mock-db.json" : ".data/mock-db.json";
  return resolve(process.cwd(), process.env.MOCK_DB_FILE || fallback);
}

let memory: MockDb | null = null;
/** Turns false after a failed write: from then on the data lives in memory only. */
let fileWritable = true;

export function readDb(): MockDb {
  const file = dbFile();
  if (file) {
    try {
      if (existsSync(file)) return JSON.parse(readFileSync(file, "utf8")) as MockDb;
    } catch {
      // Corrupted file: start again from the initial data below.
    }
    const fresh = initialDb();
    writeDb(fresh);
    if (fileWritable) return fresh;
  }
  memory ??= initialDb();
  return memory;
}

export function writeDb(db: MockDb): void {
  memory = db;
  const file = dbFile();
  if (!file) return;
  try {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify(db, null, 2));
  } catch {
    // Read-only file system: keep the data in memory from now on.
    fileWritable = false;
  }
}

/** Reads, changes and saves the database in one step. */
export function updateDb<T>(change: (db: MockDb) => T): T {
  const db = readDb();
  const result = change(db);
  writeDb(db);
  return result;
}

/** Test helper: back to the initial data. */
export function resetMockDb(): void {
  memory = initialDb();
}
