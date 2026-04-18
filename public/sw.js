/**
 * Service Worker — Institut Moisson PWA
 * Stratégie :
 *  - App shell → Cache First (JS/CSS/fonts)
 *  - API Supabase → Network First avec fallback cache (5s timeout)
 *  - Images → Cache First avec revalidation (stale-while-revalidate)
 *  - Exchange rate API → Network First, cache 10 min
 */

const CACHE_VERSION = "v3";
const SHELL_CACHE   = `moisson-shell-${CACHE_VERSION}`;
const API_CACHE     = `moisson-api-${CACHE_VERSION}`;
const IMG_CACHE     = `moisson-img-${CACHE_VERSION}`;

const SHELL_URLS = [
  "/",
  "/manifest.json",
  "/offline.html",
];

// ── Install ──────────────────────────────────────────────
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(SHELL_CACHE).then((c) =>
      // On essaie d'ajouter les ressources du shell, mais on ignore les échecs
      Promise.allSettled(SHELL_URLS.map((url) => c.add(url).catch(() => null)))
    ).then(() => self.skipWaiting())
  );
});

// ── Activate ─────────────────────────────────────────────
self.addEventListener("activate", (e) => {
  const keep = [SHELL_CACHE, API_CACHE, IMG_CACHE];
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !keep.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────
self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Ignore non-GET
  if (request.method !== "GET") return;

  // ── Supabase / API ──
  if (
    url.hostname.includes("supabase") ||
    url.hostname.includes("exchangerate-api")
  ) {
    e.respondWith(networkFirstWithTimeout(request, API_CACHE, 5000));
    return;
  }

  // ── Images stockage Supabase ──
  if (url.pathname.startsWith("/storage/") || request.destination === "image") {
    e.respondWith(staleWhileRevalidate(request, IMG_CACHE));
    return;
  }

  // ── App shell / assets ──
  e.respondWith(cacheFirstFallbackNetwork(request, SHELL_CACHE));
});

// ── Stratégies ───────────────────────────────────────────

async function networkFirstWithTimeout(request, cacheName, timeout) {
  const cache = await caches.open(cacheName);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);
    if (response.ok) {
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch {
    clearTimeout(timer);
    const cached = await cache.match(request);
    if (cached) return cached;
    // Si offline et pas de cache, retourner une réponse vide avec statut 503
    return new Response(JSON.stringify({ error: "offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((res) => {
      if (res.ok) cache.put(request, res.clone()).catch(() => {});
      return res;
    })
    .catch(() => null);

  return cached || networkPromise;
}

async function cacheFirstFallbackNetwork(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      // Ne mettre en cache que JS/CSS/fonts pour garder le cache léger
      const type = response.headers.get("content-type") || "";
      if (
        type.includes("javascript") ||
        type.includes("css") ||
        type.includes("font") ||
        request.url.endsWith(".html")
      ) {
        cache.put(request, response.clone()).catch(() => {});
      }
    }
    return response;
  } catch {
    // Page offline de fallback
    if (request.destination === "document") {
      const offlinePage = await caches.match("/offline.html");
      if (offlinePage) return offlinePage;
    }
    return new Response("Hors ligne", { status: 503 });
  }
}

// ── Push notifications (futur) ────────────────────────────
self.addEventListener("push", (e) => {
  if (!e.data) return;
  const data = e.data.json();
  e.waitUntil(
    self.registration.showNotification(data.title || "Institut Moisson", {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-96.png",
      data: { url: data.url || "/dashboard" },
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data?.url || "/dashboard";
  e.waitUntil(clients.openWindow(url));
});
