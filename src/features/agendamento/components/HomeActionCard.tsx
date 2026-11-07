import Link from "next/link";
import type { ReactNode } from "react";

type HomeActionCardProps = {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
  variant: "primary" | "secondary";
};

const iconBoxClasses: Record<HomeActionCardProps["variant"], string> = {
  primary: "bg-accent text-on-accent",
  secondary: "bg-card2 text-text",
};

export function HomeActionCard({ href, title, description, icon, variant }: HomeActionCardProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3.5 rounded-[14px] border border-border bg-card p-3.5 text-left"
    >
      <div className={`flex size-10 shrink-0 items-center justify-center rounded-[10px] ${iconBoxClasses[variant]}`}>
        {icon}
      </div>
      <div>
        <div className="text-[14px] font-semibold text-text">{title}</div>
        <div className="text-[12px] text-muted">{description}</div>
      </div>
    </Link>
  );
}
