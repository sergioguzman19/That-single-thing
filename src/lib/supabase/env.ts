function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Falta la variable de entorno ${name}. Configúrala en .env.local (local) o en Vercel → Settings → Environment Variables.`);
  return value;
}

// Next.js solo inyecta variables NEXT_PUBLIC_ cuando se leen de forma literal.
export const supabaseUrl = required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
export const supabasePublishableKey = required(
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);
