/* That Single Thing · service worker: recibe los avisos y responde a sus botones. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: data.tag,
    data: { url: data.url || "/", taskId: data.taskId || null },
  };
  // Android muestra botones; iOS los ignora y solo abre la app al tocar.
  if (data.taskId) {
    options.actions = [
      { action: "done", title: "Sí, la terminé" },
      { action: "pending", title: "No, sigue pendiente" },
    ];
    options.requireInteraction = true;
  }
  event.waitUntil(self.registration.showNotification(data.title || "That Single Thing", options));
});

async function openApp(url) {
  const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const client of all) {
    if ("focus" in client) {
      await client.focus();
      if ("navigate" in client) await client.navigate(url);
      return;
    }
  }
  await self.clients.openWindow(url);
}

self.addEventListener("notificationclick", (event) => {
  const { url, taskId } = event.notification.data || {};
  event.notification.close();

  if (taskId && (event.action === "done" || event.action === "pending")) {
    event.waitUntil(
      fetch("/api/notifications/respond", {
        method: "POST",
        credentials: "include",
        // Sin sesión el servidor redirige al login: no seguirla, para detectar el caso y abrir la app.
        redirect: "manual",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, finished: event.action === "done" }),
      }).then((response) => {
        // Sin sesión en este navegador: abrir la app para responder ahí.
        if (!response.ok) return openApp("/");
      }),
    );
    return;
  }
  event.waitUntil(openApp(url || "/"));
});
