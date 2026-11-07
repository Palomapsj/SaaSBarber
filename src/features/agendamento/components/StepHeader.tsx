import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ChevronLeftIcon } from "@/components/ui/icons/ChevronLeftIcon";

// Top bar of booking steps 2–6: back, centered title, theme toggle.
export function StepHeader({ title, backHref }: { title: string; backHref: string }) {
  return (
    <header className="content-width flex items-center justify-between px-5 pt-5 md:px-8">
      <Link
        href={backHref}
        aria-label="Voltar"
        className="relative flex size-9 items-center justify-center rounded-full bg-card text-text before:absolute before:-inset-1 before:content-['']"
      >
        <ChevronLeftIcon size={18} />
      </Link>
      <h1 className="font-display text-[15px] font-semibold tracking-[0.5px] uppercase">{title}</h1>
      <ThemeToggle />
    </header>
  );
}
