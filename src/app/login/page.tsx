import type { Metadata } from "next";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ScissorsIcon } from "@/components/ui/icons/ScissorsIcon";
import { DevProfileSelector } from "@/features/auth/components/DevProfileSelector";
import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata: Metadata = {
  title: "Entrar",
  robots: { index: false, follow: false },
};

// Panel login (prototype: index.html). Shared by every barbershop: the barbershop comes from the
// account, so the page shows a generic title instead of a barbershop name.
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const showSelector = process.env.NEXT_PUBLIC_DEV_PROFILE_SELECTOR === "true";

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-bg p-6">
      <div className="absolute top-6 right-5 md:right-8">
        <ThemeToggle />
      </div>
      <main className="flex w-[380px] max-w-full flex-col items-center gap-5 pt-12 md:pt-0">
        <div className="flex flex-col items-center gap-2.5">
          <div className="flex size-[52px] items-center justify-center rounded-[14px] bg-accent text-on-accent">
            <ScissorsIcon size={26} />
          </div>
          <h1 className="text-center font-display text-[18px] font-bold uppercase">Painel da barbearia</h1>
          <p className="text-[13px] text-muted">Acesso ao sistema</p>
        </div>
        {showSelector && <DevProfileSelector clientHref="/novaera" />}
        <LoginForm next={typeof next === "string" ? next : null} />
        <p className="text-center text-[12px] text-muted">
          Primeiro acesso? <span className="text-accent">Peça o convite ao dono da barbearia</span>
        </p>
      </main>
    </div>
  );
}
