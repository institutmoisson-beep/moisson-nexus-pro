/**
 * Service Worker — Institut Moisson PWA
 * Stratégie :
 *  - Documents HTML (navigation) → Network First (évite la page blanche après deploy)
 *  - Assets hashés (JS/CSS/fonts) → Cache First
 *  - API Supabase → Network First avec fallback cache (5s timeout)
 *  - Images → Stale-While-Revalidate
 *
 * CORRECTIFS v6 :
 *  - Cache stocké par URL exacte (plus de collision /index.html vs /)
 *  - Purge forcée des caches corrompus à l'activation
 *  - networkFirstDocument robuste avec timeout réseau de 4s
 *  - Fallback en cascade : URL exacte → /index.html → / → offline
 */

const CACHE_VERSION = "v6";
const SHELL_CACHE   = `moisson-shell-${CACHE_VERSION}`;
const API_CACHE     = `moisson-api-${CACHE_VERSION}`;
const IMG_CACHE     = `moisson-img-${CACHE_VERSION}`;

// ── Install ──────────────────────────────────────────────
self.addEventListener("install", (e) => {
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────
self.addEventListener("activate", (e) => {
  const keep = [SHELL_CACHE, API_CACHE, IMG_CACHE];
  e.waitUntil(
    (async () => {
      // Purge TOUS les anciens caches (y compris caches corrompus)
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => !keep.includes(k)).map((k) => caches.delete(k))
      );

      // Active navigation preload si dispo
      if (self.registration.navigationPreload) {
        try {
          await self.registration.navigationPreload.enable();
        } catch (_) {}
      }

      await self.clients.claim();

      // Notifier tous les clients pour qu'ils rechargent
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach((client) => client.postMessage({ type: "SW_UPDATED" }));
    })()
  );
});

// ── Fetch ─────────────────────────────────────────────────
self.addEventListener("fetch", (e) => {
  const { request } = e;

  // Ignorer les requêtes non-GET
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Ignorer chrome-extension et autres schémas non-http
  if (!url.protocol.startsWith("http")) return;

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

  // Défaut : réseau pur
});

// ── Stratégies ───────────────────────────────────────────

/**
 * Network First pour les documents HTML.
 * CORRECTIF PRINCIPAL :
 *  - Stocke sous l'URL exacte de la requête (évite la collision /)
 *  - Timeout réseau de 4s pour ne pas bloquer indéfiniment
 *  - Fallback en cascade : URL exacte → /index.html → / → offline
 */
async function networkFirstDocument(event) {
  const cache = await caches.open(SHELL_CACHE);

  // Essai réseau avec timeout de 4 secondes
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);

  try {
    // Tenter navigation preload en priorité
    const preload = await event.preloadResponse;
    let networkResponse = preload;

    if (!networkResponse) {
      networkResponse = await fetch(event.request, {
        signal: controller.signal,
        cache: "no-store",
      });
    }

    clearTimeout(timer);

    if (networkResponse && networkResponse.ok) {
      // Stocker sous l'URL exacte ET sous /index.html comme fallback universel
      const clone1 = networkResponse.clone();
      const clone2 = networkResponse.clone();
      cache.put(event.request.url, clone1).catch(() => {});
      cache.put("/index.html", clone2).catch(() => {});
    }

    return networkResponse;
  } catch (_) {
    clearTimeout(timer);

    // Fallback en cascade
    const byExactUrl = await cache.match(event.request.url);
    if (byExactUrl) return byExactUrl;

    const byIndexHtml = await cache.match("/index.html");
    if (byIndexHtml) return byIndexHtml;

    const byRoot = await cache.match("/");
    if (byRoot) return byRoot;

    const offlinePage = await caches.match("/offline.html");
    if (offlinePage) return offlinePage;

    return new Response(
      `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>Hors ligne</title>
<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f5f3ff}
.box{text-align:center;padding:2rem;background:#fff;border-radius:1rem;box-shadow:0 4px 20px rgba(0,0,0,.1)}
h1{color:#7c3aed}p{color:#6b7280}</style></head>
<body><div class="box">
<h1>Institut Moisson</h1>
<p>Vous êtes hors ligne. Veuillez vérifier votre connexion.</p>
<button onclick="location.reload()" style="margin-top:1rem;padding:.5rem 1.5rem;background:#7c3aed;color:#fff;border:none;border-radius:.5rem;cursor:pointer">Réessayer</button>
</div></body></html>`,
      {
        status: 503,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }
}

/**
 * Network First avec timeout configurable (pour les APIs).
 */
async function networkFirstWithTimeout(request, cacheName, timeout) {
  const cache = await caches.open(cacheName);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);
    if (response.ok) cache.put(request, response.clone()).catch(() => {});
    return response;
  } catch (_) {
    clearTimeout(timer);
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: "offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * Stale-While-Revalidate (pour les images).
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((res) => {
      if (res.ok) cache.put(request, res.clone()).catch(() => {});
      return res;
    })
    .catch(() => null);

  return cached || networkPromise || new Response("", { status: 504 });
}

/**
 * Cache First (pour les assets statiques hashés par Vite).
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone()).catch(() => {});
    return res;
  } catch (_) {
    return new Response("", { status: 504 });
  }
}

// ── Push notifications ────────────────────────────────────
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

// ── Messages ──────────────────────────────────────────────
self.addEventListener("message", (e) => {
  if (e.data === "SKIP_WAITING") self.skipWaiting();
});
