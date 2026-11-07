import type { PanelBarber, PanelBarberInput } from "@/lib/api/types";
import { validateEmail, validateMobilePhone, validatePercent, validatePersonName } from "@/lib/validation/person";

// The "Profissionais" form: what the admin types, and the checks shown before sending.
// The API validates again and its messages win (e.g. "Este e-mail já está em uso").

export type BarberFormValues = {
  name: string;
  /** Kept as typed, so the field can be empty while editing. */
  commission: string;
  /** Digits only. */
  phone: string;
  email: string;
  serviceIds: string[];
  active: boolean;
};

export type BarberFormField = "name" | "commissionPercent" | "phone" | "email" | "serviceIds";
export type BarberFormErrors = Partial<Record<BarberFormField, string>>;

export const SERVICES_ERROR = "Escolha ao menos um serviço";

export const EMPTY_BARBER_FORM: BarberFormValues = {
  name: "",
  commission: "",
  phone: "",
  email: "",
  serviceIds: [],
  active: true,
};

export function formValuesOf(barber: PanelBarber): BarberFormValues {
  return {
    name: barber.name,
    commission: String(barber.commissionPercent),
    phone: barber.phone,
    email: barber.email,
    serviceIds: barber.serviceIds,
    active: barber.active,
  };
}

export function toBarberInput(values: BarberFormValues): PanelBarberInput {
  return {
    name: values.name.trim(),
    commissionPercent: values.commission.trim() === "" ? Number.NaN : Number(values.commission),
    phone: values.phone,
    email: values.email.trim(),
    serviceIds: values.serviceIds,
    active: values.active,
  };
}

export function validateBarberForm(values: BarberFormValues): BarberFormErrors {
  const input = toBarberInput(values);
  const errors: BarberFormErrors = {};
  const set = (field: BarberFormField, error: string | null) => {
    if (error) errors[field] = error;
  };
  set("name", validatePersonName(input.name));
  set("commissionPercent", validatePercent(input.commissionPercent));
  set("phone", validateMobilePhone(input.phone));
  set("email", validateEmail(input.email));
  set("serviceIds", input.serviceIds.length > 0 ? null : SERVICES_ERROR);
  return errors;
}

/** "Cabelo · Barba · 40% comissão" (prototype list line). */
export function barberSummary(barber: PanelBarber): string {
  return [...barber.specialties, `${barber.commissionPercent}% comissão`].join(" · ");
}
