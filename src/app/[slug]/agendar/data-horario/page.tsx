import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClientScreen } from "@/components/layout/ClientScreen";
import { BookingProgress } from "@/features/agendamento/components/BookingProgress";
import { DateTimePicker } from "@/features/agendamento/components/DateTimePicker";
import { StepHeader } from "@/features/agendamento/components/StepHeader";
import { getBarbers, getBarbershopBySlug } from "@/lib/api/server";

export async function generateMetadata({ params }: PageProps<"/[slug]/agendar/data-horario">): Promise<Metadata> {
  const { slug } = await params;
  const barbershop = await getBarbershopBySlug(slug);
  return { title: barbershop ? `Data e horário · ${barbershop.name}` : "Barbearia não encontrada" };
}

export default async function DateTimeStepPage({ params }: PageProps<"/[slug]/agendar/data-horario">) {
  const { slug } = await params;
  const barbershop = await getBarbershopBySlug(slug);
  if (!barbershop) notFound();

  const barbers = await getBarbers(barbershop.id);
  const barberNames = Object.fromEntries(barbers.map((barber) => [barber.id, barber.name]));
  const base = `/${barbershop.slug}/agendar`;

  return (
    <ClientScreen>
      <StepHeader title="Data e horário" backHref={`${base}/profissional`} />
      <BookingProgress currentStep={3} />
      <DateTimePicker
        slug={barbershop.slug}
        barbershopId={barbershop.id}
        barberNames={barberNames}
        nextHref={`${base}/dados`}
      />
    </ClientScreen>
  );
}
