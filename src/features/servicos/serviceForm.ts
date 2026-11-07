import type { PanelService, PanelServiceInput, ServiceCategory } from "@/lib/api/types";
import { formatDuration } from "@/lib/format/duration";
import {
  centsToPriceInput,
  parsePriceToCents,
  validateCategoryName,
  validateDuration,
  validatePriceCents,
  validateServiceName,
} from "@/lib/validation/service";

// The "Serviços" form: what the admin types, and the checks shown before sending.
// The API validates again and its messages win (e.g. "Já existe um serviço com este nome").

export type ServiceFormValues = {
  name: string;
  categoryName: string;
  /** Kept as typed, so the fields can be empty while editing. */
  duration: string;
  price: string;
  barberIds: string[];
  active: boolean;
};

export type ServiceFormField = "name" | "categoryName" | "durationMinutes" | "priceCents";
export type ServiceFormErrors = Partial<Record<ServiceFormField, string>>;

export const EMPTY_SERVICE_FORM: ServiceFormValues = {
  name: "",
  categoryName: "",
  duration: "",
  price: "",
  barberIds: [],
  active: true,
};

export function serviceFormValuesOf(service: PanelService, categories: ServiceCategory[]): ServiceFormValues {
  return {
    name: service.name,
    categoryName: categories.find((c) => c.id === service.categoryId)?.name ?? "",
    duration: String(service.durationMinutes),
    price: centsToPriceInput(service.priceCents),
    barberIds: service.barberIds,
    active: service.active,
  };
}

export function toServiceInput(values: ServiceFormValues): PanelServiceInput {
  return {
    name: values.name.trim(),
    categoryName: values.categoryName.trim(),
    durationMinutes: values.duration.trim() === "" ? Number.NaN : Number(values.duration),
    priceCents: parsePriceToCents(values.price),
    barberIds: values.barberIds,
    active: values.active,
  };
}

export function validateServiceForm(values: ServiceFormValues): ServiceFormErrors {
  const input = toServiceInput(values);
  const errors: ServiceFormErrors = {};
  const set = (field: ServiceFormField, error: string | null) => {
    if (error) errors[field] = error;
  };
  set("name", validateServiceName(input.name));
  set("categoryName", validateCategoryName(input.categoryName));
  set("durationMinutes", validateDuration(input.durationMinutes));
  set("priceCents", validatePriceCents(input.priceCents));
  return errors;
}

/** "Cabelo · 30 min" (prototype list line). */
export function serviceSummary(service: PanelService, categories: ServiceCategory[]): string {
  const category = categories.find((c) => c.id === service.categoryId)?.name;
  return [category, formatDuration(service.durationMinutes)].filter(Boolean).join(" · ");
}
