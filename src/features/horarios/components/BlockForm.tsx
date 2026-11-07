"use client";

import { type FormEvent, useState } from "react";
import { TextField } from "@/components/ui/TextField";
import { type ScheduleOwner, ValidationError, addBlock } from "@/lib/api/panel/schedules";
import type { ScheduleBlock, ScheduleBlockInput, ScheduleChangeResult } from "@/lib/api/scheduleTypes";
import type { LocalDate } from "@/lib/api/types";
import { type BlockField, validateBlock } from "@/lib/validation/schedule";

type BlockFormProps = {
  owner: ScheduleOwner;
  today: LocalDate;
  onSaved: (result: ScheduleChangeResult<ScheduleBlock>) => void;
  onCancel: () => void;
};

const FIELD_ORDER: BlockField[] = ["startDate", "endDate", "time", "reason"];
const FIELD_ID: Record<BlockField, string> = {
  startDate: "block-start-date",
  endDate: "block-end-date",
  time: "block-start-time",
  reason: "block-reason",
};

const KINDS: { kind: ScheduleBlockInput["kind"]; label: string }[] = [
  { kind: "days", label: "Dias inteiros" },
  { kind: "hours", label: "Algumas horas" },
];

// "Adicionar bloqueio" opens this form inside the card (decision: no modal). Whole days for
// vacation and days off, or some hours on one day (e.g. a doctor's appointment).
export function BlockForm({ owner, today, onSaved, onCancel }: BlockFormProps) {
  const [values, setValues] = useState<ScheduleBlockInput>({
    kind: "days", startDate: today, endDate: today, startTime: "", endTime: "", reason: "",
  });
  const [touched, setTouched] = useState<Set<BlockField>>(new Set());
  const [serverErrors, setServerErrors] = useState<Partial<Record<BlockField, string>>>({});
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const input: ScheduleBlockInput =
    values.kind === "hours"
      ? { ...values, endDate: values.startDate }
      : { ...values, startTime: null, endTime: null };
  const clientErrors = validateBlock(input);
  const errorOf = (field: BlockField) => (touched.has(field) ? (serverErrors[field] ?? clientErrors[field] ?? null) : null);
  const touch = (field: BlockField) => setTouched((current) => new Set(current).add(field));
  const change = (field: BlockField | null, patch: Partial<ScheduleBlockInput>) => {
    setValues((current) => ({ ...current, ...patch }));
    if (field) setServerErrors((current) => ({ ...current, [field]: undefined }));
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    setTouched(new Set(FIELD_ORDER));
    setFailed(false);
    const firstInvalid = FIELD_ORDER.find((field) => clientErrors[field]);
    if (firstInvalid) return document.getElementById(FIELD_ID[firstInvalid])?.focus();
    setSaving(true);
    try {
      onSaved(await addBlock(owner, input));
    } catch (error) {
      if (error instanceof ValidationError) setServerErrors(error.fields as Partial<Record<BlockField, string>>);
      else setFailed(true);
      setSaving(false);
    }
  }

  return (
    <form noValidate onSubmit={submit} aria-label="Novo bloqueio" className="flex flex-col gap-4 rounded-[10px] bg-card2 p-4">
      <div role="radiogroup" aria-label="Tipo de bloqueio" className="flex flex-wrap gap-2">
        {KINDS.map(({ kind, label }) => (
          <button key={kind} type="button" role="radio" aria-checked={values.kind === kind}
            onClick={() => change(null, { kind })}
            className={`rounded-full border px-[13px] py-[7px] text-[12px] font-semibold ${
              values.kind === kind ? "border-accent bg-accent text-on-accent" : "border-border bg-card text-muted"
            }`}>
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TextField id={FIELD_ID.startDate} type="date" label={values.kind === "days" ? "De" : "Dia"} min={today}
          value={values.startDate} error={errorOf("startDate")} onBlur={() => touch("startDate")}
          onChange={(e) => change("startDate", { startDate: e.target.value })} />
        {values.kind === "days" ? (
          <TextField id={FIELD_ID.endDate} type="date" label="Até" min={values.startDate || today}
            value={values.endDate} error={errorOf("endDate")} onBlur={() => touch("endDate")}
            onChange={(e) => change("endDate", { endDate: e.target.value })} />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <TextField id={FIELD_ID.time} type="time" step={300} label="Das" value={values.startTime ?? ""}
              error={errorOf("time")} onBlur={() => touch("time")}
              onChange={(e) => change("time", { startTime: e.target.value })} />
            <TextField id="block-end-time" type="time" step={300} label="Às" value={values.endTime ?? ""}
              onBlur={() => touch("time")} onChange={(e) => change("time", { endTime: e.target.value })} />
          </div>
        )}
      </div>

      <TextField id={FIELD_ID.reason} label="Motivo" placeholder="Ex: Férias, consulta médica" autoComplete="off" maxLength={60}
        value={values.reason} error={errorOf("reason")} onBlur={() => touch("reason")}
        onChange={(e) => change("reason", { reason: e.target.value })} />

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-end md:gap-3">
        {failed && <p role="alert" className="text-[12px] text-accent">Não foi possível salvar. Tente novamente.</p>}
        <div className="flex gap-3">
          <button type="button" onClick={onCancel}
            className="flex-1 rounded-[10px] border border-border px-5 py-3 text-[13px] font-semibold text-text md:flex-none">
            Cancelar
          </button>
          <button type="submit" disabled={saving} aria-busy={saving}
            className="flex-1 rounded-[10px] bg-accent px-5 py-3 text-[13px] font-semibold text-on-accent disabled:opacity-70 md:flex-none">
            {saving ? "Salvando…" : "Salvar bloqueio"}
          </button>
        </div>
      </div>
    </form>
  );
}
