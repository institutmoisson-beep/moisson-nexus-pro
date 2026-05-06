/**
 * Service Worker — Institut Moisson PWA
 * Stratégie :
 *  - Documents HTML (navigation) → Network First (évite la page blanche après deploy)
 *  - Assets hashés (JS/CSS/fonts) → Cache First
 *  - API Supabase → Network First avec fallback cache (5s timeout)
 *  - Images → Stale-While-Revalidate
 */

const CACHE_VERSION = "v5";
const SHELL_CACHE   = `moisson-shell-${CACHE_VERSION}`;
const API_CACHE     = `moisson-api-${CACHE_VERSION}`;
const IMG_CACHE     = `moisson-img-${CACHE_VERSION}`;

// ── Install ──────────────────────────────────────────────
self.addEventListener("install", (e) => {
  // Activer immédiatement la nouvelle version
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────
self.addEventListener("activate", (e) => {
  const keep = [SHELL_CACHE, API_CACHE, IMG_CACHE];
  e.waitUntil(
    (async () => {
      // Purge anciens caches
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !keep.includes(k)).map((k) => caches.delete(k)));
      // Active navigation preload si dispo
      if (self.registration.navigationPreload) {
        try { await self.registration.navigationPreload.enable(); } catch {}
      }
      await self.clients.claim();
    })()
  );
});

// ── Fetch ─────────────────────────────────────────────────
self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Ignorer cross-origin sauf supabase / images
  // ── Documents HTML / navigations ── Network First
  if (request.mode === "navigate" || request.destination === "document") {
    e.respondWith(networkFirstDocument(e));
    return;
  }

  // ── Supabase / API ──
  if (
    url.hostname.includes("supabase") ||
    url.hostname.includes("exchangerate-api")
  ) {
    e.respondWith(networkFirstWithTimeout(request, API_CACHE, 5000));
    return;
  }

  // ── Images ──
  if (url.pathname.startsWith("/storage/") || request.destination === "image") {
    e.respondWith(staleWhileRevalidate(request, IMG_CACHE));
    return;
  }

  // ── Assets statiques (JS/CSS/fonts hashés par Vite) ──
  if (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "font" ||
    /\.(js|mjs|css|woff2?|ttf|otf)$/.test(url.pathname)
  ) {
    e.respondWith(cacheFirst(request, SHELL_CACHE));
    return;
  }

  // Défaut : réseau
});

// ── Stratégies ───────────────────────────────────────────

async function networkFirstDocument(event) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const preload = await event.preloadResponse;
    if (preload) {
      cache.put("/index.html", preload.clone()).catch(() => {});
      return preload;
    }
    const res = await fetch(event.request, { cache: "no-store" });
    if (res.ok) cache.put("/index.html", res.clone()).catch(() => {});
    return res;
  } catch {
    const cached = (await cache.match("/index.html")) || (await cache.match("/"));
    if (cached) return cached;
    const offlinePage = await caches.match("/offline.html");
    if (offlinePage) return offlinePage;
    return new Response("Hors ligne", { status: 503 });
  }
}

async function networkFirstWithTimeout(request, cacheName, timeout) {
  const cache = await caches.open(cacheName);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);
    if (response.ok) cache.put(request, response.clone()).catch(() => {});
    return response;
  } catch {
    clearTimeout(timer);
    const cached = await cache.match(request);
    if (cached) return cached;
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
    .then((res) => { if (res.ok) cache.put(request, res.clone()).catch(() => {}); return res; })
    .catch(() => null);
  return cached || networkPromise || new Response("", { status: 504 });
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone()).catch(() => {});
    return res;
  } catch {
    return new Response("", { status: 504 });
  }
}

// ── Push notifications ────────────────────────────
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

// Permet à la page de forcer l'activation
self.addEventListener("message", (e) => {
  if (e.data === "SKIP_WAITING") self.skipWaiting();
});
