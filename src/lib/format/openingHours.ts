import type { LocalTime, OpeningHours, Weekday } from "@/lib/api/types";

const WEEKDAY_SHORT: Record<Weekday, string> = {
  0: "Dom", 1: "Seg", 2: "Ter", 3: "Qua", 4: "Qui", 5: "Sex", 6: "Sáb",
};

// Week starts on Monday in the display ("Seg–Sáb").
const DISPLAY_ORDER: Weekday[] = [1, 2, 3, 4, 5, 6, 0];

/** "09:00" → "09h", "09:30" → "09h30" */
function formatHour(time: LocalTime): string {
  const [hours, minutes] = time.split(":");
  return minutes === "00" ? `${hours}h` : `${hours}h${minutes}`;
}

type Group = { first: Weekday; last: Weekday; opens: LocalTime; closes: LocalTime };

/**
 * Groups consecutive days with the same hours.
 * Mon–Sat 09:00–20:00 → "Seg–Sáb · 09h às 20h".
 * Different hours → "Seg–Sex · 09h às 20h, Sáb · 09h às 14h".
 */
export function formatOpeningHours(hours: OpeningHours[]): string {
  const byDay = new Map(hours.map((h) => [h.weekday, h]));
  const groups: Group[] = [];
  let previousWasOpen = false;

  for (const weekday of DISPLAY_ORDER) {
    const day = byDay.get(weekday);
    if (!day) {
      previousWasOpen = false;
      continue;
    }
    const current = groups.at(-1);
    if (previousWasOpen && current && current.opens === day.opens && current.closes === day.closes) {
      current.last = weekday;
    } else {
      groups.push({ first: weekday, last: weekday, opens: day.opens, closes: day.closes });
    }
    previousWasOpen = true;
  }

  return groups
    .map(({ first, last, opens, closes }) => {
      const days = first === last ? WEEKDAY_SHORT[first] : `${WEEKDAY_SHORT[first]}–${WEEKDAY_SHORT[last]}`;
      return `${days} · ${formatHour(opens)} às ${formatHour(closes)}`;
    })
    .join(", ");
}
