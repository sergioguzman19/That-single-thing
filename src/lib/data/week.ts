import "server-only";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { WeekBlock } from "@/lib/week";
import { getBoard } from "./lanes";

export type WeekState = {
  lanes: { id: string; name: string; color: string }[];
  blocks: WeekBlock[];
  timeZone: string;
};

/** Carriles activos y sus bloques de la semana (los de carriles archivados no cuentan). */
export async function getWeek(): Promise<WeekState> {
  const user = await requireUser();
  const supabase = await createClient();
  const [board, blocksRes, profileRes] = await Promise.all([
    getBoard(),
    supabase.from("blocks").select("id, lane_id, day_of_week, start_minute, end_minute").order("start_minute"),
    supabase.from("profiles").select("timezone").eq("id", user.id).maybeSingle(),
  ]);
  if (blocksRes.error) throw blocksRes.error;
  const active = new Set(board.lanes.map((l) => l.id));
  return {
    lanes: board.lanes.map(({ id, name, color }) => ({ id, name, color })),
    blocks: blocksRes.data
      .filter((b) => active.has(b.lane_id))
      .map((b) => ({ id: b.id, laneId: b.lane_id, dayOfWeek: b.day_of_week, startMinute: b.start_minute, endMinute: b.end_minute })),
    timeZone: profileRes.data?.timezone ?? "America/Bogota",
  };
}
