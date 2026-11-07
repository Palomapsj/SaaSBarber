import { PHONE_ERROR, validateMobilePhone, validatePersonName } from "@/lib/validation/person";

// Form checks for the "Seus dados" step. They only guide the client; the API validates again.

export const NAME_ERROR = "Informe seu nome";
export { PHONE_ERROR };

export function validateName(name: string): string | null {
  return validatePersonName(name, NAME_ERROR);
}

export const validatePhone = validateMobilePhone;

export function isCustomerValid(name: string, phoneDigits: string): boolean {
  return validateName(name) === null && validatePhone(phoneDigits) === null;
}
