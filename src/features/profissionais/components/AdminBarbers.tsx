"use client";

import { useState } from "react";
import { useBarbers } from "@/features/profissionais/BarbersProvider";
import { BarberForm } from "@/features/profissionais/components/BarberForm";
import { BarberListItem } from "@/features/profissionais/components/BarberListItem";
import { setPanelBarberActive } from "@/lib/api/panel/barbers";
import type { PanelBarber } from "@/lib/api/types";

const NEW = "new";

// Prototype: admin/profissionais.html. Desktop: list (340px) + form side by side.
// Phones: the list first; choosing someone (or "Novo profissional") shows the form with "Voltar".
export function AdminBarbers() {
  const state = useBarbers();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpenOnPhone, setFormOpenOnPhone] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ barberId: string; text: string } | null>(null);

  if (state.status === "loading") {
    return <div role="status" aria-label="Carregando" className="m-5 h-[480px] animate-pulse rounded-2xl bg-card md:m-8" />;
  }
  if (state.status === "error") {
    return (
      <p className="px-5 py-6 text-[13px] text-muted md:px-8">
        Não foi possível carregar os profissionais.{" "}
        <button type="button" onClick={state.retry} className="font-semibold text-accent">Tentar novamente</button>
      </p>
    );
  }

  const { barbers, plan, services } = state.page;
  const { upsert, remove } = state;
  const current = selectedId === NEW ? null : (barbers.find((b) => b.id === selectedId) ?? barbers[0] ?? null);
  const editingNew = selectedId === NEW || barbers.length === 0;
  const limitReached = barbers.length >= plan.maxBarbers;

  const open = (id: string) => {
    setSelectedId(id);
    setNotice(null);
    setFormOpenOnPhone(true);
  };

  async function toggleActive(barber: PanelBarber, active: boolean) {
    setTogglingId(barber.id);
    setListError(null);
    try {
      upsert(await setPanelBarberActive(barber.id, active));
    } catch {
      setListError("Não foi possível alterar. Tente novamente.");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6 px-5 py-6 md:flex-row md:items-start md:px-8">
      <div className={`flex-col gap-3 md:flex md:w-[340px] md:shrink-0 ${formOpenOnPhone ? "hidden" : "flex"}`}>
        <button
          type="button"
          disabled={limitReached}
          onClick={() => open(NEW)}
          className="flex flex-col items-center justify-center gap-0.5 rounded-xl border-[1.5px] border-dashed border-border p-3 text-[13px] font-semibold text-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span>+ Novo profissional</span>
          {limitReached && (
            <span className="text-[11px] font-normal">Limite do plano atingido ({barbers.length}/{plan.maxBarbers})</span>
          )}
        </button>
        {barbers.map((barber) => (
          <BarberListItem
            key={barber.id}
            barber={barber}
            selected={!editingNew && current?.id === barber.id}
            onSelect={() => open(barber.id)}
            onToggleActive={(active) => toggleActive(barber, active)}
            toggling={togglingId === barber.id}
          />
        ))}
        {listError && <p role="alert" className="text-[12px] text-accent">{listError}</p>}
      </div>

      <div className={`min-w-0 flex-1 flex-col gap-3 md:flex ${formOpenOnPhone ? "flex" : "hidden"}`}>
        <button type="button" onClick={() => setFormOpenOnPhone(false)} className="self-start text-[13px] font-semibold text-muted md:hidden">
          ‹ Voltar à lista
        </button>
        <BarberForm
          key={editingNew ? NEW : current?.id}
          barber={editingNew ? null : current}
          services={services}
          notice={notice && current && notice.barberId === current.id && !editingNew ? notice.text : null}
          onSaved={(saved, text) => {
            upsert(saved);
            setSelectedId(saved.id);
            setNotice({ barberId: saved.id, text });
          }}
          onRemoved={(id) => {
            remove(id);
            setSelectedId(null);
            setFormOpenOnPhone(false);
          }}
        />
      </div>
    </div>
  );
}
