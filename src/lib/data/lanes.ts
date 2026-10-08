import "server-only";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type Lane = { id: string; name: string; color: string; position: number; queued: number };

/** Carriles activos del usuario, en orden, con cuántas tareas tiene cada cola. */
export async function getLanes(): Promise<Lane[]> {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lanes")
    .select("id, name, color, position, tasks(count)")
    .is("archived_at", null)
    .is("tasks.completed_at", null)
    .order("position")
    .order("created_at");
  if (error) throw error;
  return data.map(({ tasks, ...lane }) => ({ ...lane, queued: tasks[0]?.count ?? 0 }));
}
