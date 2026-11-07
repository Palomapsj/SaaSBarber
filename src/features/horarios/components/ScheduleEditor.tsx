"use client";

import { type ScheduleOwner, getSchedule } from "@/lib/api/panel/schedules";
import { localDateOf } from "@/lib/format/date";
import { useAsyncResource } from "@/lib/hooks/useAsyncResource";
import { BlocksCard } from "./BlocksCard";
import { WeeklyScheduleCard } from "./WeeklyScheduleCard";

type ScheduleEditorProps = {
  owner: ScheduleOwner;
  /** "Horário semanal" (admin) or "Meu horário semanal" (barber). */
  weeklyTitle: string;
  onDirtyChange?: (dirty: boolean) => void;
};

// Weekly hours + blocks of one barber (admin/horarios.html, barbeiro/horarios.html).
export function ScheduleEditor({ owner, weeklyTitle, onDirtyChange }: ScheduleEditorProps) {
  const key = owner === "me" ? "schedule:me" : `schedule:${owner.barberId}`;
  const resource = useAsyncResource(key, () => getSchedule(owner));

  if (resource.status === "loading" || resource.status === "idle") {
    return <div role="status" aria-label="Carregando" className="h-[480px] animate-pulse rounded-2xl bg-card" />;
  }
  if (resource.status === "error") {
    return (
      <p className="py-2 text-[13px] text-muted">
        Não foi possível carregar os horários.{" "}
        <button type="button" onClick={resource.retry} className="font-semibold text-accent">Tentar novamente</button>
      </p>
    );
  }

  const { weekly, blocks, shopHours } = resource.data;
  return (
    <div key={key} className="flex flex-col gap-5">
      <WeeklyScheduleCard owner={owner} title={weeklyTitle} weekly={weekly} shopHours={shopHours} onDirtyChange={onDirtyChange} />
      <BlocksCard owner={owner} blocks={blocks} today={localDateOf(new Date())} />
    </div>
  );
}
