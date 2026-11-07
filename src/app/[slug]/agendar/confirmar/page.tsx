import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClientScreen } from "@/components/layout/ClientScreen";
import { BookingProgress } from "@/features/agendamento/components/BookingProgress";
import { BookingReview } from "@/features/agendamento/components/BookingReview";
import { StepHeader } from "@/features/agendamento/components/StepHeader";
import { getBarbers, getBarbershopBySlug, getServiceCatalog } from "@/lib/api/server";

export async function generateMetadata({ params }: PageProps<"/[slug]/agendar/confirmar">): Promise<Metadata> {
  const { slug } = await params;
  const barbershop = await getBarbershopBySlug(slug);
  return { title: barbershop ? `Confirmar · ${barbershop.name}` : "Barbearia não encontrada" };
}

export default async function ConfirmStepPage({ params }: PageProps<"/[slug]/agendar/confirmar">) {
  const { slug } = await params;
  const barbershop = await getBarbershopBySlug(slug);
  if (!barbershop) notFound();

  const [catalog, barbers] = await Promise.all([getServiceCatalog(barbershop.id), getBarbers(barbershop.id)]);
  const barberNames = Object.fromEntries(barbers.map((barber) => [barber.id, barber.name]));
  const base = `/${barbershop.slug}/agendar`;

  return (
    <ClientScreen>
      <StepHeader title="Confirmar" backHref={`${base}/dados`} />
      <BookingProgress currentStep={5} />
      <BookingReview
        barbershop={barbershop}
        services={catalog.services}
        barberNames={barberNames}
        dateTimeHref={`${base}/data-horario`}
        successHref={`${base}/sucesso`}
      />
    </ClientScreen>
  );
}
