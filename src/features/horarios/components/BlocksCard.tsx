"use client";

import { useState } from "react";
import { PlusIcon } from "@/components/ui/icons/PlusIcon";
import { TrashIcon } from "@/components/ui/icons/TrashIcon";
import { outsideWarning } from "@/features/horarios/scheduleText";
import { type ScheduleOwner, removeBlock } from "@/lib/api/panel/schedules";
import type { ScheduleBlock } from "@/lib/api/scheduleTypes";
import type { LocalDate } from "@/lib/api/types";
import { formatBlockPeriod } from "@/lib/format/scheduleBlock";
import { BlockForm } from "./BlockForm";

type BlocksCardProps = {
  owner: ScheduleOwner;
  blocks: ScheduleBlock[];
  today: LocalDate;
};

type Notice = { kind: "success" | "warning" | "error"; text: string };

const byStart = (a: ScheduleBlock, b: ScheduleBlock) =>
  `${a.startDate}${a.startTime ?? ""}`.localeCompare(`${b.startDate}${b.startTime ?? ""}`);

// Prototype: "Bloqueios e folgas" card (period, reason, trash can).
export function BlocksCard({ owner, blocks: initial, today }: BlocksCardProps) {
  const [blocks, setBlocks] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  async function remove(block: ScheduleBlock) {
    setRemovingId(block.id);
    setNotice(null);
    try {
      await removeBlock(owner, block.id);
      setBlocks((current) => current.filter((b) => b.id !== block.id));
      setNotice({ kind: "success", text: "Bloqueio removido." });
    } catch {
      setNotice({ kind: "error", text: "Não foi possível remover. Tente novamente." });
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <section aria-labelledby="blocks-title" className="rounded-2xl border border-border bg-card px-5 py-5 md:px-6">
      <div className="flex items-center justify-between gap-3 pb-3">
        <h2 id="blocks-title" className="text-[12px] font-semibold tracking-[0.5px] text-muted uppercase">Bloqueios e folgas</h2>
        {!adding && (
          <button type="button" onClick={() => { setAdding(true); setNotice(null); }}
            className="flex shrink-0 items-center gap-1.5 rounded-[9px] border border-border px-3.5 py-2 text-[12px] font-semibold whitespace-nowrap text-text">
            <PlusIcon size={14} /> Adicionar bloqueio
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {adding && (
          <BlockForm
            owner={owner}
            today={today}
            onCancel={() => setAdding(false)}
            onSaved={({ saved, outsideCount }) => {
              setBlocks((current) => [...current, saved].sort(byStart));
              setAdding(false);
              setNotice(
                outsideCount > 0
                  ? { kind: "warning", text: outsideWarning(outsideCount) }
                  : { kind: "success", text: "Bloqueio adicionado." },
              );
            }}
          />
        )}
        {blocks.length === 0 && !adding && (
          <p className="text-[13px] text-muted">Nenhum bloqueio. Use para férias, folgas e compromissos.</p>
        )}
        <ul className="flex flex-col gap-2">
          {blocks.map((block) => {
            const period = formatBlockPeriod(block);
            return (
              <li key={block.id} className="flex items-center justify-between gap-3 rounded-[10px] bg-card2 py-1 pr-1 pl-3">
                <span className="text-[13px] text-text">{period}</span>
                <span className="min-w-0 flex-1 truncate text-right text-[12px] text-muted md:flex-none md:text-left">{block.reason}</span>
                <button type="button" onClick={() => remove(block)} disabled={removingId !== null}
                  aria-label={`Remover bloqueio ${period}`} aria-busy={removingId === block.id}
                  className="flex size-11 shrink-0 items-center justify-center rounded-[10px] text-muted hover:text-accent disabled:opacity-60">
                  <TrashIcon size={15} />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      {notice && (
        <p role={notice.kind === "error" ? "alert" : "status"}
          className={`pt-3 text-[12px] ${notice.kind === "success" ? "text-success" : notice.kind === "error" ? "text-accent" : "text-text"}`}>
          {notice.text}
        </p>
      )}
    </section>
  );
}
