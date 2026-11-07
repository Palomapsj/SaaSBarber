import { getSession } from "@/lib/auth/currentSession";
import { formatInitials } from "@/lib/format/initials";

// Initials of who is logged in (the prototype shows an empty circle). Reads the session, so it
// renders behind the header's <Suspense> boundary.
export async function UserAvatar() {
  const session = await getSession();
  return (
    <div
      title={session?.name}
      aria-label={session ? `Conectado como ${session.name}` : undefined}
      className="flex size-[34px] items-center justify-center rounded-full bg-card2 font-display text-[12px] font-bold text-muted"
    >
      {session ? formatInitials(session.name) : null}
    </div>
  );
}

export function UserAvatarPlaceholder() {
  return <div className="size-[34px] rounded-full bg-card2" />;
}
