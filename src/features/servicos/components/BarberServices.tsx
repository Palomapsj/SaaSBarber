"use client";

import { useState } from "react";
import { BarberServiceItem } from "@/features/servicos/components/BarberServiceItem";
import { LastServiceError, getMyServices, setPerformsService } from "@/lib/api/panel/myServices";
import type { BarberServicesPage } from "@/lib/api/types";
import { useAsyncResource } from "@/lib/hooks/useAsyncResource";

const groupTitle = "text-[12px] font-semibold tracking-[0.5px] text-muted uppercase";

// Prototype: barbeiro/servicos.html. Each switch saves right away (there is no "Salvar"): the row
// changes at once and goes back if the API refuses.
export function BarberServices() {
  const resource = useAsyncResource("my-services", getMyServices);
  const [saved, setSaved] = useState<BarberServicesPage | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (resource.status === "loading" || resource.status === "idle") {
    return <div role="status" aria-label="Carregando" className="m-5 h-[400px] animate-pulse rounded-2xl bg-card md:m-8" />;
  }
  if (resource.status === "error") {
    return (
      <p className="px-5 py-6 text-[13px] text-muted md:px-8">
        Não foi possível carregar os serviços.{" "}
        <button type="button" onClick={resource.retry} className="font-semibold text-accent">Tentar novamente</button>
      </p>
    );
  }

  const page = saved ?? resource.data;
  const performedCount = page.services.filter((s) => s.performed).length;
  const groups = page.categories
    .map((category) => ({ category, services: page.services.filter((s) => s.categoryId === category.id) }))
    .filter((group) => group.services.length > 0);

  async function change(serviceId: string, performed: boolean) {
    const before = page;
    setSaved({ ...page, services: page.services.map((s) => (s.id === serviceId ? { ...s, performed } : s)) });
    setSavingId(serviceId);
    setError(null);
    try {
      setSaved(await setPerformsService(serviceId, performed));
    } catch (failure) {
      setSaved(before);
      setError(
        failure instanceof LastServiceError
          ? "Você precisa atender pelo menos um serviço."
          : "Não foi possível alterar. Tente novamente.",
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-2.5 px-5 py-6 md:px-8">
      <p className="pb-1.5 text-[12px] text-muted">
        Marque os serviços que você realiza. Criar ou editar um serviço novo só o Admin pode fazer.
      </p>
      {groups.map(({ category, services }, index) => (
        <section key={category.id} aria-labelledby={`group-${category.id}`} className="flex flex-col gap-2.5">
          <h2 id={`group-${category.id}`} className={`${groupTitle} ${index > 0 ? "pt-2" : ""}`}>{category.name}</h2>
          {services.map((service) => {
            const isLast = service.performed && performedCount === 1;
            return (
              <BarberServiceItem
                key={service.id}
                service={service}
                categories={page.categories}
                onChange={(performed) => change(service.id, performed)}
                disabled={savingId !== null || isLast}
                isLast={isLast}
              />
            );
          })}
        </section>
      ))}
      {groups.length === 0 && (
        <p className="text-[13px] text-muted">A barbearia ainda não tem serviços ativos. Fale com o dono da barbearia.</p>
      )}
      {error && <p role="alert" className="text-[12px] text-accent">{error}</p>}
    </div>
  );
}
