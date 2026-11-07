import { useCallback, useSyncExternalStore } from "react";

// The client's access code for "Meus agendamentos", remembered on this device per barbershop
// (docs/adr/002-acesso-cliente-sem-conta.md). Only the code is stored, never name or phone.

const storageKey = (slug: string) => `client-access:${slug}`;
const listeners = new Set<() => void>();

export function readClientAccess(slug: string): string | null {
  try {
    return localStorage.getItem(storageKey(slug));
  } catch {
    return null;
  }
}

export function saveClientAccess(slug: string, token: string): void {
  try {
    localStorage.setItem(storageKey(slug), token);
  } catch {
    // Storage blocked: the client can still use the WhatsApp link.
  }
  listeners.forEach((notify) => notify());
}

export function clearClientAccess(slug: string): void {
  try {
    localStorage.removeItem(storageKey(slug));
  } catch {
    // Nothing to clear.
  }
  listeners.forEach((notify) => notify());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** `undefined` while not known yet (server render and hydration), then the code or `null`. */
export function useClientAccess(slug: string) {
  const token = useSyncExternalStore<string | null | undefined>(
    subscribe,
    () => readClientAccess(slug),
    () => undefined,
  );
  const save = useCallback((value: string) => saveClientAccess(slug, value), [slug]);
  const clear = useCallback(() => clearClientAccess(slug), [slug]);
  return { token, save, clear };
}
