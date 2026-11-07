import type { AvailableDay, LocalDate } from "@/lib/api/types";
import { formatDayChip, formatLongDate } from "@/lib/format/date";

type DayChipsProps = {
  days: AvailableDay[];
  selectedDate: LocalDate | null;
  onSelect: (date: LocalDate) => void;
};

// Horizontal, scrollable row of days. Full days are struck through, dimmed and not selectable.
export function DayChips({ days, selectedDate, onSelect }: DayChipsProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Dia"
      className="-mt-1 flex gap-2 overflow-x-auto px-5 pt-1 pb-[18px] [scrollbar-width:none] md:px-8"
    >
      {days.map((day) => {
        const { weekday, day: dayNumber } = formatDayChip(day.date);
        const selected = day.date === selectedDate;
        const full = !day.hasFreeSlots;
        const tone = selected
          ? "bg-accent text-on-accent"
          : full
            ? "cursor-not-allowed bg-transparent text-muted2 line-through"
            : "cursor-pointer bg-card text-text";

        return (
          <label
            key={day.date}
            className={`flex min-w-[46px] shrink-0 flex-col items-center gap-1 rounded-xl px-1 py-2.5 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-accent ${tone}`}
          >
            <input
              type="radio"
              name="day"
              checked={selected}
              disabled={full}
              onChange={() => onSelect(day.date)}
              aria-label={`${formatLongDate(day.date)}${full ? ", lotado" : ""}`}
              className="sr-only"
            />
            <span className={`text-[11px] uppercase ${selected || full ? "" : "text-muted"}`}>{weekday}</span>
            <span className="font-display text-[15px] font-bold">{dayNumber}</span>
          </label>
        );
      })}
    </div>
  );
}
