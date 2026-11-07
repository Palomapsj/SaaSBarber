import type { ReactNode } from "react";
import { CheckIcon } from "@/components/ui/icons/CheckIcon";

type BarberOptionProps = {
  title: string;
  description: string;
  avatar: ReactNode;
  selected: boolean;
  onSelect: () => void;
  /** "Qualquer profissional" uses a dashed border (prototype: cliente/profissional.html). */
  variant?: "barber" | "any";
};

// A real radio input (visually hidden) inside the card. Selected = red border + red avatar + check.
export function BarberOption({ title, description, avatar, selected, onSelect, variant = "barber" }: BarberOptionProps) {
  const border =
    variant === "any"
      ? `border-[1.5px] ${selected ? "border-solid border-accent" : "border-dashed border-border"}`
      : `border ${selected ? "border-accent" : "border-border"}`;

  return (
    <label
      className={`flex w-full cursor-pointer items-center gap-3.5 rounded-[14px] bg-card p-3.5 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-accent ${border}`}
    >
      <input type="radio" name="barber" checked={selected} onChange={onSelect} className="sr-only" />
      <span
        aria-hidden="true"
        className={`flex size-11 shrink-0 items-center justify-center rounded-full font-display text-[14px] font-bold ${
          selected ? "bg-accent text-on-accent" : "bg-card2 text-text"
        }`}
      >
        {avatar}
      </span>
      <span className="flex-1">
        <span className="block text-[14px] font-semibold text-text">{title}</span>
        <span className="block text-[12px] text-muted">{description}</span>
      </span>
      {selected && <CheckIcon size={20} strokeWidth={2.5} className="shrink-0 text-accent" />}
    </label>
  );
}
