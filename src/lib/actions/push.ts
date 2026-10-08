"use server";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { type ActionResult, fail, GENERIC_ERROR, ok } from "./result";

type Subscription = { endpoint: string; keys: { p256dh: string; auth: string } };

/** Registra este dispositivo para recibir avisos (o lo actualiza si ya estaba). */
export async function savePushSubscription(subscription: Subscription, userAgent: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!subscription?.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) return fail("Suscripción inválida.");
  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      user_agent: userAgent.slice(0, 300),
    },
    { onConflict: "endpoint" },
  );
  return error ? fail(GENERIC_ERROR) : ok();
}

export async function deletePushSubscription(endpoint: string): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  return error ? fail(GENERIC_ERROR) : ok();
}
