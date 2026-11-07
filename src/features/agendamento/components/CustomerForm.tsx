"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { primaryActionClasses } from "@/components/ui/PrimaryAction";
import { TextField } from "@/components/ui/TextField";
import { useBookingStep } from "@/features/agendamento/booking/bookingSteps";
import { BookingFooter } from "@/features/agendamento/components/BookingFooter";
import { OptionListSkeleton } from "@/features/agendamento/components/OptionListSkeleton";
import { RecurrenceOption } from "@/features/agendamento/components/RecurrenceOption";
import { validateName, validatePhone } from "@/features/agendamento/customerValidation";
import { formatPhoneInput, phoneDigitsFromInput } from "@/lib/format/phone";

type CustomerFormProps = {
  slug: string;
  /** Null when the barbershop does not offer automatic repetition. */
  recurrenceIntervalWeeks: number | null;
  nextHref: string;
};

export function CustomerForm({ slug, recurrenceIntervalWeeks, nextHref }: CustomerFormProps) {
  const router = useRouter();
  const { draft, updateDraft } = useBookingStep(slug, "dados");
  const [touched, setTouched] = useState({ name: false, phone: false });
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  const name = draft?.customerName ?? "";
  const phone = draft?.customerPhone ?? "";
  const nameError = validateName(name);
  const phoneError = validatePhone(phone);
  const maskedPhone = formatPhoneInput(phone);

  function handlePhoneChange(value: string) {
    updateDraft((current) => ({ ...current, customerPhone: phoneDigitsFromInput(value, current.customerPhone) }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setTouched({ name: true, phone: true });
    if (nameError) return nameRef.current?.focus();
    if (phoneError) return phoneRef.current?.focus();
    router.push(nextHref);
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-1 flex-col">
      <p className="content-width px-5 pt-1.5 pb-1 text-[13px] text-muted md:px-8 md:pt-4">
        Não é preciso criar conta — só confirmamos pelo WhatsApp.
      </p>

      {draft === null ? (
        <OptionListSkeleton count={3} cardHeight={70} />
      ) : (
        <div className="content-width grid gap-4 px-5 py-[18px] md:grid-cols-2 md:gap-x-6 md:px-8">
          <TextField
            ref={nameRef}
            id="customer-name"
            label="Nome completo"
            placeholder="Seu nome"
            autoComplete="name"
            autoCapitalize="words"
            value={name}
            onChange={(event) => updateDraft((current) => ({ ...current, customerName: event.target.value }))}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            error={touched.name ? nameError : null}
          />
          <TextField
            ref={phoneRef}
            id="customer-phone"
            label="WhatsApp"
            type="tel"
            inputMode="numeric"
            placeholder="(11) 90000-0000"
            autoComplete="tel-national"
            value={maskedPhone}
            onChange={(event) => handlePhoneChange(event.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
            error={touched.phone ? phoneError : null}
          />
          {recurrenceIntervalWeeks !== null && (
            <div className="md:col-span-2">
              <RecurrenceOption
                intervalWeeks={recurrenceIntervalWeeks}
                checked={draft.recurring}
                onChange={(recurring) => updateDraft((current) => ({ ...current, recurring }))}
              />
            </div>
          )}
        </div>
      )}

      <div className="flex-1" />

      <BookingFooter>
        <button type="submit" disabled={draft === null} className={primaryActionClasses}>
          Revisar agendamento
        </button>
      </BookingFooter>
    </form>
  );
}
