const CACHE_VERSION = "gatebound-system-pwa-v2";
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/icons/system-s-transparent.png",
  "/story/rainy-forest.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => (key.startsWith("arise-system-") || key.startsWith("gatebound-system-")) && key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put("/index.html", clone));
          return response;
        })
        .catch(() => caches.match("/index.html").then((cached) => cached || caches.match("/")))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((response) => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
        }
        return response;
      });
      return cached || network;
    })
  );
});

function notificationOptions(payload) {
  return {
    body: payload.body || "A new System event requires your attention.",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-96.png",
    image: payload.image,
    tag: payload.tag || "gatebound-system-event",
    renotify: Boolean(payload.renotify),
    requireInteraction: Boolean(payload.requireInteraction),
    data: { url: payload.url || "/", type: payload.type || "system" },
    actions: payload.actions || [
      { action: "open", title: "Open System" },
      { action: "dismiss", title: "Dismiss" }
    ]
  };
}

self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; }
  catch (_) { payload = { body: event.data ? event.data.text() : "System notification received." }; }
  event.waitUntil(self.registration.showNotification(payload.title || "GATEBOUND — THE SYSTEM", notificationOptions(payload)));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;
  const target = event.notification.data && event.notification.data.url ? event.notification.data.url : "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          if ("navigate" in client) client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow ? self.clients.openWindow(target) : undefined;
    })
  );
});

self.addEventListener("message", (event) => {
  const message = event.data || {};
  if (message.type === "SKIP_WAITING") self.skipWaiting();
  if (message.type === "SHOW_SYSTEM_NOTIFICATION" && message.payload) {
    event.waitUntil(self.registration.showNotification(message.payload.title || "ARISE — THE SYSTEM", notificationOptions(message.payload)));
  }
  if (message.type === "GET_SW_VERSION" && event.ports && event.ports[0]) {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});
