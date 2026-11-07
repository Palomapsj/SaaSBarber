import { ClientScreen } from "@/components/layout/ClientScreen";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function NotFoundScreen({ title, message }: { title: string; message: string }) {
  return (
    <ClientScreen>
      <div className="content-width flex justify-end px-5 pt-5 pb-4 md:px-8">
        <ThemeToggle />
      </div>
      <main className="flex flex-1 flex-col items-center justify-center gap-2 px-5 pb-16 text-center">
        <h1 className="font-display text-[20px] font-bold uppercase">{title}</h1>
        <p className="text-[13px] text-muted">{message}</p>
      </main>
    </ClientScreen>
  );
}
