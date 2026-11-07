"use client";

import { type FormEvent, useState } from "react";
import { primaryActionClasses } from "@/components/ui/PrimaryAction";
import { TextField } from "@/components/ui/TextField";
import { validatePhone } from "@/features/agendamento/customerValidation";
import { requestAccessLink } from "@/lib/api/clientAccess";
import { formatPhoneInput, phoneDigitsFromInput } from "@/lib/format/phone";

type AccessRequestProps = {
  slug: string;
  barbershopId: string;
  /** The saved code or the opened link is no longer valid. */
  invalidLink?: boolean;
};

// Shown when this device has no access code (docs/adr/002): asks for the WhatsApp and sends a new link.
export function AccessRequest({ slug, barbershopId, invalidLink = false }: AccessRequestProps) {
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const phoneError = validatePhone(phone);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (phoneError || status === "sending") return;
    setStatus("sending");
    try {
      await requestAccessLink(barbershopId, phone, slug);
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="content-width px-5 py-4 md:px-8">
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-[14px] border border-border bg-card p-4 md:max-w-[480px]">
        <div className="flex flex-col gap-1">
          <h2 className="text-[15px] font-semibold text-text">Veja seus agendamentos</h2>
          <p className="text-[13px] text-muted">
            {invalidLink && "Esse link não é mais válido. "}
            Enviamos um link de acesso para o seu WhatsApp. Informe o número usado no agendamento.
          </p>
        </div>
        <TextField
          id="access-phone"
          label="WhatsApp"
          type="tel"
          inputMode="numeric"
          placeholder="(11) 90000-0000"
          autoComplete="tel-national"
          value={formatPhoneInput(phone)}
          onChange={(event) => setPhone((current) => phoneDigitsFromInput(event.target.value, current))}
          onBlur={() => setTouched(true)}
          error={touched ? phoneError : null}
        />
        <button
          type="submit"
          disabled={status === "sending"}
          aria-busy={status === "sending"}
          className={`${primaryActionClasses} disabled:opacity-70`}
        >
          {status === "sending" ? "Enviando…" : "Receber link no WhatsApp"}
        </button>
        <p aria-live="polite" className="text-[13px] text-muted empty:hidden">
          {status === "sent" && "Se esse número tiver agendamentos aqui, enviamos um link pelo WhatsApp."}
          {status === "error" && "Não foi possível enviar agora. Tente novamente."}
        </p>
      </form>
    </div>
  );
}
