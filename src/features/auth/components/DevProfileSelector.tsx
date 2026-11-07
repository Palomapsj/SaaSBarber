import Link from "next/link";
import { devLogin } from "@/app/login/actions";

const option =
  "flex flex-1 items-center justify-center rounded-[9px] py-2.5 text-[11px] font-bold text-muted hover:bg-accent hover:text-on-accent";

// Development shortcut from the prototype's "Sou Cliente / Barbeiro / Admin" selector.
// Rendered only when NEXT_PUBLIC_DEV_PROFILE_SELECTOR=true; the server action also refuses otherwise.
export function DevProfileSelector({ clientHref }: { clientHref: string }) {
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex w-full gap-1.5 rounded-xl border border-border bg-card p-1">
        <Link href={clientHref} className={option}>
          Sou Cliente
        </Link>
        <form action={devLogin.bind(null, "barber")} className="flex flex-1">
          <button type="submit" className={option}>
            Sou Barbeiro
          </button>
        </form>
        <form action={devLogin.bind(null, "admin")} className="flex flex-1">
          <button type="submit" className={option}>
            Sou Admin
          </button>
        </form>
      </div>
      <p className="text-center text-[11px] text-muted">
        Atalho de desenvolvimento: entra direto com um usuário de demonstração. No app real o perfil vem do login.
      </p>
    </div>
  );
}
