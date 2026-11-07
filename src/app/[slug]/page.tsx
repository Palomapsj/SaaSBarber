import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClientScreen } from "@/components/layout/ClientScreen";
import { CalendarIcon } from "@/components/ui/icons/CalendarIcon";
import { ClockIcon } from "@/components/ui/icons/ClockIcon";
import { BarbershopHeader } from "@/features/agendamento/components/BarbershopHeader";
import { HomeActionCard } from "@/features/agendamento/components/HomeActionCard";
import { getBarbershopBySlug } from "@/lib/api/server";
import { formatAddressLine } from "@/lib/format/address";
import { formatOpeningHours } from "@/lib/format/openingHours";

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const barbershop = await getBarbershopBySlug(slug);
  return { title: barbershop ? barbershop.name : "Barbearia não encontrada" };
}

export default async function BarbershopHomePage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const barbershop = await getBarbershopBySlug(slug);
  if (!barbershop) notFound();

  return (
    <ClientScreen>
      <BarbershopHeader name={barbershop.name} />

      <div className="border-b border-border">
        <div className="content-width flex flex-col gap-1 px-5 pb-[18px] text-[13px] text-muted md:px-8">
          <p>{formatAddressLine(barbershop.address)}</p>
          <p>{formatOpeningHours(barbershop.openingHours)}</p>
        </div>
      </div>

      <nav aria-label="Ações" className="content-width grid gap-2.5 px-5 py-[18px] md:grid-cols-2 md:gap-4 md:px-8">
        <HomeActionCard
          href={`/${barbershop.slug}/agendar/servicos`}
          title="Agendar horário"
          description="Escolha serviço, profissional e horário"
          icon={<CalendarIcon size={20} />}
          variant="primary"
        />
        <HomeActionCard
          href={`/${barbershop.slug}/meus-agendamentos`}
          title="Meus agendamentos"
          description="Ver, remarcar ou cancelar"
          icon={<ClockIcon size={20} />}
          variant="secondary"
        />
      </nav>
    </ClientScreen>
  );
}
