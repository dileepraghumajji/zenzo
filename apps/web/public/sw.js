// ─── Zenzo Service Worker ─────────────────────────────────────────────────────
//
// Strategy:
//   - Static assets (JS, CSS, fonts, images): Cache-first
//   - Attendance take page (/attendance/take/*): Network-first with cache fallback
//     so coaches can open it offline and see the last-loaded member list
//   - Everything else: Network-only (no caching)

const CACHE_NAME = "zenzo-v1";

// Assets to pre-cache on install (Next.js inlines critical CSS so keep this minimal)
const PRECACHE_URLS = ["/offline.html"];

// ── Install: pre-cache shell resources ───────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// ── Activate: remove old caches ───────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: routing logic ──────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only intercept same-origin GET requests
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Attendance take pages — network-first, fall back to cached version
  if (url.pathname.includes("/attendance/take/")) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Next.js static chunks — cache-first
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/_next/image")
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }
});

// ── Strategies ────────────────────────────────────────────────────────────────

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    // Last resort: offline page
    const offline = await cache.match("/offline.html");
    return offline ?? new Response("Offline", { status: 503 });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const cache = await caches.open(CACHE_NAME);
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}
