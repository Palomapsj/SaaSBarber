import { type NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, decodeSession, homeOf } from "@/lib/auth/session";

// Protects the panel: no session → /login; a barber opening /admin (or the other way round) →
// their own area; a logged-in user opening /login → their area. The API still checks every call.

const AREA_ROLE = { "/admin": "admin", "/barbeiro": "barber" } as const;

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = await decodeSession(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/login") {
    return session ? NextResponse.redirect(new URL(homeOf(session.role), request.url)) : NextResponse.next();
  }

  if (!session) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname + search);
    return NextResponse.redirect(login);
  }

  const area = pathname.startsWith("/admin") ? "/admin" : "/barbeiro";
  if (session.role !== AREA_ROLE[area] || pathname === area || pathname === `${area}/`) {
    return NextResponse.redirect(new URL(homeOf(session.role), request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/admin", "/admin/:path*", "/barbeiro", "/barbeiro/:path*"],
};
