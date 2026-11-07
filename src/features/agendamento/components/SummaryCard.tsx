export type SummaryRow = { label: string; value: string };

// Booking summary: label/value rows and the total (prototype: cliente/confirmar.html).
export function SummaryCard({ rows, total }: { rows: SummaryRow[]; total: string }) {
  return (
    <dl className="rounded-2xl border border-border bg-card p-4">
      {rows.map((row) => (
        <div key={row.label} className="flex justify-between gap-4 border-b border-border py-2.5 text-[13px]">
          <dt className="text-muted">{row.label}</dt>
          <dd className="text-right font-semibold text-text">{row.value}</dd>
        </div>
      ))}
      <div className="flex items-baseline justify-between pt-3">
        <dt className="text-[14px] font-bold text-text">Total</dt>
        <dd className="text-[16px] font-bold text-accent">{total}</dd>
      </div>
    </dl>
  );
}
