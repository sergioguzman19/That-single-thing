"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, type LoginState } from "./actions";

const RESEND_AFTER = 60; // segundos; Supabase no deja pedir otro código antes.

function useSecondsLeft(sentAt: number | undefined) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!sentAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [sentAt]);
  if (!sentAt) return 0;
  return Math.max(0, RESEND_AFTER - Math.floor((now - sentAt) / 1000));
}

const INITIAL: LoginState = { step: "email", email: "" };

export function LoginForm() {
  const [state, action, pending] = useActionState(login, INITIAL);
  const secondsLeft = useSecondsLeft(state.step === "code" ? state.sentAt : undefined);

  if (state.step === "email") {
    return (
      <form action={action} className="grid gap-3" noValidate>
        <Label htmlFor="email">Tu correo</Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          defaultValue={state.email}
          placeholder="nombre@correo.com"
          aria-invalid={Boolean(state.error)}
          aria-describedby={state.error ? "login-error" : undefined}
          required
          autoFocus
          className="h-11 text-base"
        />
        {state.error ? (
          <p id="login-error" role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : null}
        <Button type="submit" name="intent" value="send" size="lg" className="h-11" disabled={pending}>
          {pending ? "Enviando…" : "Enviar código"}
        </Button>
      </form>
    );
  }

  return (
    <form action={action} className="grid gap-3" noValidate>
      <input type="hidden" name="email" value={state.email} />
      <Label htmlFor="code">Código de 6 dígitos</Label>
      <p className="-mt-1 text-sm text-muted-foreground">
        Lo enviamos a <span className="font-medium text-foreground">{state.email}</span>. Vence en 10 minutos.
      </p>
      <Input
        id="code"
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="000000"
        aria-invalid={Boolean(state.error)}
        aria-describedby={state.error ? "login-error" : undefined}
        autoFocus
        className="h-12 text-center font-mono text-2xl tracking-[0.4em] tabular-nums"
      />
      {state.error ? (
        <p id="login-error" role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" name="intent" value="verify" size="lg" className="h-11" disabled={pending}>
        {pending ? "Un momento…" : "Entrar"}
      </Button>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <Button type="submit" name="intent" value="back" variant="link" className="h-auto px-0" disabled={pending}>
          Usar otro correo
        </Button>
        <Button
          type="submit"
          name="intent"
          value="send"
          variant="link"
          className="h-auto px-0"
          disabled={secondsLeft > 0 || pending}
        >
          {secondsLeft > 0 ? `Reenviar en ${secondsLeft} s` : "Reenviar código"}
        </Button>
      </div>
    </form>
  );
}
