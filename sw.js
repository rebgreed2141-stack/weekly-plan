const CACHE_NAME = "app-cache-v1";

const CORE = [
  "./",
  "./index.html",
  "./app.js",
  "./styles.css",
  "./manifest.json"
];

// install: キャッシュのみ（skipWaitingしない）
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(CORE))
  );
});

// activate: claimのみ
self.addEventListener("activate", e => {
  e.waitUntil(self.clients.claim());
});

// fetch: 完全cache-first（version.jsonだけ例外）
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);

  if (url.pathname.endsWith("version.json")) {
    e.respondWith(fetch(e.request, { cache: "no-store" }));
    return;
  }

  e.respondWith(
    caches.match(e.request).then(res => {
      return res || fetch(e.request);
    })
  );
});

// 手動更新のみ許可
self.addEventListener("message", e => {
  if (e.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
