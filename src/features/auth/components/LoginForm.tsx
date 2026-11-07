"use client";

import { useActionState } from "react";
import { type LoginState, login } from "@/app/login/actions";
import { TextField } from "@/components/ui/TextField";

const initialState: LoginState = { error: null };

// Phone or e-mail + password (prototype: index.html). Errors come from the server action.
export function LoginForm({ next }: { next: string | null }) {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form
      action={formAction}
      noValidate
      className="flex w-full flex-col gap-4 rounded-[18px] border border-border bg-card p-[26px]"
    >
      <input type="hidden" name="next" value={next ?? ""} />
      <TextField
        id="identifier"
        name="identifier"
        label="Telefone ou e-mail"
        placeholder="(11) 90000-0000"
        autoComplete="username"
        required
      />
      <TextField
        id="password"
        name="password"
        label="Senha"
        type="password"
        placeholder="••••••••"
        autoComplete="current-password"
        required
      />
      <p className="flex items-center justify-end gap-2 text-[12px] text-muted2">
        Esqueci minha senha
        <span className="rounded-full bg-card2 px-2 py-0.5 text-[9px] font-bold tracking-[0.5px] text-muted uppercase">
          Em desenvolvimento
        </span>
      </p>
      {state.error && (
        <p role="alert" className="text-[13px] text-accent">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="w-full rounded-xl bg-accent py-3.5 text-center font-display text-[14px] font-bold tracking-[0.5px] text-on-accent uppercase disabled:opacity-70"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
