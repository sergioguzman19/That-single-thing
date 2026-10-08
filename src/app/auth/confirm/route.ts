import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Destino del enlace del correo (alternativa al código de 6 dígitos).
 * Acepta los dos formatos que puede traer el enlace:
 * - `code` (flujo PKCE, plantilla por defecto de Supabase): solo funciona en el mismo
 *   navegador donde se pidió el código.
 * - `token_hash` + `type` (plantilla propia): funciona en cualquier navegador.
 * En la app instalada en iPhone el enlace abre Safari; ahí hay que usar el código.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";
  // Solo rutas internas, para no convertir esto en un redirect abierto.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  const supabase = await createClient();
  let ok = false;
  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && type) {
    ok = !(await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error;
  }

  if (ok) return NextResponse.redirect(new URL(safeNext, origin));
  return NextResponse.redirect(new URL("/entrar?enlace=invalido", origin));
}
