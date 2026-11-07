import { useCallback, useSyncExternalStore } from "react";
import type { BarberSelection, IsoDateTime, LocalDate } from "@/lib/api/types";

// The client's choices while going through the booking steps. Kept in sessionStorage
// (per tab, per barbershop) so a refresh keeps them and personal data never goes in the URL.
// Nothing is kept after the tab is closed (decision: name and WhatsApp are not remembered).

export type BarberChoice = BarberSelection;

export type BookingDraft = {
  serviceIds: string[];
  barber: BarberChoice | null;
  date: LocalDate | null;
  startsAt: IsoDateTime | null;
  customerName: string;
  /** Digits only, e.g. "11987654321". */
  customerPhone: string;
  /** Repeat automatically at the barbershop's interval. */
  recurring: boolean;
};

export const EMPTY_DRAFT: BookingDraft = {
  serviceIds: [],
  barber: null,
  date: null,
  startsAt: null,
  customerName: "",
  customerPhone: "",
  recurring: false,
};

/** After a confirmed booking: forget the choices, keep name and WhatsApp for this tab. */
export function clearBookingChoices(draft: BookingDraft): BookingDraft {
  return { ...EMPTY_DRAFT, customerName: draft.customerName, customerPhone: draft.customerPhone };
}

const cache = new Map<string, BookingDraft>();
const listeners = new Set<() => void>();

const storageKey = (slug: string) => `booking:${slug}`;

function parseBarberChoice(value: unknown): BarberChoice | null {
  if (typeof value !== "object" || value === null) return null;
  const choice = value as Record<string, unknown>;
  if (choice.kind === "any") return { kind: "any" };
  if (choice.kind === "barber" && typeof choice.barberId === "string") {
    return { kind: "barber", barberId: choice.barberId };
  }
  return null;
}

function parseDraft(value: unknown): BookingDraft {
  if (typeof value !== "object" || value === null) return EMPTY_DRAFT;
  const { serviceIds, barber, date, startsAt, customerName, customerPhone, recurring } = value as Record<
    string,
    unknown
  >;
  const validIds = Array.isArray(serviceIds) && serviceIds.every((id) => typeof id === "string");
  return {
    serviceIds: validIds ? serviceIds : [],
    barber: parseBarberChoice(barber),
    date: typeof date === "string" ? date : null,
    startsAt: typeof startsAt === "string" ? startsAt : null,
    customerName: typeof customerName === "string" ? customerName : "",
    customerPhone: typeof customerPhone === "string" ? customerPhone.replace(/\D/g, "") : "",
    recurring: recurring === true,
  };
}

function readDraft(slug: string): BookingDraft {
  const cached = cache.get(slug);
  if (cached) return cached;
  let draft = EMPTY_DRAFT;
  try {
    const raw = sessionStorage.getItem(storageKey(slug));
    if (raw) draft = parseDraft(JSON.parse(raw));
  } catch {
    // Blocked storage or corrupted value: start from an empty draft.
  }
  cache.set(slug, draft);
  return draft;
}

function writeDraft(slug: string, draft: BookingDraft): void {
  cache.set(slug, draft);
  try {
    sessionStorage.setItem(storageKey(slug), JSON.stringify(draft));
  } catch {
    // Storage can be blocked; the draft still lives in memory for this page.
  }
  listeners.forEach((notify) => notify());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Returns `null` while the stored draft is not known yet (server render and hydration),
 * so screens can tell "still loading" apart from "nothing chosen".
 */
export function useBookingDraft(slug: string) {
  const draft = useSyncExternalStore<BookingDraft | null>(
    subscribe,
    () => readDraft(slug),
    () => null,
  );
  const update = useCallback(
    (change: (current: BookingDraft) => BookingDraft) => writeDraft(slug, change(readDraft(slug))),
    [slug],
  );
  return [draft, update] as const;
}

/** Test helper: forget cached drafts so each test starts clean. */
export function resetBookingDraftCache(): void {
  cache.clear();
}
