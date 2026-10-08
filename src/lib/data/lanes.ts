import "server-only";
import { cache } from "react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const MAX_LANES = 6;
const DAY = 86_400_000;

export type Task = {
  id: string;
  laneId: string;
  title: string;
  notes: string;
  position: number;
  createdAt: string;
  startedAt: string | null;
  ageDays: number;
  aging: boolean;
};

export type Lane = {
  id: string;
  name: string;
  color: string;
  position: number;
  tasks: Task[];
  agingCount: number;
};

export type Board = { lanes: Lane[]; agingDays: number };

/**
 * Todo lo que necesitan Carriles y la captura: carriles activos en orden, cada uno con
 * su cola abierta en orden, y cuáles tareas están rezagadas según el perfil.
 */
export const getBoard = cache(async (): Promise<Board> => {
  const user = await requireUser();
  const supabase = await createClient();

  const [lanesRes, tasksRes, profileRes] = await Promise.all([
    supabase.from("lanes").select("id, name, color, position").is("archived_at", null).order("position").order("created_at"),
    supabase
      .from("tasks")
      .select("id, lane_id, title, notes, position, created_at, started_at")
      .is("completed_at", null)
      .order("position")
      .order("created_at"),
    supabase.from("profiles").select("aging_days").eq("id", user.id).maybeSingle(),
  ]);
  if (lanesRes.error) throw lanesRes.error;
  if (tasksRes.error) throw tasksRes.error;

  const agingDays = profileRes.data?.aging_days ?? 7;
  const now = Date.now();
  const byLane = new Map<string, Task[]>();
  for (const t of tasksRes.data) {
    const ageDays = Math.floor((now - new Date(t.created_at).getTime()) / DAY);
    const task: Task = {
      id: t.id,
      laneId: t.lane_id,
      title: t.title,
      notes: t.notes,
      position: t.position,
      createdAt: t.created_at,
      startedAt: t.started_at,
      ageDays,
      aging: ageDays >= agingDays,
    };
    byLane.set(t.lane_id, [...(byLane.get(t.lane_id) ?? []), task]);
  }

  const lanes = lanesRes.data.map((lane) => {
    const tasks = byLane.get(lane.id) ?? [];
    return { ...lane, tasks, agingCount: tasks.filter((t) => t.aging).length };
  });
  return { lanes, agingDays };
});
