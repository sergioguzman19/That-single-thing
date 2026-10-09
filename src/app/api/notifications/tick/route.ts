import { NextResponse, type NextRequest } from "next/server";
import { planNotifications } from "@/lib/notifications";
import { sendToUser } from "@/lib/push";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Lo llama pg_cron (vía pg_net) solo cuando hay algo que avisar; ver
 * supabase/migrations/20261008160000_notifications.sql. Protegido con CRON_SECRET.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const { data: subscribers, error: subscribersError } = await admin.from("push_subscriptions").select("user_id");
  if (subscribersError) {
    // Antes este error se tragaba y respondía "0 enviados". Ahora queda a la vista.
    console.error("[tick] no se pudo leer push_subscriptions", subscribersError);
    return NextResponse.json({ ok: false, error: "db", code: subscribersError.code ?? null, hint: subscribersError.message }, { status: 500 });
  }
  const userIds = [...new Set((subscribers ?? []).map((s) => s.user_id))];
  let sent = 0;
  let planned = 0;
  let duplicates = 0;

  for (const userId of userIds) {
    const [{ data: profile }, { data: lanes }, { data: blocks }, { data: tasks }] = await Promise.all([
      admin.from("profiles").select("timezone, aging_days, last_task_id").eq("id", userId).maybeSingle(),
      admin.from("lanes").select("id, name").eq("user_id", userId).is("archived_at", null),
      admin.from("blocks").select("id, lane_id, day_of_week, start_minute, end_minute").eq("user_id", userId),
      admin
        .from("tasks")
        .select("id, lane_id, title, started_at, created_at, aging_notified_at")
        .eq("user_id", userId)
        .is("completed_at", null)
        .order("position")
        .order("created_at"),
    ]);
    if (!profile) continue;

    const { notifications, agingTaskIds } = planNotifications({
      now,
      timeZone: profile.timezone,
      agingDays: profile.aging_days,
      lastTaskId: profile.last_task_id,
      lanes: lanes ?? [],
      blocks: (blocks ?? []).map((b) => ({ id: b.id, laneId: b.lane_id, dayOfWeek: b.day_of_week, startMinute: b.start_minute, endMinute: b.end_minute })),
      tasks: (tasks ?? []).map((t) => ({
        id: t.id,
        laneId: t.lane_id,
        title: t.title,
        startedAt: t.started_at,
        createdAt: t.created_at,
        agingNotifiedAt: t.aging_notified_at,
      })),
    });

    planned += notifications.length;
    for (const notification of notifications) {
      // El registro garantiza que cada aviso salga una sola vez aunque el programador repita.
      const { error } = await admin.from("notification_log").insert({ user_id: userId, key: notification.key });
      if (error) {
        if (error.code === "23505") duplicates++; // ya enviado
        else console.error("[tick] no se pudo registrar el aviso", error);
        continue;
      }
      sent += await sendToUser(userId, notification);
    }
    if (agingTaskIds.length) {
      await admin.from("tasks").update({ aging_notified_at: now.toISOString() }).in("id", agingTaskIds);
    }
  }

  return NextResponse.json({ ok: true, users: userIds.length, planned, duplicates, sent });
}
