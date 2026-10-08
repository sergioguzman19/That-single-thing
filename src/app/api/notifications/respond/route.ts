import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Respuesta a "¿Terminaste X?" desde los botones de la notificación (Android).
 * La llama el service worker con las cookies de la sesión.
 */
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });

  const { taskId, finished } = (await request.json().catch(() => ({}))) as { taskId?: string; finished?: boolean };
  if (!taskId || typeof finished !== "boolean") return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });

  const supabase = await createClient();
  const [task, profile] = await Promise.all([
    finished ? supabase.from("tasks").update({ completed_at: new Date().toISOString() }).eq("id", taskId) : Promise.resolve({ error: null }),
    supabase.from("profiles").update({ last_task_id: null, last_period_end: null }).eq("id", user.id),
  ]);
  if (task.error || profile.error) return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
