// Service fields, shared by the admin form and the mock server.

export const SERVICE_NAME_ERROR = "Informe o nome do serviço";
export const CATEGORY_ERROR = "Informe a categoria";
export const DURATION_ERROR = "Informe de 5 a 240 minutos";
export const PRICE_ERROR = "Informe um preço válido";
export const SERVICE_NAME_TAKEN = "Já existe um serviço com este nome";

export const MIN_DURATION = 5;
export const MAX_DURATION = 240;

export function validateServiceName(name: string): string | null {
  return name.trim().length >= 3 ? null : SERVICE_NAME_ERROR;
}

export function validateCategoryName(name: string): string | null {
  return name.trim().length >= 2 ? null : CATEGORY_ERROR;
}

export function validateDuration(minutes: number): string | null {
  return Number.isInteger(minutes) && minutes >= MIN_DURATION && minutes <= MAX_DURATION ? null : DURATION_ERROR;
}

/** Cents, from R$ 0,00 to R$ 9.999,99. */
export function validatePriceCents(cents: number): string | null {
  return Number.isInteger(cents) && cents >= 0 && cents <= 999_999 ? null : PRICE_ERROR;
}

/** "45" → 4500, "45,5" → 4550, "45,50" / "45.50" → 4550, "1.234,56" → 123456; NaN when not a price. */
export function parsePriceToCents(text: string): number {
  const value = text.trim().replace(/^R\$\s*/i, "");
  const match = /^(\d{1,3}(?:\.\d{3})+|\d+)(?:[,.](\d{1,2}))?$/.exec(value);
  if (!match) return Number.NaN;
  const reais = Number(match[1].replace(/\./g, ""));
  const cents = Number((match[2] ?? "0").padEnd(2, "0"));
  return reais * 100 + cents;
}

/** 4500 → "45", 4550 → "45,50" (for the form field). */
export function centsToPriceInput(cents: number): string {
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2).replace(".", ",");
}
