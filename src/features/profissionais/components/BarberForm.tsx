"use client";

import { type FormEvent, useState } from "react";
import { Switch } from "@/components/ui/Switch";
import { TextField } from "@/components/ui/TextField";
import { ToggleChips } from "@/components/ui/ToggleChips";
import {
  type BarberFormErrors,
  type BarberFormField,
  type BarberFormValues,
  EMPTY_BARBER_FORM,
  formValuesOf,
  toBarberInput,
  validateBarberForm,
} from "@/features/profissionais/barberForm";
import { RemoveBarberButton } from "@/features/profissionais/components/RemoveBarberButton";
import { PlanLimitError, ValidationError, createPanelBarber, updatePanelBarber } from "@/lib/api/panel/barbers";
import type { PanelBarber, Service } from "@/lib/api/types";
import { formatInitials } from "@/lib/format/initials";
import { formatPhoneInput, phoneDigitsFromInput } from "@/lib/format/phone";

type BarberFormProps = {
  /** null = new barber. */
  barber: PanelBarber | null;
  services: Service[];
  /** The form is recreated after saving a new barber, so the success message lives outside it. */
  onSaved: (barber: PanelBarber, message: string) => void;
  onRemoved: (id: string) => void;
  /** Success message to show (set by the parent after a save). */
  notice?: string | null;
};

const FIELD_ORDER: BarberFormField[] = ["name", "commissionPercent", "phone", "email", "serviceIds"];
const FIELD_ID: Record<BarberFormField, string> = {
  name: "barber-name",
  commissionPercent: "barber-commission",
  phone: "barber-phone",
  email: "barber-email",
  serviceIds: "barber-services",
};

// Prototype: admin/profissionais.html (right panel). Same error pattern as the client forms.
export function BarberForm({ barber, services, onSaved, onRemoved, notice = null }: BarberFormProps) {
  const [values, setValues] = useState<BarberFormValues>(barber ? formValuesOf(barber) : EMPTY_BARBER_FORM);
  const [touched, setTouched] = useState<Set<BarberFormField>>(new Set());
  const [serverErrors, setServerErrors] = useState<BarberFormErrors>({});
  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const clientErrors = validateBarberForm(values);
  const errorOf = (field: BarberFormField) =>
    touched.has(field) ? (serverErrors[field] ?? clientErrors[field] ?? null) : null;
  const touch = (field: BarberFormField) => setTouched((current) => new Set(current).add(field));
  /** Updates values; an edited field loses the error the server gave it. */
  const change = (field: BarberFormField | null, patch: Partial<BarberFormValues>) => {
    setValues((current) => ({ ...current, ...patch }));
    if (field) {
      setServerErrors((current) => {
        const next = { ...current };
        delete next[field];
        return next;
      });
    }
    setStatus("idle");
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    setTouched(new Set(FIELD_ORDER));
    setMessage(null);
    const firstInvalid = FIELD_ORDER.find((field) => clientErrors[field]);
    if (firstInvalid) return document.getElementById(FIELD_ID[firstInvalid])?.focus();
    setStatus("saving");
    try {
      const input = toBarberInput(values);
      const saved = barber ? await updatePanelBarber(barber.id, input) : await createPanelBarber(input);
      setStatus("idle");
      onSaved(saved, barber ? "Alterações salvas." : "Profissional cadastrado.");
    } catch (error) {
      setStatus("idle");
      if (error instanceof ValidationError) setServerErrors(error.fields as BarberFormErrors);
      else if (error instanceof PlanLimitError) setMessage("Limite de profissionais do plano atingido.");
      else setMessage("Não foi possível salvar. Tente novamente.");
    }
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-[18px] rounded-2xl border border-border bg-card p-5 md:p-6">
      <div className="flex items-center gap-4">
        <span aria-hidden="true" className="flex size-16 shrink-0 items-center justify-center rounded-full bg-accent font-display text-[20px] font-bold text-on-accent">
          {formatInitials(values.name) || "+"}
        </span>
        <button type="button" disabled className="flex cursor-not-allowed flex-col items-start rounded-[9px] border border-border px-3.5 py-2 text-[12px] font-semibold text-muted2">
          Trocar foto
          <span className="text-[9px] font-bold tracking-[0.5px] text-muted uppercase">Em desenvolvimento</span>
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TextField id={FIELD_ID.name} label="Nome completo" autoComplete="off" value={values.name} error={errorOf("name")}
          onChange={(e) => change("name", { name: e.target.value })} onBlur={() => touch("name")} />
        <TextField id={FIELD_ID.commissionPercent} label="Comissão (%)" inputMode="numeric" maxLength={3} value={values.commission}
          error={errorOf("commissionPercent")} onBlur={() => touch("commissionPercent")}
          onChange={(e) => change("commissionPercent", { commission: e.target.value.replace(/\D/g, "") })} />
        <TextField id={FIELD_ID.phone} label="WhatsApp" type="tel" inputMode="numeric" placeholder="(11) 90000-0000"
          value={formatPhoneInput(values.phone)} error={errorOf("phone")} onBlur={() => touch("phone")}
          onChange={(e) => change("phone", { phone: phoneDigitsFromInput(e.target.value, values.phone) })} />
        <TextField id={FIELD_ID.email} label="E-mail" type="email" autoComplete="off" value={values.email} error={errorOf("email")}
          onChange={(e) => change("email", { email: e.target.value })} onBlur={() => touch("email")} />
      </div>

      <div>
        <p id={FIELD_ID.serviceIds} tabIndex={-1} className="pb-2 text-[12px] font-semibold tracking-[0.5px] text-muted uppercase">
          Serviços que atende
        </p>
        <ToggleChips items={services.map((s) => ({ id: s.id, label: s.name }))} selectedIds={values.serviceIds} labelId={FIELD_ID.serviceIds}
          error={errorOf("serviceIds")} onChange={(serviceIds) => { change("serviceIds", { serviceIds }); touch("serviceIds"); }} />
      </div>

      <div className="flex items-center gap-3">
        <Switch checked={values.active} onChange={(active) => change(null, { active })} label="Profissional ativo" />
        <span className="text-[13px] text-text">Profissional ativo (aparece pra clientes agendarem)</span>
      </div>

      {!barber && <p className="text-[12px] text-muted">O profissional entra no painel com o e-mail cadastrado.</p>}

      <div className="mt-auto flex flex-col-reverse gap-3 pt-2 md:flex-row md:items-end md:justify-between">
        <div>{barber && <RemoveBarberButton barber={barber} onRemoved={onRemoved} />}</div>
        <div className="flex flex-col items-end gap-2">
          <p aria-live="polite" className={`text-[12px] ${message ? "text-accent" : "text-success"}`}>{message ?? notice}</p>
          <button type="submit" disabled={status === "saving"} aria-busy={status === "saving"}
            className="w-full rounded-[10px] bg-accent px-6 py-3 font-display text-[14px] font-bold tracking-[0.5px] text-on-accent uppercase disabled:opacity-70 md:w-auto">
            {status === "saving" ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>
    </form>
  );
}
