import "server-only";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Block } from "@/lib/dispatch";
import { startOfLocalDay } from "@/lib/time";
import { getBoard, type Lane } from "./lanes";

export type NowState = {
  lanes: Lane[];
  blocks: Block[];
  timeZone: string;
  focus: { laneId: string; until: string } | null;
  last: { taskId: string; periodEnd: string } | null;
  doneToday: number;
};

/** Todo lo que el motor de despacho necesita. "Ahora" se calcula en el cliente con la zona del perfil. */
export async function getNowState(): Promise<NowState> {
  const user = await requireUser();
  const supabase = await createClient();
  const [board, profileRes, blocksRes] = await Promise.all([
    getBoard(),
    supabase
      .from("profiles")
      .select("timezone, focus_lane_id, focus_until, last_task_id, last_period_end")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("blocks").select("lane_id, day_of_week, start_minute, end_minute"),
  ]);
  const profile = profileRes.data;
  const timeZone = profile?.timezone ?? "America/Bogota";

  const { count } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .gte("completed_at", startOfLocalDay(new Date(), timeZone).toISOString());

  return {
    lanes: board.lanes,
    blocks: (blocksRes.data ?? []).map((b) => ({
      laneId: b.lane_id,
      dayOfWeek: b.day_of_week,
      startMinute: b.start_minute,
      endMinute: b.end_minute,
    })),
    timeZone,
    focus: profile?.focus_lane_id && profile.focus_until ? { laneId: profile.focus_lane_id, until: profile.focus_until } : null,
    last: profile?.last_task_id && profile.last_period_end ? { taskId: profile.last_task_id, periodEnd: profile.last_period_end } : null,
    doneToday: count ?? 0,
  };
}
