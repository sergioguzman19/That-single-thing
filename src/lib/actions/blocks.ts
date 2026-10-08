"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { type BlockDraft, DAY_NAMES, findOverlap, formatMinute, validateDraft } from "@/lib/week";
import { type ActionResult, fail, GENERIC_ERROR, ok } from "./result";

const done = () => {
  revalidatePath("/", "layout");
  return ok();
};

/**
 * Crea el bloque en cada día escogido (cada día queda independiente), o edita uno existente.
 * Revisa cruces antes de guardar para decir con qué bloque choca; la base de datos lo garantiza igual.
 */
export async function saveBlock(draft: BlockDraft & { id?: string }): Promise<ActionResult> {
  await requireUser();
  const invalid = validateDraft(draft);
  if (invalid) return fail(invalid);

  const supabase = await createClient();
  const [{ data: existing }, { data: lanes }] = await Promise.all([
    supabase.from("blocks").select("id, lane_id, day_of_week, start_minute, end_minute"),
    supabase.from("lanes").select("id, name").is("archived_at", null),
  ]);
  const laneName = new Map((lanes ?? []).map((l) => [l.id, l.name]));
  const blocks = (existing ?? [])
    .filter((b) => laneName.has(b.lane_id))
    .map((b) => ({ id: b.id, laneId: b.lane_id, dayOfWeek: b.day_of_week, startMinute: b.start_minute, endMinute: b.end_minute }));

  const clash = findOverlap(blocks, draft, draft.id);
  if (clash) {
    return fail(
      `Choca con ${laneName.get(clash.laneId)} el ${DAY_NAMES[clash.dayOfWeek].toLowerCase()} de ${formatMinute(clash.startMinute)} a ${formatMinute(clash.endMinute)}.`,
    );
  }

  const row = { lane_id: draft.laneId, start_minute: draft.startMinute, end_minute: draft.endMinute };
  const { error } = draft.id
    ? await supabase.from("blocks").update({ ...row, day_of_week: draft.days[0] }).eq("id", draft.id)
    : await supabase.from("blocks").insert(draft.days.map((day_of_week) => ({ ...row, day_of_week })));
  if (error) {
    // 23P01: restricción de exclusión (bloques que se cruzan), por si cambió algo entre la revisión y el guardado.
    return fail(error.code === "23P01" ? "Choca con otro bloque de ese día." : GENERIC_ERROR);
  }
  return done();
}

export async function deleteBlock(id: string): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("blocks").delete().eq("id", id);
  return error ? fail(GENERIC_ERROR) : done();
}
