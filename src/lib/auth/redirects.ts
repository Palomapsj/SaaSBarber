import { type PanelRole, homeOf } from "@/lib/auth/session";

const AREA: Record<PanelRole, string> = { admin: "/admin/", barber: "/barbeiro/" };

/**
 * Where to go after login. `next` is only accepted when it is a page of the user's own area,
 * so a crafted link cannot send people to another site or to the wrong area.
 */
export function afterLoginPath(next: string | null | undefined, role: PanelRole): string {
  if (!next || !next.startsWith(AREA[role]) || next.includes("//") || next.includes("\\")) return homeOf(role);
  return next;
}
