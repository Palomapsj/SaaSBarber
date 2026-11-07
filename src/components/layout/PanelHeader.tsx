import { type ReactNode, Suspense } from "react";
import { UserAvatar, UserAvatarPlaceholder } from "@/components/layout/UserAvatar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

type PanelHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
};

// Top of each panel screen: title, subtitle and who is logged in (prototype: admin/*.html).
export function PanelHeader({ title, subtitle }: PanelHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-[22px] md:px-8">
      <div className="min-w-0">
        <h1 className="font-display text-[19px] font-bold uppercase">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[12px] text-muted">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-3.5">
        <div className="md:hidden">
          <ThemeToggle />
        </div>
        <Suspense fallback={<UserAvatarPlaceholder />}>
          <UserAvatar />
        </Suspense>
      </div>
    </header>
  );
}
