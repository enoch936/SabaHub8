self.addEventListener("push", (event) => {
  let payload = {};

  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload = { title: "SabaHub", body: event.data.text() };
    }
  }

  const title = typeof payload.title === "string" && payload.title ? payload.title : "SabaHub";
  const options = {
    body: typeof payload.body === "string" ? payload.body : "You have a new update.",
    icon: typeof payload.icon === "string" ? payload.icon : "/next.svg",
    badge: typeof payload.badge === "string" ? payload.badge : "/next.svg",
    tag: typeof payload.tag === "string" ? payload.tag : "sabahub-notification",
    data: payload.data && typeof payload.data === "object" ? payload.data : {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const route = typeof data.route === "string" && data.route ? data.route : "/jobs";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        const clientUrl = new URL(client.url);
        const nextUrl = new URL(route, client.url);

        if (clientUrl.origin === nextUrl.origin) {
          client.focus();
          client.postMessage({ type: "NAVIGATE", route });
          return client.navigate(nextUrl.toString());
        }
      }

      return self.clients.openWindow(route);
    }),
  );
});
