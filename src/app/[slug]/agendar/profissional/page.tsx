import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClientScreen } from "@/components/layout/ClientScreen";
import { BarberSelector } from "@/features/agendamento/components/BarberSelector";
import { BookingProgress } from "@/features/agendamento/components/BookingProgress";
import { StepHeader } from "@/features/agendamento/components/StepHeader";
import { getBarbershopBySlug } from "@/lib/api/server";

export async function generateMetadata({ params }: PageProps<"/[slug]/agendar/profissional">): Promise<Metadata> {
  const { slug } = await params;
  const barbershop = await getBarbershopBySlug(slug);
  return { title: barbershop ? `Profissional · ${barbershop.name}` : "Barbearia não encontrada" };
}

export default async function BarberStepPage({ params }: PageProps<"/[slug]/agendar/profissional">) {
  const { slug } = await params;
  const barbershop = await getBarbershopBySlug(slug);
  if (!barbershop) notFound();

  const servicesHref = `/${barbershop.slug}/agendar/servicos`;

  return (
    <ClientScreen>
      <StepHeader title="Profissional" backHref={servicesHref} />
      <BookingProgress currentStep={2} />
      <BarberSelector
        slug={barbershop.slug}
        barbershopId={barbershop.id}
        servicesHref={servicesHref}
        nextHref={`/${barbershop.slug}/agendar/data-horario`}
      />
    </ClientScreen>
  );
}
