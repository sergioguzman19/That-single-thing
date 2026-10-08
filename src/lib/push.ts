import "server-only";
import webpush from "web-push";
import type { Notification } from "@/lib/notifications";
import { createAdminClient } from "@/lib/supabase/admin";

let configured = false;
function configure() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) throw new Error("Faltan las claves VAPID (NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY).");
  webpush.setVapidDetails("https://thatsingleting.vercel.app", publicKey, privateKey);
  configured = true;
}

/** Envía un aviso a todos los dispositivos del usuario y borra los que ya no existen. */
export async function sendToUser(userId: string, notification: Notification): Promise<number> {
  configure();
  const admin = createAdminClient();
  const { data: subs } = await admin.from("push_subscriptions").select("id, endpoint, p256dh, auth").eq("user_id", userId);
  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    url: notification.url,
    taskId: notification.taskId ?? null,
    tag: notification.key,
  });

  let sent = 0;
  await Promise.all(
    (subs ?? []).map(async (sub) => {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload, { TTL: 60 * 60 });
        sent++;
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        // 404/410: el dispositivo se dio de baja o desinstaló la app.
        if (status === 404 || status === 410) await admin.from("push_subscriptions").delete().eq("id", sub.id);
        else console.error("[push] envío fallido", { status, endpoint: sub.endpoint.slice(0, 60) });
      }
    }),
  );
  return sent;
}
