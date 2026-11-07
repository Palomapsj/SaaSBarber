import type { LocalDate } from "@/lib/api/types";
import { formatLongDate, shiftDate } from "@/lib/format/date";

const navButton =
  "flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-text hover:bg-card2";

// ‹ "Terça, 22 de setembro" › (prototype: admin/agenda.html and barbeiro/agenda.html).
export function DayNavigator({ date, onChange }: { date: LocalDate; onChange: (date: LocalDate) => void }) {
  return (
    <div className="flex w-full items-center gap-2.5 md:w-auto">
      <button type="button" aria-label="Dia anterior" onClick={() => onChange(shiftDate(date, -1))} className={navButton}>
        ‹
      </button>
      <h2 className="min-w-[180px] flex-1 text-center font-display text-[15px] font-semibold md:flex-none" aria-live="polite">
        {formatLongDate(date)}
      </h2>
      <button type="button" aria-label="Próximo dia" onClick={() => onChange(shiftDate(date, 1))} className={navButton}>
        ›
      </button>
    </div>
  );
}
