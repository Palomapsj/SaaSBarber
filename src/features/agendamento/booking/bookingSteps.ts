import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { type BookingDraft, useBookingDraft } from "@/features/agendamento/booking/bookingDraft";
import { isCustomerValid } from "@/features/agendamento/customerValidation";

// Order of the booking steps and what each one must have filled in before moving on.
export const BOOKING_STEPS = ["servicos", "profissional", "data-horario", "dados", "confirmar"] as const;
export type BookingStep = (typeof BOOKING_STEPS)[number];

const isComplete: Record<Exclude<BookingStep, "confirmar">, (draft: BookingDraft) => boolean> = {
  servicos: (draft) => draft.serviceIds.length > 0,
  profissional: (draft) => draft.barber !== null,
  "data-horario": (draft) => draft.date !== null && draft.startsAt !== null,
  dados: (draft) => isCustomerValid(draft.customerName, draft.customerPhone),
};

/** The first earlier step that is not complete, or null when `step` can be shown. */
export function firstMissingStep(draft: BookingDraft, step: BookingStep): BookingStep | null {
  for (const earlier of BOOKING_STEPS.slice(0, BOOKING_STEPS.indexOf(step))) {
    if (earlier !== "confirmar" && !isComplete[earlier](draft)) return earlier;
  }
  return null;
}

export function bookingStepHref(slug: string, step: BookingStep): string {
  return `/${slug}/agendar/${step}`;
}

/**
 * Draft for a booking step. If an earlier step is missing (direct link, new tab), sends the
 * client back to it. `draft` is null while loading or redirecting.
 */
export function useBookingStep(slug: string, step: BookingStep) {
  const router = useRouter();
  const [stored, updateDraft] = useBookingDraft(slug);
  const missing = stored ? firstMissingStep(stored, step) : null;

  useEffect(() => {
    if (missing) router.replace(bookingStepHref(slug, missing));
  }, [missing, router, slug]);

  return { draft: missing ? null : stored, updateDraft };
}
