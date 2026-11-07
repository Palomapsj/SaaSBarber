// The waitlist flow is still being designed: the button keeps its place from the prototype,
// but is disabled and labeled "Em desenvolvimento" up front.
export function WaitlistButton() {
  return (
    <button
      type="button"
      disabled
      className="flex w-full cursor-not-allowed flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-xl border border-border bg-transparent px-3 py-3 text-[13px] text-muted2"
    >
      <span>Nenhum horário bom? Lista de espera</span>
      <span className="rounded-full bg-card2 px-2 py-0.5 text-[11px] font-semibold tracking-[0.5px] text-muted uppercase">
        Em desenvolvimento
      </span>
    </button>
  );
}
