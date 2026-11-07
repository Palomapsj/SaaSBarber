import type { IsoDateTime, TimeSlot } from "@/lib/api/types";
import { formatTime } from "@/lib/format/date";

type TimeSlotGridProps = {
  /** `null` while loading. */
  slots: TimeSlot[] | null;
  selectedStartsAt: IsoDateTime | null;
  onSelect: (startsAt: IsoDateTime) => void;
};

// Three-column grid of times. Taken times are struck through, dimmed and not selectable.
export function TimeSlotGrid({ slots, selectedStartsAt, onSelect }: TimeSlotGridProps) {
  if (slots === null) {
    return (
      <div
        role="status"
        aria-label="Carregando horários"
        className="content-width grid animate-pulse grid-cols-3 gap-2.5 px-5 md:grid-cols-6 md:px-8"
      >
        {Array.from({ length: 9 }, (_, index) => (
          <div key={index} className="h-[41px] rounded-[10px] bg-card" />
        ))}
      </div>
    );
  }

  return (
    <div role="radiogroup" aria-label="Horário" className="grid grid-cols-3 gap-2.5 px-5 md:grid-cols-6 md:px-8">
      {slots.map((slot) => {
        const time = formatTime(slot.startsAt);
        const selected = slot.available && slot.startsAt === selectedStartsAt;
        const tone = selected
          ? "border-transparent bg-accent font-bold text-on-accent"
          : slot.available
            ? "cursor-pointer border-border bg-card font-medium text-text"
            : "cursor-not-allowed border-border bg-transparent font-medium text-muted2 line-through";

        return (
          <label
            key={slot.startsAt}
            className={`rounded-[10px] border py-3 text-center text-[13px] has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-accent ${tone}`}
          >
            <input
              type="radio"
              name="time"
              checked={selected}
              disabled={!slot.available}
              onChange={() => onSelect(slot.startsAt)}
              aria-label={slot.available ? time : `${time}, indisponível`}
              className="sr-only"
            />
            {time}
          </label>
        );
      })}
    </div>
  );
}
