"use client";

import { useState } from "react";
import { HasFutureAppointmentsError, removePanelBarber } from "@/lib/api/panel/barbers";
import type { PanelBarber } from "@/lib/api/types";

type RemoveBarberButtonProps = {
  barber: PanelBarber;
  onRemoved: (id: string) => void;
};

// "Remover" with an inline confirmation. Decision: the API refuses while the barber still has
// future appointments, and the admin is told to deactivate instead.
export function RemoveBarberButton({ barber, onRemoved }: RemoveBarberButtonProps) {
  const [step, setStep] = useState<"idle" | "confirming" | "removing">("idle");
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setStep("removing");
    setError(null);
    try {
      await removePanelBarber(barber.id);
      onRemoved(barber.id);
    } catch (caught) {
      setStep("idle");
      setError(
        caught instanceof HasFutureAppointmentsError
          ? `Este profissional tem ${caught.count} ${caught.count === 1 ? "agendamento futuro" : "agendamentos futuros"}. Desative-o para parar de receber agendamentos.`
          : "Não foi possível remover. Tente novamente.",
      );
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      {step === "idle" ? (
        <button
          type="button"
          onClick={() => setStep("confirming")}
          className="rounded-[10px] border border-border px-5 py-3 text-[13px] font-semibold text-accent"
        >
          Remover
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-semibold text-text">Remover {barber.name}?</span>
          <button
            type="button"
            onClick={() => setStep("idle")}
            disabled={step === "removing"}
            className="rounded-[10px] border border-border px-4 py-2.5 text-[13px] font-semibold text-text"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={step === "removing"}
            aria-busy={step === "removing"}
            className="rounded-[10px] bg-accent px-4 py-2.5 text-[13px] font-semibold text-on-accent disabled:opacity-70"
          >
            {step === "removing" ? "Removendo…" : "Sim, remover"}
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="max-w-[420px] text-[12px] text-accent">
          {error}
        </p>
      )}
    </div>
  );
}
