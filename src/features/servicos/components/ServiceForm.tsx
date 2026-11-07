"use client";

import { type FormEvent, useState } from "react";
import { Switch } from "@/components/ui/Switch";
import { TextField } from "@/components/ui/TextField";
import { ToggleChips } from "@/components/ui/ToggleChips";
import {
  EMPTY_SERVICE_FORM,
  type ServiceFormErrors,
  type ServiceFormField,
  type ServiceFormValues,
  serviceFormValuesOf,
  toServiceInput,
  validateServiceForm,
} from "@/features/servicos/serviceForm";
import { ValidationError, createPanelService, updatePanelService } from "@/lib/api/panel/services";
import type { PanelService, PanelServicesPage } from "@/lib/api/types";

type ServiceFormProps = {
  /** null = new service. */
  service: PanelService | null;
  page: PanelServicesPage;
  onSaved: (service: PanelService, message: string) => Promise<void> | void;
  onCancel: () => void;
  notice?: string | null;
};

const FIELD_ORDER: ServiceFormField[] = ["name", "categoryName", "durationMinutes", "priceCents"];
const FIELD_ID: Record<ServiceFormField, string> = {
  name: "service-name",
  categoryName: "service-category",
  durationMinutes: "service-duration",
  priceCents: "service-price",
};

// Prototype: admin/servicos.html (right panel). Category: free text with suggestions; a new name
// creates the category. A service without barbers is allowed, with a warning.
export function ServiceForm({ service, page, onSaved, onCancel, notice = null }: ServiceFormProps) {
  const [values, setValues] = useState<ServiceFormValues>(
    service ? serviceFormValuesOf(service, page.categories) : EMPTY_SERVICE_FORM,
  );
  const [touched, setTouched] = useState<Set<ServiceFormField>>(new Set());
  const [serverErrors, setServerErrors] = useState<ServiceFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const clientErrors = validateServiceForm(values);
  const errorOf = (field: ServiceFormField) =>
    touched.has(field) ? (serverErrors[field] ?? clientErrors[field] ?? null) : null;
  const touch = (field: ServiceFormField) => setTouched((current) => new Set(current).add(field));
  const change = (field: ServiceFormField | null, patch: Partial<ServiceFormValues>) => {
    setValues((current) => ({ ...current, ...patch }));
    if (field) {
      setServerErrors((current) => {
        const next = { ...current };
        delete next[field];
        return next;
      });
    }
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    setTouched(new Set(FIELD_ORDER));
    setMessage(null);
    const firstInvalid = FIELD_ORDER.find((field) => clientErrors[field]);
    if (firstInvalid) return document.getElementById(FIELD_ID[firstInvalid])?.focus();
    setSaving(true);
    try {
      const input = toServiceInput(values);
      const saved = service ? await updatePanelService(service.id, input) : await createPanelService(input);
      await onSaved(saved, service ? "Alterações salvas." : "Serviço cadastrado.");
    } catch (error) {
      if (error instanceof ValidationError) setServerErrors(error.fields as ServiceFormErrors);
      else setMessage("Não foi possível salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-[18px] rounded-2xl border border-border bg-card p-5 md:p-6">
      <h2 className="text-[13px] font-bold text-text">{service ? "Editar serviço" : "Novo serviço"}</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <TextField id={FIELD_ID.name} label="Nome do serviço" placeholder="Ex: Corte navalhado" autoComplete="off"
          value={values.name} error={errorOf("name")} onBlur={() => touch("name")}
          onChange={(e) => change("name", { name: e.target.value })} />
        <TextField id={FIELD_ID.categoryName} label="Categoria" placeholder="Ex: Cabelo" autoComplete="off" list="service-categories"
          value={values.categoryName} error={errorOf("categoryName")} onBlur={() => touch("categoryName")}
          onChange={(e) => change("categoryName", { categoryName: e.target.value })} />
        <datalist id="service-categories">
          {page.categories.map((category) => (
            <option key={category.id} value={category.name} />
          ))}
        </datalist>
        <TextField id={FIELD_ID.durationMinutes} label="Duração (min)" placeholder="Ex: 30" inputMode="numeric" maxLength={3}
          value={values.duration} error={errorOf("durationMinutes")} onBlur={() => touch("durationMinutes")}
          onChange={(e) => change("durationMinutes", { duration: e.target.value.replace(/\D/g, "") })} />
        <TextField id={FIELD_ID.priceCents} label="Preço (R$)" placeholder="Ex: 45" inputMode="decimal" maxLength={9}
          value={values.price} error={errorOf("priceCents")} onBlur={() => touch("priceCents")}
          onChange={(e) => change("priceCents", { price: e.target.value.replace(/[^\d.,]/g, "") })} />
      </div>

      <div>
        <p id="service-barbers" className="pb-2 text-[12px] font-semibold tracking-[0.5px] text-muted uppercase">
          Profissionais que atendem
        </p>
        <ToggleChips items={page.barbers.map((b) => ({ id: b.id, label: b.name }))} selectedIds={values.barberIds}
          labelId="service-barbers" onChange={(barberIds) => change(null, { barberIds })} />
        {values.barberIds.length === 0 && (
          <p className="mt-1.5 text-[12px] text-muted">
            Nenhum profissional atende este serviço: ele não aparece para os clientes até alguém ser marcado.
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Switch checked={values.active} onChange={(active) => change(null, { active })} label="Serviço ativo" />
        <span className="text-[13px] text-text">Serviço ativo (disponível para agendamento)</span>
      </div>

      <div className="mt-auto flex flex-col items-stretch gap-2 pt-2 md:items-end">
        <p aria-live="polite" className={`text-right text-[12px] ${message ? "text-accent" : "text-success"}`}>{message ?? notice}</p>
        <div className="flex gap-3 md:justify-end">
          <button type="button" onClick={onCancel} className="flex-1 rounded-[10px] border border-border px-5 py-3 text-[13px] font-semibold text-text md:flex-none">
            Cancelar
          </button>
          <button type="submit" disabled={saving} aria-busy={saving}
            className="flex-1 rounded-[10px] bg-accent px-6 py-3 font-display text-[14px] font-bold tracking-[0.5px] text-on-accent uppercase disabled:opacity-70 md:flex-none">
            {saving ? "Salvando…" : "Salvar serviço"}
          </button>
        </div>
      </div>
    </form>
  );
}
