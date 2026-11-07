import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClientScreen } from "@/components/layout/ClientScreen";
import { BookingProgress } from "@/features/agendamento/components/BookingProgress";
import { ServiceSelector } from "@/features/agendamento/components/ServiceSelector";
import { StepHeader } from "@/features/agendamento/components/StepHeader";
import { getBarbershopBySlug, getServiceCatalog } from "@/lib/api/server";

export async function generateMetadata({ params }: PageProps<"/[slug]/agendar/servicos">): Promise<Metadata> {
  const { slug } = await params;
  const barbershop = await getBarbershopBySlug(slug);
  return { title: barbershop ? `Serviços · ${barbershop.name}` : "Barbearia não encontrada" };
}

export default async function ServicesStepPage({ params }: PageProps<"/[slug]/agendar/servicos">) {
  const { slug } = await params;
  const barbershop = await getBarbershopBySlug(slug);
  if (!barbershop) notFound();
  const catalog = await getServiceCatalog(barbershop.id);

  return (
    <ClientScreen>
      <StepHeader title="Serviços" backHref={`/${barbershop.slug}`} />
      <BookingProgress currentStep={1} />
      <ServiceSelector
        slug={barbershop.slug}
        catalog={catalog}
        nextHref={`/${barbershop.slug}/agendar/profissional`}
      />
    </ClientScreen>
  );
}
