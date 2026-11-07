"use client";

import { useState } from "react";
import { type AppointmentTone, appointmentStatus, appointmentTitle } from "@/features/agendamento/myAppointments";
import type { MyAppointment } from "@/lib/api/types";
import { formatShortDate, formatTime } from "@/lib/format/date";

type AppointmentCardProps = {
  appointment: MyAppointment;
  now: Date;
  cancellationNoticeHours: number;
  /** Absent in "Histórico": no actions. */
  onCancel?: (appointmentId: string) => Promise<void>;
};

const toneClass: Record<AppointmentTone, string> = {
  success: "text-success",
  muted: "text-muted",
  accent: "text-accent",
};

const actionButton = "flex-1 rounded-[9px] border border-border bg-transparent py-[9px] text-[12px] font-semibold";

export function AppointmentCard({ appointment, now, cancellationNoticeHours, onCancel }: AppointmentCardProps) {
  const [step, setStep] = useState<"idle" | "confirming" | "cancelling" | "error">("idle");
  const status = appointmentStatus(appointment, now);
  const titleId = `appointment-${appointment.id}`;

  async function cancel() {
    if (!onCancel) return;
    setStep("cancelling");
    try {
      await onCancel(appointment.id);
    } catch {
      setStep("error");
    }
  }

  return (
    <article aria-labelledby={titleId} className="flex flex-col gap-2 rounded-[14px] border border-border bg-card p-3.5">
      <div className="flex items-center justify-between">
        <span className={`text-[11px] font-bold tracking-[0.5px] uppercase ${toneClass[status.tone]}`}>{status.label}</span>
        <span className="text-[12px] text-muted">{formatShortDate(appointment.startsAt)}</span>
      </div>
      <h2 id={titleId} className="text-[14px] font-semibold text-text">
        {appointmentTitle(appointment)}
      </h2>
      <p className="text-[12px] text-muted">
        {formatTime(appointment.startsAt)} · {appointment.barber.name}
      </p>

      {onCancel && !appointment.canChange && (
        <p className="pt-1.5 text-[12px] text-muted">
          Faltam menos de {cancellationNoticeHours}h. Para alterar, fale com a barbearia.
        </p>
      )}

      {onCancel && appointment.canChange && (step === "idle" || step === "error") && (
        <>
          <div className="flex gap-2 pt-1.5">
            <button type="button" disabled className={`${actionButton} flex cursor-not-allowed flex-col items-center gap-0.5 text-muted2`}>
              Reagendar
              <span className="text-[9px] font-bold tracking-[0.5px] uppercase">Em desenvolvimento</span>
            </button>
            <button type="button" onClick={() => setStep("confirming")} className={`${actionButton} text-accent`}>
              Cancelar
            </button>
          </div>
          {step === "error" && (
            <p role="alert" className="text-[12px] text-accent">
              Não foi possível cancelar. Tente novamente.
            </p>
          )}
        </>
      )}

      {onCancel && (step === "confirming" || step === "cancelling") && (
        <div className="flex flex-col gap-2 pt-1.5">
          <p className="text-[13px] font-semibold text-text">Cancelar este agendamento?</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep("idle")} disabled={step === "cancelling"} className={`${actionButton} text-text`}>
              Voltar
            </button>
            <button
              type="button"
              onClick={cancel}
              disabled={step === "cancelling"}
              aria-busy={step === "cancelling"}
              className="flex-1 rounded-[9px] bg-accent py-[9px] text-[12px] font-semibold text-on-accent disabled:opacity-70"
            >
              {step === "cancelling" ? "Cancelando…" : "Sim, cancelar"}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
