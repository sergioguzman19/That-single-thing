"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { focusUntil } from "@/lib/dispatch";
import { createClient } from "@/lib/supabase/server";
import { type ActionResult, fail, GENERIC_ERROR, ok } from "./result";

const done = () => {
  revalidatePath("/", "layout");
  return ok();
};

/**
 * Escoger qué carril despacha: en un bloque abierto ("open") o saliéndose del plan ("override").
 * El foco dura hasta que termine el bloque, o hasta el siguiente bloque o el fin del día.
 * Se calcula con el instante real y la zona horaria del perfil, nunca con la hora local del servidor.
 */
export async function chooseLane(laneId: string, kind: "open" | "override"): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();
  const [{ data: profile }, { data: blocks }] = await Promise.all([
    supabase.from("profiles").select("timezone").eq("id", user.id).maybeSingle(),
    supabase.from("blocks").select("lane_id, day_of_week, start_minute, end_minute"),
  ]);
  const until = focusUntil(
    new Date(),
    profile?.timezone ?? "America/Bogota",
    (blocks ?? []).map((b) => ({ laneId: b.lane_id, dayOfWeek: b.day_of_week, startMinute: b.start_minute, endMinute: b.end_minute })),
  );

  const [update, event] = await Promise.all([
    supabase.from("profiles").update({ focus_lane_id: laneId, focus_until: until.toISOString() }).eq("id", user.id),
    supabase.from("focus_events").insert({ lane_id: laneId, kind }),
  ]);
  return update.error || event.error ? fail(GENERIC_ERROR) : done();
}

/** Volver al plan: deja que el bloque programado decida otra vez. */
export async function backToPlan(): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ focus_lane_id: null, focus_until: null }).eq("id", user.id);
  return error ? fail(GENERIC_ERROR) : done();
}

export async function completeTask(id: string): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").update({ completed_at: new Date().toISOString() }).eq("id", id);
  return error ? fail(GENERIC_ERROR) : done();
}

/** Deshacer "Hecho": la tarea vuelve a su lugar en la cola (su posición no cambió). */
export async function undoComplete(id: string): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").update({ completed_at: null }).eq("id", id);
  return error ? fail(GENERIC_ERROR) : done();
}

/**
 * Empezar o pausar. Solo puede haber una tarea en curso (lo garantiza un índice único):
 * empezar una pausa la que estuviera en curso, que sigue de primera en su carril.
 * Devuelve la tarea que se pausó, si hubo una.
 */
export async function setStarted(id: string, started: boolean): Promise<ActionResult & { paused?: { title: string; laneName: string } }> {
  await requireUser();
  const supabase = await createClient();
  if (!started) {
    const { error } = await supabase.from("tasks").update({ started_at: null }).eq("id", id);
    return error ? fail(GENERIC_ERROR) : done();
  }

  const { data: previous } = await supabase
    .from("tasks")
    .select("id, title, lanes(name)")
    .not("started_at", "is", null)
    .is("completed_at", null)
    .neq("id", id)
    .maybeSingle();
  if (previous) {
    const { error } = await supabase.from("tasks").update({ started_at: null }).eq("id", previous.id);
    if (error) return fail(GENERIC_ERROR);
  }
  const { error } = await supabase.from("tasks").update({ started_at: new Date().toISOString() }).eq("id", id);
  if (error) return fail(GENERIC_ERROR);
  revalidatePath("/", "layout");
  return previous ? { ok: true, paused: { title: previous.title, laneName: previous.lanes?.name ?? "" } } : ok();
}

/** Recuerda cuál fue la tarea única y cuándo terminaba su período (para "¿Terminaste X?"). */
export async function markSeen(taskId: string, periodEnd: string): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ last_task_id: taskId, last_period_end: periodEnd })
    .eq("id", user.id);
  return error ? fail(GENERIC_ERROR) : ok();
}

/** Respuesta a "¿Terminaste X?": sí la completa; no la deja de primera en su carril. */
export async function resolveCheck(taskId: string, finished: boolean): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();
  const [task, profile] = await Promise.all([
    finished
      ? supabase.from("tasks").update({ completed_at: new Date().toISOString() }).eq("id", taskId)
      : Promise.resolve({ error: null }),
    supabase.from("profiles").update({ last_task_id: null, last_period_end: null }).eq("id", user.id),
  ]);
  return task.error || profile.error ? fail(GENERIC_ERROR) : done();
}
