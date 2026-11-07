import { Switch } from "@/components/ui/Switch";
import { WEEKDAY_NAMES } from "@/features/horarios/scheduleText";
import type { DaySchedule } from "@/lib/api/scheduleTypes";
import { TimeInput } from "./TimeInput";

type DayScheduleRowProps = {
  day: DaySchedule;
  onChange: (day: DaySchedule) => void;
  error: string | null;
  disabled: boolean;
};

const word = "text-[12px] text-muted";

// One weekday of "Horário semanal" (prototype: switch, day, "Das 09:00 às 20:00", "Intervalo").
// On the phone the times go to a second line.
export function DayScheduleRow({ day, onChange, error, disabled }: DayScheduleRowProps) {
  const name = WEEKDAY_NAMES[day.weekday];
  const errorId = `day-${day.weekday}-error`;
  const set = (patch: Partial<DaySchedule>) => onChange({ ...day, ...patch });

  return (
    <div id={`day-${day.weekday}`} className="border-b border-border py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
        <div className="flex items-center gap-4">
          <Switch
            checked={day.working}
            onChange={(working) => set({ working })}
            label={`Trabalha ${name.toLowerCase()}`}
            disabled={disabled}
            describedBy={error ? errorId : undefined}
          />
          <span className={`w-[90px] text-[13px] ${day.working ? "font-semibold text-text" : "text-muted"}`}>{name}</span>
        </div>

        {day.working ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
            <div className="flex items-center gap-2.5">
              <span className={word} aria-hidden="true">Das</span>
              <TimeInput label={`${name}: início`} value={day.start} onChange={(start) => set({ start })}
                invalid={Boolean(error)} disabled={disabled} />
              <span className={word} aria-hidden="true">às</span>
              <TimeInput label={`${name}: fim`} value={day.end} onChange={(end) => set({ end })}
                invalid={Boolean(error)} disabled={disabled} />
            </div>
            <div className="flex items-center gap-2.5 md:ml-3">
              <span className={word} aria-hidden="true">Intervalo</span>
              <TimeInput label={`${name}: início do intervalo`} value={day.breakStart ?? ""}
                onChange={(value) => set({ breakStart: value || null })} invalid={Boolean(error)} disabled={disabled} />
              <span className={word} aria-hidden="true">–</span>
              <TimeInput label={`${name}: fim do intervalo`} value={day.breakEnd ?? ""}
                onChange={(value) => set({ breakEnd: value || null })} invalid={Boolean(error)} disabled={disabled} />
            </div>
          </div>
        ) : (
          <span className="text-[12px] text-muted2">Folga</span>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-[12px] text-accent">
          {name}: {error}
        </p>
      )}
    </div>
  );
}
