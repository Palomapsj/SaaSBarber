type ToggleChipsProps = {
  items: { id: string; label: string }[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  /** Id of the element that names the group (its visible title). */
  labelId: string;
  error?: string | null;
};

// Chips that turn on/off (prototype: "Serviços que atende", "Profissionais que atendem").
// Selected = red with white text; the pressed state is announced, not only shown by color.
export function ToggleChips({ items, selectedIds, onChange, labelId, error }: ToggleChipsProps) {
  const toggle = (id: string) =>
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);

  return (
    <div>
      <div
        role="group"
        aria-labelledby={labelId}
        aria-describedby={error ? `${labelId}-error` : undefined}
        className="flex flex-wrap gap-2"
      >
        {items.map((item) => {
          const selected = selectedIds.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected}
              onClick={() => toggle(item.id)}
              className={`rounded-full border px-[13px] py-[7px] text-[12px] font-semibold ${
                selected ? "border-accent bg-accent text-on-accent" : "border-border bg-card2 text-muted"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {error && (
        <p id={`${labelId}-error`} className="mt-1.5 text-[12px] text-accent">
          {error}
        </p>
      )}
    </div>
  );
}
