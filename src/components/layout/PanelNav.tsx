"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarIcon } from "@/components/ui/icons/CalendarIcon";
import { ClockIcon } from "@/components/ui/icons/ClockIcon";
import { TagIcon } from "@/components/ui/icons/TagIcon";
import { UsersIcon } from "@/components/ui/icons/UsersIcon";
import type { PanelNavIcon, PanelNavItem } from "@/components/layout/panelNavigation";

const ICONS: Record<PanelNavIcon, typeof CalendarIcon> = {
  calendar: CalendarIcon,
  users: UsersIcon,
  tag: TagIcon,
  clock: ClockIcon,
};

type PanelNavProps = {
  items: PanelNavItem[];
  /** "side": icon squares in the desktop side bar. "bottom": icon + label in the phone bottom bar. */
  variant: "side" | "bottom";
};

export function PanelNav({ items, variant }: PanelNavProps) {
  const pathname = usePathname();

  return items.map((item) => {
    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
    const Icon = ICONS[item.icon];
    const tone = active ? "bg-accent text-on-accent" : "text-muted hover:bg-card2";
    return variant === "side" ? (
      <Link
        key={item.href}
        href={item.href}
        aria-label={item.label}
        aria-current={active ? "page" : undefined}
        title={item.label}
        className={`flex size-[52px] items-center justify-center rounded-[14px] ${tone}`}
      >
        <Icon size={20} />
      </Link>
    ) : (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={`flex min-h-12 min-w-16 flex-1 flex-col items-center justify-center gap-0.5 rounded-[14px] px-1 py-1.5 text-[10px] font-semibold ${tone}`}
      >
        <Icon size={20} />
        {item.label}
      </Link>
    );
  });
}
