import type { Address } from "@/lib/api/types";

/** "Rua das Tesouras, 123 · Vila Nova" */
export function formatAddressLine(address: Address): string {
  return `${address.street}, ${address.number} · ${address.district}`;
}

/** "Rua das Tesouras, 123 - Vila Nova, São Paulo - SP", for calendars and maps. */
export function formatFullAddress(address: Address): string {
  return `${address.street}, ${address.number} - ${address.district}, ${address.city} - ${address.state}`;
}
