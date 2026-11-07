import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClientScreen } from "@/components/layout/ClientScreen";
import { MyAppointments } from "@/features/agendamento/components/MyAppointments";
import { StepHeader } from "@/features/agendamento/components/StepHeader";
import { getBarbershopBySlug } from "@/lib/api/server";

export async function generateMetadata({ params }: PageProps<"/[slug]/meus-agendamentos">): Promise<Metadata> {
  const { slug } = await params;
  const barbershop = await getBarbershopBySlug(slug);
  return {
    title: barbershop ? `Meus agendamentos · ${barbershop.name}` : "Barbearia não encontrada",
    // The magic link carries a personal code: never index this page or leak the full URL.
    robots: { index: false, follow: false },
    referrer: "no-referrer",
  };
}

export default async function MyAppointmentsPage({ params, searchParams }: PageProps<"/[slug]/meus-agendamentos">) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const barbershop = await getBarbershopBySlug(slug);
  if (!barbershop) notFound();

  return (
    <ClientScreen>
      <StepHeader title="Meus agendamentos" backHref={`/${barbershop.slug}`} />
      <MyAppointments
        slug={barbershop.slug}
        barbershopId={barbershop.id}
        cancellationNoticeHours={barbershop.cancellationNoticeHours}
        linkToken={typeof query.acesso === "string" ? query.acesso : null}
        linkWasInvalid={query.link === "invalido"}
        selfHref={`/${barbershop.slug}/meus-agendamentos`}
        bookHref={`/${barbershop.slug}/agendar/servicos`}
      />
    </ClientScreen>
  );
}
