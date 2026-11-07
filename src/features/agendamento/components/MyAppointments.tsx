"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PrimaryAction } from "@/components/ui/PrimaryAction";
import { useClientAccess } from "@/features/agendamento/booking/clientAccess";
import { AccessRequest } from "@/features/agendamento/components/AccessRequest";
import { AppointmentCard } from "@/features/agendamento/components/AppointmentCard";
import { BookingFooter } from "@/features/agendamento/components/BookingFooter";
import { OptionListSkeleton } from "@/features/agendamento/components/OptionListSkeleton";
import { StepMessage } from "@/features/agendamento/components/StepMessage";
import { useAsyncResource } from "@/lib/hooks/useAsyncResource";
import { splitAppointments } from "@/features/agendamento/myAppointments";
import { InvalidAccessError, cancelMyAppointment, getMyAppointments } from "@/lib/api/clientAccess";

type MyAppointmentsProps = {
  slug: string;
  barbershopId: string;
  cancellationNoticeHours: number;
  /** Code from a magic link (`?acesso=`), if the page was opened through one. */
  linkToken: string | null;
  /** The previous magic link was rejected (`?link=invalido`). */
  linkWasInvalid: boolean;
  selfHref: string;
  bookHref: string;
};

type Tab = "upcoming" | "history";

const tabClass = (active: boolean) =>
  `flex-1 rounded-[10px] py-2.5 text-[13px] ${active ? "bg-accent font-bold text-on-accent" : "bg-card font-semibold text-muted"}`;

export function MyAppointments(props: MyAppointmentsProps) {
  const { slug, barbershopId, cancellationNoticeHours, linkToken, linkWasInvalid, selfHref, bookHref } = props;
  const router = useRouter();
  const { token: storedToken, save, clear } = useClientAccess(slug);
  const [tab, setTab] = useState<Tab>("upcoming");
  const [reloads, setReloads] = useState(0);
  const [now] = useState(() => new Date());

  const token = linkToken ?? storedToken;
  const appointments = useAsyncResource(token ? `${token}#${reloads}` : null, () =>
    token ? getMyAppointments(barbershopId, token) : Promise.resolve([]),
  );
  const accessRejected = appointments.status === "error" && appointments.error instanceof InvalidAccessError;

  // Magic link: keep the code only once the API accepted it, then take it out of the address.
  useEffect(() => {
    if (!linkToken || appointments.status === "loading" || appointments.status === "idle") return;
    if (appointments.status === "ready") save(linkToken);
    router.replace(accessRejected ? `${selfHref}?link=invalido` : selfHref);
  }, [linkToken, appointments.status, accessRejected, save, router, selfHref]);

  async function cancel(appointmentId: string) {
    if (!token) return;
    await cancelMyAppointment(barbershopId, token, appointmentId);
    setReloads((n) => n + 1);
  }

  let body;
  if (token === undefined || appointments.status === "loading") {
    body = <OptionListSkeleton count={2} cardHeight={150} />;
  } else if (token === null || accessRejected) {
    body = <AccessRequest slug={slug} barbershopId={barbershopId} invalidLink={accessRejected || linkWasInvalid} />;
  } else if (appointments.status === "error") {
    body = (
      <StepMessage action={<button type="button" onClick={appointments.retry}>Tentar novamente</button>}>
        Não foi possível carregar seus agendamentos.
      </StepMessage>
    );
  } else if (appointments.status === "ready") {
    const { upcoming, history } = splitAppointments(appointments.data, now);
    const list = tab === "upcoming" ? upcoming : history;
    body = (
      <>
        <div role="tablist" aria-label="Agendamentos" className="content-width flex gap-2 px-5 pt-3.5 md:px-8">
          <div className="flex w-full gap-2 md:max-w-sm">
            {(["upcoming", "history"] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                id={`tab-${value}`}
                aria-selected={tab === value}
                aria-controls="appointments-panel"
                onClick={() => setTab(value)}
                className={tabClass(tab === value)}
              >
                {value === "upcoming" ? "Próximos" : "Histórico"}
              </button>
            ))}
          </div>
        </div>
        <div id="appointments-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="content-width px-5 py-4 md:px-8">
          {list.length === 0 ? (
            <p className="text-[13px] text-muted">
              {tab === "upcoming" ? "Você não tem agendamentos próximos." : "Nenhum agendamento anterior."}
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {list.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  now={now}
                  cancellationNoticeHours={cancellationNoticeHours}
                  onCancel={tab === "upcoming" ? cancel : undefined}
                />
              ))}
            </div>
          )}
          <button type="button" onClick={clear} className="mt-5 text-[12px] text-muted underline">
            Sair deste aparelho
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {body}
      <div className="flex-1" />
      <BookingFooter>
        <PrimaryAction href={bookHref}>Agendar novo horário</PrimaryAction>
      </BookingFooter>
    </div>
  );
}
