import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ScissorsIcon } from "@/components/ui/icons/ScissorsIcon";

// Logo + name + theme toggle at the top of the client home (prototype: cliente/inicio.html).
export function BarbershopHeader({ name }: { name: string }) {
  return (
    <header className="content-width flex items-center justify-between px-5 pt-5 pb-4 md:px-8">
      <div className="flex items-center gap-2.5">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent">
          <ScissorsIcon size={22} />
        </div>
        <h1 className="font-display text-[20px] font-bold uppercase">{name}</h1>
      </div>
      <ThemeToggle />
    </header>
  );
}
