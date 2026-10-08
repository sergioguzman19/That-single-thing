"use client";

import { useCallback, useEffect, useState } from "react";
import { deletePushSubscription, savePushSubscription } from "@/lib/actions/push";

export type PushState = "unsupported" | "denied" | "off" | "on" | "loading";

function toUint8Array(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

const supported = () =>
  typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

/** Activar o desactivar los avisos en este dispositivo. */
export function usePush() {
  const [state, setState] = useState<PushState>("loading");

  const refresh = useCallback(async () => {
    if (!supported()) return setState("unsupported");
    if (Notification.permission === "denied") return setState("denied");
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    setState(subscription ? "on" : "off");
  }, []);

  useEffect(() => {
    // Lee el estado del navegador después de montar (no existe en el servidor).
    void refresh(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [refresh]);

  const enable = useCallback(async () => {
    const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!supported() || !key) return { ok: false as const, error: "Este navegador no permite avisos." };
    setState("loading");
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      await refresh();
      return { ok: false as const, error: "Sin permiso no podemos avisarte. Actívalo en los ajustes del navegador." };
    }
    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toUint8Array(key) }));
    const result = await savePushSubscription(subscription.toJSON() as never, navigator.userAgent);
    await refresh();
    return result.ok ? { ok: true as const } : { ok: false as const, error: result.error };
  }, [refresh]);

  const disable = useCallback(async () => {
    setState("loading");
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) {
      await deletePushSubscription(subscription.endpoint);
      await subscription.unsubscribe();
    }
    await refresh();
  }, [refresh]);

  return { state, enable, disable };
}
