import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { supabaseUrl } from "./env";

/**
 * Cliente con la clave secreta: se salta RLS. Solo para procesos del servidor sin sesión
 * (el programador de avisos). Nunca importarlo desde código que llegue al navegador.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("Falta SUPABASE_SECRET_KEY (solo servidor). Configúrala en .env.local y en Vercel.");
  return createClient<Database>(supabaseUrl, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
