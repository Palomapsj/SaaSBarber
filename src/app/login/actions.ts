"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authenticate, demoUserFor } from "@/lib/api/server";
import type { PanelUser } from "@/lib/api/types";
import { afterLoginPath } from "@/lib/auth/redirects";
import { type PanelRole, SESSION_COOKIE, SESSION_HOURS, encodeSession } from "@/lib/auth/session";

export type LoginState = { error: string | null };

async function startSession(user: PanelUser): Promise<void> {
  const value = await encodeSession({
    userId: user.id,
    role: user.role,
    barbershopId: user.barbershopId,
    barberId: user.barberId,
    name: user.name,
    expiresAt: Date.now() + SESSION_HOURS * 3_600_000,
  });
  (await cookies()).set(SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
}

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const identifier = String(formData.get("identifier") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!identifier.trim() || !password) return { error: "Informe telefone ou e-mail e senha." };

  const user = await authenticate(identifier, password);
  if (!user) return { error: "Telefone/e-mail ou senha incorretos." };

  await startSession(user);
  redirect(afterLoginPath(String(formData.get("next") ?? ""), user.role));
}

/** Development shortcut behind the profile selector. Refused when the selector is off. */
export async function devLogin(role: PanelRole): Promise<void> {
  if (process.env.NEXT_PUBLIC_DEV_PROFILE_SELECTOR !== "true") throw new Error("Profile selector is disabled.");
  const user = await demoUserFor(role);
  await startSession(user);
  redirect(afterLoginPath(null, user.role));
}

export async function logout(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
