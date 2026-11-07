import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClientScreen } from "@/components/layout/ClientScreen";
import { BookingSuccess } from "@/features/agendamento/components/BookingSuccess";
import { getBarbershopBySlug } from "@/lib/api/server";

export async function generateMetadata({ params }: PageProps<"/[slug]/agendar/sucesso">): Promise<Metadata> {
  const { slug } = await params;
  const barbershop = await getBarbershopBySlug(slug);
  return { title: barbershop ? `Agendamento · ${barbershop.name}` : "Barbearia não encontrada" };
}

export default async function BookingSuccessPage({ params, searchParams }: PageProps<"/[slug]/agendar/sucesso">) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const barbershop = await getBarbershopBySlug(slug);
  if (!barbershop) notFound();

  const appointmentId = typeof query.agendamento === "string" ? query.agendamento : null;

  return (
    <ClientScreen>
      <BookingSuccess
        slug={barbershop.slug}
        appointmentId={appointmentId}
        barbershopName={barbershop.name}
        address={barbershop.address}
        homeHref={`/${barbershop.slug}`}
        myAppointmentsHref={`/${barbershop.slug}/meus-agendamentos`}
      />
    </ClientScreen>
  );
}
