/** Brazilian phone: "11987654321" → "(11) 98765-4321". Unknown formats are returned as given. */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return value;
}

/**
 * Digits typed in a masked phone field. Deleting a mask character ("-", ")", " ") would change
 * nothing, so it removes the digit before it instead.
 */
export function phoneDigitsFromInput(value: string, previousDigits: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  const deletedMaskCharacter = value.length < formatPhoneInput(previousDigits).length && digits === previousDigits;
  return deletedMaskCharacter ? digits.slice(0, -1) : digits;
}

/** Mask applied while typing: "1198" → "(11) 98", "11987654321" → "(11) 98765-4321". Max 11 digits. */
export function formatPhoneInput(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  const areaCode = d.slice(0, 2);
  const rest = d.slice(2);
  if (rest.length <= 4) return `(${areaCode}) ${rest}`;
  const split = d.length === 11 ? 5 : 4;
  return `(${areaCode}) ${rest.slice(0, split)}-${rest.slice(split)}`;
}
