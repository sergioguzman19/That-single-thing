"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { LANE_COLORS } from "@/lib/lanes";
import { positionAtEnd } from "@/lib/ordering";
import { createClient } from "@/lib/supabase/server";
import { type ActionResult, fail, GENERIC_ERROR, ok } from "./result";

const COLORS = new Set<string>(LANE_COLORS.map((c) => c.id));
const done = () => {
  revalidatePath("/", "layout");
  return ok();
};

function cleanName(name: string) {
  const value = name.trim().replace(/\s+/g, " ");
  if (!value) return { error: "Ponle un nombre al carril." };
  if (value.length > 60) return { error: "El nombre es muy largo (máximo 60 caracteres)." };
  return { value };
}

export async function createLane(input: { name: string; color: string }): Promise<ActionResult> {
  await requireUser();
  const name = cleanName(input.name);
  if ("error" in name) return fail(name.error!);
  if (!COLORS.has(input.color)) return fail("Escoge uno de los colores.");

  const supabase = await createClient();
  const { data: lanes } = await supabase.from("lanes").select("position").is("archived_at", null);
  const { error } = await supabase
    .from("lanes")
    .insert({ name: name.value, color: input.color, position: positionAtEnd((lanes ?? []).map((l) => l.position)) });
  if (error) {
    // El límite de 6 lo hace cumplir la base de datos (trigger lanes_limit).
    if (error.code === "23514") return fail("Ya tienes 6 carriles, el máximo. Archiva uno para crear otro.");
    return fail(GENERIC_ERROR);
  }
  return done();
}

export async function updateLane(id: string, input: { name?: string; color?: string }): Promise<ActionResult> {
  await requireUser();
  const patch: { name?: string; color?: string } = {};
  if (input.name !== undefined) {
    const name = cleanName(input.name);
    if ("error" in name) return fail(name.error!);
    patch.name = name.value;
  }
  if (input.color !== undefined) {
    if (!COLORS.has(input.color)) return fail("Escoge uno de los colores.");
    patch.color = input.color;
  }
  const supabase = await createClient();
  const { error } = await supabase.from("lanes").update(patch).eq("id", id);
  return error ? fail(GENERIC_ERROR) : done();
}

/** Sube (−1) o baja (+1) un carril un lugar, intercambiando posición con su vecino. */
export async function moveLane(id: string, direction: -1 | 1): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();
  const { data: lanes, error } = await supabase
    .from("lanes")
    .select("id, position")
    .is("archived_at", null)
    .order("position")
    .order("created_at");
  if (error || !lanes) return fail(GENERIC_ERROR);

  const i = lanes.findIndex((l) => l.id === id);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= lanes.length) return ok();

  // Renumera para que el intercambio funcione aunque haya posiciones repetidas.
  const order = lanes.map((l) => l.id);
  [order[i], order[j]] = [order[j], order[i]];
  const results = await Promise.all(order.map((laneId, k) => supabase.from("lanes").update({ position: k + 1 }).eq("id", laneId)));
  return results.some((r) => r.error) ? fail(GENERIC_ERROR) : done();
}

/** Archivar saca el carril de la vista y de la semana (se quitan sus bloques); sus tareas se conservan. */
export async function archiveLane(id: string): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("lanes").update({ archived_at: new Date().toISOString() }).eq("id", id);
  if (error) return fail(GENERIC_ERROR);
  const { error: blocksError } = await supabase.from("blocks").delete().eq("lane_id", id);
  return blocksError ? fail(GENERIC_ERROR) : done();
}
