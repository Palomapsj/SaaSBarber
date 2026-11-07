"use client";

import { useState } from "react";
import { useServices } from "@/features/servicos/ServicesProvider";
import { ServiceForm } from "@/features/servicos/components/ServiceForm";
import { ServiceListItem } from "@/features/servicos/components/ServiceListItem";
import { setPanelServiceActive } from "@/lib/api/panel/services";
import type { PanelService } from "@/lib/api/types";

const NEW = "new";
const groupTitle = "text-[12px] font-semibold tracking-[0.5px] text-muted uppercase";

// Prototype: admin/servicos.html. Desktop: list by category (560px) + form ("Novo serviço" by
// default; the pencil loads a service). Phones: the list first; "+ Novo serviço" or the pencil
// open the form with "Voltar".
export function AdminServices() {
  const state = useServices();
  const [editingId, setEditingId] = useState<string>(NEW);
  const [formOpenOnPhone, setFormOpenOnPhone] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ serviceId: string; text: string } | null>(null);

  if (state.status === "loading") {
    return <div role="status" aria-label="Carregando" className="m-5 h-[480px] animate-pulse rounded-2xl bg-card md:m-8" />;
  }
  if (state.status === "error") {
    return (
      <p className="px-5 py-6 text-[13px] text-muted md:px-8">
        Não foi possível carregar os serviços.{" "}
        <button type="button" onClick={state.retry} className="font-semibold text-accent">Tentar novamente</button>
      </p>
    );
  }

  const { page, reload } = state;
  const editing = page.services.find((s) => s.id === editingId) ?? null;
  const groups = page.categories
    .map((category) => ({ category, services: page.services.filter((s) => s.categoryId === category.id) }))
    .filter((group) => group.services.length > 0);

  const open = (id: string) => {
    setEditingId(id);
    setNotice(null);
    setFormOpenOnPhone(true);
  };

  async function toggleActive(service: PanelService, active: boolean) {
    setTogglingId(service.id);
    setListError(null);
    try {
      await setPanelServiceActive(service.id, active);
      await reload();
    } catch {
      setListError("Não foi possível alterar. Tente novamente.");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6 px-5 py-6 md:flex-row md:items-start md:px-8">
      <div className={`flex-col gap-2.5 md:flex md:w-[560px] md:max-w-[50%] md:shrink-0 ${formOpenOnPhone ? "hidden" : "flex"}`}>
        <button type="button" onClick={() => open(NEW)}
          className="rounded-xl border-[1.5px] border-dashed border-border p-3 text-[13px] font-semibold text-muted md:hidden">
          + Novo serviço
        </button>
        {groups.map(({ category, services }, index) => (
          <section key={category.id} aria-labelledby={`group-${category.id}`} className="flex flex-col gap-2.5">
            <h2 id={`group-${category.id}`} className={`${groupTitle} ${index > 0 ? "pt-2" : ""}`}>{category.name}</h2>
            {services.map((service) => (
              <ServiceListItem key={service.id} service={service} categories={page.categories}
                editing={service.id === editingId} onEdit={() => open(service.id)}
                onToggleActive={(active) => toggleActive(service, active)} toggling={togglingId === service.id} />
            ))}
          </section>
        ))}
        {groups.length === 0 && <p className="text-[13px] text-muted">Nenhum serviço cadastrado.</p>}
        {listError && <p role="alert" className="text-[12px] text-accent">{listError}</p>}
      </div>

      <div className={`min-w-0 flex-1 flex-col gap-3 md:flex ${formOpenOnPhone ? "flex" : "hidden"}`}>
        <button type="button" onClick={() => setFormOpenOnPhone(false)} className="self-start text-[13px] font-semibold text-muted md:hidden">
          ‹ Voltar à lista
        </button>
        <ServiceForm
          key={editing ? editing.id : NEW}
          service={editing}
          page={page}
          notice={notice && editing && notice.serviceId === editing.id ? notice.text : null}
          onCancel={() => {
            setEditingId(NEW);
            setNotice(null);
            setFormOpenOnPhone(false);
          }}
          onSaved={async (saved, text) => {
            await reload();
            setEditingId(saved.id);
            setNotice({ serviceId: saved.id, text });
          }}
        />
      </div>
    </div>
  );
}
