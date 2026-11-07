import type { BookingDraft } from "@/features/agendamento/booking/bookingDraft";
import { type ResourceState, useAsyncResource } from "@/lib/hooks/useAsyncResource";
import { type AvailabilityQuery, getAvailableDays, getTimeSlots } from "@/lib/api/availability";
import type { AvailableDay, LocalDate, TimeSlot } from "@/lib/api/types";

export type Availability = {
  days: ResourceState<AvailableDay[]>;
  /** The stored day if still bookable, otherwise the first day with free slots. */
  selectedDate: LocalDate | null;
  slots: ResourceState<TimeSlot[]>;
  /** The stored time if it is still free on the selected day. */
  selectedSlot: TimeSlot | null;
};

function queryKey(query: AvailabilityQuery): string {
  const barber = query.barber.kind === "any" ? "any" : query.barber.barberId;
  return `${query.barbershopId}|${query.serviceIds.join(",")}|${barber}`;
}

/** Pass a `null` draft (still loading or incomplete) to skip loading. */
export function useAvailability(barbershopId: string, draft: BookingDraft | null): Availability {
  const query: AvailabilityQuery | null =
    draft && draft.serviceIds.length > 0 && draft.barber
      ? { barbershopId, serviceIds: draft.serviceIds, barber: draft.barber }
      : null;
  const key = query ? queryKey(query) : null;

  const days = useAsyncResource(key, () => (query ? getAvailableDays(query) : Promise.resolve([])));

  const bookableDays = days.status === "ready" ? days.data.filter((day) => day.hasFreeSlots) : [];
  const selectedDate =
    draft?.date && bookableDays.some((day) => day.date === draft.date) ? draft.date : (bookableDays[0]?.date ?? null);

  const slots = useAsyncResource(key && selectedDate ? `${key}|${selectedDate}` : null, () =>
    query && selectedDate ? getTimeSlots({ ...query, date: selectedDate }) : Promise.resolve([]),
  );

  const selectedSlot =
    slots.status === "ready" && draft?.startsAt && draft.date === selectedDate
      ? (slots.data.find((slot) => slot.available && slot.startsAt === draft.startsAt) ?? null)
      : null;

  return { days, selectedDate, slots, selectedSlot };
}
