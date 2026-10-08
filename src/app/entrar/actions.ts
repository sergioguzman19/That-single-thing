"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState =
  | { step: "email"; email: string; error?: string }
  | { step: "code"; email: string; sentAt: number; error?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalize = (value: FormDataEntryValue | null) => String(value ?? "").trim().toLowerCase();

/** Errores de Supabase traducidos a lo que la persona necesita saber. */
function sendError(code: string | undefined): string {
  switch (code) {
    // Sin registro público: un correo que no existe no puede pedir código.
    case "otp_disabled":
    case "signup_disabled":
    case "user_not_found":
      return "Este correo no está registrado.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Ya te enviamos un código hace poco. Espera un minuto y vuelve a intentarlo.";
    default:
      return "No pudimos enviar el código. Inténtalo de nuevo en un momento.";
  }
}

/**
 * Una sola acción para todo el login; el botón que envía el formulario dice qué hacer:
 * "send" pide el código, "verify" lo comprueba, "back" vuelve a escribir el correo.
 */
export async function login(prev: LoginState, formData: FormData): Promise<LoginState> {
  const intent = String(formData.get("intent") ?? "send");
  const email = normalize(formData.get("email")) || prev.email;

  if (intent === "back") return { step: "email", email };

  const supabase = await createClient();

  if (intent === "send") {
    if (!EMAIL.test(email)) return { step: "email", email, error: "Escribe un correo válido." };
    // shouldCreateUser: false → un correo sin registrar no recibe nada.
    // El correo trae el código y, como alternativa, un enlace que vuelve a /auth/confirm.
    const origin = (await headers()).get("origin") ?? "";
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, emailRedirectTo: origin ? `${origin}/auth/confirm` : undefined },
    });
    if (error) {
      const message = sendError(error.code);
      // Si falla un reenvío, la persona sigue en el paso del código.
      return prev.step === "code" ? { ...prev, error: message } : { step: "email", email, error: message };
    }
    return { step: "code", email, sentAt: Date.now() };
  }

  const sentAt = prev.step === "code" ? prev.sentAt : Date.now();
  const token = String(formData.get("code") ?? "").replace(/\D/g, "");
  if (token.length !== 6) return { step: "code", email, sentAt, error: "El código tiene 6 dígitos." };

  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) {
    return {
      step: "code",
      email,
      sentAt,
      error:
        error.code === "over_request_rate_limit"
          ? "Demasiados intentos. Espera un momento."
          : "El código no es válido o ya venció. Revísalo o pide uno nuevo.",
    };
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/entrar");
}
