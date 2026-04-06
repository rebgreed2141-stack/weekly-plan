const CACHE_NAME = "weekly-plan-cache";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./jszip.min.js",
  "./manifest.json",
  "./sw.js",
  "./version.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

async function refreshCoreAssets() {
  const cache = await caches.open(CACHE_NAME);
  for (const asset of CORE_ASSETS) {
    try {
      const request = new Request(asset, { cache: "reload" });
      const response = await fetch(request);
      if (response && response.ok) {
        await cache.put(asset, response.clone());
      }
    } catch (_) {}
  }
}

self.addEventListener("message", (event) => {
  const data = event.data || {};

  if (data.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (data.type === "REFRESH_CACHE") {
    const replyPort = event.ports && event.ports[0];
    event.waitUntil((async () => {
      let ok = true;
      try {
        await refreshCoreAssets();
      } catch (_) {
        ok = false;
      }
      if (replyPort) {
        replyPort.postMessage({ ok });
      }
    })());
  }
});

async function fetchLatestVersion(request) {
  const response = await fetch(request, { cache: "no-store" });
  return response;
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.ok) {
    cache.put(request, response.clone()).catch(() => {});
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.pathname.endsWith("/version.json") && url.searchParams.has("ts")) {
    event.respondWith(fetchLatestVersion(event.request));
    return;
  }

  event.respondWith(cacheFirst(event.request));
});
