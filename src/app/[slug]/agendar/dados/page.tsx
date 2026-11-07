import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClientScreen } from "@/components/layout/ClientScreen";
import { BookingProgress } from "@/features/agendamento/components/BookingProgress";
import { CustomerForm } from "@/features/agendamento/components/CustomerForm";
import { StepHeader } from "@/features/agendamento/components/StepHeader";
import { getBarbershopBySlug } from "@/lib/api/server";

export async function generateMetadata({ params }: PageProps<"/[slug]/agendar/dados">): Promise<Metadata> {
  const { slug } = await params;
  const barbershop = await getBarbershopBySlug(slug);
  return { title: barbershop ? `Seus dados · ${barbershop.name}` : "Barbearia não encontrada" };
}

export default async function CustomerStepPage({ params }: PageProps<"/[slug]/agendar/dados">) {
  const { slug } = await params;
  const barbershop = await getBarbershopBySlug(slug);
  if (!barbershop) notFound();

  const base = `/${barbershop.slug}/agendar`;

  return (
    <ClientScreen>
      <StepHeader title="Seus dados" backHref={`${base}/data-horario`} />
      <BookingProgress currentStep={4} />
      <CustomerForm
        slug={barbershop.slug}
        recurrenceIntervalWeeks={barbershop.recurrenceIntervalWeeks}
        nextHref={`${base}/confirmar`}
      />
    </ClientScreen>
  );
}
