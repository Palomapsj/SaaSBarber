// Field checks shared by the screens and the mock server. The screens use them to guide the
// user; the server checks again (never trust the browser). Messages are shown as they are.

export const NAME_ERROR = "Informe o nome";
export const PHONE_ERROR = "Informe um WhatsApp válido, com DDD";
export const EMAIL_ERROR = "Informe um e-mail válido";
export const PERCENT_ERROR = "Informe um número de 0 a 100";

/** At least 3 letters, ignoring spaces and punctuation. */
export function validatePersonName(name: string, message = NAME_ERROR): string | null {
  return name.replace(/[^\p{L}]/gu, "").length >= 3 ? null : message;
}

/** WhatsApp is a mobile number: area code (DDD) + 9 digits starting with 9. */
export function validateMobilePhone(digits: string): string | null {
  return /^[1-9]{2}9\d{8}$/.test(digits) ? null : PHONE_ERROR;
}

export function validateEmail(email: string): string | null {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()) ? null : EMAIL_ERROR;
}

/** Whole number from 0 to 100. */
export function validatePercent(value: number): string | null {
  return Number.isInteger(value) && value >= 0 && value <= 100 ? null : PERCENT_ERROR;
}
