import Link from "next/link";
import type { ReactNode } from "react";

// Full-width outlined action, e.g. "Ver meus agendamentos" (prototype: cliente/sucesso.html).
export function SecondaryAction({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="block w-full rounded-xl border border-border py-[15px] text-center text-[14px] font-semibold text-text"
    >
      {children}
    </Link>
  );
}
