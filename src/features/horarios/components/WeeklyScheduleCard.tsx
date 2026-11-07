"use client";

import { type FormEvent, useEffect, useState } from "react";
import { outsideWarning, sameWeekly } from "@/features/horarios/scheduleText";
import { type ScheduleOwner, ValidationError, saveWeekly } from "@/lib/api/panel/schedules";
import type { DaySchedule } from "@/lib/api/scheduleTypes";
import type { OpeningHours } from "@/lib/api/types";
import { validateWeekly } from "@/lib/validation/schedule";
import { DayScheduleRow } from "./DayScheduleRow";

type WeeklyScheduleCardProps = {
  owner: ScheduleOwner;
  title: string;
  weekly: DaySchedule[];
  shopHours: OpeningHours[];
  /** Tells the page when there are unsaved changes (the admin is warned before switching barber). */
  onDirtyChange?: (dirty: boolean) => void;
};

type Notice = { kind: "success" | "warning" | "error"; text: string };

const NOTICE_COLOR: Record<Notice["kind"], string> = { success: "text-success", warning: "text-text", error: "text-accent" };

// Prototype: "Horário semanal" card of admin/horarios.html and barbeiro/horarios.html.
// Decision: changes are kept on screen until "Salvar horários".
export function WeeklyScheduleCard({ owner, title, weekly, shopHours, onDirtyChange }: WeeklyScheduleCardProps) {
  const [saved, setSaved] = useState(weekly);
  const [draft, setDraft] = useState(weekly);
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const dirty = !sameWeekly(draft, saved);
  useEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange]);

  const clientErrors = validateWeekly(draft, shopHours);
  const errorOf = (weekday: number) =>
    submitted ? (serverErrors[String(weekday)] ?? clientErrors[weekday] ?? null) : null;

  function change(day: DaySchedule) {
    setDraft((current) => current.map((d) => (d.weekday === day.weekday ? day : d)));
    setServerErrors((current) => {
      const next = { ...current };
      delete next[String(day.weekday)];
      return next;
    });
    setNotice(null);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    setNotice(null);
    const firstInvalid = draft.find((d) => clientErrors[d.weekday]);
    if (firstInvalid) {
      const row = document.getElementById(`day-${firstInvalid.weekday}`);
      (row?.querySelector<HTMLElement>("input") ?? row?.querySelector<HTMLElement>("button"))?.focus();
      return;
    }
    setSaving(true);
    try {
      const result = await saveWeekly(owner, draft);
      setSaved(result.saved);
      setDraft(result.saved);
      setSubmitted(false);
      setNotice(
        result.outsideCount > 0
          ? { kind: "warning", text: outsideWarning(result.outsideCount) }
          : { kind: "success", text: "Horários salvos." },
      );
    } catch (error) {
      if (error instanceof ValidationError) setServerErrors(error.fields);
      else setNotice({ kind: "error", text: "Não foi possível salvar. Tente novamente." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form noValidate onSubmit={submit} aria-labelledby="weekly-title" className="rounded-2xl border border-border bg-card px-5 py-5 md:px-6">
      <h2 id="weekly-title" className="pb-2 text-[12px] font-semibold tracking-[0.5px] text-muted uppercase">{title}</h2>
      {draft.map((day) => (
        <DayScheduleRow
          key={day.weekday}
          day={day}
          onChange={change}
          error={errorOf(day.weekday)}
          disabled={saving}
        />
      ))}
      <div className="flex flex-col items-stretch gap-2 pt-4 md:flex-row md:items-center md:justify-end md:gap-4">
        <p aria-live="polite" className={`text-[12px] md:text-right ${notice ? NOTICE_COLOR[notice.kind] : ""}`}>
          {notice?.text ?? (dirty ? "Alterações não salvas." : null)}
        </p>
        <button type="submit" disabled={saving} aria-busy={saving}
          className="rounded-[10px] bg-accent px-6 py-3 font-display text-[14px] font-bold tracking-[0.5px] text-on-accent uppercase disabled:opacity-70">
          {saving ? "Salvando…" : "Salvar horários"}
        </button>
      </div>
    </form>
  );
}
