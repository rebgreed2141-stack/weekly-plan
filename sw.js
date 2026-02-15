/* weekly-plan Service Worker (PWA)
   - 最低限のオフライン対応
   - ルート(index.html)に戻れるようにナビゲーションをキャッシュ優先で返す

   ★重要：
   下の CORE_ASSETS に、あなたの実ファイル名を必ず合わせてください。
   例）main.js / app.js / data.js / style.css など
*/

const CACHE_NAME = "weekly-plan-v1";

// ★あなたの構成に合わせて編集（index.html は必須）
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./sw.js"
  // "./app.js",
  // "./data.js",
  // "./style.css",
  // "./icon-192.png",
  // "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(CORE_ASSETS);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // 同一オリジンのみ扱う（GitHub Pages想定）
  if (url.origin !== self.location.origin) return;

  // ナビゲーション（URL直打ち/リロード）対策：index.html を返す
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const networkRes = await fetch(req);
          // 成功したらキャッシュも更新
          const cache = await caches.open(CACHE_NAME);
          cache.put("./index.html", networkRes.clone());
          return networkRes;
        } catch {
          const cache = await caches.open(CACHE_NAME);
          return (await cache.match("./index.html")) || Response.error();
        }
      })()
    );
    return;
  }

  // それ以外：キャッシュ優先 → なければネット → 取れたらキャッシュ
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      if (cached) return cached;

      try {
        const networkRes = await fetch(req);
        // 成功レスポンスのみキャッシュ
        if (networkRes && networkRes.ok) {
          cache.put(req, networkRes.clone());
        }
        return networkRes;
      } catch {
        return Response.error();
      }
    })()
  );
});
