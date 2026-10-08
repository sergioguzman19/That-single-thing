"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { positionAtEnd, positionAtStart, positionBetween } from "@/lib/ordering";
import { createClient } from "@/lib/supabase/server";
import { type ActionResult, fail, GENERIC_ERROR, ok } from "./result";

const done = () => {
  revalidatePath("/", "layout");
  return ok();
};

function cleanTitle(title: string) {
  const value = title.trim().replace(/\s+/g, " ");
  if (!value) return { error: "Escribe la tarea." };
  if (value.length > 500) return { error: "La tarea es muy larga (máximo 500 caracteres)." };
  return { value };
}

async function queuePositions(laneId: string, exceptId?: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select("id, position")
    .eq("lane_id", laneId)
    .is("completed_at", null)
    .order("position")
    .order("created_at");
  return (data ?? []).filter((t) => t.id !== exceptId);
}

export async function createTask(input: { laneId: string; title: string; notes?: string; first?: boolean }): Promise<ActionResult> {
  await requireUser();
  const title = cleanTitle(input.title);
  if ("error" in title) return fail(title.error!);

  const queue = (await queuePositions(input.laneId)).map((t) => t.position);
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    lane_id: input.laneId,
    title: title.value,
    notes: (input.notes ?? "").trim(),
    position: input.first ? positionAtStart(queue) : positionAtEnd(queue),
  });
  return error ? fail(GENERIC_ERROR) : done();
}

/** Edita título y descripción; si cambia de carril, entra al final de la cola nueva. */
export async function updateTask(id: string, input: { title: string; notes: string; laneId: string }): Promise<ActionResult> {
  await requireUser();
  const title = cleanTitle(input.title);
  if ("error" in title) return fail(title.error!);

  const supabase = await createClient();
  const { data: current } = await supabase.from("tasks").select("lane_id").eq("id", id).maybeSingle();
  if (!current) return fail("Esta tarea ya no existe.");

  const patch: { title: string; notes: string; lane_id?: string; position?: number; started_at?: null } = {
    title: title.value,
    notes: input.notes.trim(),
  };
  if (input.laneId !== current.lane_id) {
    patch.lane_id = input.laneId;
    patch.position = positionAtEnd((await queuePositions(input.laneId)).map((t) => t.position));
    patch.started_at = null;
  }
  const { error } = await supabase.from("tasks").update(patch).eq("id", id);
  return error ? fail(GENERIC_ERROR) : done();
}

/**
 * Coloca una tarea entre dos vecinas de su cola (por id; null = sin vecina de ese lado).
 * Calcula con las posiciones de la base de datos, no con las del navegador.
 */
export async function reorderTask(id: string, beforeId: string | null, afterId: string | null): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();
  const { data: task } = await supabase.from("tasks").select("lane_id").eq("id", id).maybeSingle();
  if (!task) return fail("Esta tarea ya no existe.");

  let queue = await queuePositions(task.lane_id, id);
  const pos = (taskId: string | null) => (taskId ? (queue.find((t) => t.id === taskId)?.position ?? null) : null);
  let position = positionBetween(pos(beforeId), pos(afterId));

  if (position === null) {
    // Sin espacio entre las vecinas: renumera la cola (1, 2, 3…) y vuelve a calcular.
    await Promise.all(queue.map((t, i) => supabase.from("tasks").update({ position: i + 1 }).eq("id", t.id)));
    queue = queue.map((t, i) => ({ ...t, position: i + 1 }));
    position = positionBetween(pos(beforeId), pos(afterId)) ?? positionAtEnd(queue.map((t) => t.position));
  }

  const { error } = await supabase.from("tasks").update({ position }).eq("id", id);
  return error ? fail(GENERIC_ERROR) : done();
}

/** Atajos: subir a primera o mandar al final de su cola. */
export async function moveTaskToEdge(id: string, edge: "start" | "end"): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();
  const { data: task } = await supabase.from("tasks").select("lane_id").eq("id", id).maybeSingle();
  if (!task) return fail("Esta tarea ya no existe.");
  const queue = (await queuePositions(task.lane_id, id)).map((t) => t.position);
  const position = edge === "start" ? positionAtStart(queue) : positionAtEnd(queue);
  const patch = edge === "end" ? { position, started_at: null } : { position };
  const { error } = await supabase.from("tasks").update(patch).eq("id", id);
  return error ? fail(GENERIC_ERROR) : done();
}

export async function deleteTask(id: string): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  return error ? fail(GENERIC_ERROR) : done();
}
